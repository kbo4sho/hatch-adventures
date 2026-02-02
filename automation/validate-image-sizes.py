#!/usr/bin/env python3
"""
Validate that all video images are the correct size (1536×1024)
Usage: python3 validate-image-sizes.py <story-name>
"""

import sys
import os
from PIL import Image

def validate_story_images(story_name):
    """Check all images in a story folder for correct resolution"""
    
    assets_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images', story_name)
    
    if not os.path.exists(assets_dir):
        print(f"❌ Story folder not found: {assets_dir}")
        return False
    
    files = sorted([f for f in os.listdir(assets_dir) if f.endswith(('.png', '.jpg'))])
    
    if not files:
        print(f"❌ No images found in {assets_dir}")
        return False
    
    print(f"📊 Validating images for: {story_name}")
    print(f"   Location: {assets_dir}")
    print()
    
    all_valid = True
    expected_width = 1536
    expected_height = 1024
    
    for filename in files:
        filepath = os.path.join(assets_dir, filename)
        try:
            img = Image.open(filepath)
            width, height = img.size
            
            # COVER.png is optional and can be any portrait size
            if filename.upper() == 'COVER.PNG':
                status = "✅" if height > width else "⚠️"
                print(f"{status} {filename}: {width}×{height} (portrait, optional)")
                continue
            
            # All other files should be 1536×1024
            if width == expected_width and height == expected_height:
                print(f"✅ {filename}: {width}×{height}")
            else:
                print(f"❌ {filename}: {width}×{height} (expected {expected_width}×{expected_height})")
                all_valid = False
        
        except Exception as e:
            print(f"❌ {filename}: Error reading image - {e}")
            all_valid = False
    
    print()
    if all_valid:
        print("✅ All images are the correct size!")
        return True
    else:
        print("❌ Some images have incorrect sizes. Regenerate or resize them.")
        print("   All video images (00.png - 08.png) must be 1536×1024")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 validate-image-sizes.py <story-name>")
        print("Example: python3 validate-image-sizes.py story-01-dinosaur-garden")
        sys.exit(1)
    
    story_name = sys.argv[1]
    success = validate_story_images(story_name)
    sys.exit(0 if success else 1)
