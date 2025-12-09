"""Simple script to copy artifact images from source to static/images"""
import shutil
import json
from pathlib import Path

# Paths
source = Path(r'C:\Users\Pasindu Fernando\Downloads\Artifact Pictures\Artifact Pictures')
dest = Path('static/images')

# Create destination
dest.mkdir(parents=True, exist_ok=True)

# Mapping: artifact_id -> (folder_name, source_file, dest_file)
mappings = {
    'A001': ('Kandyan Battle Sword (Kasthāne)', 'Sword.jpg', 'A001_Sword.jpg'),
    'A002': ('Traditional Sri Lankan Drum (Geta Bera  Yak Bera)', 'Geta Bera.jpg', 'A002_Geta_Bera.jpg'),
    'A003': ('Kandyan Mural Painting', 'M1.jpg', 'A003_M1.jpg'),
    'A004': ('Traditional Clay Pot (Sri Lankan Earthenware)', 'C2.jpg', 'A004_C2.jpg'),
    'A005': ('Kolam Mask (Traditional Dance Mask)', 'Kolam_devil_mask_Wellcome_L0037158.jpg', 'A005_Kolam_devil_mask_Wellcome_L0037158.jpg'),
    'A010': ('Polonnaruwa Moonstone (Sandakada Pahana)', 'P1.jpg', 'A010_P1.jpg'),
    'A011': ('Isurumuniya Lovers Statue', 'I1.jpg', 'A011_I1.jpg'),
    'A012': ('Sigiriya Fresco Fragment', '1.jpg', 'A012_1.jpg'),
    'A013': ('Nissanka latha Mandapaya', 'nissaka 3.jpg', 'A013_nissaka_3.jpg'),
}

artifact_map = {}
copied = 0

print("Copying artifact images...")
for artifact_id, (folder_name, source_file, dest_file_name) in mappings.items():
    folder = source / folder_name
    if not folder.exists():
        print(f"✗ {artifact_id}: Folder not found")
        continue
    
    img_file = folder / source_file
    if not img_file.exists():
        # Try to find any image
        images = list(folder.glob('*.jpg')) + list(folder.glob('*.jpeg')) + list(folder.glob('*.webp'))
        if images:
            img_file = images[0]
        else:
            print(f"✗ {artifact_id}: No images found")
            continue
    
    dest_file = dest / dest_file_name
    try:
        shutil.copy2(img_file, dest_file)
        artifact_map[artifact_id] = f"images/{dest_file_name}"
        print(f"✓ {artifact_id}: {dest_file_name}")
        copied += 1
    except Exception as e:
        print(f"✗ {artifact_id}: {e}")

# Update JSON
with open('artifact_images.json', 'w', encoding='utf-8') as f:
    json.dump(artifact_map, f, indent=2, ensure_ascii=False)

print(f"\n✓ Copied {copied} images")
print("✓ Updated artifact_images.json")

