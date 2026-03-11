# Tanishq AI Jewellery Platform — patched React + FastAPI version

This version is adjusted for your **React frontend**, not Streamlit.

## What was fixed

- corrected FAISS ranking for cosine similarity / inner product
- added direct **image-to-image retrieval** for uploaded photos and sketches
- added **multimodal retrieval** for text + image together
- made Gemini optional instead of making the whole backend depend on it
- made path handling portable across Windows and relative paths
- improved category filtering for **rings vs necklaces**
- added a safer rebuild script that indexes only files that really exist
- added Windows helper scripts for rebuild, backend, and frontend startup

## Important truth

This code can only return items whose images actually exist inside:

`Jewelry_RAG/data/Tanishq/`

So before demoing 90% accuracy, make sure your local machine really contains all ring and necklace images, then rebuild the index.

---

## Folder setup you need

```text
TanishqAI_Platform_v3/
  backend/
  frontend/
  Jewelry_RAG/
    data/
      Tanishq/
        rings/
        necklaces/
```

---

## 1) Rebuild the FAISS index after copying images

Open terminal in:

```text
TanishqAI_Platform_v3\Jewelry_RAG
```

Run:

```powershell
python rebuild_index.py
```

This will create or refresh:

- `jewelry_visual.index`
- `jewelry_hybrid.index`
- `jewelry.index`
- `image_paths.txt`
- `jewelry_metadata.json`

---

## 2) Run backend

Open terminal in:

```text
TanishqAI_Platform_v3\backend
```

Create and activate your virtual environment if needed, then run:

```powershell
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

Health check:

```text
http://127.0.0.1:8000/health
```

---

## 3) Run frontend

Open terminal in:

```text
TanishqAI_Platform_v3\frontend
```

Run:

```powershell
npm install
npm run dev
```

Frontend usually opens at:

```text
http://127.0.0.1:5173
```

---

## 4) Optional Gemini setup

If you want Gemini-powered spell correction and image text extraction, create:

```text
Jewelry_RAG\.env
```

with:

```env
GEMINI_API_KEY=your_key_here
```

Without Gemini, the core retrieval still works.

---

## Windows quick-run files

You can also double-click these files:

- `rebuild_index.bat`
- `run_backend.bat`
- `run_frontend.bat`

Or open them in Notepad and see the commands.

---

## Best demo flow for your project

1. Copy all ring and necklace images into the correct folders
2. Run `python rebuild_index.py`
3. Start backend
4. Start frontend
5. Test these cases:
   - text query: `gold ring with red stones`
   - text query: `bridal necklace`
   - upload a ring photo
   - upload a necklace image
   - upload a sketch
   - voice input for a ring / necklace query

---

## Honest limitation

I patched the code, but I could not magically restore missing ring image files from the uploaded zip because they are not present in the zip available here. If your local machine has them, this patched version is ready for that setup.
