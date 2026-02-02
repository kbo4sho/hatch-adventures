#!/bin/bash
# Prepare intro cards by adding title overlays
# Usage: ./prepare-intro-cards.sh story-01 "The Dinosaur Garden"

if [ $# -lt 2 ]; then
    echo "Usage: $0 <story-name> <episode-title>"
    echo "Example: $0 story-01 'The Dinosaur Garden'"
    exit 1
fi

STORY_NAME=$1
EPISODE_TITLE=$2
# Extract episode number from story name (story-01-dinosaur-garden -> 1)
EPISODE_NUM=$(echo $STORY_NAME | grep -o 'story-[0-9]*' | sed 's/story-0*//')

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS_DIR="$(dirname "$SCRIPT_DIR")/assets"
IMAGE_DIR="$ASSETS_DIR/images/$STORY_NAME"

echo "🎨 Preparing intro card for: $STORY_NAME"
echo "   Episode: $EPISODE_NUM"
echo "   Title: $EPISODE_TITLE"
echo ""

if [ ! -d "$IMAGE_DIR" ]; then
    echo "❌ Image directory not found: $IMAGE_DIR"
    exit 1
fi

# Check if 00.png exists
if [ ! -f "$IMAGE_DIR/00.png" ]; then
    echo "⚠️  No 00.png found in $IMAGE_DIR"
    exit 1
fi

# Check if already titled (has -titled in the filename or save over)
INTRO_FILE="$IMAGE_DIR/00.png"

# Add title overlay
python3 "$SCRIPT_DIR/add-intro-title.py" "$INTRO_FILE" "$EPISODE_NUM" "$EPISODE_TITLE" "$INTRO_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Intro card ready: $INTRO_FILE"
else
    echo "❌ Failed to process intro card"
    exit 1
fi
