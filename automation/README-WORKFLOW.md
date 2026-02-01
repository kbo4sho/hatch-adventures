# Hatch Hoppers Episode Production Workflow

Complete workflow for creating an episode from story to final video.

## 📋 Step-by-Step

### 1. Write the Story
Create `story-0X-title.md` in the root folder with the complete story text.

### 2. Generate Images
Generate intro card, scene images, and outro card:

```bash
# With placeholders (for quick testing)
python3 automation/generate-episode-images.py \
  --episode 1 \
  --scenes 8 \
  --placeholders

# Without placeholders (you'll add custom/AI images manually)
python3 automation/generate-episode-images.py \
  --episode 1 \
  --scenes 8
```

This creates:
- `00.png` - Intro title card (4s duration)
- `01-0N.png` - Scene images (divide remaining time)
- `0(N+1).png` - Outro/next episode card (4s duration)

**If generating custom scene images:**
- Manually create or AI-generate `01.png` through `08.png`
- Place them in `assets/images/story-0X-slug/`

### 3. Create Narration Script
Create `automation/story-0X-slug-narration.md` with:

```markdown
# Hatch Hoppers — Episode X Narration Script

Welcome, Hatch Hoppers. I'm your story guide. [Name] is [age], [Name2] is [age], and today… we're stepping into the unknown. Hands together. Deep breath. Hatch time.

---

## Episode X: The Title

[Story narration matching the scene images 01-08]

---

Thanks for hopping with us. If you liked this adventure, tell a grown-up you want another. Until next time—hands together. Deep breath. Hatch time.
```

**⏱️ Timing Guide:**
- **Intro (~4s):** "Welcome, Hatch Hoppers..." opening
- **Scenes:** Main story narration divided across scene images
- **Outro (~4s):** "Thanks for hopping..." closing

The video script automatically allocates:
- 4 seconds to intro card (00.png)
- Remaining time ÷ scene count for each scene (01-0N.png)
- 4 seconds to outro card (0N+1.png)

### 4. Generate Audio
Convert narration script to audio with OpenAI TTS:

```bash
cd automation
node generate-audio-openai-chunked.js story-0X-slug-narration.md --voice nova
```

This creates `output/story-0X-slug-narration-audio.mp3`.

**Copy to expected location:**
```bash
cp output/story-0X-slug-narration-audio.mp3 output/story-0X-slug-audio.mp3
```

### 5. Create Videos
Generate all platform-specific videos:

```bash
node automation/create-video.js story-0X-slug
```

Creates:
- `story-0X-slug-youtube.mp4` (1920x1080, 16:9)
- `story-0X-slug-tiktok.mp4` (1080x1920, 9:16)
- `story-0X-slug-instagram-reel.mp4` (1080x1920, 9:16)
- `story-0X-slug-instagram-feed.mp4` (1080x1080, 1:1)

All videos are in `automation/output/`.

### 6. Upload & Publish
Use the upload scripts in `automation/`:
- `upload-youtube.md` - YouTube upload guide
- `upload-spotify.md` - Spotify Podcasts guide
- `upload-social.md` - Social media tips

---

## 🔧 Customization

### Episode Metadata
Edit `automation/generate-episode-images.py` to add new episode metadata:

```javascript
EPISODES = {
    4: {
        'title': 'Underwater Music Festival',
        'slug': 'underwater-music-festival',
        'next': 'The Crystal Cave',
        'theme': 'robot'  // or 'dino', 'mint'
    }
}
```

### Themes
Three built-in themes in `automation/generate-episode-images.py`:
- **dino** - Cyan/orange, space vibes
- **mint** - Green/white, fresh
- **robot** - Purple/cyan, electric

Add custom themes by editing the `THEMES` dict.

### Voice
Available OpenAI TTS voices (set with `--voice`):
- `nova` (default) - Warm, slightly British, great for narration
- `alloy` - Neutral, balanced
- `echo` - Clear male voice
- `fable` - Expressive, storytelling
- `onyx` - Deep male voice
- `shimmer` - Bright female voice

---

## 🎯 Quick Example: Episode 1

```bash
# 1. Images (with placeholders for testing)
python3 automation/generate-episode-images.py --episode 1 --scenes 8 --placeholders

# 2. Audio
cd automation
node generate-audio-openai-chunked.js story-01-dinosaur-garden-narration.md --voice nova
cp output/story-01-dinosaur-garden-narration-audio.mp3 output/story-01-dinosaur-garden-audio.mp3

# 3. Video
node create-video.js story-01-dinosaur-garden

# Done! Videos are in automation/output/
```

---

## 📝 Notes

- **Intro/outro timing is fixed at 4s each** - narration should match
- Scene timing is **automatic** - divides remaining audio equally
- If narration is too short/long for scenes, adjust script or image count
- **File naming matters**: Use consistent `story-0X-slug` pattern throughout
