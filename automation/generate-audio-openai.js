#!/usr/bin/env node
/**
 * Generate audio using OpenAI TTS API
 * Usage: node generate-audio-openai.js story-01-dinosaur-garden.md
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const storyFile = process.argv[2];
if (!storyFile) {
    console.error('Usage: node generate-audio-openai.js <story-file.md>');
    process.exit(1);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY not set');
    process.exit(1);
}

// Read and clean story text
const projectRoot = path.join(__dirname, '..');
const fullPath = path.join(projectRoot, storyFile);
const content = fs.readFileSync(fullPath, 'utf8');

// Remove markdown formatting
// NOTE: Only strip YAML frontmatter if it is at the very top of the file.
const storyText = content
    .replace(/^---\n[\s\S]*?\n---\n/, '') // Remove YAML frontmatter (top-of-file only)
    .replace(/^#+\s+.*/gm, '') // Remove headers
    .replace(/^\*\*.*/gm, '') // Remove bold lines
    .replace(/\*/g, '') // Remove asterisks
    .replace(/_/g, '') // Remove underscores
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();

console.log('📖 Generating OpenAI TTS audio...');
console.log(`📝 Text length: ${storyText.length} characters`);

const payload = JSON.stringify({
    model: 'tts-1',
    voice: 'nova', // Warm, friendly female voice
    input: storyText
});

const options = {
    hostname: 'api.openai.com',
    path: '/v1/audio/speech',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

const outputDir = path.join(__dirname, 'output');
const storyName = path.basename(storyFile, '.md');
const outputFile = path.join(outputDir, `${storyName}-audio.mp3`);

fs.mkdirSync(outputDir, { recursive: true });

const req = https.request(options, (res) => {
    if (res.statusCode !== 200) {
        console.error(`❌ Error: HTTP ${res.statusCode}`);
        res.setEncoding('utf8');
        let errorData = '';
        res.on('data', chunk => errorData += chunk);
        res.on('end', () => {
            console.error(errorData);
            process.exit(1);
        });
        return;
    }

    const writeStream = fs.createWriteStream(outputFile);
    res.pipe(writeStream);

    writeStream.on('finish', () => {
        const stats = fs.statSync(outputFile);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log('');
        console.log('✅ Audio generated successfully!');
        console.log(`📁 File: ${outputFile}`);
        console.log(`💾 Size: ${sizeMB} MB`);
        console.log('');
        console.log('Next: Create video with:');
        console.log(`  node create-video.js ${storyName}`);
    });
});

req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
    process.exit(1);
});

req.write(payload);
req.end();
