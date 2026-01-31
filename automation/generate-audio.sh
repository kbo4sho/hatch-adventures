#!/bin/bash
# Generate audio narration from story text
# Usage: ./generate-audio.sh story-01-dinosaur-garden.md [method]
# Methods: elevenlabs, openai, macos (default: macos)

set -e

STORY_FILE="$1"
METHOD="${2:-macos}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$SCRIPT_DIR/output"

mkdir -p "$OUTPUT_DIR"

if [ -z "$STORY_FILE" ]; then
    echo "Usage: $0 <story-file.md> [method]"
    echo "Methods: elevenlabs, openai, macos"
    exit 1
fi

# Extract story name from filename
STORY_NAME=$(basename "$STORY_FILE" .md)
OUTPUT_FILE="$OUTPUT_DIR/${STORY_NAME}-audio.mp3"

# Extract just the story text (remove YAML frontmatter and markdown formatting)
STORY_TEXT=$(cat "$PROJECT_ROOT/$STORY_FILE" | \
    sed '/^---$/,/^---$/d' | \
    sed '/^#/d' | \
    sed '/^\*\*/d' | \
    sed 's/\*//g' | \
    sed 's/_//g' | \
    grep -v '^$' | \
    tr '\n' ' ')

echo "📖 Generating audio for: $STORY_NAME"
echo "🎤 Method: $METHOD"

case "$METHOD" in
    elevenlabs)
        echo "🔊 Using ElevenLabs TTS..."
        if [ -z "$ELEVENLABS_API_KEY" ]; then
            echo "❌ Error: ELEVENLABS_API_KEY not set"
            echo "Get your key at: https://elevenlabs.io"
            exit 1
        fi
        
        # ElevenLabs API call (voice: Rachel - good for kids' stories)
        curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
            -H "xi-api-key: $ELEVENLABS_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$STORY_TEXT\",\"model_id\":\"eleven_monolingual_v1\"}" \
            --output "$OUTPUT_FILE"
        ;;
        
    openai)
        echo "🔊 Using OpenAI TTS..."
        if [ -z "$OPENAI_API_KEY" ]; then
            echo "❌ Error: OPENAI_API_KEY not set"
            exit 1
        fi
        
        # OpenAI TTS API call (voice: nova - friendly female)
        curl -X POST "https://api.openai.com/v1/audio/speech" \
            -H "Authorization: Bearer $OPENAI_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"model\":\"tts-1\",\"voice\":\"nova\",\"input\":\"$STORY_TEXT\"}" \
            --output "$OUTPUT_FILE"
        ;;
        
    macos)
        echo "🔊 Using macOS built-in TTS..."
        # Use macOS say command (voice: Samantha)
        TMP_AIFF="$OUTPUT_DIR/${STORY_NAME}-temp.aiff"
        say -v Samantha -o "$TMP_AIFF" "$STORY_TEXT"
        
        # Convert AIFF to MP3
        if command -v ffmpeg &> /dev/null; then
            ffmpeg -i "$TMP_AIFF" -codec:a libmp3lame -qscale:a 2 "$OUTPUT_FILE" -y
            rm "$TMP_AIFF"
        else
            echo "⚠️ ffmpeg not found. Installing via Homebrew..."
            brew install ffmpeg
            ffmpeg -i "$TMP_AIFF" -codec:a libmp3lame -qscale:a 2 "$OUTPUT_FILE" -y
            rm "$TMP_AIFF"
        fi
        ;;
        
    *)
        echo "❌ Unknown method: $METHOD"
        echo "Available: elevenlabs, openai, macos"
        exit 1
        ;;
esac

if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    DURATION=$(ffprobe -i "$OUTPUT_FILE" -show_entries format=duration -v quiet -of csv="p=0" | cut -d'.' -f1)
    MINUTES=$((DURATION / 60))
    SECONDS=$((DURATION % 60))
    
    echo ""
    echo "✅ Audio generated successfully!"
    echo "📁 File: $OUTPUT_FILE"
    echo "💾 Size: $FILE_SIZE"
    echo "⏱️  Duration: ${MINUTES}m ${SECONDS}s"
    echo ""
    echo "Next step: Create video with:"
    echo "  node create-video.js $STORY_NAME"
else
    echo "❌ Error: Audio generation failed"
    exit 1
fi
