# 📺 Upload to YouTube Kids

YouTube Kids is a filtered version of YouTube showing only kid-appropriate content. Your videos can appear there by properly categorizing them.

---

## One-Time Setup

### Step 1: Create YouTube Channel

1. Go to https://youtube.com
2. Sign in with Google account
3. Click your profile → **"Create a channel"**
4. Choose **"Use a custom name"** (not your personal name)
5. Name: **"The Hatch Adventures"**
6. Category: **Education**

### Step 2: Customize Channel

1. **Channel Art:**
   - Banner: 2560x1440px (shows full on TV)
   - Profile pic: Your series logo (800x800px minimum)

2. **About Section:**
   ```
   Magical story adventures for kids ages 3-7! 🚪✨
   
   Join Max (7) and Mia (3) as they discover magical hatches that transport them to incredible places. Each adventure teaches kindness, curiosity, and friendship.
   
   Perfect for:
   • Bedtime stories 🌙
   • Learning time 📚
   • Quiet activities 🎨
   
   New episodes every [your schedule]!
   
   Parents: Visit [website] for printable activities, coloring pages, and more!
   ```

3. **Links:**
   - Website
   - Instagram
   - Spotify podcast
   - Contact email

### Step 3: Enable "Made for Kids"

This is REQUIRED for YouTube Kids:

1. Go to **YouTube Studio**
2. Click **Settings** → **Channel** → **Advanced Settings**
3. Under **Audience**, select:
   - ✅ **"Yes, set this channel as made for kids"**
4. Save

---

## Uploading Videos

### Via YouTube Studio (Web)

1. Go to https://studio.youtube.com
2. Click **"Create"** → **"Upload videos"**
3. Select your video file (e.g., `story-01-youtube.mp4`)
4. Fill in details (see template below)
5. Set audience: **"Yes, it's made for kids"**
6. Click **"Publish"** or **"Schedule"**

### Video Details Template

**Title:**
```
The Dinosaur Garden 🦕 | Hatch Adventures Episode 1 | Kids Story
```

**Description:**
```
Max and Mia discover a magical hatch that takes them to a prehistoric garden full of friendly dinosaurs! 🦕✨

In this episode, the kids learn about sharing, kindness, and making new friends. Perfect for ages 3-7!

🚪 What are the Hatch Adventures?
Max (7) and Mia (3) find magical hatches that transport them to incredible places. Each adventure is a complete story teaching important lessons through fun!

⏱️ Story Length: [X] minutes
🎯 Ages: 3-7 years old
📚 Lesson: Kindness, sharing, curiosity

---

🎨 FREE Activities & Coloring Pages: [your website]
🎧 Listen on Spotify: [podcast link]
📱 Follow on Instagram: @hatchadventures

---

Parents: This is 100% kid-safe content with no ads or scary elements. Perfect for bedtime, quiet time, or learning!

#KidsStories #Bedtime #Educational #PreschoolLearning
```

**Tags:**
```
kids stories, bedtime stories, educational, preschool, kindergarten, children's stories, story time, read aloud, dinosaurs, adventure, Max and Mia, ages 3-7, kid friendly, safe content
```

**Thumbnail:**
- Use cover image from your generated scenes
- Add text: "Episode 1" + story title
- Bright, eye-catching, shows characters

**Playlist:**
- Create playlist: "The Hatch Adventures - Season 1"
- Add each episode to it

---

## YouTube Kids Requirements

To appear in YouTube Kids app, your video MUST:

✅ Be marked "Made for Kids"  
✅ Have no violent/scary content  
✅ Have no inappropriate language  
✅ Have clean, kid-safe music  
✅ Have appropriate title/description/thumbnail

**YouTube auto-reviews and approves within 24 hours.**

---

## Best Practices

### Video Quality
- **Resolution:** 1080p (1920x1080)
- **Format:** MP4 (H.264)
- **Framerate:** 30fps
- **Audio:** AAC, 192kbps

### Upload Schedule
- **Consistency is key:** Same day/time each week
- **Best times:** 
  - Weekday mornings (parents searching for content)
  - Sunday evenings (week prep)

### SEO (Discoverability)
- **Title:** Include keywords + episode number
- **Description:** First 2 lines show in search
- **Tags:** Use all 500 characters (max 30 tags)
- **Chapters:** Add timestamps for scenes
- **End screen:** Suggest next episode

### Engagement
- **Pinned comment:** "What was your favorite part? 💬"
- **Community posts:** Behind-the-scenes, coloring pages
- **Polls:** "Which hatch should Max & Mia find next?"

---

## Automated Upload (Advanced)

### Option 1: YouTube Data API (Recommended)

**Setup:**
1. Create Google Cloud project
2. Enable YouTube Data API v3
3. Create OAuth credentials
4. Download `client_secret.json`

**Script:**
```bash
# Install dependencies
npm install googleapis

# Authorize (one-time)
node upload-youtube.js --setup

# Upload video
node upload-youtube.js \
  --video story-01-youtube.mp4 \
  --title "The Dinosaur Garden | Episode 1" \
  --description "..." \
  --tags "kids stories,bedtime,educational"
```

**Cost:** Free (10,000 quota units/day = ~6 uploads/day)

### Option 2: Batch Upload Tool

Use **TubeBuddy** or **VidIQ** browser extensions:
- Upload multiple videos at once
- Auto-fill metadata from templates
- Schedule publish times

---

## Analytics to Track

### YouTube Studio Analytics

**Watch Time Metrics:**
- Average view duration (goal: >60%)
- Audience retention graph
- Traffic sources (search, suggested, external)

**Engagement:**
- Likes, comments, shares
- Subscribers gained per video
- Click-through rate (thumbnail performance)

**Audience:**
- Age range (should be 2-8 primarily)
- Watch time by episode
- Returning vs new viewers

**Pro Tip:** Videos with >50% retention perform better in recommendations!

---

## Monetization

### YouTube Partner Program
**Requirements:**
- 1,000 subscribers
- 4,000 watch hours (past 12 months)
- Made for Kids content = limited ads

**Note:** "Made for Kids" videos have restricted monetization. Focus on:
- Merchandise
- Spotify ads (podcast version)
- Sponsorships
- Premium products (books, printables)

---

## Common Issues

**Q: Video not showing in YouTube Kids app?**
- Check it's marked "Made for Kids"
- Wait 24-48 hours for review
- Verify no inappropriate content flags

**Q: Low views?**
- Improve thumbnail (test A/B versions)
- Optimize title for search
- Share on social media
- Engage with similar channels

**Q: Comments disabled?**
- Normal for "Made for Kids" content
- YouTube auto-disables to comply with COPPA
- Use Community tab for engagement instead

---

## Checklist: First Upload

- [ ] Channel created & customized
- [ ] "Made for Kids" enabled
- [ ] Cover art & profile pic uploaded
- [ ] First video exported (1080p MP4)
- [ ] Title follows SEO template
- [ ] Description includes keywords & links
- [ ] Tags added (max 30)
- [ ] Custom thumbnail created
- [ ] Playlist created
- [ ] Video published or scheduled
- [ ] Shared on social media
- [ ] Added to Spotify episode description

---

**Next:** Set up social media to drive traffic to YouTube!
