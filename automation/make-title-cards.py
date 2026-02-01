#!/usr/bin/env python3
"""Create simple intro/outro title cards for Hatch Hoppers episodes.

Usage:
  python3 make-title-cards.py --out <path.png> --title "..." --subtitle "..." --footer "..." --theme "dino|mint|robot"

Defaults are set for Episode 1.
"""

import argparse
from PIL import Image, ImageDraw, ImageFont

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


def centered(draw, text, y, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--title', default='Hatch Hoppers')
    ap.add_argument('--subtitle', default='Episode 1: The Dinosaur Garden')
    ap.add_argument('--footer', default='Hands together. Deep breath. Hatch time.')
    ap.add_argument('--theme', default='dino', choices=THEMES.keys())
    args = ap.parse_args()

    t = THEMES[args.theme]
    img = Image.new('RGB', (W, H), t['bg'])
    d = ImageDraw.Draw(img)

    # subtle stars
    import random
    random.seed(7)
    for _ in range(420):
        x = random.randint(0, W-1)
        y = random.randint(0, H-1)
        r = random.choice([1, 1, 2])
        col = (255, 255, 255) if random.random() > 0.2 else t['accent']
        d.ellipse((x, y, x+r, y+r), fill=col)

    # neon frame
    d.rounded_rectangle((90, 90, W-90, H-90), radius=60, outline=t['accent'], width=10)
    d.rounded_rectangle((120, 120, W-120, H-120), radius=48, outline=(255, 255, 255, 80), width=3)

    centered(d, args.title, 240, TITLE_F, t['accent'])
    centered(d, args.subtitle, 390, SUB_F, (255, 255, 255))
    centered(d, args.footer, 520, FOOT_F, t['accent2'])

    # simple hatch icon
    cx, cy = W//2, 740
    d.ellipse((cx-140, cy-140, cx+140, cy+140), outline=t['accent2'], width=10)
    d.ellipse((cx-110, cy-110, cx+110, cy+110), outline=t['accent'], width=10)
    d.arc((cx-90, cy-90, cx+90, cy+90), start=30, end=330, fill=t['accent'], width=8)

    img.save(args.out, 'PNG')
    print('wrote', args.out)

if __name__ == '__main__':
    main()
