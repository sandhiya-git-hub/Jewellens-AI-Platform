"""
Tanishq AI Jewelry Concierge - FastAPI Backend v3.0
===================================================
This backend is patched for a React frontend and a FAISS + CLIP jewelry RAG system.

Key fixes in this version
-------------------------
1. Uses cosine similarity correctly (higher score = better for IndexFlatIP)
2. Supports text, image, and multimodal search
3. Uses direct image embeddings for uploaded photos / sketches
4. Makes Gemini optional instead of mandatory
5. Works with portable relative paths and also old Windows paths
6. Adds stronger category / attribute reranking for rings vs necklaces
7. Gives cleaner health and setup diagnostics

Important note
--------------
This code can only retrieve images that actually exist inside Jewelry_RAG/data/Tanishq.
If ring images are missing on disk, no backend can return them correctly.
"""

from __future__ import annotations

import json
import os
import re
import tempfile
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import faiss
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
from sentence_transformers import SentenceTransformer
import speech_recognition as sr

# Optional Gemini support. The backend still works without it.
try:
    from google import genai
    from google.genai import types
except Exception:  # pragma: no cover - optional dependency behaviour
    genai = None
    types = None

# ──────────────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).parent.resolve()
PROJECT_DIR = BACKEND_DIR.parent.resolve()
RAG_DIR = PROJECT_DIR / "Jewelry_RAG"
DATA_DIR = RAG_DIR / "data"
TANISHQ_DIR = DATA_DIR / "Tanishq"

INDEX_HYBRID_FILE = RAG_DIR / "jewelry_hybrid.index"
INDEX_VISUAL_FILE = RAG_DIR / "jewelry_visual.index"
INDEX_FALLBACK_FILE = RAG_DIR / "jewelry.index"
PATHS_FILE = RAG_DIR / "image_paths.txt"
META_FILE = RAG_DIR / "jewelry_metadata.json"
ENV_FILE = RAG_DIR / ".env"

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────
def safe_load_env(path: Path) -> None:
    if not path.exists():
        return
    for enc in ("utf-8-sig", "utf-8", "utf-16", "utf-16-le", "utf-16-be", "latin-1"):
        try:
            load_dotenv(path, encoding=enc, override=False)
            return
        except Exception:
            continue


def l2_normalize(vec: np.ndarray) -> np.ndarray:
    arr = np.asarray(vec, dtype="float32")
    if arr.ndim == 1:
        denom = float(np.linalg.norm(arr))
        return arr if denom == 0 else arr / denom
    denom = np.linalg.norm(arr, axis=1, keepdims=True)
    denom = np.where(denom == 0, 1e-12, denom)
    return arr / denom


def category_from_name(name: str) -> Optional[str]:
    text = (name or "").lower()
    if any(k in text for k in ["ring", "band", "solitaire", "engagement", "finger"]):
        return "rings"
    if any(k in text for k in ["necklace", "chain", "pendant", "mangalsutra", "haar", "choker", "locket"]):
        return "necklaces"
    return None


def detect_category_from_path(path: Path) -> Optional[str]:
    parts = [p.lower() for p in path.parts]
    if "rings" in parts or path.name.lower().startswith("ring_"):
        return "rings"
    if "necklaces" in parts or path.name.lower().startswith("necklace_"):
        return "necklaces"
    return None


def extract_number(name: str) -> int:
    m = re.search(r"(\d+)", name or "")
    return int(m.group(1)) if m else 1


def build_image_url(path: Path) -> str:
    rel = path.relative_to(DATA_DIR)
    return f"/images/{rel.as_posix()}"


def resolve_image_path(raw_path: str) -> Optional[Path]:
    if not raw_path:
        return None

    p = raw_path.replace("\\", "/")

    candidates: List[Path] = []

    # Preferred: relative path already stored.
    rel_candidate = RAG_DIR / p
    candidates.append(rel_candidate)

    # Common absolute-path legacy formats.
    markers = ["data/Tanishq/", "Tanishq/"]
    for marker in markers:
        if marker in p:
            suffix = p[p.index(marker) :]
            candidates.append(DATA_DIR / suffix.replace("data/", "", 1))
            candidates.append(RAG_DIR / suffix)

    fname = Path(p).name
    for cand in candidates:
        if cand.exists():
            return cand.resolve()

    for match in TANISHQ_DIR.rglob(fname):
        return match.resolve()

    return None


COLOR_KEYWORDS = {
    "red", "ruby", "green", "emerald", "blue", "sapphire", "white", "diamond",
    "pink", "rose", "gold", "yellow", "silver", "black", "pearl",
}
STYLE_KEYWORDS = {
    "bridal", "traditional", "modern", "minimal", "minimalist", "vintage",
    "temple", "daily", "party", "floral", "leaf", "heart", "halo", "cluster",
    "ethnic", "classic", "statement", "elegant", "simple", "ornate",
}
SHAPE_KEYWORDS = {
    "round", "oval", "square", "heart", "floral", "leaf", "drop", "teardrop",
    "cluster", "halo", "solitaire", "band",
}
GEM_KEYWORDS = {"diamond", "ruby", "emerald", "sapphire", "pearl", "polki", "kundan"}


def extract_attributes_from_text(text: str) -> Dict[str, str]:
    src = (text or "").lower()
    category = category_from_name(src) or "Any"
    color = next((w for w in COLOR_KEYWORDS if w in src), "Any")
    style = next((w for w in STYLE_KEYWORDS if w in src), "Any")
    shape = next((w for w in SHAPE_KEYWORDS if w in src), "Any")
    gemstone = next((w for w in GEM_KEYWORDS if w in src), "Any")
    query = re.sub(r"\s+", " ", src).strip() or "jewelry"
    return {
        "Category": category,
        "Color": color,
        "Shape": shape,
        "Style": style,
        "Gemstone": gemstone,
        "Query": query,
    }


_MATERIALS = [
    "22K Gold", "18K Gold", "Rose Gold", "White Gold", "Platinum 950", "Diamond Studded Gold"
]
_STYLES = [
    "Traditional", "Modern", "Bridal", "Minimal", "Vintage", "Temple", "Classic", "Floral"
]
_RING_NAMES = [
    "Solitaire Diamond Ring", "Gold Floral Band Ring", "Ruby Accent Ring", "Temple Gold Ring",
    "Diamond Halo Ring", "Classic Gold Band", "Emerald Cluster Ring", "Minimal Gold Ring",
]
_NECKLACE_NAMES = [
    "Gold Bridal Necklace", "Floral Pendant Necklace", "Temple Necklace", "Diamond Chain Necklace",
    "Ruby Accent Necklace", "Traditional Gold Necklace", "Statement Necklace", "Classic Pendant Necklace",
]


def catalog_name(file_name: str, category: str, idx: int) -> str:
    names = _RING_NAMES if category == "rings" else _NECKLACE_NAMES
    n = extract_number(file_name)
    return names[(n + idx) % len(names)]


def catalog_price(file_name: str, category: str) -> int:
    base = 18000 if category == "rings" else 32000
    n = extract_number(file_name)
    return base + ((n * 1379 + n * n * 31) % 85000)


# ──────────────────────────────────────────────────────────────────────────────
# Load env and optional Gemini
# ──────────────────────────────────────────────────────────────────────────────
safe_load_env(ENV_FILE)
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_CLIENT = genai.Client(api_key=GEMINI_KEY) if (genai and GEMINI_KEY) else None

# ──────────────────────────────────────────────────────────────────────────────
# App
# ──────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Tanishq AI Concierge API", version="3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("\n" + "=" * 70)
print("Tanishq AI Concierge — Backend v3.0")
print("=" * 70)
print(f"Project dir     : {PROJECT_DIR}")
print(f"RAG dir         : {RAG_DIR}")
print(f"Data dir exists : {DATA_DIR.exists()}")
print(f"Gemini enabled  : {bool(GEMINI_CLIENT)}")
print("=" * 70)

print("Loading CLIP model...")
CLIP_MODEL = SentenceTransformer("clip-ViT-B-32")
print("CLIP loaded ✓")

# Prefer the dedicated v3 indexes. Fall back if they do not exist.
HYBRID_INDEX_PATH = INDEX_HYBRID_FILE if INDEX_HYBRID_FILE.exists() else INDEX_FALLBACK_FILE
VISUAL_INDEX_PATH = INDEX_VISUAL_FILE if INDEX_VISUAL_FILE.exists() else HYBRID_INDEX_PATH

print(f"Loading hybrid FAISS index from: {HYBRID_INDEX_PATH.name}")
FAISS_HYBRID = faiss.read_index(str(HYBRID_INDEX_PATH))
print(f"Hybrid index vectors: {FAISS_HYBRID.ntotal}")

print(f"Loading visual FAISS index from: {VISUAL_INDEX_PATH.name}")
FAISS_VISUAL = faiss.read_index(str(VISUAL_INDEX_PATH))
print(f"Visual index vectors: {FAISS_VISUAL.ntotal}")

with open(PATHS_FILE, "r", encoding="utf-8") as f:
    raw_paths = [line.strip() for line in f if line.strip()]

with open(META_FILE, "r", encoding="utf-8") as f:
    META = json.load(f)

# Align entries to what really exists on disk.
ENTRIES: List[Dict] = []
missing_count = 0
for i, raw in enumerate(raw_paths):
    resolved = resolve_image_path(raw)
    if not resolved or not resolved.exists():
        missing_count += 1
        continue
    file_name = resolved.name
    meta = META.get(file_name, {}) if isinstance(META, dict) else {}
    category = detect_category_from_path(resolved) or category_from_name(meta.get("category", "")) or "rings"
    ENTRIES.append(
        {
            "faiss_idx": i,
            "path": resolved,
            "file_name": file_name,
            "category": category,
            "description": (meta.get("ai_description") or "").strip(),
            "meta": meta,
        }
    )

ENTRY_BY_FAISS_IDX = {e["faiss_idx"]: e for e in ENTRIES}
print(f"Resolved entries : {len(ENTRIES)}")
print(f"Missing paths    : {missing_count}")

# If old index count mismatches resolved paths, still continue but only return available entries.
print("Backend bootstrap complete ✓\n")

# ──────────────────────────────────────────────────────────────────────────────
# AI helper functions
# ──────────────────────────────────────────────────────────────────────────────
def transcribe_audio(audio_bytes: bytes) -> Dict:
    recognizer = sr.Recognizer()
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        with sr.AudioFile(tmp_path) as source:
            audio = recognizer.record(source)
        text = recognizer.recognize_google(audio)
        return {"success": True, "text": text}
    except sr.UnknownValueError:
        return {"success": False, "error": "Could not understand audio"}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def spell_check_and_correct(text: str) -> Dict:
    cleaned = re.sub(r"\s+", " ", (text or "").strip())
    if not cleaned:
        return {"has_errors": False, "original": text, "corrected": text}

    # Keep it deterministic when Gemini is unavailable.
    if not GEMINI_CLIENT:
        return {"has_errors": False, "original": cleaned, "corrected": cleaned}

    try:
        resp = GEMINI_CLIENT.models.generate_content(
            model="gemini-2.5-flash",
            contents=f'Correct only spelling mistakes in this jewellery search query and return only the corrected query: "{cleaned}"',
        )
        corrected = (resp.text or "").strip().strip('"')
        corrected = corrected or cleaned
        return {"has_errors": corrected.lower() != cleaned.lower(), "original": cleaned, "corrected": corrected}
    except Exception:
        return {"has_errors": False, "original": cleaned, "corrected": cleaned}


def gemini_extract_text_or_description(image_bytes: bytes) -> Dict[str, str]:
    if not GEMINI_CLIENT or not types:
        return {"has_text": False, "text": ""}
    try:
        resp = GEMINI_CLIENT.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                (
                    "If the image contains search-useful text, return 'TEXT: ...'. "
                    "Otherwise if it is jewellery or a sketch, return 'DESCRIPTION: ...' with short jewellery attributes. "
                    "If unclear, return 'NONE'."
                ),
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            ],
        )
        text = (resp.text or "").strip()
        if text.upper().startswith("TEXT:"):
            return {"has_text": True, "text": text.split(":", 1)[1].strip()}
        if text.upper().startswith("DESCRIPTION:"):
            return {"has_text": True, "text": text.split(":", 1)[1].strip()}
    except Exception:
        pass
    return {"has_text": False, "text": ""}


def rewrite_query_with_llm(query: str) -> Dict:
    cleaned = re.sub(r"\s+", " ", (query or "").strip())
    if not cleaned:
        return {"original": query, "rewritten": query}

    if not GEMINI_CLIENT:
        return {"original": cleaned, "rewritten": cleaned}

    try:
        resp = GEMINI_CLIENT.models.generate_content(
            model="gemini-2.5-flash",
            contents=(
                "Rewrite this jewellery search query for better retrieval. "
                "Keep it short, preserve meaning, add missing jewellery words only if helpful. "
                f"Query: {cleaned}"
            ),
        )
        rewritten = (resp.text or "").strip().replace("\n", " ")
        rewritten = re.sub(r"\s+", " ", rewritten)
        return {"original": cleaned, "rewritten": rewritten or cleaned}
    except Exception:
        return {"original": cleaned, "rewritten": cleaned}


def encode_text_query(query: str) -> np.ndarray:
    text = (query or "jewelry").strip()
    vec = CLIP_MODEL.encode([text], convert_to_numpy=True)[0]
    return l2_normalize(vec)


def encode_image_query(image_bytes: bytes) -> np.ndarray:
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    vec = CLIP_MODEL.encode([img], convert_to_numpy=True)[0]
    return l2_normalize(vec)


def combine_query_vectors(text_vec: Optional[np.ndarray], image_vec: Optional[np.ndarray]) -> Optional[np.ndarray]:
    if text_vec is not None and image_vec is not None:
        return l2_normalize((0.35 * text_vec) + (0.65 * image_vec))
    if image_vec is not None:
        return image_vec
    if text_vec is not None:
        return text_vec
    return None


def score_attribute_matches(description: str, attrs: Dict[str, str]) -> float:
    text = (description or "").lower()
    score = 0.0
    for field, weight in [("Color", 0.10), ("Shape", 0.08), ("Style", 0.08), ("Gemstone", 0.10)]:
        val = (attrs.get(field) or "Any").lower()
        if val != "any" and val in text:
            score += weight
    return score


def build_result(entry: Dict, similarity: float, score: float, rank_idx: int) -> Dict:
    category = entry["category"]
    file_name = entry["file_name"]
    desc = entry["description"] or f"{category[:-1].title()} jewellery piece"
    return {
        "image_url": build_image_url(entry["path"]),
        "image_path": str(entry["path"]),
        "description": desc,
        "category": category,
        "name": catalog_name(file_name, category, rank_idx),
        "price": catalog_price(file_name, category),
        "material": _MATERIALS[rank_idx % len(_MATERIALS)],
        "style": _STYLES[rank_idx % len(_STYLES)],
        "similarity": round(float(max(0.0, min(1.0, similarity))) * 100.0, 1),
        "score": round(float(score), 4),
    }


def search_candidates(
    text_query: Optional[str],
    image_bytes: Optional[bytes],
    attrs: Dict[str, str],
    top_n: int = 6,
) -> List[Dict]:
    if not ENTRIES:
        return []

    wanted_category = category_from_name(attrs.get("Category", "") or "")
    text_vec = encode_text_query(text_query) if text_query else None
    image_vec = encode_image_query(image_bytes) if image_bytes else None

    # Search text in hybrid index, image in visual index, combine at score level.
    text_scores: Dict[int, float] = {}
    image_scores: Dict[int, float] = {}

    if text_vec is not None:
        scores, idxs = FAISS_HYBRID.search(np.array([text_vec], dtype="float32"), min(80, max(20, top_n * 12)))
        for idx, score in zip(idxs[0], scores[0]):
            text_scores[int(idx)] = float(score)

    if image_vec is not None:
        scores, idxs = FAISS_VISUAL.search(np.array([image_vec], dtype="float32"), min(80, max(20, top_n * 12)))
        for idx, score in zip(idxs[0], scores[0]):
            image_scores[int(idx)] = float(score)

    candidate_ids = set(text_scores) | set(image_scores)
    if not candidate_ids:
        # Fall back: if only category is known, return category-matching catalog entries from resolved files.
        candidate_ids = set(ENTRY_BY_FAISS_IDX.keys())

    ranked: List[Tuple[float, Dict, float]] = []
    for faiss_idx in candidate_ids:
        entry = ENTRY_BY_FAISS_IDX.get(int(faiss_idx))
        if not entry:
            continue

        if wanted_category and entry["category"] != wanted_category:
            continue

        t_score = text_scores.get(int(faiss_idx), 0.0)
        i_score = image_scores.get(int(faiss_idx), 0.0)

        if text_vec is not None and image_vec is not None:
            base_similarity = (0.40 * t_score) + (0.60 * i_score)
        else:
            base_similarity = i_score if image_vec is not None else t_score

        # Description string used for reranking.
        desc_blob = " ".join(
            [
                entry["file_name"],
                entry["category"],
                entry["description"],
                str(entry["meta"].get("category", "")),
            ]
        ).lower()

        rerank_bonus = score_attribute_matches(desc_blob, attrs)
        if wanted_category and entry["category"] == wanted_category:
            rerank_bonus += 0.15
        if text_query:
            for token in re.findall(r"[a-zA-Z]+", text_query.lower()):
                if len(token) >= 3 and token in desc_blob:
                    rerank_bonus += 0.01

        final_score = base_similarity + rerank_bonus
        ranked.append((final_score, entry, base_similarity))

    ranked.sort(key=lambda x: x[0], reverse=True)
    results = [build_result(entry, sim, final, idx) for idx, (final, entry, sim) in enumerate(ranked[:top_n])]
    return results


def get_smart_recommendations(reference_path: str, top_n: int = 4) -> List[Dict]:
    ref_path = resolve_image_path(reference_path) or Path(reference_path)
    if not ref_path.exists():
        return []
    ref_cat = detect_category_from_path(ref_path) or "rings"
    opposite = "necklaces" if ref_cat == "rings" else "rings"
    pool = [e for e in ENTRIES if e["file_name"] != ref_path.name and e["category"] == opposite]
    return [
        {
            "image_url": build_image_url(e["path"]),
            "image_path": str(e["path"]),
            "description": e["description"] or f"Complementary {opposite[:-1]} piece",
            "category": e["category"].title(),
        }
        for e in pool[:top_n]
    ]


# ──────────────────────────────────────────────────────────────────────────────
# API routes
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health() -> Dict:
    cat_counts = {"rings": 0, "necklaces": 0}
    for e in ENTRIES:
        cat_counts[e["category"]] = cat_counts.get(e["category"], 0) + 1
    return {
        "status": "ok",
        "hybrid_index_vectors": FAISS_HYBRID.ntotal,
        "visual_index_vectors": FAISS_VISUAL.ntotal,
        "resolved_entries": len(ENTRIES),
        "category_counts": cat_counts,
        "gemini_enabled": bool(GEMINI_CLIENT),
        "data_dir_exists": DATA_DIR.exists(),
    }


@app.post("/api/transcribe")
async def transcribe_endpoint(audio: UploadFile = File(...)) -> Dict:
    return transcribe_audio(await audio.read())


@app.post("/api/search")
async def search_endpoint(
    query: str = Form(default=""),
    image: Optional[UploadFile] = File(default=None),
    top_n: int = Form(default=6),
) -> Dict:
    query = (query or "").strip()
    image_bytes: Optional[bytes] = None
    ocr_text = ""
    spell_correction = None
    query_rewrite = None

    if image and image.filename:
        image_bytes = await image.read()
        gemini_image_text = gemini_extract_text_or_description(image_bytes)
        if gemini_image_text["has_text"]:
            ocr_text = gemini_image_text["text"]

    merged_query = query
    if not merged_query and ocr_text:
        merged_query = ocr_text
    elif merged_query and ocr_text:
        merged_query = f"{query} {ocr_text}".strip()

    if merged_query:
        spell_correction = spell_check_and_correct(merged_query)
        merged_query = spell_correction["corrected"]
        query_rewrite = rewrite_query_with_llm(merged_query)
        merged_query = query_rewrite["rewritten"]

    attributes = extract_attributes_from_text(merged_query or ocr_text or "jewelry")
    results = search_candidates(merged_query or None, image_bytes, attributes, top_n=max(1, min(top_n, 20)))

    return {
        "ocr_text": ocr_text,
        "spell_correction": spell_correction,
        "query_rewrite": query_rewrite,
        "refinement": attributes,
        "results": results,
        "top_image_path": results[0]["image_path"] if results else None,
        "detected_category": category_from_name(attributes.get("Category", "") or "") or "unknown",
    }


@app.post("/api/recommendations")
async def recommendations_endpoint(image_path: str = Form(...), top_n: int = Form(default=4)) -> Dict:
    recs = get_smart_recommendations(image_path, top_n=max(1, min(top_n, 10)))
    ref_path = resolve_image_path(image_path)
    return {
        "reference": {
            "image_url": build_image_url(ref_path) if ref_path and ref_path.exists() else "",
            "description": "Selected jewelry piece",
            "category": (detect_category_from_path(ref_path) or "Jewelry").title() if ref_path else "Jewelry",
        },
        "recommendations": recs,
    }


# Static images are exposed here so the React frontend can load returned URLs.
if DATA_DIR.exists():
    app.mount("/images", StaticFiles(directory=str(DATA_DIR)), name="images")
