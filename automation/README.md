# 🎬 Multimedia Automation Pipeline
## The Hatch Adventures - Story Distribution System

This folder contains scripts to convert stories into **audio** and **video** formats, then distribute them across multiple platforms.

---

## 📋 Full Workflow

### Step 1: Generate Audio (Narration)
**Input:** Story text  
**Output:** MP3 audio file (~3-5 minutes)

**Options:**
- **A) Professional Recording** (best quality) - Record yourself or hire narrator
- **B) AI Text-to-Speech** (fast, automated) - Use ElevenLabs, Google TTS, or OpenAI TTS
- **C) Built-in TTS** (free, lower quality) - macOS `say` command

**Script:** `generate-audio.sh`

---

### Step 2: Create Video (Images + Audio)
**Input:** Images folder + audio file  
**Output:** MP4 video

**What it does:**
- Stitches images together
- Times them to audio narration
- Adds fade transitions
- Exports platform-specific versions

**Script:** `create-video.js`

---

### Step 3: Export for Platforms

**Created formats:**
1. **Audio-only (MP3)** → Spotify, Apple Podcasts, podcast feeds
2. **Full video (16:9, 1080p)** → YouTube Kids
3. **Vertical video (9:16, 1080x1920)** → TikTok, Instagram Reels
4. **Square video (1:1, 1080x1080)** → Instagram Feed

**Script:** `export-platforms.sh`

---

### Step 4: Upload (Manual or Automated)

**Platforms:**
- ✅ Spotify (via podcast hosting: Anchor, Podbean, etc.)
- ✅ YouTube Kids (YouTube Studio + Kids category)
- ✅ TikTok (API or manual upload)
- ✅ Instagram (API or manual upload)

**Scripts:**
- `upload-youtube.js` (uses YouTube Data API)
- `upload-spotify.md` (manual steps via podcast host)
- `upload-social.md` (TikTok/Instagram guides)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install ffmpeg (for video creation)
brew install ffmpeg

# Install Node packages (if using automated scripts)
npm install
```

### 2. Generate Audio
```bash
./generate-audio.sh story-01-dinosaur-garden.md
# Creates: output/story-01-audio.mp3
```

### 3. Create Videos
```bash
node create-video.js story-01
# Creates:
#   output/story-01-youtube.mp4
#   output/story-01-tiktok.mp4
#   output/story-01-instagram-reel.mp4
#   output/story-01-instagram-feed.mp4
```

### 4. Upload
Follow platform-specific guides in `upload-*.md` files.

---

## 📁 File Structure

```
automation/
├── README.md                    # This file
├── generate-audio.sh            # Audio generation script
├── create-video.js              # Video stitching script
├── export-platforms.sh          # Multi-platform export
├── upload-youtube.js            # YouTube API uploader
├── upload-spotify.md            # Spotify/podcast guide
├── upload-social.md             # TikTok/Instagram guide
└── output/                      # Generated files go here
```

---

## 🎯 Platform Requirements

### Spotify (via Podcast)
- **Format:** MP3, 128kbps+
- **Host:** Anchor.fm (free, Spotify-owned) or Podbean
- **Setup:** 10 minutes, no API needed
- **Auto-submit to Spotify:** ✅ via host

### YouTube Kids
- **Format:** MP4, 1080p, 16:9
- **Requirements:** YouTube account, Kids category enabled
- **API:** YouTube Data API v3 (free quota: 10,000 units/day)
- **Upload:** Automated via script or manual

### TikTok
- **Format:** MP4, 1080x1920 (9:16), max 10 minutes
- **Requirements:** TikTok account
- **API:** TikTok Content Posting API (requires business account)
- **Upload:** Manual or automated

### Instagram
- **Reels:** MP4, 1080x1920 (9:16), 90 seconds max
- **Feed:** MP4, 1080x1080 (1:1)
- **Requirements:** Instagram account
- **API:** Instagram Graph API (requires Facebook Business)
- **Upload:** Manual or automated

---

## ⚙️ Configuration

### Audio Generation Options

**Option A: ElevenLabs (Best Quality)**
- Sign up: https://elevenlabs.io
- Get API key
- Set: `ELEVENLABS_API_KEY=...`
- Cost: ~$0.30 per story

**Option B: OpenAI TTS (Good Quality)**
- Use existing OpenAI key
- Model: `tts-1` or `tts-1-hd`
- Cost: ~$0.015 per story

**Option C: Free macOS TTS**
- Uses built-in `say` command
- Voices: Samantha, Alex, etc.
- Cost: $0

### YouTube Upload Setup
1. Create Google Cloud project
2. Enable YouTube Data API v3
3. Get OAuth credentials
4. Run `node upload-youtube.js --setup`

### Social Media Upload
- Instagram/TikTok require Business/Creator accounts for API access
- Manual upload is often easier for now
- Scripts can prepare + organize files for bulk upload

---

## 🎨 Video Timing Strategy

**Images per scene:**
- Cover: 5 seconds
- Scene 1-7: Auto-calculated based on narration
- Each scene gets equal time if no timing specified

**Transitions:**
- 0.5 second crossfade between images
- Keeps video smooth and professional

**Background music (optional):**
- Add royalty-free background track
- Lower volume during narration
- Use sites like Uppbeat, Artlist, Epidemic Sound

---

## 📊 Automation Level

### Fully Automated
- ✅ Audio generation (TTS)
- ✅ Video creation
- ✅ Platform-specific exports
- ✅ YouTube upload

### Semi-Automated
- ⚠️ Spotify (one-time podcast setup, then auto-RSS)
- ⚠️ TikTok/Instagram (files ready, manual upload)

### Manual Steps (One-Time)
- Create podcast on Anchor/Podbean
- Set up YouTube channel + Kids category
- Get API credentials for automation

---

## 🔄 Daily Workflow (Once Set Up)

1. **9am, 1pm, 5pm, 9pm:** New assets created (automated)
2. **11pm:** Assets pushed to GitHub (automated)
3. **When images are ready:**
   - Run `generate-audio.sh` (1 command)
   - Run `create-video.js` (1 command)
   - Run upload scripts or manually upload

**Time investment:** ~5 minutes per story once pipeline is built

---

## 🎯 Next Steps

1. Choose audio generation method (ElevenLabs recommended)
2. Test video creation with Story #1 images
3. Set up one platform at a time:
   - Start with YouTube (easiest API)
   - Then Spotify (via Anchor)
   - Then social media (manual is fine to start)

Want me to build the scripts now? I'll create:
- ✅ `generate-audio.sh`
- ✅ `create-video.js`
- ✅ `export-platforms.sh`
- ✅ Platform upload guides
