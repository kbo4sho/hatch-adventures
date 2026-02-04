# Hatch Adventures — Project Workflow

This project uses reusable skills from `~/clawd/skills/`.

## Quick Reference

### Generate Episode Audio + Video
```bash
# From hatch-stories/automation directory:

# 1. Generate TTS audio from narration script
node ~/clawd/skills/openai-tts-producer/generate-audio.js \
  story-02-candy-cloud-castle-narration.md \
  --voice nova \
  --output ./output \
  --timestamps-dir ../assets/images/story-02-candy-cloud-castle

# 2. Create video from images + audio
node ~/clawd/skills/video-assembler/create-video.js \
  --images ../assets/images/story-02-candy-cloud-castle \
  --audio ./output/story-02-candy-cloud-castle-audio.mp3 \
  --timestamps ../assets/images/story-02-candy-cloud-castle/timestamps.json \
  --output ./output/story-02-candy-cloud-castle-youtube.mp4
```

## Full Pipeline

### 1. Write Story
- Pick idea from `STORY-IDEAS-BACKLOG.md`
- Use `STORY-TEMPLATE.md` for structure
- Save as `story-NN-title.md`

### 2. Create Narration Script
```bash
# Copy narration template
cp automation/NARRATION-TEMPLATE.md automation/story-NN-title-narration.md
# Edit with scene-by-scene narration text
```

### 3. Generate Images
```bash
# Use openai-image-gen skill (already exists)
python automation/generate-images-dalle.py story-NN-title
```

### 4. Generate Audio
```bash
node ~/clawd/skills/openai-tts-producer/generate-audio.js \
  automation/story-NN-title-narration.md \
  --output automation/output \
  --timestamps-dir assets/images/story-NN-title
```

### 5. Create Video
```bash
node ~/clawd/skills/video-assembler/create-video.js \
  --images assets/images/story-NN-title \
  --audio automation/output/story-NN-title-audio.mp3 \
  --timestamps assets/images/story-NN-title/timestamps.json \
  --output automation/output/story-NN-title-youtube.mp4
```

### 6. Publish
- YouTube: See `automation/upload-youtube.md`
- Spotify: See `automation/upload-spotify.md`
- Social: See `automation/upload-social.md`

## Skills Used

| Skill | Location | Purpose |
|-------|----------|---------|
| `story-writer` | `~/clawd/skills/story-writer/` | Templates, structure, idea management |
| `openai-image-gen` | Built-in Clawdbot skill | DALL-E image generation |
| `openai-tts-producer` | `~/clawd/skills/openai-tts-producer/` | Scene-based TTS, timestamps |
| `video-assembler` | `~/clawd/skills/video-assembler/` | Images + audio → video |
| `media-publisher` | `~/clawd/skills/media-publisher/` | YouTube, Spotify, social uploads |

## Project Files

```
hatch-stories/
├── PROJECT.md              ← You are here
├── README.md               ← Series overview
├── SERIES-OVERVIEW.md      ← Characters, style, goals
├── STORY-TEMPLATE.md       ← Writing template
├── STORY-IDEAS-BACKLOG.md  ← 30+ story ideas
├── SEASON-1-ROADMAP.md     ← Episode plan
├── story-*.md              ← Published stories
├── assets/
│   └── images/story-*/     ← Scene images + timestamps.json
└── automation/
    ├── output/             ← Generated audio/video
    ├── *-narration.md      ← Narration scripts
    └── upload-*.md         ← Publishing guides
```

## Hatch-Specific Config

### Voice
- **Voice**: `nova` (warm, friendly narrator)
- **Model**: `tts-1` (fast) or `tts-1-hd` (for final)

### Video
- **Intro duration**: 4s (title card before audio)
- **Crossfade**: 1.5s dissolves between scenes
- **Resolution**: 1920x1080

### Image naming
- `00.png` — Title card (shown during 4s silence)
- `01.png` — Scene 1
- `02.png` — Scene 2
- etc.
