# Episode [NUMBER]: [STORY TITLE] — Image Prompts

**IMPORTANT: All video images (00.png - 08.png) MUST be 1536×1024 landscape**

Save to: `assets/images/story-[XX]-[story-name]/[file].png`

- **COVER.png:** 1024×1536 (portrait, optional - for social/thumbnails only, NOT in video)
- **00.png - 08.png:** 1536×1024 (landscape, required for video)

---

## Style Configuration

**Style prefix (applied to EVERY prompt below):**
```
Children's book illustration style, warm and inviting.
```

**Customization tips:**
- Change base style: `Watercolor children's book art` or `Bold graphic novel style for kids`
- Add artist references: `in the style of Oliver Jeffers` or `Eric Carle inspired`
- Adjust mood: `playful and energetic` or `gentle and dreamy`
- Every prompt below automatically starts with this prefix

---

## COVER.png — Thumbnail/Cover Image

Resolution: **1024×1536** (portrait / 2:3 ratio)

Children's book illustration style, warm and inviting. [Main visual hook of the story - Max and Mia with the key setting element]. A 7-year-old boy (brown hair, blue shirt) and his 3-year-old sister (blonde pigtails, pink dress) [doing the central action or in the iconic location]. The boy holds a stuffed white bunny. [Key visual elements that make this story unique]. Bright, magical, safe atmosphere. Perfect for a story thumbnail - bold composition, engaging focal point, kid-friendly colors.

**Purpose:** YouTube thumbnail, social media cover, podcast artwork
**Aspect ratio:** 2:3 portrait (1024×1536)
**Emphasis:** Bold, eye-catching, shows both kids + key story element

---

## 00.png — Intro Card (Pure Illustration)

**Resolution: 1536×1024 (landscape, MUST match all other scenes)**

Children's book illustration style, warm and inviting. A dramatic, iconic moment from the episode: [describe the most memorable scene - include Max (7-year-old boy, brown hair, blue shirt) and Mia (3-year-old girl, blonde pigtails, pink dress) in the key setting]. The boy holds a stuffed white bunny. [Environmental details, key characters/elements that define this episode]. Warm golden lighting, rich saturated colors. Safe, magical, awe-inspiring atmosphere. Bold, memorable composition suitable for an opening sequence. **NO TEXT** - illustration only (text overlay will be added separately via prepare-intro-cards.sh).

**Purpose:** Video intro card (4 seconds, will have title overlay added)
**Size requirement:** MUST be 1536×1024 landscape
**Important:** Do NOT include any text in the image - we add it as overlay afterward

---

## 01.png — [Scene Name]

Children's book illustration style, warm and inviting. [Describe the first story scene in detail - setting, characters, mood, action]. A 7-year-old boy (brown hair, blue shirt) and his 3-year-old sister (blonde pigtails, pink dress) [what they're doing]. The boy holds a stuffed white bunny. [Environmental details, lighting, atmosphere]. [Emotional tone]. Magical, safe atmosphere.

---

## 02.png — [Scene Name]

Children's book illustration style, warm and inviting. [Second scene description...]

---

## 03.png — [Scene Name]

Children's book illustration style, warm and inviting. [Third scene description...]

---

## 04.png — [Scene Name]

Children's book illustration style, warm and inviting. [Fourth scene description...]

---

## 05.png — [Scene Name]

Children's book illustration style, warm and inviting. [Fifth scene description...]

---

## 06.png — [Scene Name]

Children's book illustration style, warm and inviting. [Sixth scene description...]

---

## 07.png — [Scene Name]

Children's book illustration style, warm and inviting. [Seventh scene description...]

---

## 08.png — [Scene Name / Outro]

Children's book illustration style, warm and inviting. [Final scene - usually finding the next hatch]. [Description of the new hatch and where it leads]. The boy (brown hair, blue shirt) and little girl (blonde pigtails, pink dress) [their action - usually entering or discovering]. Sense of completion mixed with anticipation for the next adventure. [Goodbye elements if any]. Warm, magical, hopeful atmosphere.

**Purpose:** Video outro (4 seconds)
**Shows:** Transition to next adventure

---

## Character Reference

- **Max:** 7 years old, brown hair, blue t-shirt, khaki shorts, curious and brave
- **Mia:** 3 years old, blonde pigtails, pink dress, joyful and fearless  
- **Flop:** Small white stuffed bunny, floppy ears
- **[Other characters specific to this story]**

---

## Notes

- Consistent character designs across all images
- Warm, inviting color palette
- Never dark or scary — always magical and safe
- **COVER.png** is portrait (2:3) for thumbnails/social
- **00.png** (intro) and **01-08.png** (scenes) are landscape (3:2)
- Style should be cohesive across entire set

---

## Generation Instructions

1. **Generate COVER.png first** (portrait, bold composition)
2. **Generate 00.png** (intro card with title)
3. **Generate 01-08.png** (8 story scenes, landscape)
4. **Total: 10 images** (1 cover + 1 intro + 8 scenes)

**For DALL-E:** Use standard sizes, no aspect ratio flags needed
**For Midjourney:** Add `--ar 2:3` for cover, `--ar 3:2` for scenes
**For Stable Diffusion:** Use 1024×1536 for cover, 1536×1024 for scenes
