"""
Portable FAISS rebuild script for the TanishqAI React + FastAPI project.

What this script does
---------------------
1. Scans Jewelry_RAG/data/Tanishq/rings and necklaces
2. Builds a visual index for image search
3. Builds a hybrid index for text search
4. Stores portable relative paths in image_paths.txt
5. Updates jewelry_metadata.json only for files that actually exist

Run from terminal
-----------------
cd Jewelry_RAG
python rebuild_index.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

import faiss
import numpy as np
from PIL import Image
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).parent.resolve()
DATA_DIR = BASE_DIR / "data" / "Tanishq"
META_PATH = BASE_DIR / "jewelry_metadata.json"
PATHS_PATH = BASE_DIR / "image_paths.txt"
HYBRID_INDEX_PATH = BASE_DIR / "jewelry_hybrid.index"
VISUAL_INDEX_PATH = BASE_DIR / "jewelry_visual.index"
FALLBACK_INDEX_PATH = BASE_DIR / "jewelry.index"

CATEGORY_PROMPTS = {
    "rings": [
        "gold ring jewellery",
        "diamond ring Indian jewellery",
        "bridal gold ring fine jewellery",
        "traditional ring design",
    ],
    "necklaces": [
        "gold necklace jewellery",
        "bridal necklace Indian jewellery",
        "traditional necklace design",
        "pendant chain fine jewellery",
    ],
}


def l2_normalize(arr: np.ndarray) -> np.ndarray:
    arr = np.asarray(arr, dtype="float32")
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1e-12, norms)
    return arr / norms


def detect_category(path: Path) -> str:
    lower = path.as_posix().lower()
    if "/rings/" in lower or path.name.lower().startswith("ring_"):
        return "rings"
    return "necklaces"


def relative_image_path(path: Path) -> str:
    return path.relative_to(BASE_DIR).as_posix()


def load_existing_metadata() -> Dict:
    if not META_PATH.exists():
        return {}
    with open(META_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, dict) else {}


def build_text_embedding(model: SentenceTransformer, category: str, description: str) -> np.ndarray:
    prompts = list(CATEGORY_PROMPTS.get(category, ["fine jewellery"]))
    if description:
        prompts.append(description)
    vecs = model.encode(prompts, convert_to_numpy=True)
    return np.mean(vecs, axis=0)


def rebuild() -> None:
    print("=" * 68)
    print("Rebuilding FAISS indexes for Tanishq AI Platform")
    print("=" * 68)

    if not DATA_DIR.exists():
        raise FileNotFoundError(f"Dataset folder not found: {DATA_DIR}")

    print("Loading CLIP model...")
    model = SentenceTransformer("clip-ViT-B-32")

    existing_meta = load_existing_metadata()

    image_paths: List[Path] = []
    for ext in ("*.jpg", "*.jpeg", "*.png", "*.webp"):
        image_paths.extend(sorted(DATA_DIR.rglob(ext)))

    image_paths = sorted(set(image_paths))
    if not image_paths:
        raise RuntimeError("No image files found. Put your ring and necklace images inside Jewelry_RAG/data/Tanishq/")

    print(f"Found {len(image_paths)} image files")

    visual_vectors: List[np.ndarray] = []
    hybrid_vectors: List[np.ndarray] = []
    valid_paths: List[Path] = []
    fresh_meta: Dict[str, Dict] = {}

    for idx, img_path in enumerate(image_paths, start=1):
        try:
            image = Image.open(img_path).convert("RGB")
            vis_vec = model.encode([image], convert_to_numpy=True)[0]

            file_name = img_path.name
            category = detect_category(img_path)
            old = existing_meta.get(file_name, {})
            description = (old.get("ai_description") or "").strip()
            if not description:
                description = f"{category[:-1]} jewellery piece"

            txt_vec = build_text_embedding(model, category, description)
            hyb_vec = (0.70 * vis_vec) + (0.30 * txt_vec)

            visual_vectors.append(vis_vec)
            hybrid_vectors.append(hyb_vec)
            valid_paths.append(img_path)
            fresh_meta[file_name] = {
                "category": category,
                "path": relative_image_path(img_path),
                "ai_description": description,
            }

            if idx % 25 == 0 or idx == len(image_paths):
                print(f"Encoded {idx}/{len(image_paths)}")
        except Exception as e:
            print(f"Skipped {img_path.name}: {e}")

    if not valid_paths:
        raise RuntimeError("No valid images could be encoded.")

    vis_np = l2_normalize(np.vstack(visual_vectors).astype("float32"))
    hyb_np = l2_normalize(np.vstack(hybrid_vectors).astype("float32"))
    dim = vis_np.shape[1]

    visual_index = faiss.IndexFlatIP(dim)
    visual_index.add(vis_np)
    faiss.write_index(visual_index, str(VISUAL_INDEX_PATH))

    hybrid_index = faiss.IndexFlatIP(dim)
    hybrid_index.add(hyb_np)
    faiss.write_index(hybrid_index, str(HYBRID_INDEX_PATH))
    faiss.write_index(hybrid_index, str(FALLBACK_INDEX_PATH))

    with open(PATHS_PATH, "w", encoding="utf-8") as f:
        for p in valid_paths:
            f.write(relative_image_path(p) + "\n")

    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(fresh_meta, f, indent=2)

    print("-" * 68)
    print(f"Visual index vectors : {visual_index.ntotal}")
    print(f"Hybrid index vectors : {hybrid_index.ntotal}")
    print(f"Metadata entries     : {len(fresh_meta)}")
    print("SUCCESS: rebuild complete")
    print("-" * 68)


if __name__ == "__main__":
    rebuild()
