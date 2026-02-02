#!/usr/bin/env node
/**
 * Scene-aware audio generator for The Hatch Adventures
 * 
 * Reads a narration script with [SCENE XX] markers, generates audio per scene
 * via OpenAI TTS, concatenates them, and auto-generates timestamps.json.
 *
 * Usage: node generate-audio-scenes.js <narration.md> [--voice nova] [--model tts-1]
 *
 * Input:  Narration markdown with ## [SCENE 01], ## [SCENE 02], etc.
 * Output: 
 *   - output/<story>-audio.mp3         (concatenated full audio)
 *   - output/<story>-scene-chunks/     (individual scene audio files)
 *   - assets/images/<story>/timestamps.json  (auto-generated timing)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// ── Args ───────────────────────────────────────────────
const mdPathArg = process.argv[2];
if (!mdPathArg) {
    console.error('Usage: node generate-audio-scenes.js <narration.md> [--voice nova] [--model tts-1]');
    console.error('Example: node generate-audio-scenes.js story-01-dinosaur-garden-narration.md');
    process.exit(1);
}

function arg(name, def = null) {
    const i = process.argv.indexOf(name);
    return (i !== -1 && process.argv[i + 1]) ? process.argv[i + 1] : def;
}

const voice = arg('--voice', 'nova');
const model = arg('--model', 'tts-1');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not set');
    process.exit(1);
}

// ── Paths ──────────────────────────────────────────────
const scriptDir = __dirname;
const projectRoot = path.join(scriptDir, '..');
const mdFullPath = path.isAbsolute(mdPathArg) ? mdPathArg : path.join(scriptDir, mdPathArg);

const content = fs.readFileSync(mdFullPath, 'utf8');

// Extract story name from narration filename
// "story-01-dinosaur-garden-narration.md" → "story-01-dinosaur-garden"
const baseName = path.basename(mdFullPath, '.md').replace(/-narration$/, '');

const outDir = path.join(scriptDir, 'output');
const chunkDir = path.join(outDir, `${baseName}-scene-chunks`);
const outFile = path.join(outDir, `${baseName}-audio.mp3`);
const assetsImageDir = path.join(projectRoot, 'assets', 'images', baseName);

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(chunkDir, { recursive: true });

// ── Parse narration into scenes ────────────────────────
function parseScenes(markdown) {
    const scenes = [];
    // Match ## [INTRO], ## [SCENE 01] — Name, ## [OUTRO]
    const regex = /^## \[([^\]]+)\](?:\s*—\s*(.+))?$/gm;
    let match;
    const markers = [];
    
    while ((match = regex.exec(markdown)) !== null) {
        markers.push({
            tag: match[1].trim(),
            name: (match[2] || match[1]).trim(),
            index: match.index,
            headerEnd: match.index + match[0].length
        });
    }
    
    for (let i = 0; i < markers.length; i++) {
        const start = markers[i].headerEnd;
        const end = (i + 1 < markers.length) ? markers[i + 1].index : markdown.length;
        const text = markdown.substring(start, end).trim();
        
        if (!text) continue;
        
        scenes.push({
            tag: markers[i].tag,
            name: markers[i].name,
            text: text
        });
    }
    
    return scenes;
}

const scenes = parseScenes(content);
console.log(`🎬 Scene-aware audio generator`);
console.log(`📖 Story: ${baseName}`);
console.log(`🎤 Voice: ${voice} | Model: ${model}`);
console.log(`🧩 Scenes found: ${scenes.length}`);
console.log('');

scenes.forEach((s, i) => {
    console.log(`   ${s.tag}: "${s.name}" (${s.text.length} chars)`);
});
console.log('');

// ── TTS generation ─────────────────────────────────────
const MAX_CHARS = 3900;

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

function getAudioDuration(file) {
    const output = execSync(
        `ffprobe -i "${file}" -show_entries format=duration -v quiet -of csv="p=0"`
    ).toString();
    return parseFloat(output);
}

(async () => {
    const chunkFiles = [];
    const sceneDurations = [];
    
    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const filename = `${String(i).padStart(2, '0')}-${scene.tag.replace(/\s+/g, '-').toLowerCase()}.mp3`;
        const filepath = path.join(chunkDir, filename);
        chunkFiles.push(filepath);
        
        console.log(`🎙️  Generating: [${scene.tag}] "${scene.name}" (${scene.text.length} chars)`);
        
        // Handle scenes longer than TTS character limit
        if (scene.text.length > MAX_CHARS) {
            // Split on paragraph boundaries
            const paras = scene.text.split(/\n\n+/);
            const subChunks = [];
            let cur = '';
            for (const p of paras) {
                if ((cur + '\n\n' + p).length > MAX_CHARS && cur) {
                    subChunks.push(cur.trim());
                    cur = p;
                } else {
                    cur = cur ? cur + '\n\n' + p : p;
                }
            }
            if (cur.trim()) subChunks.push(cur.trim());
            
            // Generate sub-chunks and concatenate
            const subFiles = [];
            for (let j = 0; j < subChunks.length; j++) {
                const subFile = path.join(chunkDir, `${String(i).padStart(2, '0')}-sub-${j}.mp3`);
                await ttsToFile(subChunks[j], subFile);
                subFiles.push(subFile);
            }
            
            // Concat sub-chunks into scene file
            const listFile = path.join(chunkDir, `${String(i).padStart(2, '0')}-concat.txt`);
            fs.writeFileSync(listFile, subFiles.map(f => `file '${f}'`).join('\n') + '\n');
            execSync(`ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${filepath}" -y`, { stdio: 'ignore' });
            
            // Clean up sub-chunks
            subFiles.forEach(f => { try { fs.unlinkSync(f); } catch(e) {} });
            try { fs.unlinkSync(listFile); } catch(e) {}
        } else {
            await ttsToFile(scene.text, filepath);
        }
        
        const dur = getAudioDuration(filepath);
        sceneDurations.push(dur);
        console.log(`   ✅ ${dur.toFixed(2)}s`);
    }
    
    // ── Concatenate all scenes ──────────────────────────
    console.log('');
    console.log('🧵 Concatenating all scenes...');
    const concatList = path.join(chunkDir, 'concat.txt');
    fs.writeFileSync(concatList, chunkFiles.map(f => `file '${f}'`).join('\n') + '\n');
    execSync(`ffmpeg -f concat -safe 0 -i "${concatList}" -c copy "${outFile}" -y`, { stdio: 'ignore' });
    
    const totalDuration = getAudioDuration(outFile);
    const sizeMb = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Audio: ${outFile} (${sizeMb} MB, ${totalDuration.toFixed(2)}s)`);
    
    // ── Generate timestamps.json ───────────────────────
    console.log('');
    console.log('📐 Generating timestamps.json...');
    
    // Build timestamps from cumulative durations
    // INTRO + SCENE 01 are combined into the first scene image (01.png)
    // OUTRO is appended to the last scene image (08.png)
    const timestamps = { story: baseName, scenes: [] };
    let cumulative = 0;
    let introIdx = -1;
    let outroIdx = -1;
    
    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        
        if (scene.tag === 'INTRO') {
            introIdx = i;
            // Intro audio plays during scene 01 — don't create a separate timestamp
            cumulative += sceneDurations[i];
            continue;
        }
        
        if (scene.tag === 'OUTRO') {
            outroIdx = i;
            // Outro audio plays during the last scene — don't create a separate timestamp
            continue;
        }
        
        // Extract scene number from tag like "SCENE 01"
        const sceneMatch = scene.tag.match(/SCENE\s*(\d+)/i);
        if (!sceneMatch) {
            cumulative += sceneDurations[i];
            continue;
        }
        
        const sceneNum = parseInt(sceneMatch[1]);
        const imageFile = String(sceneNum).padStart(2, '0') + '.png';
        
        // First scene starts at 0 (includes intro audio)
        const startTime = (sceneNum === 1) ? 0 : cumulative;
        
        timestamps.scenes.push({
            image: imageFile,
            start: parseFloat(startTime.toFixed(3)),
            duration: parseFloat(sceneDurations[i].toFixed(3)),
            cue: scene.name
        });
        
        cumulative += sceneDurations[i];
    }
    
    // Add outro duration to last scene
    if (outroIdx >= 0 && timestamps.scenes.length > 0) {
        const lastScene = timestamps.scenes[timestamps.scenes.length - 1];
        lastScene.duration += sceneDurations[outroIdx];
        console.log(`   Outro (${sceneDurations[outroIdx].toFixed(2)}s) added to last scene`);
    }
    
    // Save timestamps
    fs.mkdirSync(assetsImageDir, { recursive: true });
    const tsFile = path.join(assetsImageDir, 'timestamps.json');
    fs.writeFileSync(tsFile, JSON.stringify(timestamps, null, 2) + '\n');
    console.log(`✅ Timestamps: ${tsFile}`);
    
    // ── Summary ────────────────────────────────────────
    console.log('');
    console.log('📊 Scene timing summary:');
    console.log('┌──────────┬──────────┬──────────┬─────────────────────────────┐');
    console.log('│ Image    │ Start    │ Duration │ Scene                       │');
    console.log('├──────────┼──────────┼──────────┼─────────────────────────────┤');
    for (const ts of timestamps.scenes) {
        const mins = Math.floor(ts.start / 60);
        const secs = (ts.start % 60).toFixed(1).padStart(5, ' ');
        const dur = ts.duration.toFixed(1).padStart(6, ' ') + 's';
        const cue = ts.cue.substring(0, 27).padEnd(27);
        console.log(`│ ${ts.image.padEnd(8)} │ ${mins}:${secs} │ ${dur} │ ${cue} │`);
    }
    console.log('└──────────┴──────────┴──────────┴─────────────────────────────┘');
    console.log(`   Total audio: ${totalDuration.toFixed(2)}s`);
    
    console.log('');
    console.log('🎉 Done! Next steps:');
    console.log(`   1. Add title overlay: ./prepare-intro-cards.sh ${baseName} "Episode Title"`);
    console.log(`   2. Create video:      node create-video.js ${baseName}`);
})();
