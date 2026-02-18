"""
Sync images from frontend/public/images to static/images
This ensures both locations have all artifact images
"""

import os
import shutil

def sync_images():
    """Copy all images from frontend/public/images to static/images"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    source_dir = os.path.join(script_dir, 'frontend', 'public', 'images')
    target_dir = os.path.join(script_dir, 'static', 'images')
    
    # Create target directory if it doesn't exist
    os.makedirs(target_dir, exist_ok=True)
    
    if not os.path.exists(source_dir):
        print(f"❌ Source directory not found: {source_dir}")
        return
    
    # Get all image files
    image_files = [f for f in os.listdir(source_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))]
    
    print(f"📁 Syncing {len(image_files)} images...")
    print(f"   From: {source_dir}")
    print(f"   To:   {target_dir}")
    print()
    
    copied = 0
    skipped = 0
    
    for filename in image_files:
        source_path = os.path.join(source_dir, filename)
        target_path = os.path.join(target_dir, filename)
        
        # Only copy if target doesn't exist or source is newer
        if not os.path.exists(target_path) or os.path.getmtime(source_path) > os.path.getmtime(target_path):
            shutil.copy2(source_path, target_path)
            print(f"✅ Copied: {filename}")
            copied += 1
        else:
            skipped += 1
    
    print()
    print(f"✨ Sync complete!")
    print(f"   Copied: {copied} files")
    print(f"   Skipped: {skipped} files (already up to date)")

if __name__ == '__main__':
    sync_images()
