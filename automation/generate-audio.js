#!/usr/bin/env node
/**
 * TTS Audio Producer (Configurable)
 * Generate scene-based narrated audio from markdown scripts
 * 
 * Usage: node generate-audio.js <script.md> [options]
 * Options:
 *   --engine <name>     TTS engine: apple (default, free) or openai (paid)
 *   --voice <name>      Voice name (engine-specific)
 *   --rate <wpm>        Speaking rate for Apple TTS (default: 175)
 *   --model <name>      OpenAI model: tts-1 or tts-1-hd (default: tts-1)
 *   --output <dir>      Output directory (default: ./output)
 *   --timestamps-dir    Where to write timestamps.json
 * 
 * Apple voices (free): Samantha, Karen, Daniel, Moira, Tessa
 *   List all: say -v '?'
 * 
 * OpenAI voices (~$0.05/story): nova, alloy, echo, fable, onyx, shimmer
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// ── Args ───────────────────────────────────────────────
const mdPathArg = process.argv[2];
if (!mdPathArg || mdPathArg.startsWith('-')) {
    console.error('Usage: node generate-audio.js <script.md> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --engine <name>   apple (default, free) or openai (paid)');
    console.error('  --voice <name>    Voice (apple: Samantha, openai: nova)');
    console.error('  --rate <wpm>      Apple speaking rate (default: 175)');
    console.error('  --model <name>    OpenAI model (default: tts-1)');
    console.error('  --output <dir>    Output directory');
    console.error('  --timestamps-dir  Where to write timestamps.json');
    console.error('');
    console.error('Examples:');
    console.error('  node generate-audio.js script.md                    # Free Apple TTS');
    console.error('  node generate-audio.js script.md --engine openai    # Paid OpenAI TTS');
    console.error('  node generate-audio.js script.md --voice Daniel     # British male');
    process.exit(1);
}

function arg(name, def = null) {
    const i = process.argv.indexOf(name);
    return (i !== -1 && process.argv[i + 1]) ? process.argv[i + 1] : def;
}

const engine = arg('--engine', 'apple').toLowerCase();
const rate = parseInt(arg('--rate', '175'));
const model = arg('--model', 'tts-1');
const outputArg = arg('--output', './output');
const timestampsDir = arg('--timestamps-dir', null);

// Default voices per engine
const defaultVoices = { apple: 'Samantha', openai: 'nova' };
const voice = arg('--voice', defaultVoices[engine] || 'Samantha');

// Validate engine
if (!['apple', 'openai'].includes(engine)) {
    console.error(`❌ Unknown engine: ${engine}`);
    console.error('   Available: apple, openai');
    process.exit(1);
}

// Check OpenAI key if needed
const apiKey = process.env.OPENAI_API_KEY;
if (engine === 'openai' && !apiKey) {
    console.error('❌ OPENAI_API_KEY not set (required for openai engine)');
    console.error('   Use --engine apple for free TTS');
    process.exit(1);
}

// ── Paths ──────────────────────────────────────────────
const mdFullPath = path.isAbsolute(mdPathArg) ? mdPathArg : path.resolve(mdPathArg);
const content = fs.readFileSync(mdFullPath, 'utf8');

const baseName = path.basename(mdFullPath, '.md').replace(/-narration$/, '');

const outDir = path.isAbsolute(outputArg) ? outputArg : path.resolve(outputArg);
const chunkDir = path.join(outDir, `${baseName}-scene-chunks`);
const outFile = path.join(outDir, `${baseName}-audio.mp3`);
const tsDir = timestampsDir ? (path.isAbsolute(timestampsDir) ? timestampsDir : path.resolve(timestampsDir)) : outDir;

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(chunkDir, { recursive: true });
fs.mkdirSync(tsDir, { recursive: true });

// ── Parse narration into scenes ────────────────────────
function parseScenes(markdown) {
    const scenes = [];
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
        let text = markdown.substring(start, end).trim();
        
        // Clean markdown formatting
        text = text
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            .replace(/^[-*]\s+/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        
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
const engineLabel = engine === 'apple' ? '🍎 Apple TTS (FREE)' : '🤖 OpenAI TTS (PAID)';
console.log(`${engineLabel}`);
console.log(`📖 Script: ${baseName}`);
console.log(`🎤 Voice: ${voice}${engine === 'apple' ? ` | Rate: ${rate} wpm` : ` | Model: ${model}`}`);
console.log(`🧩 Scenes: ${scenes.length}`);
console.log('');

scenes.forEach((s) => {
    console.log(`   [${s.tag}] "${s.name}" (${s.text.length} chars)`);
});
console.log('');

// ── TTS Engines ────────────────────────────────────────

// Apple TTS using macOS 'say'
function appleToFile(text, filePath) {
    const aiffPath = filePath.replace(/\.mp3$/, '.aiff');
    const tmpTextFile = path.join(chunkDir, `tmp-${Date.now()}.txt`);
    fs.writeFileSync(tmpTextFile, text);
    
    try {
        execSync(`say -v "${voice}" -r ${rate} -o "${aiffPath}" -f "${tmpTextFile}"`, { 
            stdio: 'pipe', timeout: 120000 
        });
        execSync(`ffmpeg -i "${aiffPath}" -codec:a libmp3lame -qscale:a 2 "${filePath}" -y`, { 
            stdio: 'pipe' 
        });
        fs.unlinkSync(aiffPath);
        fs.unlinkSync(tmpTextFile);
    } catch (err) {
        try { fs.unlinkSync(tmpTextFile); } catch(e) {}
        try { fs.unlinkSync(aiffPath); } catch(e) {}
        throw err;
    }
}

// OpenAI TTS
function openaiToFile(text, filePath) {
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

// Unified TTS function
async function ttsToFile(text, filePath) {
    if (engine === 'apple') {
        appleToFile(text, filePath);
    } else {
        await openaiToFile(text, filePath);
    }
}

function getAudioDuration(file) {
    const output = execSync(
        `ffprobe -i "${file}" -show_entries format=duration -v quiet -of csv="p=0"`
    ).toString();
    return parseFloat(output);
}

// ── Main ───────────────────────────────────────────────
const MAX_CHARS = 3900; // OpenAI limit

(async () => {
    const chunkFiles = [];
    const sceneDurations = [];
    
    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const filename = `${String(i).padStart(2, '0')}-${scene.tag.replace(/\s+/g, '-').toLowerCase()}.mp3`;
        const filepath = path.join(chunkDir, filename);
        chunkFiles.push(filepath);
        
        console.log(`🎙️  Generating: [${scene.tag}] (${scene.text.length} chars)`);
        
        // Handle long scenes (OpenAI has char limit)
        if (engine === 'openai' && scene.text.length > MAX_CHARS) {
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
            
            const subFiles = [];
            for (let j = 0; j < subChunks.length; j++) {
                const subFile = path.join(chunkDir, `${String(i).padStart(2, '0')}-sub-${j}.mp3`);
                await ttsToFile(subChunks[j], subFile);
                subFiles.push(subFile);
            }
            
            const listFile = path.join(chunkDir, `${String(i).padStart(2, '0')}-concat.txt`);
            fs.writeFileSync(listFile, subFiles.map(f => `file '${f}'`).join('\n') + '\n');
            execSync(`ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${filepath}" -y`, { stdio: 'pipe' });
            
            subFiles.forEach(f => { try { fs.unlinkSync(f); } catch(e) {} });
            try { fs.unlinkSync(listFile); } catch(e) {}
        } else {
            await ttsToFile(scene.text, filepath);
        }
        
        const dur = getAudioDuration(filepath);
        sceneDurations.push(dur);
        console.log(`   ✅ ${dur.toFixed(2)}s`);
    }
    
    // ── Concatenate ────────────────────────────────────
    console.log('');
    console.log('🧵 Concatenating all scenes...');
    const concatList = path.join(chunkDir, 'concat.txt');
    fs.writeFileSync(concatList, chunkFiles.map(f => `file '${f}'`).join('\n') + '\n');
    execSync(`ffmpeg -f concat -safe 0 -i "${concatList}" -c copy "${outFile}" -y`, { stdio: 'pipe' });
    
    const totalDuration = getAudioDuration(outFile);
    const sizeMb = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Audio: ${outFile} (${sizeMb} MB, ${totalDuration.toFixed(2)}s)`);
    
    // ── Timestamps ─────────────────────────────────────
    console.log('');
    console.log('📐 Generating timestamps.json...');
    
    const timestamps = { story: baseName, totalDuration, scenes: [] };
    let cumulative = 0;
    
    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        
        if (scene.tag === 'INTRO') {
            cumulative += sceneDurations[i];
            continue;
        }
        
        if (scene.tag === 'OUTRO') {
            if (timestamps.scenes.length > 0) {
                timestamps.scenes[timestamps.scenes.length - 1].duration += sceneDurations[i];
            }
            continue;
        }
        
        const sceneMatch = scene.tag.match(/SCENE\s*(\d+)/i);
        if (!sceneMatch) {
            cumulative += sceneDurations[i];
            continue;
        }
        
        const sceneNum = parseInt(sceneMatch[1]);
        const imageFile = String(sceneNum).padStart(2, '0') + '.png';
        const startTime = (sceneNum === 1) ? 0 : cumulative;
        
        timestamps.scenes.push({
            image: imageFile,
            start: parseFloat(startTime.toFixed(3)),
            duration: parseFloat(sceneDurations[i].toFixed(3)),
            cue: scene.name
        });
        
        cumulative += sceneDurations[i];
    }
    
    const tsFile = path.join(tsDir, 'timestamps.json');
    fs.writeFileSync(tsFile, JSON.stringify(timestamps, null, 2) + '\n');
    console.log(`✅ Timestamps: ${tsFile}`);
    
    // ── Summary ────────────────────────────────────────
    console.log('');
    console.log('📊 Scene timing:');
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
    console.log(`   Total: ${totalDuration.toFixed(2)}s`);
    console.log('');
    console.log(engine === 'apple' ? '💰 Cost: $0.00 (free!)' : '💰 Cost: ~$0.05');
    console.log('');
    console.log('🎉 Done!');
})();
