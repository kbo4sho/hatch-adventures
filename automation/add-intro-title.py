#!/usr/bin/env python3
"""
Add title text overlay to intro card images
Usage: python3 add-intro-title.py <input_image> <episode_number> [output_image]
Example: python3 add-intro-title.py story-01-intro.jpg 1 story-01-intro-final.jpg
"""

import sys
from PIL import Image, ImageDraw, ImageFont

def add_title_overlay(input_path, episode_num, episode_title, output_path=None):
    """
    Add THE HATCH ADVENTURES header + episode title to intro card
    
    Args:
        input_path: Path to the source image
        episode_num: Episode number (1, 2, 3, etc.)
        episode_title: Episode title string
        output_path: Path to save (defaults to input_path-titled.jpg)
    """
    
    if output_path is None:
        output_path = input_path.rsplit('.', 1)[0] + '-titled.jpg'
    
    # Load image
    img = Image.open(input_path)
    draw = ImageDraw.Draw(img)
    width, height = img.size
    
    # Load fonts
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Arial Rounded Bold.ttf", 80)
    except:
        try:
            title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 80)
        except:
            title_font = ImageFont.load_default()
    
    try:
        subtitle_font = ImageFont.truetype("/System/Library/Fonts/Georgia.ttf", 48)
    except:
        try:
            subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        except:
            subtitle_font = ImageFont.load_default()
    
    # Text content
    title_line1 = "THE HATCH"
    title_line2 = "ADVENTURES"
    subtitle = f"Episode {episode_num}: {episode_title}"
    
    # Calculate positions for centering
    bbox1 = draw.textbbox((0, 0), title_line1, font=title_font)
    bbox2 = draw.textbbox((0, 0), title_line2, font=title_font)
    width1 = bbox1[2] - bbox1[0]
    width2 = bbox2[2] - bbox2[0]
    
    line1_x = (width - width1) // 2
    line2_x = (width - width2) // 2
    title_y = 60
    
    # Draw title with shadow
    shadow_color = (50, 50, 50)
    shadow_offset = 4
    white = (255, 255, 255)
    
    # Line 1: THE HATCH
    draw.text((line1_x + shadow_offset, title_y + shadow_offset), title_line1, fill=shadow_color, font=title_font)
    draw.text((line1_x, title_y), title_line1, fill=white, font=title_font)
    
    # Line 2: ADVENTURES
    draw.text((line2_x + shadow_offset, title_y + 90 + shadow_offset), title_line2, fill=shadow_color, font=title_font)
    draw.text((line2_x, title_y + 90), title_line2, fill=white, font=title_font)
    
    # Draw episode title below
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_y = title_y + 90 + 100  # Close gap after ADVENTURES
    draw.text(((width - subtitle_width) // 2, subtitle_y), subtitle, fill=white, font=subtitle_font)
    
    # Save
    img.save(output_path)
    print(f"✅ Saved: {output_path}")
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 add-intro-title.py <input_image> <episode_number> <episode_title> [output_image]")
        print("Example: python3 add-intro-title.py intro.jpg 1 'The Dinosaur Garden'")
        sys.exit(1)
    
    input_path = sys.argv[1]
    episode_num = sys.argv[2]
    episode_title = sys.argv[3] if len(sys.argv) > 3 else "Unknown"
    output_path = sys.argv[4] if len(sys.argv) > 4 else None
    
    add_title_overlay(input_path, episode_num, episode_title, output_path)
