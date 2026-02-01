#!/usr/bin/env python3
"""Generate simple kid-friendly PNG scene cards for Episode 3 (Robot Playground).

Creates 8 images at 1920x1080 in:
  hatch-stories/assets/images/story-03-narration/

These are intentionally simple (pipeline test assets).
"""

import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'assets', 'images', 'story-03-narration'))
os.makedirs(OUT_DIR, exist_ok=True)

# Try to load a decent font; fall back to default.
FONT_CANDIDATES = [
    '/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf',
    '/System/Library/Fonts/Supplemental/Comic Sans MS.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf'
]

def load_font(size):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            return ImageFont.truetype(p, size=size)
    return ImageFont.load_default()

TITLE = load_font(92)
H1 = load_font(64)
BODY = load_font(42)
SMALL = load_font(34)


def draw_centered(draw, text, y, font, fill=(255, 255, 255)):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)


def scene(idx, bg, accent, title, subtitle, elements):
    img = Image.new('RGB', (W, H), bg)
    d = ImageDraw.Draw(img)

    # Top header bar
    d.rounded_rectangle((80, 60, W - 80, 180), radius=40, fill=(0, 0, 0, 120), outline=accent, width=6)
    draw_centered(d, title, 78, H1, fill=accent)
    draw_centered(d, subtitle, 132, SMALL, fill=(255, 255, 255))

    # Ground panel
    d.rounded_rectangle((120, 240, W - 120, H - 120), radius=60, fill=(255, 255, 255), outline=accent, width=8)

    # Add simple elements
    for fn in elements:
        fn(d)

    path = os.path.join(OUT_DIR, f"{idx:02d}.png")
    img.save(path, 'PNG')
    print('wrote', path)


def icon_robot(d, x, y, color=(40, 200, 255)):
    # body
    d.rounded_rectangle((x, y, x + 280, y + 330), radius=30, fill=(245, 245, 245), outline=color, width=8)
    # face
    d.rounded_rectangle((x + 40, y + 40, x + 240, y + 170), radius=24, fill=(20, 30, 40), outline=color, width=6)
    d.ellipse((x + 80, y + 80, x + 120, y + 120), fill=(0, 255, 140))
    d.ellipse((x + 160, y + 80, x + 200, y + 120), fill=(0, 255, 140))
    d.arc((x + 90, y + 120, x + 190, y + 160), start=0, end=180, fill=(255, 255, 255), width=5)
    # antenna
    d.line((x + 140, y - 30, x + 140, y + 10), fill=color, width=8)
    d.ellipse((x + 125, y - 55, x + 155, y - 25), fill=color)


def icon_kids(d, x, y):
    # Max
    d.ellipse((x, y, x + 110, y + 110), fill=(255, 228, 196), outline=(40, 40, 40), width=4)
    d.rounded_rectangle((x - 10, y + 110, x + 120, y + 260), radius=20, fill=(30, 120, 255), outline=(40, 40, 40), width=4)
    d.text((x - 5, y + 270), 'Max', font=SMALL, fill=(30, 30, 30))

    # Mia
    x2 = x + 200
    d.ellipse((x2, y + 10, x2 + 100, y + 110), fill=(255, 228, 196), outline=(40, 40, 40), width=4)
    # blonde pigtails
    d.ellipse((x2 - 18, y + 35, x2 + 10, y + 65), fill=(255, 220, 80))
    d.ellipse((x2 + 90, y + 35, x2 + 118, y + 65), fill=(255, 220, 80))
    d.rounded_rectangle((x2 - 10, y + 110, x2 + 110, y + 250), radius=20, fill=(255, 110, 170), outline=(40, 40, 40), width=4)
    d.text((x2 - 5, y + 270), 'Mia', font=SMALL, fill=(30, 30, 30))


def icon_hoverball(d, x, y, color=(180, 80, 255)):
    d.ellipse((x, y, x + 160, y + 160), fill=(245, 245, 255), outline=color, width=10)
    d.ellipse((x + 35, y + 35, x + 125, y + 125), fill=color)
    d.text((x + 25, y + 175), 'Hover-ball', font=SMALL, fill=(30, 30, 30))


def icon_hatch(d, x, y, glow=(0, 200, 255)):
    d.ellipse((x, y, x + 260, y + 260), fill=(230, 230, 230), outline=(40, 40, 40), width=6)
    d.ellipse((x + 18, y + 18, x + 242, y + 242), outline=glow, width=12)
    d.arc((x + 40, y + 40, x + 220, y + 220), start=20, end=320, fill=glow, width=8)
    d.text((x + 65, y + 275), 'Hatch', font=SMALL, fill=(30, 30, 30))


def main():
    # Scene 1: Title
    img = Image.new('RGB', (W, H), (10, 20, 40))
    d = ImageDraw.Draw(img)
    draw_centered(d, 'Hatch Hoppers', 180, TITLE, fill=(0, 229, 255))
    draw_centered(d, 'Episode 3: The Robot Playground', 320, H1, fill=(255, 255, 255))
    draw_centered(d, 'Hands together. Deep breath. Hatch time.', 420, BODY, fill=(255, 180, 80))
    # neon floor
    for i in range(0, W, 80):
        d.line((i, 760, i + 120, H), fill=(0, 229, 255), width=3)
    # icons
    icon_kids(d, 520, 560)
    icon_robot(d, 1120, 560)
    path = os.path.join(OUT_DIR, '01.png')
    img.save(path, 'PNG')
    print('wrote', path)

    # Scene 2: Arrival
    def elems2(d):
        d.text((170, 300), 'They tumble out onto a bouncy, color-changing floor!', font=BODY, fill=(20, 20, 20))
        icon_kids(d, 220, 420)
        # floor tiles
        for r in range(0, 5):
            for c in range(0, 7):
                x0 = 700 + c * 140
                y0 = 420 + r * 110
                color = (80 + c * 20, 120 + r * 20, 255 - c * 10)
                d.rounded_rectangle((x0, y0, x0 + 120, y0 + 90), radius=16, fill=color, outline=(255, 255, 255), width=3)
    scene(2, (240, 250, 255), (0, 229, 255), 'Robot Playground', 'Scene 1: The Arrival', [elems2])

    # Scene 3: Meet GREET-0
    def elems3(d):
        d.text((170, 300), 'GREET-0 says: “WELCOME, NEW PLAYERS!”', font=BODY, fill=(20, 20, 20))
        icon_kids(d, 220, 470)
        icon_robot(d, 1050, 430, color=(0, 229, 255))
        d.text((1030, 780), 'GREET-0', font=H1, fill=(20, 20, 20))
    scene(3, (245, 240, 255), (161, 0, 255), 'Robot Playground', 'Scene 2: Meet GREET-0', [elems3])

    # Scene 4: Lonely PLAY-7
    def elems4(d):
        d.text((170, 300), 'Behind the dome, PLAY-7 sits alone…', font=BODY, fill=(20, 20, 20))
        icon_robot(d, 330, 430, color=(120, 120, 160))
        d.text((360, 780), 'PLAY-7', font=H1, fill=(20, 20, 20))
        icon_hoverball(d, 760, 500)
        d.text((760, 420), '“My laugh module is offline.”', font=BODY, fill=(20, 20, 20))
    scene(4, (255, 245, 235), (255, 110, 170), 'Robot Playground', 'Scene 3: Someone Alone', [elems4])

    # Scene 5: Turn-taking game
    def elems5(d):
        d.text((170, 300), 'Mia makes it simple: “Your turn.”', font=BODY, fill=(20, 20, 20))
        icon_kids(d, 220, 460)
        icon_hoverball(d, 760, 520)
        icon_robot(d, 1240, 450, color=(120, 120, 160))
        d.text((780, 730), 'Pass the hover-ball', font=H1, fill=(20, 20, 20))
    scene(5, (235, 255, 245), (64, 255, 128), 'Robot Playground', 'Scene 4: Your Turn', [elems5])

    # Scene 6: First laugh + celebration
    def elems6(d):
        d.text((170, 300), 'PLAY-7: “HA.”  Then: “HA-HA!”', font=BODY, fill=(20, 20, 20))
        icon_robot(d, 350, 430, color=(120, 120, 160))
        # confetti
        import random
        for _ in range(180):
            x = random.randint(180, W - 180)
            y = random.randint(360, H - 180)
            d.ellipse((x, y, x + 10, y + 10), fill=(random.randint(0,255), random.randint(0,255), random.randint(0,255)))
        d.text((760, 520), 'Friendship fix! ✨', font=TITLE, fill=(255, 110, 0))
    scene(6, (250, 250, 255), (255, 200, 40), 'Robot Playground', 'Scene 5: Laughter Reboots', [elems6])

    # Scene 7: The Hatch appears
    def elems7(d):
        d.text((170, 300), 'Mia points: “Maxy… hatch.”', font=BODY, fill=(20, 20, 20))
        icon_kids(d, 240, 460)
        icon_hatch(d, 1160, 430, glow=(0, 120, 255))
        d.text((820, 780), 'Glowing electric-blue hatch', font=H1, fill=(20, 20, 20))
    scene(7, (240, 245, 255), (0, 120, 255), 'Robot Playground', 'Scene 6: The Hatch', [elems7])

    # Scene 8: Next destination teaser
    def elems8(d):
        d.text((170, 300), 'Next up: Underwater Music Festival!', font=BODY, fill=(20, 20, 20))
        icon_hatch(d, 260, 430, glow=(0, 120, 255))
        # bubbles
        for r in range(1, 10):
            d.ellipse((980 + r * 70, 460 + r * 40, 980 + r * 70 + 60, 460 + r * 40 + 60), outline=(0, 170, 255), width=6)
        d.text((760, 660), '“Maaaaybe… UNDERWATER MUSIC!”', font=H1, fill=(0, 80, 160))
    scene(8, (220, 245, 255), (0, 170, 255), 'Hatch Hoppers', 'Teaser: Episode 4', [elems8])


if __name__ == '__main__':
    main()
