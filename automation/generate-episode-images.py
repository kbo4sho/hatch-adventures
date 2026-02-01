#!/usr/bin/env python3
"""Generate complete episode image set: intro card + scene images + outro card.

Usage:
  python3 generate-episode-images.py --episode 1 --scenes 8 --theme dino

This creates:
  00.png - Intro title card
  01.png through 0N.png - Scene images (simple placeholders or AI-generated)
  0(N+1).png - Outro/next episode card

All images go to: assets/images/story-0X-<slug>/
"""

import argparse
import os
from PIL import Image, ImageDraw, ImageFont
import random

W, H = 1920, 1080

FONT_CANDIDATES = [
    '/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf',
    '/System/Library/Fonts/Supplemental/Avenir Next.ttc',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
]

def load_font(size):
    for p in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(p, size=size)
        except Exception:
            pass
    return ImageFont.load_default()

TITLE_F = load_font(108)
SUB_F = load_font(64)
FOOT_F = load_font(44)
H1_F = load_font(72)
BODY_F = load_font(42)

THEMES = {
    'dino': {
        'bg': (10, 18, 28),
        'accent': (0, 229, 255),
        'accent2': (255, 180, 80)
    },
    'mint': {
        'bg': (8, 20, 18),
        'accent': (120, 255, 210),
        'accent2': (255, 255, 255)
    },
    'robot': {
        'bg': (12, 10, 24),
        'accent': (161, 0, 255),
        'accent2': (0, 229, 255)
    }
}

EPISODES = {
    1: {
        'title': 'The Dinosaur Garden',
        'slug': 'dinosaur-garden',
        'next': 'The Candy Cloud Castle',
        'theme': 'dino'
    },
    2: {
        'title': 'The Candy Cloud Castle',
        'slug': 'candy-cloud-castle',
        'next': 'The Robot Playground',
        'theme': 'mint'
    },
    3: {
        'title': 'The Robot Playground',
        'slug': 'robot-playground',
        'next': 'Underwater Music Festival',
        'theme': 'robot'
    }
}


def centered(draw, text, y, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)


def make_title_card(path, ep_num, title, footer, theme):
    """Create intro title card (00.png)."""
    t = THEMES[theme]
    img = Image.new('RGB', (W, H), t['bg'])
    d = ImageDraw.Draw(img)

    # Subtle stars
    random.seed(ep_num * 7)
    for _ in range(420):
        x = random.randint(0, W-1)
        y = random.randint(0, H-1)
        r = random.choice([1, 1, 2])
        col = (255, 255, 255) if random.random() > 0.2 else t['accent']
        d.ellipse((x, y, x+r, y+r), fill=col)

    # Neon frame
    d.rounded_rectangle((90, 90, W-90, H-90), radius=60, outline=t['accent'], width=10)
    d.rounded_rectangle((120, 120, W-120, H-120), radius=48, outline=(255, 255, 255, 80), width=3)

    centered(d, 'Hatch Hoppers', 240, TITLE_F, t['accent'])
    centered(d, f'Episode {ep_num}: {title}', 390, SUB_F, (255, 255, 255))
    centered(d, footer, 520, FOOT_F, t['accent2'])

    # Simple hatch icon
    cx, cy = W//2, 740
    d.ellipse((cx-140, cy-140, cx+140, cy+140), outline=t['accent2'], width=10)
    d.ellipse((cx-110, cy-110, cx+110, cy+110), outline=t['accent'], width=10)
    d.arc((cx-90, cy-90, cx+90, cy+90), start=30, end=330, fill=t['accent'], width=8)

    img.save(path, 'PNG')
    print(f'✅ Intro card: {path}')


def make_outro_card(path, ep_num, next_title, theme):
    """Create outro/next episode card (0N.png)."""
    t = THEMES[theme]
    img = Image.new('RGB', (W, H), t['bg'])
    d = ImageDraw.Draw(img)

    # Subtle stars
    random.seed((ep_num + 1) * 11)
    for _ in range(420):
        x = random.randint(0, W-1)
        y = random.randint(0, H-1)
        r = random.choice([1, 1, 2])
        col = (255, 255, 255) if random.random() > 0.2 else t['accent']
        d.ellipse((x, y, x+r, y+r), fill=col)

    # Neon frame
    d.rounded_rectangle((90, 90, W-90, H-90), radius=60, outline=t['accent'], width=10)
    d.rounded_rectangle((120, 120, W-120, H-120), radius=48, outline=(255, 255, 255, 80), width=3)

    centered(d, 'Hatch Hoppers', 240, TITLE_F, t['accent'])
    centered(d, f'Next: Episode {ep_num + 1}', 390, SUB_F, (255, 255, 255))
    centered(d, next_title, 520, FOOT_F, t['accent2'])

    # Hatch icon
    cx, cy = W//2, 740
    d.ellipse((cx-140, cy-140, cx+140, cy+140), outline=t['accent2'], width=10)
    d.ellipse((cx-110, cy-110, cx+110, cy+110), outline=t['accent'], width=10)
    d.arc((cx-90, cy-90, cx+90, cy+90), start=30, end=330, fill=t['accent'], width=8)

    img.save(path, 'PNG')
    print(f'✅ Outro card: {path}')


def make_placeholder_scene(path, scene_num, theme, text='Scene placeholder'):
    """Create simple placeholder scene card."""
    t = THEMES[theme]
    img = Image.new('RGB', (W, H), (235, 240, 245))
    d = ImageDraw.Draw(img)

    # Header bar
    d.rounded_rectangle((80, 60, W-80, 180), radius=40, fill=(0, 0, 0, 120), outline=t['accent'], width=6)
    centered(d, f'Scene {scene_num}', 85, H1_F, t['accent'])

    # Content panel
    d.rounded_rectangle((120, 240, W-120, H-120), radius=60, fill=(255, 255, 255), outline=t['accent'], width=8)
    centered(d, text, 500, BODY_F, (40, 40, 40))
    centered(d, '(Replace with AI-generated or custom image)', 580, FOOT_F, (120, 120, 120))

    img.save(path, 'PNG')
    print(f'📝 Placeholder: {path}')


def main():
    ap = argparse.ArgumentParser(description='Generate complete episode image set')
    ap.add_argument('--episode', type=int, required=True, help='Episode number (1-100)')
    ap.add_argument('--scenes', type=int, default=8, help='Number of scene images (default: 8)')
    ap.add_argument('--theme', choices=THEMES.keys(), help='Theme (auto-detected from episode if not set)')
    ap.add_argument('--title', help='Episode title (auto-detected if not set)')
    ap.add_argument('--slug', help='Slug for folder name (auto-detected if not set)')
    ap.add_argument('--next', help='Next episode title (auto-detected if not set)')
    ap.add_argument('--placeholders', action='store_true', help='Generate placeholder scene images')
    args = ap.parse_args()

    # Auto-detect episode metadata
    ep_meta = EPISODES.get(args.episode, {})
    title = args.title or ep_meta.get('title', f'Episode {args.episode}')
    slug = args.slug or ep_meta.get('slug', f'episode-{args.episode:02d}')
    next_title = args.next or ep_meta.get('next', f'Episode {args.episode + 1}')
    theme = args.theme or ep_meta.get('theme', 'dino')

    # Create output directory
    out_dir = os.path.abspath(os.path.join(
        os.path.dirname(__file__), '..', 'assets', 'images', f'story-{args.episode:02d}-{slug}'
    ))
    os.makedirs(out_dir, exist_ok=True)
    print(f'\n📁 Output: {out_dir}')

    # Generate intro card (00.png)
    intro_path = os.path.join(out_dir, '00.png')
    make_title_card(intro_path, args.episode, title, 'Hands together. Deep breath. Hatch time.', theme)

    # Generate scene placeholders if requested
    if args.placeholders:
        for i in range(1, args.scenes + 1):
            scene_path = os.path.join(out_dir, f'{i:02d}.png')
            make_placeholder_scene(scene_path, i, theme, f'Scene {i}: Add your content here')
    else:
        print(f'\n⏭️  Skipping scene placeholders (use --placeholders to generate {args.scenes} placeholder scenes)')
        print(f'   Manually create or AI-generate: {out_dir}/01.png through {out_dir}/{args.scenes:02d}.png')

    # Generate outro card (0N.png)
    outro_num = args.scenes + 1
    outro_path = os.path.join(out_dir, f'{outro_num:02d}.png')
    make_outro_card(outro_path, args.episode, next_title, theme)

    print(f'\n✨ Done! Total images: {2 + (args.scenes if args.placeholders else 0)}')
    print(f'   Ready for: node create-video.js story-{args.episode:02d}-{slug}')


if __name__ == '__main__':
    main()
