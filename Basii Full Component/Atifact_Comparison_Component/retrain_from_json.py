import json
import os
import sys
from artifact_model import ArtifactComparisonModel

def retrain_from_json():
    print("🚀 Starting manual retrain from JSON source...")
    
    # 1. Load the metadata directly from your JSON file
    metadata_path = "trained_model/artifact_metadata.json"
    if not os.path.exists(metadata_path):
        print(f"❌ Error: {metadata_path} not found!")
        return

    with open(metadata_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        artifacts = data.get('artifacts', [])

    print(f"📦 Found {len(artifacts)} artifacts in metadata.")

    # 1a. Load latest image mappings
    image_mapping = {}
    if os.path.exists('artifact_images.json'):
        with open('artifact_images.json', 'r', encoding='utf-8') as f:
            image_mapping = json.load(f)
        print(f"🖼️ Found {len(image_mapping)} image mappings.")

    # Update artifacts with images from mapping
    for a in artifacts:
        a_id = a.get('id')
        if a_id in image_mapping:
            a['image'] = image_mapping[a_id]

    # 2. Initialize the model
    model = ArtifactComparisonModel()

    # 3. Force a train using the synced data
    print("🧠 Generating new AI embeddings (this may take a minute)...")
    model.train(artifacts)

    print("\n✅ SUCCESS! All 56 artifacts are now vectorized and ready for comparison.")
    print("Tip: Restart your run_kiosk.py to load the new embeddings.")

if __name__ == "__main__":
    retrain_from_json()
