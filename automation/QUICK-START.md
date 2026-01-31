# 🚀 Quick Start: Story to All Platforms

**Goal:** Get one story from text → Spotify + YouTube + TikTok + Instagram in under 30 minutes.

---

## Prerequisites (One-Time Setup)

1. Install ffmpeg: `brew install ffmpeg`
2. Have your story images ready (8 scenes)
3. Accounts created on all platforms

---

## The 5-Minute Workflow (Per Story)

### Step 1: Generate Audio (2 minutes)
```bash
cd /Users/kevinbolander/clawd/hatch-stories/automation
./generate-audio.sh story-01-dinosaur-garden.md macos
```

**Output:** `output/story-01-dinosaur-garden-audio.mp3`

### Step 2: Organize Images (1 minute)
```bash
mkdir -p ../assets/images/story-01
# Move your 8 generated images here
# Name them: 01-cover.jpg, 02-hatch.jpg, etc.
```

### Step 3: Create Videos (2 minutes)
```bash
node create-video.js story-01
```

**Output:**
- `story-01-youtube.mp4` (16:9, 1080p)
- `story-01-tiktok.mp4` (9:16, 1080x1920)
- `story-01-instagram-reel.mp4` (9:16, 1080x1920)
- `story-01-instagram-feed.mp4` (1:1, 1080x1080)

---

## Upload to Platforms (Manual - 10 minutes total)

### Spotify (3 minutes)
1. Open Anchor.fm
2. Click "New Episode"
3. Upload `story-01-dinosaur-garden-audio.mp3`
4. Title: "Episode 1: The Dinosaur Garden"
5. Copy description from story file
6. Publish!

### YouTube (3 minutes)
1. Open YouTube Studio
2. Click "Create" → "Upload"
3. Select `story-01-youtube.mp4`
4. Title: "The Dinosaur Garden 🦕 | Hatch Adventures Ep 1"
5. Mark "Made for Kids"
6. Publish!

### TikTok (2 minutes)
1. AirDrop `story-01-tiktok.mp4` to phone
2. Open TikTok app
3. Upload video
4. Caption: "Max & Mia find dinosaurs! 🦕✨ Full story on YouTube!"
5. Add hashtags
6. Post!

### Instagram (2 minutes)
1. Upload `story-01-instagram-reel.mp4` to Reels
2. Same caption as TikTok
3. Add to Feed too
4. Post!

---

## Total Time Breakdown

- Audio generation: **2 min**
- Video creation: **2 min**
- Spotify upload: **3 min**
- YouTube upload: **3 min**
- TikTok upload: **2 min**
- Instagram upload: **2 min**

**Total: ~14 minutes** (after initial setup)

---

## Batch Processing (Recommended)

Instead of doing one story at a time:

**Sunday Prep:**
1. Generate audio for Stories 1-3
2. Create all videos
3. Schedule uploads for the week

**Weekly Schedule:**
- Mon: Post TikTok teaser
- Wed: Upload YouTube full episode
- Fri: Post Instagram Reel
- Sun: Publish Spotify episode

**Time savings:** 30 min once/week vs 15 min 4x/week

---

## Automation Level

✅ **Fully Automated:**
- Asset creation (images, games, etc.)
- Audio generation (with TTS)
- Video creation
- GitHub backups

⚠️ **Semi-Automated:**
- Spotify (upload via Anchor app/web)
- YouTube (can script, but manual is easier)

📱 **Manual (For Now):**
- TikTok/Instagram (APIs require business approval)
- Quality check before posting

---

## Tips for Speed

1. **Use templates:** Copy previous episode's title/description
2. **Batch resize:** Generate all images at once
3. **Schedule ahead:** Upload 3-5 episodes at launch
4. **Automate reminders:** Add to your calendar

---

## Next Level: Full Automation

Want to automate uploads too?

**YouTube:** Can be scripted with YouTube Data API  
**Spotify:** Use RSS feed auto-publishing via Podbean  
**Social:** Requires business API approval (TikTok/Instagram)

Let me know if you want those scripts!

---

**Questions?** Check the detailed guides:
- `upload-spotify.md`
- `upload-youtube.md`
- `upload-social.md`
