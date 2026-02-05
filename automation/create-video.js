#!/usr/bin/env node
/**
 * Create video from images + audio for The Hatch Adventures
 * Usage: node create-video.js <story-name> [--subtitles] [--no-ken-burns]
 *
 * Flags:
 *   --subtitles      Generate and burn subtitles from narration markdown
 *   --no-ken-burns   Disable Ken Burns pan/zoom effects (static images)
 *
 * Timing model:
 *   - Intro card (00.png) shows for INTRO_DURATION seconds with silence
 *   - Audio starts when scene 01 appears
 *   - Scene transitions are synced to narration via timestamps.json
 *   - Crossfade dissolves (XFADE_DURATION) between scenes
 *   - Clip durations are extended by XFADE_DURATION to compensate for overlap
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Prefer ffmpeg-full (has drawtext/subtitles) over base ffmpeg
const FFMPEG_FULL = '/opt/homebrew/opt/ffmpeg-full/bin';
const FFMPEG_ENV = fs.existsSync(path.join(FFMPEG_FULL, 'ffmpeg'))
    ? { ...process.env, PATH: `${FFMPEG_FULL}:${process.env.PATH}` }
    : process.env;

// Parse arguments
const args = process.argv.slice(2);
const storyName = args.find(a => !a.startsWith('--'));
const enableSubtitles = args.includes('--subtitles');
const enableKenBurns = !args.includes('--no-ken-burns');

if (!storyName) {
    console.error('Usage: node create-video.js <story-name> [--subtitles] [--no-ken-burns]');
    console.error('Example: node create-video.js story-01 --subtitles');
    console.error('');
    console.error('Flags:');
    console.error('  --subtitles      Generate and burn subtitles from narration markdown');
    console.error('  --no-ken-burns   Disable Ken Burns pan/zoom effects (static images)');
    process.exit(1);
}

const scriptDir = __dirname;
const outputDir = path.join(scriptDir, 'output');
const audioFile = path.join(outputDir, `${storyName}-audio.mp3`);

if (!fs.existsSync(audioFile)) {
    console.error(`❌ Audio file not found: ${audioFile}`);
    console.error('Run generate-audio.sh first!');
    process.exit(1);
}

// ── Config ─────────────────────────────────────────────
const INTRO_DURATION = 4.0;   // seconds of silence for title card
const XFADE_DURATION = 1.5;   // seconds for dissolve transition
// ───────────────────────────────────────────────────────

function getAudioDuration(file) {
    const output = execSync(
        `ffprobe -i "${file}" -show_entries format=duration -v quiet -of csv="p=0"`
    ).toString();
    return parseFloat(output);
}

function findImages(storyName) {
    const assetsDir = path.join(scriptDir, '..', 'assets');
    const imageDir = path.join(assetsDir, 'images', storyName);
    if (!fs.existsSync(imageDir)) {
        console.error(`❌ Images folder not found: ${imageDir}`);
        process.exit(1);
    }
    return fs.readdirSync(imageDir)
        .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
        .sort()
        .map(f => path.join(imageDir, f));
}

// ── Gather inputs ──────────────────────────────────────
const audioDuration = getAudioDuration(audioFile);
const images = findImages(storyName);
const imageCount = images.length;
const imageFiles = images.map(p => path.basename(p));
const hasIntro = imageFiles[0] === '00.png';
const introDuration = hasIntro ? INTRO_DURATION : 0;
const totalVideoDuration = introDuration + audioDuration;

console.log(`🎬 Creating video for: ${storyName}`);
console.log('');
console.log(`📊 Video specs:`);
console.log(`   Audio: ${Math.floor(audioDuration / 60)}m ${Math.floor(audioDuration % 60)}s (${audioDuration.toFixed(2)}s)`);
console.log(`   Images: ${imageCount} (${hasIntro ? 'intro + ' : ''}${imageCount - (hasIntro ? 1 : 0)} scenes)`);
console.log(`   Total video: ${totalVideoDuration.toFixed(2)}s`);
console.log('');

// ── Calculate scene durations ──────────────────────────
// "Scene durations" = how long each image should be the PRIMARY visible image
// These map 1:1 to audio time (no crossfade compensation yet)

const assetsDir = path.join(scriptDir, '..', 'assets');
const imageDir = path.join(assetsDir, 'images', storyName);
const timestampsFile = path.join(imageDir, 'timestamps.json');
const hasTimestamps = fs.existsSync(timestampsFile);

let sceneDurations;  // Duration each image is the "active" scene (audio-relative)

if (hasTimestamps) {
    const timestamps = JSON.parse(fs.readFileSync(timestampsFile, 'utf8'));
    const scenes = timestamps.scenes;
    
    console.log(`🎯 Using narration-synced timestamps`);
    
    sceneDurations = images.map((img, i) => {
        if (hasIntro && i === 0) return introDuration;
        
        const sceneIdx = hasIntro ? i - 1 : i;
        if (sceneIdx >= scenes.length) return audioDuration / imageCount; // fallback
        
        // First scene starts from audio time 0 (includes any intro narration)
        const sceneStart = (sceneIdx === 0) ? 0 : scenes[sceneIdx].start;
        const sceneEnd = (sceneIdx + 1 < scenes.length)
            ? scenes[sceneIdx + 1].start
            : audioDuration;
        
        return sceneEnd - sceneStart;
    });
} else {
    const sceneCount = imageCount - (hasIntro ? 1 : 0);
    const equalDuration = audioDuration / Math.max(sceneCount, 1);
    
    console.log(`📐 Using equal distribution (no timestamps.json)`);
    
    sceneDurations = images.map((img, i) => {
        if (hasIntro && i === 0) return introDuration;
        return equalDuration;
    });
}

// Verify total scene duration matches expectations
const totalSceneDuration = sceneDurations.reduce((a, b) => a + b, 0);
console.log('');
console.log(`⏱️  Scene timing:`);
if (hasIntro) console.log(`   00.png (intro): ${sceneDurations[0].toFixed(2)}s (silent)`);
images.forEach((img, i) => {
    if (hasIntro && i === 0) return;
    const name = path.basename(img);
    const videoStart = introDuration + (hasTimestamps 
        ? ((hasIntro && i === 1) ? 0 : JSON.parse(fs.readFileSync(timestampsFile, 'utf8')).scenes[hasIntro ? i - 1 : i]?.start || 0)
        : sceneDurations.slice(hasIntro ? 1 : 0, i).reduce((a, b) => a + b, 0));
    console.log(`   ${name}: ${sceneDurations[i].toFixed(2)}s (video @${videoStart.toFixed(1)}s)`);
});
console.log(`   Scenes total: ${totalSceneDuration.toFixed(2)}s (expected: ${totalVideoDuration.toFixed(2)}s)`);

// ── Calculate clip durations (compensate for crossfade) ──
// Each crossfade overlap shortens the output by XFADE_DURATION.
// To keep transitions aligned with narration, extend each clip
// (except the last) by XFADE_DURATION.
const numTransitions = imageCount - 1;
const clipDurations = sceneDurations.map((d, i) => {
    if (i < imageCount - 1) return d + XFADE_DURATION;
    return d;
});

const totalClipDuration = clipDurations.reduce((a, b) => a + b, 0);
const expectedOutput = totalClipDuration - (numTransitions * XFADE_DURATION);
console.log('');
console.log(`🎞️  Clip durations (with crossfade compensation):`);
clipDurations.forEach((d, i) => {
    const name = path.basename(images[i]);
    const extra = (i < imageCount - 1) ? ` (+${XFADE_DURATION}s xfade)` : ' (last, no extra)';
    console.log(`   ${name}: ${d.toFixed(2)}s${extra}`);
});
console.log(`   Output after xfades: ${expectedOutput.toFixed(2)}s`);
console.log('');

// ── Subtitle Generation ────────────────────────────────
function parseNarrationMarkdown(narrationPath) {
    const content = fs.readFileSync(narrationPath, 'utf8');
    const scenes = [];
    
    // Match scene headers like [SCENE 01] or [INTRO] or [OUTRO]
    const scenePattern = /## \[(INTRO|OUTRO|SCENE \d+)\](?: — (.+))?\n\n([\s\S]*?)(?=\n## \[|$)/g;
    let match;
    
    while ((match = scenePattern.exec(content)) !== null) {
        const sceneType = match[1];
        const sceneTitle = match[2] || '';
        const text = match[3].trim();
        
        scenes.push({
            type: sceneType,
            title: sceneTitle,
            text: text
        });
    }
    
    return scenes;
}

function splitIntoSubtitles(text, maxWordsPerLine = 10, maxLines = 2) {
    // Split text into paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    const subtitles = [];
    
    for (const para of paragraphs) {
        const words = para.trim().split(/\s+/);
        const maxWordsPerSubtitle = maxWordsPerLine * maxLines;
        
        for (let i = 0; i < words.length; i += maxWordsPerSubtitle) {
            const chunk = words.slice(i, i + maxWordsPerSubtitle);
            
            // Split into lines
            const lines = [];
            for (let j = 0; j < chunk.length; j += maxWordsPerLine) {
                lines.push(chunk.slice(j, j + maxWordsPerLine).join(' '));
            }
            
            subtitles.push(lines.join('\n'));
        }
    }
    
    return subtitles;
}

function generateSRT(storyName, sceneDurations, introDuration) {
    const narrationPath = path.join(scriptDir, `${storyName}-narration.md`);
    
    if (!fs.existsSync(narrationPath)) {
        console.error(`❌ Narration file not found: ${narrationPath}`);
        console.error('   Subtitles require a narration markdown file.');
        return null;
    }
    
    console.log(`📝 Generating subtitles from narration...`);
    
    const scenes = parseNarrationMarkdown(narrationPath);
    const srtPath = path.join(outputDir, `${storyName}-subtitles.srt`);
    
    let srtContent = '';
    let subtitleIndex = 1;
    let currentTime = introDuration; // Start after intro card
    
    // Process each scene (skip INTRO and OUTRO, they don't have images)
    const imageScenes = scenes.filter(s => s.type.startsWith('SCENE'));
    
    imageScenes.forEach((scene, sceneIdx) => {
        // Determine scene duration from sceneDurations
        // Account for intro offset - scene 01 is at index 1 in the durations array if hasIntro
        const durationIdx = hasIntro ? sceneIdx + 1 : sceneIdx;
        const sceneDuration = sceneDurations[durationIdx];
        
        // Split scene text into subtitle chunks
        const subtitles = splitIntoSubtitles(scene.text);
        
        if (subtitles.length === 0) return;
        
        // Distribute subtitles evenly across the scene duration
        const timePerSubtitle = sceneDuration / subtitles.length;
        
        subtitles.forEach(subText => {
            const startTime = currentTime;
            const endTime = currentTime + timePerSubtitle;
            
            // Format timestamps as SRT time (HH:MM:SS,mmm)
            const formatTime = (seconds) => {
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                const ms = Math.floor((seconds % 1) * 1000);
                return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
            };
            
            srtContent += `${subtitleIndex}\n`;
            srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
            srtContent += `${subText}\n\n`;
            
            subtitleIndex++;
            currentTime = endTime;
        });
    });
    
    fs.writeFileSync(srtPath, srtContent, 'utf8');
    console.log(`   ✅ SRT file created: ${path.basename(srtPath)}`);
    console.log(`   ${subtitleIndex - 1} subtitles generated`);
    
    return srtPath;
}

// ── Render individual image clips ──────────────────────
function renderClips(images, durations, useKenBurns = true) {
    const tmpDir = path.join(outputDir, '.tmp-clips');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // Ken Burns patterns (subtle, gentle movement for kids content)
    const kenBurnsPatterns = [
        // Zoom in (center)
        { z: "zoom+0.0015", x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" },
        // Zoom out
        { z: "if(lte(on,1),1.08,max(1.0,1.08-on*0.0015))", x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" },
        // Pan right with gentle zoom
        { z: "zoom+0.001", x: "if(lte(on,1),iw/2-(iw/zoom/2),x+1.5)", y: "ih/2-(ih/zoom/2)" },
        // Pan left with gentle zoom
        { z: "zoom+0.001", x: "if(lte(on,1),iw/2-(iw/zoom/2),x-1.5)", y: "ih/2-(ih/zoom/2)" }
    ];

    const clipPaths = [];
    images.forEach((img, i) => {
        const clipPath = path.join(tmpDir, `clip-${String(i).padStart(2, '0')}.mp4`);
        clipPaths.push(clipPath);
        if (fs.existsSync(clipPath)) return;
        
        const dur = durations[i];
        const fps = 30;
        const totalFrames = Math.ceil(dur * fps);
        
        let videoFilter;
        if (useKenBurns) {
            // Alternate Ken Burns pattern per clip
            const pattern = kenBurnsPatterns[i % kenBurnsPatterns.length];
            videoFilter = `zoompan=z='${pattern.z}':x='${pattern.x}':y='${pattern.y}':d=${totalFrames}:s=1920x1080:fps=${fps},` +
                         `scale=1920:1080:force_original_aspect_ratio=decrease,` +
                         `pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1`;
        } else {
            // Static image (original behavior)
            videoFilter = `scale=1920:1080:force_original_aspect_ratio=decrease,` +
                         `pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}`;
        }
        
        const loopArg = useKenBurns ? '' : `-loop 1 -t ${dur} `;
        const cmd = `ffmpeg -y ${loopArg}-i "${img}" ` +
            `-vf "${videoFilter}" ` +
            `-c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "${clipPath}"`;
        
        execSync(cmd, { stdio: 'pipe', env: FFMPEG_ENV });
    });
    return { tmpDir, clipPaths };
}

console.log('📎 Rendering image clips...');
if (enableKenBurns) {
    console.log('   🎥 Ken Burns effect enabled (subtle pan/zoom)');
}
const { tmpDir, clipPaths } = renderClips(images, clipDurations, enableKenBurns);
console.log(`   ${clipPaths.length} clips ready`);
console.log('');

// ── Generate Subtitles (if requested) ──────────────────
let srtPath = null;
if (enableSubtitles) {
    srtPath = generateSRT(storyName, sceneDurations, introDuration);
    if (!srtPath) {
        console.error('⚠️  Subtitle generation failed, continuing without subtitles...');
    }
    console.log('');
}

// ── Combine clips with xfade + delayed audio ──────────
function createVideoWithXfade(clipPaths, clipDurations, audioFile, outputFile, srtPath = null) {
    const inputArgs = clipPaths.map(p => `-i "${p}"`).join(' ');
    
    // Build chained xfade filter
    // The offset for each transition = cumulative - XFADE_DURATION
    // With extended clip durations, this lands exactly on narration cue points
    let filter = '';
    let cumulative = clipDurations[0];
    let prevLabel = '0:v';
    
    console.log('   Xfade transitions:');
    for (let i = 1; i < clipPaths.length; i++) {
        const offset = Math.max(0, cumulative - XFADE_DURATION);
        const outLabel = (i === clipPaths.length - 1) ? 'xfaded' : `x${i}`;
        filter += `[${prevLabel}][${i}:v]xfade=transition=dissolve:duration=${XFADE_DURATION}:offset=${offset.toFixed(3)}[${outLabel}];`;
        
        const sceneName = path.basename(images[i]);
        console.log(`   ${sceneName} dissolve starts @${offset.toFixed(2)}s (fully visible @${(offset + XFADE_DURATION).toFixed(2)}s)`);
        
        cumulative += clipDurations[i] - XFADE_DURATION;
        prevLabel = outLabel;
    }
    
    // Add subtitles if provided
    if (srtPath && fs.existsSync(srtPath)) {
        // For ffmpeg filter, we need to escape the path:
        // Colons and backslashes need special escaping in filter strings
        const escapedSrtPath = srtPath
            .replace(/\\/g, '/')        // Convert backslashes to forward slashes
            .replace(/:/g, '\\\\:');     // Escape colons with double backslash
        
        // Subtitle style for kids content: white text, black outline, bottom-center, readable size
        // Use filename= parameter to avoid path issues with special characters
        const subtitleFilter = `subtitles=filename=${escapedSrtPath}:` +
            `force_style='FontName=Arial,FontSize=28,PrimaryColour=&H00FFFFFF,` +
            `OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=1,` +
            `Outline=2,Shadow=1,MarginV=60,Alignment=2'`;
        
        filter += `[xfaded]${subtitleFilter}[outv]`;
        console.log('   📝 Burning subtitles into video...');
    } else {
        // No subtitles, rename final xfade output
        filter = filter.replace('[xfaded]', '[outv]');
    }
    
    // Delay audio to start AFTER intro card
    const audioIdx = clipPaths.length;
    const audioDelayMs = Math.round(introDuration * 1000);
    if (audioDelayMs > 0) {
        filter += `;[${audioIdx}:a]adelay=${audioDelayMs}|${audioDelayMs}[outa]`;
    }
    
    const audioMap = audioDelayMs > 0 ? '-map "[outa]"' : `-map ${audioIdx}:a`;
    
    const cmd = `ffmpeg -y ${inputArgs} -i "${audioFile}" ` +
        `-filter_complex "${filter}" ` +
        `-map "[outv]" ${audioMap} ` +
        `-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p ` +
        `-c:a aac -b:a 192k "${outputFile}"`;
    
    execSync(cmd, { stdio: 'inherit', env: FFMPEG_ENV });
}

function cleanupClips(tmpDir) {
    try {
        fs.readdirSync(tmpDir).forEach(f => fs.unlinkSync(path.join(tmpDir, f)));
        fs.rmdirSync(tmpDir);
    } catch (e) { /* ignore */ }
}

// ── Create video ───────────────────────────────────────
console.log('🎬 Generating YouTube video...');
console.log('');

const outputFile = path.join(outputDir, `${storyName}-youtube.mp4`);
console.log(`🎥 Creating YouTube (16:9)...`);
try {
    createVideoWithXfade(clipPaths, clipDurations, audioFile, outputFile, srtPath);
    const size = (fs.statSync(outputFile).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ YouTube (16:9) complete! (${size} MB)`);
} catch (err) {
    console.error(`❌ Failed to create video`);
    throw err;
}

console.log('');
console.log('🎉 Video created successfully!');
console.log(`📁 ${outputFile}`);
console.log('');
console.log('🧹 Cleaning up temp clips...');
cleanupClips(tmpDir);
