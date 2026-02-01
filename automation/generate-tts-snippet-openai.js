#!/usr/bin/env node
/**
 * Generate a short MP3 using OpenAI TTS from literal text.
 *
 * Usage:
 *   node generate-tts-snippet-openai.js --out output/foo.mp3 --voice nova --text "Hello"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

const outRel = arg('--out');
const text = arg('--text');
const voice = arg('--voice') || 'nova';
const model = arg('--model') || 'tts-1';

if (!outRel || !text) {
  console.error('Usage: node generate-tts-snippet-openai.js --out <file.mp3> --text <text> [--voice nova] [--model tts-1]');
  process.exit(1);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not set');
  process.exit(1);
}

const outPath = path.isAbsolute(outRel) ? outRel : path.join(__dirname, outRel);
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const payload = JSON.stringify({ model, voice, input: text });

const options = {
  hostname: 'api.openai.com',
  path: '/v1/audio/speech',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log(`🎙️ OpenAI TTS → ${outPath}`);

const req = https.request(options, (res) => {
  if (res.statusCode !== 200) {
    console.error(`❌ HTTP ${res.statusCode}`);
    res.setEncoding('utf8');
    let err = '';
    res.on('data', (c) => (err += c));
    res.on('end', () => {
      console.error(err);
      process.exit(1);
    });
    return;
  }

  const ws = fs.createWriteStream(outPath);
  res.pipe(ws);
  ws.on('finish', () => {
    const size = (fs.statSync(outPath).size / 1024).toFixed(1);
    console.log(`✅ done (${size} KB)`);
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
  process.exit(1);
});

req.write(payload);
req.end();
