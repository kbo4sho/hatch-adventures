# Intro Card Workflow

Quick guide for generating and styling intro cards (00.png) with title overlays.

## Process

### 1. Generate Intro Card Image
Use the prompt from `assets/[NUMBER]-image-prompts-[story-name].md` → `00.png` section.

Save it to: `assets/images/story-[XX]-[story-name]/00.png`

**Example:** For Story 1, save generated image to:
```
assets/images/story-01-dinosaur-garden/00.png
```

### 2. Add Title Overlay Automatically

Once you have the 00.png image, run:

```bash
cd automation
./prepare-intro-cards.sh story-01 "The Dinosaur Garden"
```

**What this does:**
- Adds "THE HATCH" + "ADVENTURES" (2 lines, Arial Rounded font)
- Adds episode title below: "Episode 1: The Dinosaur Garden"
- Applies shadow effect to main title
- Saves directly over 00.png

### 3. Done!

The video creation script will automatically use the titled intro card.

## Options

### Manual Python Script
If you need more control, use the Python script directly:

```bash
python3 add-intro-title.py <input_image> <episode_number> <episode_title> [output_image]
```

**Example:**
```bash
python3 add-intro-title.py ~/custom-intro.jpg 2 "The Candy Cloud Castle"
```

### Customizing Fonts/Styling

Edit `add-intro-title.py`:
- Line ~44: Change font path for title
- Line ~49: Change font path for subtitle
- Line ~70: Adjust shadow color (currently `(50, 50, 50)` = dark gray)
- Line ~71: Adjust shadow offset (currently `4` pixels)
- Lines 75-87: Adjust text positioning/spacing

## Style Details

**Current styling:**
- **Title font:** Arial Rounded Bold, 80pt
- **Subtitle font:** Georgia, 48pt
- **Title text:** "THE HATCH" / "ADVENTURES" (split 2 lines)
- **Shadow:** Dark gray (50, 50, 50), 4px offset
- **Color:** White text on image
- **Spacing:** 100px gap between title and episode subtitle

## Quick Checklist

- [ ] Generate 00.png (pure illustration, no text)
- [ ] Save to `assets/images/story-XX/00.png`
- [ ] Run: `./prepare-intro-cards.sh story-XX "Episode Title"`
- [ ] Ready for video creation

## Example: Story 1 Complete Workflow

```bash
# Step 1: Generate image using the prompt
# (use DALL-E, Midjourney, etc.)
# Save as: assets/images/story-01-dinosaur-garden/00.png

# Step 2: Add title overlay
cd automation
./prepare-intro-cards.sh story-01 "The Dinosaur Garden"

# Step 3: Create video (uses titled 00.png automatically)
node create-video.js story-01
```

Done! Your video now has a properly styled intro card.
