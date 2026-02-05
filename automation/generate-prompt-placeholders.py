#!/usr/bin/env python3
"""Generate placeholder images with image prompts printed on them.

Usage: python3 generate-prompt-placeholders.py --episode 4
"""

import argparse
import os
import re
import textwrap
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080

# Find available fonts
FONT_CANDIDATES = [
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
    '/System/Library/Fonts/SFNSText.ttf',
]

def load_font(size):
    for p in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(p, size=size)
        except Exception:
            pass
    return ImageFont.load_default()

TITLE_F = load_font(48)
PROMPT_F = load_font(24)
SCENE_F = load_font(72)

EPISODES = {
    4: {
        'title': 'The Underwater Music Festival',
        'slug': 'underwater-music-festival',
        'prompts_file': '04-image-prompts-underwater-music-festival.md'
    }
}

def parse_prompts(md_path):
    """Parse image prompts from markdown file."""
    with open(md_path, 'r') as f:
        content = f.read()
    
    prompts = {}
    
    # Match sections like ## 01.png — Scene Name
    pattern = r'## (\d+\.png|COVER\.png)\s*—\s*([^\n]+)\n\n(.*?)(?=\n---|\n## |\Z)'
    matches = re.findall(pattern, content, re.DOTALL)
    
    for filename, scene_name, body in matches:
        # Extract the prompt (first paragraph that starts with "Children's book")
        prompt_match = re.search(r'(Children\'s book illustration.*?)(?:\n\n|\*\*Purpose|\Z)', body, re.DOTALL)
        if prompt_match:
            prompt = prompt_match.group(1).strip()
            # Clean up the prompt
            prompt = re.sub(r'\s+', ' ', prompt)
            prompts[filename] = {
                'scene': scene_name.strip(),
                'prompt': prompt
            }
    
    return prompts

def wrap_text(text, width_chars=80):
    """Wrap text to fit within specified character width."""
    return textwrap.fill(text, width=width_chars)

def make_prompt_placeholder(path, scene_num, scene_name, prompt):
    """Create placeholder with scene number, name, and full prompt text."""
    # Background color based on scene
    bg_colors = [
        (30, 60, 90),    # Deep blue
        (40, 70, 80),    # Teal
        (50, 60, 70),    # Slate
        (35, 65, 85),    # Ocean
        (45, 55, 75),    # Navy
        (40, 80, 70),    # Sea green
        (55, 65, 80),    # Steel blue
        (30, 70, 90),    # Azure
        (50, 50, 70),    # Purple-blue
    ]
    bg = bg_colors[scene_num % len(bg_colors)]
    
    img = Image.new('RGB', (W, H), bg)
    d = ImageDraw.Draw(img)
    
    # Scene number (large, top left)
    scene_text = f"{scene_num:02d}"
    d.text((60, 40), scene_text, font=SCENE_F, fill=(255, 255, 255, 180))
    
    # Scene name (top, next to number)
    d.text((180, 60), scene_name, font=TITLE_F, fill=(255, 220, 100))
    
    # Divider line
    d.line([(60, 140), (W-60, 140)], fill=(255, 255, 255, 100), width=2)
    
    # Prompt text (wrapped)
    wrapped = wrap_text(prompt, width_chars=85)
    lines = wrapped.split('\n')
    
    y = 170
    line_height = 32
    for line in lines:
        if y + line_height > H - 40:
            # Add "..." if text is truncated
            d.text((60, y), "...", font=PROMPT_F, fill=(200, 200, 200))
            break
        d.text((60, y), line, font=PROMPT_F, fill=(220, 220, 220))
        y += line_height
    
    img.save(path, 'PNG')
    print(f'✅ {scene_num:02d}.png — {scene_name}')

def make_intro_card(path, ep_num, title):
    """Create intro card placeholder."""
    img = Image.new('RGB', (W, H), (20, 40, 60))
    d = ImageDraw.Draw(img)
    
    # Title
    d.text((W//2 - 300, H//2 - 100), "THE HATCH ADVENTURES", font=TITLE_F, fill=(100, 200, 255))
    d.text((W//2 - 280, H//2), f"Episode {ep_num}: {title}", font=load_font(36), fill=(255, 255, 255))
    d.text((W//2 - 100, H//2 + 80), "[INTRO CARD]", font=load_font(28), fill=(150, 150, 150))
    
    img.save(path, 'PNG')
    print(f'✅ 00.png — Intro Card')

def make_outro_card(path, ep_num, next_title):
    """Create outro card placeholder."""
    img = Image.new('RGB', (W, H), (20, 40, 60))
    d = ImageDraw.Draw(img)
    
    d.text((W//2 - 200, H//2 - 50), f"Next: Episode {ep_num + 1}", font=TITLE_F, fill=(100, 200, 255))
    d.text((W//2 - 200, H//2 + 30), next_title, font=load_font(36), fill=(255, 255, 255))
    d.text((W//2 - 100, H//2 + 100), "[OUTRO CARD]", font=load_font(28), fill=(150, 150, 150))
    
    img.save(path, 'PNG')
    print(f'✅ 09.png — Outro Card')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--episode', type=int, required=True)
    args = ap.parse_args()
    
    ep = EPISODES.get(args.episode)
    if not ep:
        print(f"❌ Episode {args.episode} not configured")
        return
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    prompts_path = os.path.join(project_root, 'assets', ep['prompts_file'])
    output_dir = os.path.join(project_root, 'assets', 'images', f"story-{args.episode:02d}-{ep['slug']}")
    
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"📖 Reading prompts from: {prompts_path}")
    print(f"📁 Output: {output_dir}")
    print()
    
    prompts = parse_prompts(prompts_path)
    
    # Generate intro card
    make_intro_card(os.path.join(output_dir, '00.png'), args.episode, ep['title'])
    
    # Generate scene placeholders with prompts
    for i in range(1, 9):
        filename = f"{i:02d}.png"
        if filename in prompts:
            p = prompts[filename]
            make_prompt_placeholder(
                os.path.join(output_dir, filename),
                i,
                p['scene'],
                p['prompt']
            )
        else:
            print(f"⚠️  No prompt found for {filename}")
    
    # Generate outro card
    make_outro_card(os.path.join(output_dir, '09.png'), args.episode, "The Whispering Woods")
    
    print()
    print(f"✨ Done! Generated 10 images with prompts")
    print(f"   Run: node create-video.js story-{args.episode:02d}-{ep['slug']}")


if __name__ == '__main__':
    main()
