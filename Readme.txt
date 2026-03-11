Tanishq AI Jewelry Search Platform

An AI-powered multimodal jewelry search platform that allows users to discover jewelry using text queries, voice commands, uploaded images, or hand-drawn sketches.

The system retrieves visually and semantically similar jewelry items from a product catalog using CLIP embeddings, FAISS vector search, and metadata filtering.

This project demonstrates how multimodal Retrieval Augmented Generation (RAG) can be applied to e-commerce product discovery.

------------------------------------------------------------

FEATURES

Multimodal Search

Users can search jewelry using multiple input formats:

• Text queries  
Example: "gold ring with red stones"

• Voice queries  
Speech input is converted to text and processed like a normal search query.

• Image upload  
Upload a jewelry photo to find visually similar items.

• Sketch upload  
Upload a hand-drawn jewelry design and retrieve similar products.

------------------------------------------------------------

AI-POWERED RETRIEVAL

The search system combines multiple AI techniques:

• CLIP embeddings for image and text similarity  
• FAISS vector database for fast similarity search  
• Metadata filtering for category, material, gemstone, etc.  
• Sketch detection and classification  
• Multimodal embedding fusion

------------------------------------------------------------

SKETCH UNDERSTANDING

Sketch inputs are processed differently from normal images.

Steps used:

1. Detect if the uploaded input is a sketch / line drawing  
2. Classify jewelry type (Ring or Necklace)  
3. Restrict retrieval to the correct category  
4. Generate helper prompts for the sketch  
5. Combine image and text embeddings for better retrieval

------------------------------------------------------------

SYSTEM ARCHITECTURE

User Input
|
|-- Text Query
|-- Voice Input
|-- Uploaded Image
|-- Sketch Design
|
v
Input Processing Layer
|
|-- Speech to Text (voice input)
|-- Sketch Detection
|-- Attribute Extraction
|
v
Embedding Generation
|
|-- CLIP Text Embedding
|-- CLIP Image Embedding
|
v
Vector Search
|
|-- FAISS Similarity Retrieval
|
v
Metadata Filtering and Reranking
|
v
Top Matching Jewelry Results
|
v
Displayed in React Frontend

------------------------------------------------------------

TECH STACK

Frontend
• React
• Vite
• JavaScript
• CSS

Backend
• FastAPI
• Python

AI / Machine Learning
• CLIP Model
• FAISS Vector Database
• Multimodal Embeddings
• Sketch Detection

Libraries
• NumPy
• Pillow
• OpenCV

------------------------------------------------------------

PROJECT STRUCTURE

TanishqAI_Platform_v3

backend
    main.py
    requirements.txt
    API routes and retrieval logic

frontend
    src
    package.json
    React UI

Jewelry_RAG
    rebuild_index.py
    jewelry.index
    image_paths.txt
    data
        Tanishq
            rings
            necklaces

run_backend.bat
run_frontend.bat
rebuild_index.bat
README.md

------------------------------------------------------------

SETUP INSTRUCTIONS

1. Clone the repository

git clone https://github.com/yourusername/tanishq-ai-search.git
cd tanishq-ai-search

------------------------------------------------------------

2. Install backend dependencies

pip install -r backend/requirements.txt

------------------------------------------------------------

3. Install frontend dependencies

cd frontend
npm install
cd ..

------------------------------------------------------------

4. Rebuild the vector index

After placing jewelry images inside:

Jewelry_RAG/data/Tanishq/

run:

rebuild_index.bat

This generates embeddings and builds the FAISS vector index.

------------------------------------------------------------

5. Run backend server

run_backend.bat

Backend will run at:

http://127.0.0.1:8000

------------------------------------------------------------

6. Run frontend

Open another terminal and run:

run_frontend.bat

Frontend runs at:

http://localhost:3000

------------------------------------------------------------

EXAMPLE SEARCHES

Text Search

gold ring  
diamond necklace  
traditional bridal necklace  
ring with ruby stones  

Sketch Search

Upload a ring sketch  
Upload a necklace design  

Image Search

Upload a jewelry photo to find similar designs.

------------------------------------------------------------

RETRIEVAL PIPELINE

Input → Embedding → FAISS Search → Metadata Filtering → Reranking → Results

Multimodal embedding fusion:

Final Query Vector =
0.65 * Image Embedding +
0.35 * Text Embedding

------------------------------------------------------------

FUTURE IMPROVEMENTS

• Better gemstone recognition  
• Jewelry attribute extraction  
• Personalized recommendations  
• Larger product catalog support  
• Fine-tuned CLIP model for jewelry domain

