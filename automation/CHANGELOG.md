# Hatch Hoppers Automation Updates

## 2026-01-31: Intro/Outro Card Integration

### ✨ New Features

**1. Automated Title Card Generation**
- New script: `generate-episode-images.py`
- Auto-generates intro + outro cards for each episode
- Supports placeholder scene images for testing
- Theme-aware (dino/mint/robot)
- Episode metadata auto-detection

**2. Smart Video Timing**
- Updated: `create-video.js`
- Fixed 4-second intro card duration (00.png)
- Fixed 4-second outro card duration (0N.png)
- Remaining audio time divided equally across scene images
- Automatic detection of intro/outro cards

**3. Complete Workflow Documentation**
- New guide: `README-WORKFLOW.md`
- Step-by-step episode creation process
- Timing guidelines for narration scripts
- Quick-start examples

### 🔄 Updated Scripts

**`create-video.js`**
- Now detects `00.png` as intro card → 4s duration
- Detects highest-numbered PNG as outro → 4s duration
- Calculates scene duration as: `(total_audio - 8s) / scene_count`
- Variable duration support in ffmpeg filter

**`generate-episode-images.py`** (NEW)
```bash
# Generate complete image set
python3 generate-episode-images.py --episode 1 --scenes 8 --placeholders

# Without placeholders (add custom images manually)
python3 generate-episode-images.py --episode 2 --scenes 8
```

### 📝 Narration Script Guidelines

To match the new timing structure, narration scripts should:

1. **Intro (~4s)**: Opening hook
   ```
   Welcome, Hatch Hoppers. I'm your story guide. [Names/ages]. 
   Hands together. Deep breath. Hatch time.
   ```

2. **Scenes**: Main story content
   - Divide evenly across scene count
   - Each scene gets equal audio time

3. **Outro (~4s)**: Closing + next episode tease
   ```
   Thanks for hopping with us. If you liked this adventure, 
   tell a grown-up you want another. Until next time—
   hands together. Deep breath. Hatch time.
   ```

### 🎯 File Naming Convention

All files for an episode use: `story-{NN}-{slug}`

Example for Episode 1:
```
story-01-dinosaur-garden.md                     (story text)
automation/story-01-dinosaur-garden-narration.md (narration script)
automation/output/story-01-dinosaur-garden-audio.mp3 (audio)
assets/images/story-01-dinosaur-garden/         (images folder)
  00.png  (intro card)
  01.png  (scene 1)
  ...
  08.png  (scene 8)
  09.png  (outro card)
automation/output/story-01-dinosaur-garden-youtube.mp4 (video)
```

### 🚀 Quick Start (Full Episode)

```bash
# 1. Generate images with placeholders
python3 automation/generate-episode-images.py --episode 1 --scenes 8 --placeholders

# 2. Create narration script (manual)
# Edit: automation/story-01-dinosaur-garden-narration.md

# 3. Generate audio
cd automation
node generate-audio-openai-chunked.js story-01-dinosaur-garden-narration.md
cp output/story-01-dinosaur-garden-narration-audio.mp3 output/story-01-dinosaur-garden-audio.mp3

# 4. Create videos
node create-video.js story-01-dinosaur-garden

# Done! Videos in automation/output/
```

### ⚠️ Breaking Changes

**None!** The updates are backward-compatible:
- Episodes without `00.png` still work (no intro card)
- Episodes with all same-numbered images work (equal timing)
- Old narration scripts still work

### 🐛 Fixes

- **"Cocoa Machine" → "Chocolate Rain Machine"** 
  - Updated in `story-02-candy-cloud-castle.md`
  - Updated in `automation/story-02-narration.md`
  - Updated in `STORY-IDEAS-BACKLOG.md`

---

## Previous Updates

See git history for earlier changes.
