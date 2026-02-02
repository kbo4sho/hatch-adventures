#!/usr/bin/env node
/**
 * Create video from images + audio for The Hatch Adventures
 * Usage: node create-video.js story-01
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

const storyName = process.argv[2];
if (!storyName) {
    console.error('Usage: node create-video.js <story-name>');
    console.error('Example: node create-video.js story-01');
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

// ── Render individual image clips ──────────────────────
function renderClips(images, durations) {
    const tmpDir = path.join(outputDir, '.tmp-clips');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const clipPaths = [];
    images.forEach((img, i) => {
        const clipPath = path.join(tmpDir, `clip-${String(i).padStart(2, '0')}.mp4`);
        clipPaths.push(clipPath);
        if (fs.existsSync(clipPath)) return;
        const dur = durations[i];
        const cmd = `ffmpeg -y -loop 1 -t ${dur} -i "${img}" ` +
            `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30" ` +
            `-c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "${clipPath}"`;
        execSync(cmd, { stdio: 'pipe' });
    });
    return { tmpDir, clipPaths };
}

console.log('📎 Rendering image clips...');
const { tmpDir, clipPaths } = renderClips(images, clipDurations);
console.log(`   ${clipPaths.length} clips ready`);
console.log('');

// ── Combine clips with xfade + delayed audio ──────────
function createVideoWithXfade(clipPaths, clipDurations, audioFile, outputFile) {
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
        const outLabel = (i === clipPaths.length - 1) ? 'outv' : `x${i}`;
        filter += `[${prevLabel}][${i}:v]xfade=transition=dissolve:duration=${XFADE_DURATION}:offset=${offset.toFixed(3)}[${outLabel}];`;
        
        const sceneName = path.basename(images[i]);
        console.log(`   ${sceneName} dissolve starts @${offset.toFixed(2)}s (fully visible @${(offset + XFADE_DURATION).toFixed(2)}s)`);
        
        cumulative += clipDurations[i] - XFADE_DURATION;
        prevLabel = outLabel;
    }
    
    // Delay audio to start AFTER intro card
    const audioIdx = clipPaths.length;
    const audioDelayMs = Math.round(introDuration * 1000);
    if (audioDelayMs > 0) {
        filter += `[${audioIdx}:a]adelay=${audioDelayMs}|${audioDelayMs}[outa]`;
    } else {
        filter = filter.replace(/;$/, '');
    }
    
    const audioMap = audioDelayMs > 0 ? '-map "[outa]"' : `-map ${audioIdx}:a`;
    
    const cmd = `ffmpeg -y ${inputArgs} -i "${audioFile}" ` +
        `-filter_complex "${filter}" ` +
        `-map "[outv]" ${audioMap} ` +
        `-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p ` +
        `-c:a aac -b:a 192k "${outputFile}"`;
    
    execSync(cmd, { stdio: 'inherit' });
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
    createVideoWithXfade(clipPaths, clipDurations, audioFile, outputFile);
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
