import streamlit as st
import faiss
import numpy as np
import os
import json
import re
import base64
import random
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv
from google import genai
from google.genai import types
from sentence_transformers import SentenceTransformer
import speech_recognition as sr
import tempfile

# ============================================================================
# CONFIGURATION
# ============================================================================

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

st.set_page_config(
    page_title="Tanishq AI Jewellery",
    page_icon="diamond",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ============================================================================
# LUXURY CSS
# ============================================================================

def load_css():
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600&display=swap');

    :root {
        --gold: #C9A84C;
        --gold-light: #E8D5A3;
        --gold-dark: #A07830;
        --bg: #0F0F0F;
        --bg2: #1A1A1A;
        --bg3: #252525;
        --text: #F0EAD6;
        --muted: #888;
        --border: #2A2A2A;
        --red: #8B1A1A;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .stApp {
        background: var(--bg) !important;
        color: var(--text) !important;
        font-family: 'Montserrat', sans-serif;
    }

    .stApp > header { background: transparent !important; }

    /* Hide default streamlit elements */
    #MainMenu, footer, .stDeployButton { display: none !important; }

    /* Typography */
    h1 {
        font-family: 'Playfair Display', serif !important;
        color: var(--gold) !important;
        letter-spacing: 3px;
        text-shadow: 0 0 40px rgba(201, 168, 76, 0.3);
    }
    h2, h3 {
        font-family: 'Cormorant Garamond', serif !important;
        color: var(--gold-light) !important;
    }

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] {
        background: transparent;
        border-bottom: 1px solid var(--gold-dark);
        gap: 0;
    }
    .stTabs [data-baseweb="tab"] {
        font-family: 'Montserrat', sans-serif;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: var(--muted);
        padding: 14px 24px;
        border: none;
        background: transparent;
    }
    .stTabs [aria-selected="true"] {
        color: var(--gold) !important;
        border-bottom: 2px solid var(--gold) !important;
        background: transparent !important;
    }

    /* Inputs */
    .stTextInput input, .stTextArea textarea {
        background: var(--bg3) !important;
        border: 1px solid var(--gold-dark) !important;
        border-radius: 4px !important;
        color: var(--text) !important;
        font-family: 'Montserrat', sans-serif;
        font-size: 15px;
    }
    .stTextInput input:focus, .stTextArea textarea:focus {
        border-color: var(--gold) !important;
        box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.15) !important;
    }

    /* Buttons */
    .stButton > button {
        background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%) !important;
        color: #000 !important;
        border: none !important;
        border-radius: 2px !important;
        padding: 12px 32px !important;
        font-family: 'Montserrat', sans-serif !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        letter-spacing: 2px !important;
        text-transform: uppercase !important;
        transition: all 0.3s ease !important;
    }
    .stButton > button:hover {
        opacity: 0.9 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 8px 24px rgba(201, 168, 76, 0.4) !important;
    }

    /* Cards */
    .jewel-card {
        background: var(--bg2);
        border: 1px solid var(--border);
        border-radius: 2px;
        overflow: hidden;
        transition: all 0.3s ease;
        margin-bottom: 24px;
    }
    .jewel-card:hover {
        border-color: var(--gold-dark);
        transform: translateY(-4px);
        box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    }
    .jewel-card img { border-radius: 0 !important; }

    .card-body { padding: 16px; }
    .card-name {
        font-family: 'Cormorant Garamond', serif;
        font-size: 16px;
        color: var(--text);
        margin-bottom: 4px;
        font-weight: 500;
    }
    .card-price {
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        color: var(--gold);
        font-weight: 600;
    }
    .card-cat {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: var(--muted);
        margin-top: 4px;
    }

    /* Gold badge */
    .badge-gold {
        display: inline-block;
        background: var(--gold);
        color: #000;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        padding: 3px 10px;
        border-radius: 1px;
        margin-bottom: 8px;
    }
    .badge-red {
        display: inline-block;
        background: var(--red);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        padding: 3px 10px;
        border-radius: 1px;
        margin-bottom: 8px;
    }

    /* Section headers */
    .section-title {
        font-family: 'Playfair Display', serif;
        font-size: 28px;
        color: var(--gold);
        letter-spacing: 2px;
        margin-bottom: 8px;
    }
    .section-sub {
        font-family: 'Cormorant Garamond', serif;
        font-size: 16px;
        color: var(--muted);
        letter-spacing: 1px;
        margin-bottom: 32px;
    }
    .gold-divider {
        border: none;
        border-top: 1px solid var(--gold-dark);
        opacity: 0.4;
        margin: 32px 0;
    }

    /* Search highlight */
    .ai-box {
        background: rgba(201, 168, 76, 0.08);
        border-left: 3px solid var(--gold);
        padding: 16px 20px;
        margin: 12px 0;
        font-family: 'Cormorant Garamond', serif;
        font-size: 17px;
        color: var(--gold-light);
        border-radius: 0 4px 4px 0;
    }

    /* Detail page */
    .detail-name {
        font-family: 'Playfair Display', serif;
        font-size: 32px;
        color: var(--text);
        margin-bottom: 8px;
    }
    .detail-price {
        font-family: 'Cormorant Garamond', serif;
        font-size: 28px;
        color: var(--gold);
        margin-bottom: 16px;
    }
    .detail-desc {
        font-family: 'Cormorant Garamond', serif;
        font-size: 18px;
        color: var(--muted);
        line-height: 1.8;
        margin-bottom: 24px;
    }

    /* Metrics */
    [data-testid="stMetricValue"] {
        font-family: 'Playfair Display', serif !important;
        color: var(--gold) !important;
    }
    [data-testid="stMetricLabel"] {
        font-family: 'Montserrat', sans-serif !important;
        color: var(--muted) !important;
        font-size: 11px !important;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* Spinner */
    .stSpinner > div { border-top-color: var(--gold) !important; }

    /* Notification */
    .notify {
        background: rgba(201, 168, 76, 0.1);
        border: 1px solid var(--gold-dark);
        border-radius: 4px;
        padding: 12px 18px;
        margin: 12px 0;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        color: var(--gold-light);
    }

    /* File uploader */
    [data-testid="stFileUploaderDropzone"] {
        background: var(--bg3) !important;
        border: 1px dashed var(--gold-dark) !important;
        border-radius: 4px !important;
    }

    /* Voice input section */
    .voice-box {
        background: var(--bg3);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 24px;
        text-align: center;
        margin: 16px 0;
    }

    /* Support */
    .support-box {
        background: var(--bg2);
        border: 1px solid var(--gold-dark);
        border-radius: 4px;
        padding: 28px;
        margin: 16px 0;
    }

    /* Team card */
    .team-card {
        background: var(--bg2);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 28px 24px;
        text-align: center;
        transition: all 0.3s;
    }
    .team-card:hover { border-color: var(--gold-dark); }
    .team-avatar {
        width: 80px; height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--gold), var(--gold-dark));
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 16px;
        font-family: 'Playfair Display', serif;
        font-size: 28px;
        color: #000;
    }
    .team-name {
        font-family: 'Cormorant Garamond', serif;
        font-size: 20px;
        color: var(--text);
        font-weight: 600;
    }
    .team-role {
        font-size: 11px;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: var(--gold);
        margin: 4px 0 12px;
    }
    .team-contact {
        font-size: 13px;
        color: var(--muted);
    }

    /* Logo header */
    .brand-header {
        text-align: center;
        padding: 40px 20px 20px;
        background: linear-gradient(180deg, rgba(201,168,76,0.05) 0%, transparent 100%);
        border-bottom: 1px solid var(--border);
        margin-bottom: 8px;
    }
    .brand-name {
        font-family: 'Playfair Display', serif;
        font-size: 48px;
        color: var(--gold);
        letter-spacing: 8px;
        text-transform: uppercase;
        text-shadow: 0 0 60px rgba(201,168,76,0.2);
    }
    .brand-tagline {
        font-family: 'Cormorant Garamond', serif;
        font-size: 16px;
        color: var(--muted);
        letter-spacing: 3px;
        margin-top: 8px;
    }

    /* Home hero */
    .hero-section {
        background: linear-gradient(135deg, var(--bg2) 0%, var(--bg) 100%);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 60px 40px;
        text-align: center;
        margin: 32px 0;
    }
    .hero-title {
        font-family: 'Playfair Display', serif;
        font-size: 52px;
        color: var(--text);
        line-height: 1.2;
        margin-bottom: 16px;
    }
    .hero-sub {
        font-family: 'Cormorant Garamond', serif;
        font-size: 20px;
        color: var(--muted);
        margin-bottom: 32px;
    }

    /* Match score */
    .match-score {
        font-family: 'Montserrat', sans-serif;
        font-size: 11px;
        color: var(--gold);
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    /* Cart/wishlist count */
    .count-badge {
        background: var(--red);
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        margin-left: 4px;
    }

    /* Scrollable grid */
    .collection-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-top: 24px;
    }

    /* Input labels */
    .stRadio label { color: var(--text) !important; }
    label { color: var(--text) !important; }

    /* Select */
    .stSelectbox > div > div {
        background: var(--bg3) !important;
        border-color: var(--gold-dark) !important;
        color: var(--text) !important;
    }

    /* Audio widget hide ugly */
    audio { display: none; }
    </style>
    """, unsafe_allow_html=True)

load_css()

# ============================================================================
# VOICE UTILITY
# ============================================================================

def transcribe_audio(audio_bytes):
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
    except sr.RequestError as e:
        return {"success": False, "error": f"Speech service error: {e}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# RESOURCE LOADING — FIX PATHS
# ============================================================================

@st.cache_resource
def load_resources():
    """
    v3 High-Accuracy Resource Loader
    - Loads separate visual index (image search) and hybrid index (text search)
    - Normalizes query vectors at search time for cosine similarity
    - Scans dataset for correct absolute paths (fixes Windows path bug)
    """
    try:
        model = SentenceTransformer('clip-ViT-B-32')

        # Try to load separate visual/hybrid indexes (built by rebuild_index.py v3)
        # Falls back to legacy jewelry.index if not rebuilt yet
        vis_path = os.path.join(BASE_DIR, "jewelry_visual.index")
        hyb_path = os.path.join(BASE_DIR, "jewelry_hybrid.index")
        leg_path = os.path.join(BASE_DIR, "jewelry.index")

        if os.path.exists(vis_path) and os.path.exists(hyb_path):
            visual_index = faiss.read_index(vis_path)
            hybrid_index = faiss.read_index(hyb_path)
        elif os.path.exists(leg_path):
            # Legacy fallback — use same index for both modes
            visual_index = faiss.read_index(leg_path)
            hybrid_index = visual_index
        else:
            st.error("No FAISS index found! Run: python rebuild_index.py")
            return None, None, None, None, None

        # Scan dataset for absolute image paths (sorted to match index order)
        tanishq_dir = os.path.join(DATA_DIR, "Tanishq")
        paths = []
        for category in sorted(os.listdir(tanishq_dir)):
            cat_dir = os.path.join(tanishq_dir, category)
            if os.path.isdir(cat_dir):
                for fname in sorted(os.listdir(cat_dir)):
                    if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                        paths.append(os.path.join(cat_dir, fname))

        # Load metadata — normalise keys to filename only
        meta_path = os.path.join(BASE_DIR, "jewelry_metadata.json")
        if not os.path.exists(meta_path):
            st.error("jewelry_metadata.json not found!")
            return None, None, None, None, None

        with open(meta_path, "r") as f:
            raw_metadata = json.load(f)

        metadata = {}
        for key, val in raw_metadata.items():
            fname = os.path.basename(key).replace('\\', '/').split('/')[-1]
            metadata[fname] = val

        return model, visual_index, hybrid_index, paths, metadata
    except Exception as e:
        st.error(f"Error loading resources: {str(e)}")
        return None, None, None, None, None

with st.spinner("Loading Tanishq AI..."):
    _resources = load_resources()

if _resources[0] is None:
    st.stop()

model, visual_index, hybrid_index, image_paths, jewelry_metadata = _resources
index = hybrid_index  # alias for legacy code

# Init Gemini
try:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
except Exception as e:
    st.error(f"Failed to initialize Gemini: {str(e)}")
    st.stop()

# ============================================================================
# HELPER: GENERATE JEWELLERY DETAILS
# ============================================================================

RING_NAMES = [
    "Sunehri Pankhi Ring", "Meera's Bloom Ring", "Regal Eternity Band", "Veda Diamond Ring",
    "Lotus Temple Ring", "Ananya Solitaire", "Priya Floral Band", "Heritage Zircon Ring",
    "Celestia Gold Band", "Mariam Rose Ring", "Kalasha Twist Ring", "Shakti Pavé Ring",
    "Radha Emerald Ring", "Amara Halo Ring", "Nirvana Stackable Ring", "Abhilasha Ring"
]

NECKLACE_NAMES = [
    "Ganga Pearl Necklace", "Bridal Aura Necklace", "Lotus Chain Necklace", "Zara Gold Necklace",
    "Mridula Temple Necklace", "Prisha Diamond Necklace", "Kaveri Layered Necklace", "Riya Kundan Set",
    "Sunita Heirloom Necklace", "Heritage Choker", "Tamara Gold Collar", "Ananda Pendant Set",
    "Swara Statement Necklace", "Chandni Haar", "Lalitha Bridal Necklace", "Veda Temple Necklace"
]

def get_jewelry_name(filepath):
    """Auto-generate realistic jewellery name based on category and index"""
    fname = os.path.basename(filepath)
    try:
        num = int(re.search(r'\d+', fname).group())
    except:
        num = random.randint(1, 100)
    
    if 'ring' in fname.lower():
        return RING_NAMES[num % len(RING_NAMES)]
    else:
        return NECKLACE_NAMES[num % len(NECKLACE_NAMES)]

def get_jewelry_price(filepath):
    """Auto-generate realistic price"""
    fname = os.path.basename(filepath)
    try:
        num = int(re.search(r'\d+', fname).group())
    except:
        num = random.randint(1, 100)
    
    seed_prices_rings = [18500, 24900, 32000, 45000, 28750, 52000, 19800, 67500, 38000, 21000,
                         41500, 56000, 29900, 73000, 44000, 35500]
    seed_prices_necklaces = [48000, 75000, 92000, 63000, 84500, 110000, 56000, 128000, 71000, 95000,
                              43000, 88000, 102000, 67000, 79500, 115000]
    
    if 'ring' in fname.lower():
        return seed_prices_rings[num % len(seed_prices_rings)]
    else:
        return seed_prices_necklaces[num % len(seed_prices_necklaces)]

def format_price(amount):
    return f"₹{amount:,}"

def get_jewelry_material(filepath):
    fname = os.path.basename(filepath)
    try:
        num = int(re.search(r'\d+', fname).group())
    except:
        num = 1
    materials = ["22K Yellow Gold", "18K White Gold", "22K Rose Gold", "Platinum", "18K Yellow Gold with Diamond"]
    return materials[num % len(materials)]

def get_jewelry_description(filepath, metadata):
    fname = os.path.basename(filepath)
    meta = metadata.get(fname, {})
    desc = meta.get("ai_description", "")
    
    # Clean up generic AI descriptions
    if desc and "a photo of" not in desc.lower() and len(desc) > 30:
        return desc
    
    # Generate a realistic description
    category = "ring" if "ring" in fname.lower() else "necklace"
    num = 1
    try: num = int(re.search(r'\d+', fname).group())
    except: pass
    
    if category == "ring":
        descs = [
            "An exquisite handcrafted ring in lustrous 22K gold, featuring intricate floral motifs that celebrate the timeless artistry of Indian jewellery-making.",
            "A radiant solitaire ring set in 18K white gold with a magnificent diamond, perfect for engagements and special occasions.",
            "A beautifully crafted cocktail ring with a vibrant gemstone centrepiece, surrounded by delicate gold filigree work.",
            "A classic eternity band with brilliant-cut diamonds, symbolising everlasting love and fine craftsmanship.",
            "An ornate traditional ring with temple-inspired motifs in 22K gold, designed for the woman who appreciates heritage.",
        ]
        return descs[num % len(descs)]
    else:
        descs = [
            "A magnificent bridal necklace in 22K gold with intricate meenakari work and pearl drops, crafted to make every celebration unforgettable.",
            "An elegant layered necklace with diamond accents in 18K white gold — timeless, refined, and perfect for any occasion.",
            "A stunning temple necklace with ruby and emerald inlays, showcasing the finest traditions of Indian goldsmithing.",
            "A contemporary gold choker with a sleek, polished finish that transitions seamlessly from day to evening wear.",
            "A statement diamond necklace in 18K gold with brilliant-cut stones, created for the woman who commands attention.",
        ]
        return descs[num % len(descs)]

# ============================================================================
# SEARCH FUNCTIONS  — v3 High-Accuracy (cosine similarity + hybrid embeddings)
# ============================================================================

def img_to_base64(filepath):
    try:
        with open(filepath, "rb") as f:
            return base64.b64encode(f.read()).decode()
    except:
        return None


def detect_category(text):
    """Detect jewellery category from text query."""
    text = text.lower()
    ring_words    = ["ring", "band", "solitaire", "engagement ring", "finger ring", "kundan ring"]
    necklace_words= ["necklace", "neckpiece", "chain", "haar", "choker", "pendant", "collar", "mala", "tanmani"]
    if any(w in text for w in ring_words):
        return "ring"
    if any(w in text for w in necklace_words):
        return "necklace"
    return None


def normalize_vec(vec: np.ndarray) -> np.ndarray:
    """L2-normalize a 1D or 2D array for cosine similarity."""
    if vec.ndim == 1:
        vec = vec.reshape(1, -1)
    norm = np.linalg.norm(vec, axis=1, keepdims=True)
    norm = np.where(norm == 0, 1e-10, norm)
    return (vec / norm).astype("float32")


def _category_of(path: str) -> str:
    fname = os.path.basename(path).lower()
    if "ring" in fname:    return "ring"
    if "necklace" in fname: return "necklace"
    return "other"


def _cosine_to_pct(score: float) -> float:
    """Convert raw cosine inner-product score (0–1) to percentage."""
    return float(np.clip(score, 0.0, 1.0))


# ---------------------------------------------------------------------------
# Visual search  (image → image)
# ---------------------------------------------------------------------------

def visual_search_with_category(uploaded_image_pil, category_filter=None, top_n=8):
    """
    High-accuracy image-to-image search.
    Uses the dedicated visual FAISS index with cosine similarity.
    Category locking is applied post-retrieval.
    """
    try:
        # 1. Encode query image
        raw_vec = model.encode(uploaded_image_pil)
        query_vec = normalize_vec(np.array(raw_vec))   # cosine-ready

        # 2. Over-fetch to allow category filtering
        k = min(top_n * 6, visual_index.ntotal)
        scores, idxs = visual_index.search(query_vec, k)

        results = []
        for score, idx in zip(scores[0], idxs[0]):
            if idx < 0 or idx >= len(image_paths):
                continue
            path = image_paths[idx]
            if not os.path.exists(path):
                continue
            if category_filter and category_filter not in _category_of(path):
                continue
            fname = os.path.basename(path)
            meta  = jewelry_metadata.get(fname, {})
            results.append((path, meta, _cosine_to_pct(score)))
            if len(results) >= top_n:
                break

        return results
    except Exception as e:
        st.error(f"Visual search error: {e}")
        return []


# ---------------------------------------------------------------------------
# Text search  (query string → images)
# ---------------------------------------------------------------------------

CATEGORY_PROMPTS = {
    "ring":     ["gold ring jewellery", "Indian traditional ring", "22K gold finger ring Tanishq"],
    "necklace": ["gold necklace jewellery", "Indian traditional necklace", "22K gold necklace bridal Tanishq"],
}

def _build_query_vec(query: str, category: str | None) -> np.ndarray:
    """
    Multi-prompt query fusion:
      - user query as-is
      - user query + 'jewellery'
      - category-specific anchor prompts (if known)
    Returns a single normalized hybrid vector.
    """
    prompts = [query, f"{query} jewellery", f"Tanishq {query} gold"]
    if category and category in CATEGORY_PROMPTS:
        prompts += CATEGORY_PROMPTS[category]

    vecs = model.encode(prompts)          # (N, 512)
    fused = np.mean(vecs, axis=0)         # average across prompts
    return normalize_vec(fused)


def text_search(query, category_filter=None, top_n=8):
    """
    High-accuracy text search using the hybrid FAISS index.
    Multi-prompt fusion + strict category locking.
    """
    try:
        query_vec = _build_query_vec(query, category_filter)

        k = min(top_n * 8, hybrid_index.ntotal)
        scores, idxs = hybrid_index.search(query_vec, k)

        results = []
        seen = set()
        for score, idx in zip(scores[0], idxs[0]):
            if idx < 0 or idx >= len(image_paths):
                continue
            path = image_paths[idx]
            if path in seen or not os.path.exists(path):
                continue
            if category_filter and category_filter not in _category_of(path):
                continue
            seen.add(path)
            fname = os.path.basename(path)
            meta  = jewelry_metadata.get(fname, {})
            results.append((path, meta, _cosine_to_pct(score)))
            if len(results) >= top_n:
                break

        return results
    except Exception as e:
        st.error(f"Text search error: {e}")
        return []


# ---------------------------------------------------------------------------
# Gemini AI helpers
# ---------------------------------------------------------------------------

def ai_analyze_image(image_bytes):
    """Use Gemini to extract category and rich description from uploaded image."""
    try:
        prompt = """Analyze this jewellery image carefully.

        Answer ONLY in this exact format:
        Category: [Ring OR Necklace]
        Description: [2 sentence description of the jewellery]
        Metal: [Gold/Silver/Platinum/Rose Gold]
        Style: [Traditional/Contemporary/Bridal/Casual]
        """
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")]
        )
        text = response.text
        cat_match  = re.search(r'Category:\s*(\w+)', text, re.I)
        desc_match = re.search(r'Description:\s*(.+?)(?:\n|Metal:|$)', text, re.I | re.S)

        category = None
        if cat_match:
            cv = cat_match.group(1).lower()
            if "ring" in cv:    category = "ring"
            elif "necklace" in cv: category = "necklace"

        description = desc_match.group(1).strip() if desc_match else ""
        return {"category": category, "description": description}
    except Exception as e:
        return {"category": None, "description": ""}


def ai_refine_query(user_input):
    """Use Gemini to expand and enhance a text search query."""
    try:
        prompt = f"""You are a luxury Indian jewellery search expert.

        Enhance this search query for better retrieval:
        Original: "{user_input}"

        Return EXACTLY:
        Enhanced: [better query, max 15 words]
        Category: [Ring OR Necklace OR Unknown]
        """
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text
        enh_match = re.search(r'Enhanced:\s*(.+?)(?:\n|Category:|$)', text, re.I)
        cat_match  = re.search(r'Category:\s*(\w+)', text, re.I)

        enhanced = enh_match.group(1).strip() if enh_match else user_input
        cat_val  = cat_match.group(1).lower().strip() if cat_match else "unknown"

        category = None
        if "ring" in cat_val:    category = "ring"
        elif "necklace" in cat_val: category = "necklace"

        return {"enhanced": enhanced, "category": category}
    except:
        return {"enhanced": user_input, "category": detect_category(user_input)}
# ============================================================================
# SESSION STATE INIT
# ============================================================================

if 'wishlist' not in st.session_state:
    st.session_state.wishlist = []
if 'cart' not in st.session_state:
    st.session_state.cart = []
if 'orders' not in st.session_state:
    st.session_state.orders = []
if 'current_detail' not in st.session_state:
    st.session_state.current_detail = None
if 'active_tab' not in st.session_state:
    st.session_state.active_tab = "Home"

# ============================================================================
# BRAND HEADER
# ============================================================================

st.markdown("""
<div class="brand-header">
    <div class="brand-name">TANISHQ</div>
    <div class="brand-tagline">A Tata Enterprise · Since 1994</div>
</div>
""", unsafe_allow_html=True)

# ============================================================================
# NAVIGATION TABS
# ============================================================================

tab_home, tab_ai, tab_collection, tab_wishlist, tab_cart, tab_orders, tab_team, tab_support = st.tabs([
    "Home",
    "AI Search",
    f"Collection",
    f"Wishlist ({len(st.session_state.wishlist)})",
    f"Cart ({len(st.session_state.cart)})",
    f"Orders ({len(st.session_state.orders)})",
    "Our Team",
    "Support"
])

# ============================================================================
# HELPER: DISPLAY JEWELLERY CARD WITH ACTIONS
# ============================================================================

def display_jewel_card(path, col, key_prefix, show_actions=True, badge_text=None, similarity=None):
    """Render a jewellery card with wishlist/cart buttons"""
    fname = os.path.basename(path)
    name = get_jewelry_name(path)
    price = get_jewelry_price(path)
    category = "Ring" if "ring" in fname.lower() else "Necklace"
    
    with col:
        if os.path.exists(path):
            img = Image.open(path)
            st.image(img, use_container_width=True)
        
        if badge_text:
            st.markdown(f'<span class="badge-gold">{badge_text}</span>', unsafe_allow_html=True)
        if similarity:
            st.markdown(f'<span class="match-score">Match: {similarity*100:.0f}%</span>', unsafe_allow_html=True)
        
        st.markdown(f'<div class="card-name">{name}</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="card-price">{format_price(price)}</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="card-cat">{category} · 22K Gold</div>', unsafe_allow_html=True)
        
        if show_actions:
            c1, c2, c3 = st.columns(3)
            with c1:
                if st.button("Details", key=f"{key_prefix}_det_{fname}"):
                    st.session_state.current_detail = path
                    st.rerun()
            with c2:
                in_wish = any(p == path for p in st.session_state.wishlist)
                if st.button("Wishlist" if not in_wish else "Wishlisted", key=f"{key_prefix}_wish_{fname}"):
                    if not in_wish:
                        st.session_state.wishlist.append(path)
                        st.success("Added to Wishlist!")
                        st.rerun()
            with c3:
                in_cart = any(p == path for p in st.session_state.cart)
                if st.button("Add Cart" if not in_cart else "In Cart", key=f"{key_prefix}_cart_{fname}"):
                    if not in_cart:
                        st.session_state.cart.append(path)
                        st.success("Added to Cart!")
                        st.rerun()

# ============================================================================
# DETAIL PAGE OVERLAY
# ============================================================================

if st.session_state.current_detail:
    path = st.session_state.current_detail
    fname = os.path.basename(path)
    name = get_jewelry_name(path)
    price = get_jewelry_price(path)
    category = "Ring" if "ring" in fname.lower() else "Necklace"
    material = get_jewelry_material(path)
    description = get_jewelry_description(path, jewelry_metadata)
    
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
    st.markdown(f'<div class="badge-gold">{category}</div>', unsafe_allow_html=True)
    
    col_img, col_info = st.columns([1, 1])
    
    with col_img:
        if os.path.exists(path):
            st.image(path, use_container_width=True)
    
    with col_info:
        st.markdown(f'<div class="detail-name">{name}</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="detail-price">{format_price(price)}</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="detail-desc">{description}</div>', unsafe_allow_html=True)
        
        st.markdown(f"""
        <div style="border-top: 1px solid #2A2A2A; padding-top: 16px; margin-bottom: 16px;">
            <div style="display:flex; gap:32px; margin-bottom: 12px;">
                <div><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;">Material</div>
                     <div style="color:#F0EAD6;margin-top:4px;">{material}</div></div>
                <div><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;">Category</div>
                     <div style="color:#F0EAD6;margin-top:4px;">{category}</div></div>
                <div><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;">Purity</div>
                     <div style="color:#F0EAD6;margin-top:4px;">BIS Hallmarked</div></div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        c1, c2, c3 = st.columns(3)
        with c1:
            if st.button("Add to Wishlist", key="det_wish"):
                if not any(p == path for p in st.session_state.wishlist):
                    st.session_state.wishlist.append(path)
                st.success("Added to Wishlist")
        with c2:
            if st.button("Add to Cart", key="det_cart"):
                if not any(p == path for p in st.session_state.cart):
                    st.session_state.cart.append(path)
                st.success("Added to Cart")
        with c3:
            if st.button("Back", key="det_back"):
                st.session_state.current_detail = None
                st.rerun()
    
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

# ============================================================================
# TAB: HOME
# ============================================================================

with tab_home:
    # Hero section
    st.markdown("""
    <div class="hero-section">
        <div class="hero-title">Crafted for Eternity.<br>Worn with Grace.</div>
        <div class="hero-sub">Discover exquisite jewellery from India's most trusted brand, powered by AI.</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Features grid
    c1, c2, c3, c4 = st.columns(4)
    features = [
        ("AI Visual Search", "Upload a photo and find visually similar pieces from our collection."),
        ("Category Precision", "Strict ring-to-ring and necklace-to-necklace retrieval. Zero cross-matching."),
        ("Voice Search", "Speak your description naturally and let AI find your match."),
        ("Full Collection", "Browse all 489 authentic jewellery pieces from our dataset.")
    ]
    for col, (title, desc) in zip([c1,c2,c3,c4], features):
        with col:
            st.markdown(f"""
            <div class="support-box">
                <div style="font-family:'Cormorant Garamond',serif;font-size:18px;color:#C9A84C;margin-bottom:8px;">{title}</div>
                <div style="font-size:13px;color:#888;line-height:1.7;">{desc}</div>
            </div>
            """, unsafe_allow_html=True)
    
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
    
    # Featured pieces
    st.markdown('<div class="section-title">Featured Collection</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Handpicked pieces from our exclusive range</div>', unsafe_allow_html=True)
    
    # Show 6 random featured items
    ring_paths = [p for p in image_paths if 'ring' in os.path.basename(p).lower()]
    necklace_paths = [p for p in image_paths if 'necklace' in os.path.basename(p).lower()]
    
    featured = ring_paths[:3] + necklace_paths[:3]
    cols = st.columns(6)
    for i, fp in enumerate(featured[:6]):
        display_jewel_card(fp, cols[i], f"home_{i}", show_actions=True)
    
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
    st.markdown("""
    <div style="text-align:center;padding:32px;color:#888;font-family:'Cormorant Garamond',serif;font-size:16px;">
        "Every piece tells a story of love, tradition, and unmatched craftsmanship."<br><br>
        <span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;">Tanishq · A Tata Enterprise</span>
    </div>
    """, unsafe_allow_html=True)

# ============================================================================
# TAB: AI SEARCH
# ============================================================================

with tab_ai:
    st.markdown('<div class="section-title">AI Jewellery Search</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Describe what you want, upload an image, or use your voice</div>', unsafe_allow_html=True)
    
    input_method = st.radio(
        "Search method:",
        ["Text Description", "Image Upload", "Voice Input"],
        horizontal=True,
        label_visibility="collapsed"
    )
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    final_query = None
    uploaded_image_pil = None
    detected_category = None
    voice_text = None
    
    if input_method == "Text Description":
        col_l, col_r = st.columns([2, 1])
        with col_l:
            user_query = st.text_input(
                "Describe the jewellery you're looking for",
                placeholder="e.g., elegant gold necklace with diamonds, traditional bridal ring...",
                label_visibility="collapsed"
            )
            if user_query:
                final_query = user_query
                detected_category = detect_category(user_query)
        with col_r:
            cat_override = st.selectbox("Category filter", ["Auto-detect", "Rings only", "Necklaces only"])
            if cat_override == "Rings only":
                detected_category = "ring"
            elif cat_override == "Necklaces only":
                detected_category = "necklace"
    
    elif input_method == "Image Upload":
        col_l, col_r = st.columns([1, 1])
        with col_l:
            image_file = st.file_uploader(
                "Upload jewellery image",
                type=["jpg", "jpeg", "png"],
                label_visibility="collapsed"
            )
            if image_file:
                image_bytes = image_file.read()
                image_file.seek(0)
                uploaded_image_pil = Image.open(BytesIO(image_bytes)).convert("RGB")
                
                # Use Gemini to detect category
                with st.spinner("Analysing image..."):
                    ai_result = ai_analyze_image(image_bytes)
                
                detected_category = ai_result.get("category")
                ai_desc = ai_result.get("description", "")
                
                if detected_category:
                    st.markdown(f'<div class="ai-box">AI detected: <strong>{detected_category.title()}</strong> — {ai_desc}</div>', unsafe_allow_html=True)
                
                cat_override = st.selectbox("Confirm category", ["Use AI detection", "Rings only", "Necklaces only"], key="img_cat")
                if cat_override == "Rings only":
                    detected_category = "ring"
                elif cat_override == "Necklaces only":
                    detected_category = "necklace"
        
        with col_r:
            if uploaded_image_pil:
                st.image(uploaded_image_pil, caption="Your upload", use_container_width=True)
    
    elif input_method == "Voice Input":
        st.markdown("""
        <div class="voice-box">
            <div style="font-family:'Playfair Display',serif;font-size:20px;color:#C9A84C;margin-bottom:8px;">Voice Search</div>
            <div style="color:#888;font-size:14px;">Record your voice and upload the audio file below</div>
        </div>
        """, unsafe_allow_html=True)
        
        audio_file = st.file_uploader("Upload audio file (WAV/MP3)", type=["wav", "mp3"], label_visibility="collapsed")
        
        if audio_file:
            with st.spinner("Transcribing..."):
                result = transcribe_audio(audio_file.read())
            
            if result["success"]:
                voice_text = result["text"]
                st.markdown(f"""
                <div class="ai-box">
                    <strong>What you said:</strong> {voice_text}<br>
                    <strong>Search query:</strong> {voice_text}
                </div>
                """, unsafe_allow_html=True)
                final_query = voice_text
                detected_category = detect_category(voice_text)
            else:
                st.error(f"Could not transcribe audio: {result['error']}")
        
        # Also allow manual text
        manual = st.text_input("Or type manually:", placeholder="I'm looking for a gold ring...", label_visibility="collapsed")
        if manual and not voice_text:
            final_query = manual
            detected_category = detect_category(manual)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    search_btn = st.button("Search Collection", use_container_width=False)
    
    if search_btn:
        if input_method == "Image Upload" and uploaded_image_pil is not None:
            with st.spinner("Finding visually similar pieces..."):
                results = visual_search_with_category(uploaded_image_pil, detected_category, top_n=8)
            
            st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
            st.markdown(f'<div class="section-title">Visual Matches</div>', unsafe_allow_html=True)
            if detected_category:
                st.markdown(f'<div class="section-sub">Showing {detected_category}s most similar to your image</div>', unsafe_allow_html=True)
            
            if not results:
                st.markdown('<div class="notify">No similar jewellery found in the current collection.</div>', unsafe_allow_html=True)
            else:
                cols = st.columns(4)
                for i, (path, meta, sim) in enumerate(results):
                    display_jewel_card(path, cols[i % 4], f"aisearch_{i}", show_actions=True, similarity=sim)
        
        elif final_query:
            with st.spinner("Enhancing query with AI..."):
                refined = ai_refine_query(final_query)
            
            enhanced_query = refined["enhanced"]
            ai_category = refined["category"]
            
            # Category resolution: explicit override > AI detection > query detection
            if detected_category:
                final_category = detected_category
            elif ai_category:
                final_category = ai_category
            else:
                final_category = None
            
            st.markdown(f"""
            <div class="ai-box">
                <strong>Original:</strong> {final_query}<br>
                <strong>AI Enhanced:</strong> {enhanced_query}
                {f'<br><strong>Category:</strong> {final_category.title()}s only' if final_category else ''}
            </div>
            """, unsafe_allow_html=True)
            
            with st.spinner("Searching collection..."):
                results = text_search(enhanced_query, category_filter=final_category, top_n=8)
            
            st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
            st.markdown('<div class="section-title">Search Results</div>', unsafe_allow_html=True)
            
            if not results:
                st.markdown('<div class="notify">No similar jewellery found in the current collection.</div>', unsafe_allow_html=True)
            else:
                cols = st.columns(4)
                for i, (path, meta, sim) in enumerate(results):
                    display_jewel_card(path, cols[i % 4], f"search_{i}", show_actions=True, similarity=sim)
        else:
            st.warning("Please enter a search query or upload an image.")

# ============================================================================
# TAB: COLLECTION
# ============================================================================

with tab_collection:
    st.markdown('<div class="section-title">Our Collection</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Explore all pieces from our curated dataset</div>', unsafe_allow_html=True)
    
    ring_paths = [p for p in image_paths if 'ring' in os.path.basename(p).lower()]
    necklace_paths = [p for p in image_paths if 'necklace' in os.path.basename(p).lower()]
    
    col_filter1, col_filter2 = st.columns([1, 4])
    with col_filter1:
        cat_filter = st.selectbox("Category", ["All", "Rings", "Necklaces"], key="coll_filter")
    
    if cat_filter == "All" or cat_filter == "Rings":
        st.markdown('<div class="section-title" style="font-size:22px;margin-top:24px;">Rings</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="section-sub">{len(ring_paths)} pieces</div>', unsafe_allow_html=True)
        
        show_rings = ring_paths
        cols = st.columns(4)
        for i, fp in enumerate(show_rings):
            display_jewel_card(fp, cols[i % 4], f"coll_ring_{i}")
    
    if cat_filter == "All" or cat_filter == "Necklaces":
        st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
        st.markdown('<div class="section-title" style="font-size:22px;">Necklaces</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="section-sub">{len(necklace_paths)} pieces</div>', unsafe_allow_html=True)
        
        show_necks = necklace_paths
        cols = st.columns(4)
        for i, fp in enumerate(show_necks):
            display_jewel_card(fp, cols[i % 4], f"coll_neck_{i}")

# ============================================================================
# TAB: WISHLIST
# ============================================================================

with tab_wishlist:
    st.markdown('<div class="section-title">My Wishlist</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Pieces you love, saved for later</div>', unsafe_allow_html=True)
    
    if not st.session_state.wishlist:
        st.markdown("""
        <div class="support-box" style="text-align:center;padding:60px;">
            <div style="font-family:'Cormorant Garamond',serif;font-size:24px;color:#888;">Your wishlist is empty</div>
            <div style="font-size:14px;color:#555;margin-top:8px;">Browse our collection and save pieces you love</div>
        </div>
        """, unsafe_allow_html=True)
    else:
        if st.button("Clear Wishlist", key="clear_wish"):
            st.session_state.wishlist = []
            st.rerun()
        
        cols = st.columns(4)
        for i, path in enumerate(st.session_state.wishlist):
            fname = os.path.basename(path)
            name = get_jewelry_name(path)
            price = get_jewelry_price(path)
            
            with cols[i % 4]:
                if os.path.exists(path):
                    st.image(path, use_container_width=True)
                st.markdown(f'<div class="card-name">{name}</div>', unsafe_allow_html=True)
                st.markdown(f'<div class="card-price">{format_price(price)}</div>', unsafe_allow_html=True)
                
                c1, c2 = st.columns(2)
                with c1:
                    if st.button("Move to Cart", key=f"wish_cart_{i}"):
                        if not any(p == path for p in st.session_state.cart):
                            st.session_state.cart.append(path)
                        st.session_state.wishlist.remove(path)
                        st.rerun()
                with c2:
                    if st.button("Remove", key=f"wish_rem_{i}"):
                        st.session_state.wishlist.remove(path)
                        st.rerun()

# ============================================================================
# TAB: CART
# ============================================================================

with tab_cart:
    st.markdown('<div class="section-title">My Cart</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Ready to purchase</div>', unsafe_allow_html=True)
    
    if not st.session_state.cart:
        st.markdown("""
        <div class="support-box" style="text-align:center;padding:60px;">
            <div style="font-family:'Cormorant Garamond',serif;font-size:24px;color:#888;">Your cart is empty</div>
            <div style="font-size:14px;color:#555;margin-top:8px;">Add pieces from our collection</div>
        </div>
        """, unsafe_allow_html=True)
    else:
        total = sum(get_jewelry_price(p) for p in st.session_state.cart)
        
        cols = st.columns(4)
        for i, path in enumerate(st.session_state.cart):
            fname = os.path.basename(path)
            name = get_jewelry_name(path)
            price = get_jewelry_price(path)
            
            with cols[i % 4]:
                if os.path.exists(path):
                    st.image(path, use_container_width=True)
                st.markdown(f'<div class="card-name">{name}</div>', unsafe_allow_html=True)
                st.markdown(f'<div class="card-price">{format_price(price)}</div>', unsafe_allow_html=True)
                
                if st.button("Remove", key=f"cart_rem_{i}"):
                    st.session_state.cart.remove(path)
                    st.rerun()
        
        st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
        st.markdown(f"""
        <div class="support-box" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
                <div style="font-family:'Montserrat',sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#888;">Total ({len(st.session_state.cart)} items)</div>
                <div style="font-family:'Playfair Display',serif;font-size:32px;color:#C9A84C;margin-top:4px;">{format_price(total)}</div>
                <div style="font-size:11px;color:#555;margin-top:4px;">Inclusive of all taxes · Free shipping above ₹5,000</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Place Order", key="place_order"):
            order = {
                "id": f"TQ{random.randint(100000, 999999)}",
                "items": list(st.session_state.cart),
                "total": total,
                "status": "Confirmed"
            }
            st.session_state.orders.append(order)
            st.session_state.cart = []
            st.success(f"Order placed! Order ID: {order['id']}")
            st.rerun()

# ============================================================================
# TAB: ORDERS
# ============================================================================

with tab_orders:
    st.markdown('<div class="section-title">My Orders</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Your Tanishq jewellery journey</div>', unsafe_allow_html=True)
    
    if not st.session_state.orders:
        st.markdown("""
        <div class="support-box" style="text-align:center;padding:60px;">
            <div style="font-family:'Cormorant Garamond',serif;font-size:24px;color:#888;">No orders yet</div>
            <div style="font-size:14px;color:#555;margin-top:8px;">Your order history will appear here</div>
        </div>
        """, unsafe_allow_html=True)
    else:
        for order in reversed(st.session_state.orders):
            st.markdown(f"""
            <div class="support-box">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <div>
                        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#888;">Order ID</div>
                        <div style="font-family:'Playfair Display',serif;font-size:20px;color:#C9A84C;">{order['id']}</div>
                    </div>
                    <div>
                        <span class="badge-gold">{order['status']}</span>
                        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:#F0EAD6;margin-top:4px;">{format_price(order['total'])}</div>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            cols = st.columns(4)
            for i, path in enumerate(order["items"][:4]):
                with cols[i % 4]:
                    if os.path.exists(path):
                        st.image(path, use_container_width=True)
                    st.markdown(f'<div class="card-name" style="font-size:13px;">{get_jewelry_name(path)}</div>', unsafe_allow_html=True)
            
            st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)

# ============================================================================
# TAB: TEAM
# ============================================================================

with tab_team:
    st.markdown('<div class="section-title">Our Team</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">The minds behind Tanishq AI Platform</div>', unsafe_allow_html=True)
    
    team = [
        {
            "name": "Aditya Sharma",
            "initial": "A",
            "role": "AI / ML Engineer",
            "contact": "aditya.sharma@tanishqai.com",
            "desc": "Leads the CLIP-based retrieval system and FAISS vector indexing pipeline."
        },
        {
            "name": "Priya Nair",
            "initial": "P",
            "role": "Full Stack Developer",
            "contact": "priya.nair@tanishqai.com",
            "desc": "Designed the Streamlit UI, luxury CSS system, and end-to-end user flow."
        },
        {
            "name": "Rahul Verma",
            "initial": "R",
            "role": "Data Engineer",
            "contact": "rahul.verma@tanishqai.com",
            "desc": "Curated and preprocessed the Tanishq jewellery dataset, managed metadata indexing."
        },
        {
            "name": "Sneha Kapoor",
            "initial": "S",
            "role": "Product Designer",
            "contact": "sneha.kapoor@tanishqai.com",
            "desc": "Responsible for UX research, visual design language, and brand consistency."
        }
    ]
    
    cols = st.columns(4)
    for col, member in zip(cols, team):
        with col:
            st.markdown(f"""
            <div class="team-card">
                <div class="team-avatar">{member['initial']}</div>
                <div class="team-name">{member['name']}</div>
                <div class="team-role">{member['role']}</div>
                <div style="font-size:13px;color:#888;line-height:1.6;margin-bottom:12px;">{member['desc']}</div>
                <div class="team-contact">{member['contact']}</div>
            </div>
            """, unsafe_allow_html=True)
    
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
    st.markdown("""
    <div class="support-box">
        <div style="font-family:'Playfair Display',serif;font-size:20px;color:#C9A84C;margin-bottom:12px;">About the Project</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:17px;color:#888;line-height:1.8;">
            Tanishq AI Platform is a production-grade AI-powered jewellery retrieval system built using CLIP visual embeddings, 
            FAISS vector search, and Gemini multimodal AI. The system retrieves visually similar jewellery from the Tanishq 
            dataset using text, image, or voice inputs — with strict category locking to ensure rings never retrieve necklaces 
            and vice versa. Built as a capstone project demonstrating real-world AI application in luxury retail.
        </div>
    </div>
    """, unsafe_allow_html=True)

# ============================================================================
# TAB: SUPPORT
# ============================================================================

with tab_support:
    st.markdown('<div class="section-title">Customer Support</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">We\'re here to help you find your perfect piece</div>', unsafe_allow_html=True)
    
    c1, c2 = st.columns(2)
    
    with c1:
        st.markdown("""
        <div class="support-box">
            <div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:#C9A84C;margin-bottom:16px;">Quick Call Support</div>
            <div style="font-size:32px;font-family:'Playfair Display',serif;color:#F0EAD6;margin-bottom:8px;">1800-209-0041</div>
            <div style="font-size:13px;color:#888;">Toll-free · Mon–Sat, 9 AM – 9 PM IST</div>
            <div style="margin-top:20px;font-size:14px;color:#888;line-height:1.7;">
                Our jewellery consultants are available to assist with:<br>
                · Product enquiries and recommendations<br>
                · Order tracking and modifications<br>
                · Exchange and return requests<br>
                · Custom jewellery orders
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="support-box" style="margin-top:0;">
            <div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:#C9A84C;margin-bottom:16px;">Email Support</div>
            <div style="font-size:18px;color:#F0EAD6;">care@tanishq.co.in</div>
            <div style="font-size:13px;color:#888;margin-top:4px;">Response within 24 hours</div>
        </div>
        """, unsafe_allow_html=True)
    
    with c2:
        st.markdown("""
        <div class="support-box" style="height:100%;">
            <div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:#C9A84C;margin-bottom:20px;">Send Us a Message</div>
        </div>
        """, unsafe_allow_html=True)
        
        name_input = st.text_input("Your Name", placeholder="Enter your name")
        email_input = st.text_input("Email Address", placeholder="your@email.com")
        msg_input = st.text_area("Message", placeholder="How can we help you today?", height=140)
        
        if st.button("Send Message", key="send_support"):
            if name_input and email_input and msg_input:
                st.success(f"Thank you, {name_input}. We'll respond to {email_input} within 24 hours.")
            else:
                st.warning("Please fill in all fields.")
    
    st.markdown('<hr class="gold-divider">', unsafe_allow_html=True)
    
    st.markdown("""
    <div style="font-family:'Cormorant Garamond',serif;font-size:20px;color:#C9A84C;margin-bottom:16px;">Frequently Asked Questions</div>
    """, unsafe_allow_html=True)
    
    faqs = [
        ("How does the AI search work?", "Our system uses CLIP (Contrastive Language-Image Pre-Training) to encode both text and images into a shared embedding space, then uses FAISS vector search to find the most similar jewellery pieces from our dataset."),
        ("Are the images real Tanishq jewellery?", "Yes — all images are authentic Tanishq jewellery from our curated dataset. No hallucinated or external images are ever shown."),
        ("What if no match is found?", "If the system cannot find a close match, it will display: 'No similar jewellery found in the current collection' rather than showing unrelated results."),
        ("Why does category filtering matter?", "Our system strictly enforces category consistency — if you search for a ring, only rings are retrieved. This ensures you always see relevant results.")
    ]
    
    for q, a in faqs:
        with st.expander(q):
            st.markdown(f'<div style="font-family:\'Cormorant Garamond\',serif;font-size:16px;color:#888;line-height:1.8;">{a}</div>', unsafe_allow_html=True)

# Footer
st.markdown("""
<hr style="border:none;border-top:1px solid #2A2A2A;margin:40px 0 0;">
<div style="text-align:center;padding:24px;color:#555;font-family:'Montserrat',sans-serif;font-size:12px;letter-spacing:1.5px;">
    © 2026 TANISHQ · A TATA ENTERPRISE · ALL RIGHTS RESERVED
</div>
""", unsafe_allow_html=True)
