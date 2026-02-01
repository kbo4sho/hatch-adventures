#!/usr/bin/env node
/**
 * Chunked OpenAI TTS generator (handles >4096 chars by splitting + concatenating).
 * Usage: node generate-audio-openai-chunked.js <markdownPath> [--voice nova] [--model tts-1]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const mdPathArg = process.argv[2];
if (!mdPathArg) {
  console.error('Usage: node generate-audio-openai-chunked.js <markdownPath> [--voice nova] [--model tts-1]');
  process.exit(1);
}

function arg(name, def = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return def;
  return process.argv[i + 1] ?? def;
}

const voice = arg('--voice', 'nova');
const model = arg('--model', 'tts-1');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not set');
  process.exit(1);
}

const scriptDir = __dirname;
const projectRoot = path.join(scriptDir, '..');
const mdFullPath = path.isAbsolute(mdPathArg) ? mdPathArg : path.join(projectRoot, mdPathArg);

const content = fs.readFileSync(mdFullPath, 'utf8');

// Strip markdown (only strip YAML frontmatter if at top)
const storyText = content
  .replace(/^---\n[\s\S]*?\n---\n/, '')
  .replace(/^#+\s+.*/gm, '')
  .replace(/^\*\*.*/gm, '')
  .replace(/\*/g, '')
  .replace(/_/g, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

console.log('📖 Chunked OpenAI TTS');
console.log(`📝 Text length: ${storyText.length} chars`);

const outDir = path.join(scriptDir, 'output');
fs.mkdirSync(outDir, { recursive: true });

const baseName = path.basename(mdFullPath, path.extname(mdFullPath));
const outFile = path.join(outDir, `${baseName}-audio.mp3`);
const tmpDir = path.join(outDir, `${baseName}-chunks`);
fs.mkdirSync(tmpDir, { recursive: true });

const MAX = 3900; // keep margin under 4096

function splitIntoChunks(text) {
  // Split on paragraph boundaries first, then sentences if needed.
  const paras = text.split(/\n\n+/);
  const chunks = [];
  let cur = '';

  function pushCur() {
    if (cur.trim()) chunks.push(cur.trim());
    cur = '';
  }

  for (const p of paras) {
    const candidate = cur ? cur + '\n\n' + p : p;
    if (candidate.length <= MAX) {
      cur = candidate;
      continue;
    }

    // If current has content, push it first
    if (cur) pushCur();

    // If paragraph itself is too big, split by sentences.
    if (p.length > MAX) {
      const sentences = p.split(/(?<=[.!?])\s+/);
      let sCur = '';
      for (const s of sentences) {
        const sCand = sCur ? sCur + ' ' + s : s;
        if (sCand.length <= MAX) {
          sCur = sCand;
        } else {
          if (sCur) chunks.push(sCur.trim());
          sCur = s;
        }
      }
      if (sCur) chunks.push(sCur.trim());
    } else {
      cur = p;
    }
  }

  pushCur();
  return chunks;
}

function ttsToFile(text, filePath) {
  return new Promise((resolve, reject) => {
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

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        res.setEncoding('utf8');
        let err = '';
        res.on('data', (c) => (err += c));
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${err}`)));
        return;
      }
      const ws = fs.createWriteStream(filePath);
      res.pipe(ws);
      ws.on('finish', resolve);
      ws.on('error', reject);
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  const chunks = splitIntoChunks(storyText);
  console.log(`🧩 Chunks: ${chunks.length}`);

  const chunkFiles = [];
  for (let i = 0; i < chunks.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    const f = path.join(tmpDir, `${n}.mp3`);
    chunkFiles.push(f);
    console.log(`🎙️ Generating chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
    await ttsToFile(chunks[i], f);
  }

  // Build concat list
  const listPath = path.join(tmpDir, 'concat.txt');
  fs.writeFileSync(listPath, chunkFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n') + '\n', 'utf8');

  // Concatenate
  console.log('🧵 Stitching chunks…');
  execSync(`ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outFile}" -y`, { stdio: 'ignore' });

  const sizeMb = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Done: ${outFile} (${sizeMb} MB)`);
})();
