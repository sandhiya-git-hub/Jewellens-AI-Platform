import os
import faiss
import numpy as np
import torch
from PIL import Image
from sentence_transformers import SentenceTransformer

# Load CLIP
model = SentenceTransformer('clip-ViT-B-32')

# Paths
base_path = "data/Tanishq"
folders = ['rings', 'necklaces']
image_list = []
embeddings = []

print("Indexing images... this may take a minute.")

for folder in folders:
    folder_path = os.path.join(base_path, folder)
    for img_name in os.listdir(folder_path):
        if img_name.lower().endswith(('.png', '.jpg', '.jpeg')):
            img_path = os.path.join(folder_path, img_name)
            try:
                # 1. Generate Embedding
                img = Image.open(img_path).convert("RGB")
                embedding = model.encode(img)
                
                # 2. Store data
                embeddings.append(embedding)
                image_list.append(img_path)
            except Exception as e:
                print(f"Skipping {img_name}: {e}")

# Save to FAISS
index = faiss.IndexFlatL2(512) # CLIP-ViT-B-32 produces 512-dim vectors
index.add(np.array(embeddings).astype('float32'))

faiss.write_index(index, "jewelry.index")
# Save the file paths so we can retrieve the images later
with open("image_paths.txt", "w") as f:
    for path in image_list:
        f.write(path + "\n")

print(f"Success! Indexed {len(image_list)} items.")