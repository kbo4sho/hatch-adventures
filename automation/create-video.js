#!/usr/bin/env node
/**
 * Create video from images + audio for The Hatch Adventures
 * Usage: node create-video.js story-01
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

// Get audio duration
function getAudioDuration(file) {
    const output = execSync(`ffprobe -i "${file}" -show_entries format=duration -v quiet -of csv="p=0"`).toString();
    return parseFloat(output);
}

// Find all images for this story
function findImages(storyName) {
    const assetsDir = path.join(scriptDir, '..', 'assets');
    const imageDir = path.join(assetsDir, 'images', storyName);
    
    if (!fs.existsSync(imageDir)) {
        console.error(`❌ Images folder not found: ${imageDir}`);
        console.error('Please create the folder and add images first!');
        process.exit(1);
    }
    
    const files = fs.readdirSync(imageDir)
        .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
        .sort();
    
    return files.map(f => path.join(imageDir, f));
}

console.log(`🎬 Creating video for: ${storyName}`);
console.log('');

const audioDuration = getAudioDuration(audioFile);
const images = findImages(storyName);
const imageCount = images.length;

console.log(`📊 Video specs:`);
console.log(`   Audio: ${Math.floor(audioDuration / 60)}m ${Math.floor(audioDuration % 60)}s`);
console.log(`   Images: ${imageCount} scenes`);
console.log('');

// Detect intro/outro cards (00.png and highest numbered image)
const imageFiles = images.map(p => path.basename(p));
const hasIntro = imageFiles[0] === '00.png';
const hasOutro = imageFiles.length >= 3; // Assume last image is outro if we have intro + scenes + outro

const INTRO_DURATION = 4.0;  // seconds
const OUTRO_DURATION = 4.0;  // seconds

// Calculate duration per scene image
let introDuration = hasIntro ? INTRO_DURATION : 0;
let outroDuration = hasOutro ? OUTRO_DURATION : 0;
let sceneCount = imageCount - (hasIntro ? 1 : 0) - (hasOutro ? 1 : 0);
let sceneDuration = (audioDuration - introDuration - outroDuration) / Math.max(sceneCount, 1);

// Build duration array for each image
const imageDurations = images.map((img, i) => {
    if (hasIntro && i === 0) return introDuration;
    if (hasOutro && i === imageCount - 1) return outroDuration;
    return sceneDuration;
});

console.log(`⏱️  Timing:`);
if (hasIntro) console.log(`   Intro card: ${introDuration}s`);
console.log(`   ${sceneCount} scene(s): ${sceneDuration.toFixed(2)}s each`);
if (hasOutro) console.log(`   Outro card: ${outroDuration}s`);
console.log('');

// Smooth crossfade dissolve between scenes
const XFADE_DURATION = 1.5; // seconds for dissolve transition

// Two-pass approach: render individual clips first, then chain xfades
// This avoids ffmpeg choking on large filter graphs with many inputs

function renderClips(images, durations) {
    const tmpDir = path.join(outputDir, '.tmp-clips');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const clipPaths = [];
    images.forEach((img, i) => {
        const clipPath = path.join(tmpDir, `clip-${String(i).padStart(2, '0')}.mp4`);
        clipPaths.push(clipPath);
        if (fs.existsSync(clipPath)) return; // reuse if already rendered
        const dur = durations[i];
        const cmd = `ffmpeg -y -loop 1 -t ${dur} -i "${img}" ` +
            `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30" ` +
            `-c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "${clipPath}"`;
        execSync(cmd, { stdio: 'pipe' });
    });
    return { tmpDir, clipPaths };
}

function createVideoWithXfade(clipPaths, durations, audioFile, outputFile) {
    // Build chained xfade filter
    const inputArgs = clipPaths.map(p => `-i "${p}"`).join(' ');
    
    let filter = '';
    let cumulative = durations[0];
    let prevLabel = '0:v';
    
    for (let i = 1; i < clipPaths.length; i++) {
        const offset = Math.max(0, cumulative - XFADE_DURATION).toFixed(3);
        const outLabel = (i === clipPaths.length - 1) ? 'outv' : `x${i}`;
        filter += `[${prevLabel}][${i}:v]xfade=transition=dissolve:duration=${XFADE_DURATION}:offset=${offset}[${outLabel}];`;
        cumulative += durations[i] - XFADE_DURATION;
        prevLabel = outLabel;
    }
    
    // Remove trailing semicolon
    filter = filter.replace(/;$/, '');
    
    const audioIdx = clipPaths.length;
    const cmd = `ffmpeg -y ${inputArgs} -i "${audioFile}" ` +
        `-filter_complex "${filter}" ` +
        `-map "[outv]" -map ${audioIdx}:a ` +
        `-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p ` +
        `-c:a aac -b:a 192k -shortest "${outputFile}"`;
    
    execSync(cmd, { stdio: 'inherit' });
}

function cleanupClips(tmpDir) {
    try {
        fs.readdirSync(tmpDir).forEach(f => fs.unlinkSync(path.join(tmpDir, f)));
        fs.rmdirSync(tmpDir);
    } catch (e) { /* ignore cleanup errors */ }
}

// Render individual image clips
console.log('📎 Rendering image clips...');
const { tmpDir, clipPaths } = renderClips(images, imageDurations);
console.log(`   ${clipPaths.length} clips ready`);
console.log('');

function createVideo(outputFile, width, height, format) {
    console.log(`🎥 Creating ${format}...`);
    try {
        createVideoWithXfade(clipPaths, imageDurations, audioFile, outputFile);
        const size = (fs.statSync(outputFile).size / (1024 * 1024)).toFixed(2);
        console.log(`✅ ${format} complete! (${size} MB)`);
    } catch (err) {
        console.error(`❌ Failed to create ${format}`);
        throw err;
    }
}

// Create all platform versions
console.log('🎬 Generating platform-specific videos...');
console.log('');

const outputs = [
    { file: `${storyName}-youtube.mp4`, width: 1920, height: 1080, format: 'YouTube (16:9)' },
    { file: `${storyName}-tiktok.mp4`, width: 1080, height: 1920, format: 'TikTok (9:16)' },
    { file: `${storyName}-instagram-reel.mp4`, width: 1080, height: 1920, format: 'Instagram Reel (9:16)' },
    { file: `${storyName}-instagram-feed.mp4`, width: 1080, height: 1080, format: 'Instagram Feed (1:1)' }
];

outputs.forEach(({ file, width, height, format }) => {
    createVideo(path.join(outputDir, file), width, height, format);
});

console.log('');
console.log('🎉 All videos created successfully!');
console.log('');
console.log('📁 Output files:');
outputs.forEach(({ file }) => {
    console.log(`   ${path.join(outputDir, file)}`);
});
console.log('');
console.log('🧹 Cleaning up temp clips...');
cleanupClips(tmpDir);
console.log('');
console.log('Next: Upload to platforms or run upload scripts');
