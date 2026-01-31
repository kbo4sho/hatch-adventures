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

// Calculate duration per image
const durationPerImage = audioDuration / imageCount;

// Create ffmpeg filter for slideshow with crossfades
function createSlideshowFilter(images, durationPerImage) {
    const fadeDuration = 0.5;
    let filter = '';
    
    // Input section: load all images
    images.forEach((img, i) => {
        filter += `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,`
        filter += `pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,`
        filter += `fade=t=in:st=0:d=${fadeDuration},`
        filter += `fade=t=out:st=${durationPerImage - fadeDuration}:d=${fadeDuration}[v${i}];`;
    });
    
    // Concat all clips
    filter += images.map((_, i) => `[v${i}]`).join('');
    filter += `concat=n=${imageCount}:v=1:a=0[outv]`;
    
    return filter;
}

const filter = createSlideshowFilter(images, durationPerImage);

// Build ffmpeg command
const inputArgs = images.map(img => `-loop 1 -t ${durationPerImage} -i "${img}"`).join(' ');

function createVideo(outputFile, width, height, format) {
    const scale = width !== 1920 || height !== 1080 
        ? `,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`
        : '';
    
    const cmd = `ffmpeg ${inputArgs} -i "${audioFile}" \
        -filter_complex "${filter}" \
        -map "[outv]" -map ${imageCount}:a \
        -c:v libx264 -preset medium -crf 23 \
        -c:a aac -b:a 192k \
        -shortest -y "${outputFile}"`;
    
    console.log(`🎥 Creating ${format}...`);
    try {
        execSync(cmd, { stdio: 'inherit' });
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
console.log('Next: Upload to platforms or run upload scripts');
