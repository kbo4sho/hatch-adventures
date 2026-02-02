#!/usr/bin/env python3
"""
Generate episode images via DALL-E 3 API from image prompts markdown.

Usage:
  python3 generate-images-dalle.py story-03-robot-playground

Reads:  assets/03-image-prompts-robot-playground.md
Creates: assets/images/story-03-robot-playground/00.png through 08.png

Requires: OPENAI_API_KEY environment variable
"""

import os
import sys
import re
import time
import base64
import json
from pathlib import Path

try:
    import requests
except ImportError:
    print("❌ requests library required: pip install requests")
    sys.exit(1)

API_KEY = os.environ.get('OPENAI_API_KEY')
if not API_KEY:
    print("❌ OPENAI_API_KEY environment variable not set")
    sys.exit(1)

API_URL = 'https://api.openai.com/v1/images/generations'
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def parse_image_prompts(md_file):
    """Extract image prompts from markdown file."""
    if not os.path.exists(md_file):
        print(f"❌ Prompts file not found: {md_file}")
        sys.exit(1)
    
    with open(md_file, 'r') as f:
        content = f.read()
    
    # Extract style prefix
    style_match = re.search(r'```\s*\n([^\n]+)\n```', content, re.MULTILINE)
    style_prefix = style_match.group(1) if style_match else "Children's book illustration style, warm and inviting."
    
    print(f"📝 Style prefix: {style_prefix}")
    print()
    
    # Parse image sections
    sections = re.split(r'##\s+(\d+\.png|00\.png|COVER\.png)\s*(?:—|–|-)\s*(.+)', content)
    
    images = []
    for i in range(1, len(sections), 3):
        filename = sections[i].strip()
        title = sections[i+1].strip() if i+1 < len(sections) else ""
        body = sections[i+2].strip() if i+2 < len(sections) else ""
        
        # Extract the main prompt text (first paragraph after heading)
        prompt_match = re.search(r'(Children.*?\.)\s*\n', body, re.DOTALL)
        if prompt_match:
            prompt = prompt_match.group(1).strip()
        else:
            # Fall back to first paragraph
            paragraphs = [p.strip() for p in body.split('\n\n') if p.strip() and not p.strip().startswith('**')]
            prompt = paragraphs[0] if paragraphs else ""
        
        if prompt and filename.endswith('.png'):
            images.append({
                'filename': filename,
                'title': title,
                'prompt': prompt
            })
    
    return style_prefix, images

def generate_image_dalle(prompt, size="1536x1024", quality="standard"):
    """Call DALL-E 3 API to generate an image."""
    payload = {
        'model': 'dall-e-3',
        'prompt': prompt,
        'n': 1,
        'size': size,
        'quality': quality,
        'response_format': 'url'
    }
    
    response = requests.post(API_URL, headers=HEADERS, json=payload, timeout=120)
    
    if response.status_code != 200:
        error_msg = response.json().get('error', {}).get('message', response.text)
        raise Exception(f"API error: {error_msg}")
    
    data = response.json()
    image_url = data['data'][0]['url']
    revised_prompt = data['data'][0].get('revised_prompt')
    
    return image_url, revised_prompt

def download_image(url, output_path):
    """Download image from URL and save to file."""
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    with open(output_path, 'wb') as f:
        f.write(response.content)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 generate-images-dalle.py <story-name>")
        print("Example: python3 generate-images-dalle.py story-03-robot-playground")
        sys.exit(1)
    
    story_name = sys.argv[1]
    
    # Extract episode number and slug
    match = re.match(r'story-(\d+)-(.+)', story_name)
    if not match:
        print("❌ Story name must be in format: story-XX-slug-name")
        sys.exit(1)
    
    ep_num = match.group(1)
    slug = match.group(2)
    
    # Find prompts file
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    prompts_file = project_root / 'assets' / f'{ep_num}-image-prompts-{slug}.md'
    output_dir = project_root / 'assets' / 'images' / story_name
    
    print(f"🎬 Generating images for Episode {ep_num}: {slug}")
    print(f"📂 Prompts: {prompts_file}")
    print(f"📂 Output: {output_dir}")
    print()
    
    # Parse prompts
    style_prefix, images = parse_image_prompts(prompts_file)
    
    # Filter out COVER.png and keep only numbered scenes
    # We want 00.png (intro) + 01.png through 08.png (scenes)
    scene_images = [img for img in images if re.match(r'^\d+\.png$', img['filename'])]
    scene_images.sort(key=lambda x: int(x['filename'].split('.')[0]))
    
    print(f"🖼️  Found {len(scene_images)} scene images to generate:")
    for img in scene_images:
        print(f"   {img['filename']}: {img['title']}")
    print()
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate each image
    total_cost = 0.0
    for i, img in enumerate(scene_images, 1):
        filename = img['filename']
        title = img['title']
        prompt = img['prompt']
        
        output_path = output_dir / filename
        
        print(f"🎨 [{i}/{len(scene_images)}] Generating {filename}: {title}")
        print(f"   Prompt: {prompt[:80]}...")
        
        try:
            # Generate
            image_url, revised_prompt = generate_image_dalle(prompt, size="1792x1024", quality="standard")
            
            # Download
            download_image(image_url, output_path)
            
            # Cost calculation (DALL-E 3: $0.040 per 1024×1024 standard, $0.080 per 1024×1024 HD)
            # For 1536×1024, using standard pricing
            cost = 0.040
            total_cost += cost
            
            print(f"   ✅ Saved: {output_path} (${cost:.3f})")
            
            if revised_prompt and revised_prompt != prompt:
                print(f"   📝 Revised: {revised_prompt[:80]}...")
            
            print()
            
            # Rate limiting: DALL-E 3 has lower rate limits
            if i < len(scene_images):
                print("   ⏳ Waiting 5s before next generation...")
                time.sleep(5)
        
        except Exception as e:
            print(f"   ❌ Failed: {e}")
            print()
            continue
    
    print("=" * 60)
    print(f"✨ Done! Generated {len(scene_images)} images")
    print(f"💰 Estimated cost: ${total_cost:.2f}")
    print(f"📁 Images saved to: {output_dir}")
    print()
    print("Next steps:")
    print(f"  1. Review images: open {output_dir}")
    print(f"  2. Generate audio: node generate-audio-scenes.js {story_name}-narration.md")
    print(f"  3. Create video: node create-video.js {story_name}")

if __name__ == '__main__':
    main()
