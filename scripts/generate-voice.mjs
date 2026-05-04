// Voicevox で 100首 × 2話者 × 2(上/下) = 400ファイル生成、MP3 mono 64kbpsで保存
// 使い方:
//   node scripts/generate-voice.mjs [--from N] [--to M] [--speaker female|male|both]

import { execSync, spawn } from 'node:child_process';
import { existsSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const VOICEVOX = 'http://localhost:50021';

const SPEAKERS = {
  female: { id: 20, label: 'もち子さん-ノーマル' },
  male: { id: 13, label: '青山龍星-ノーマル' },
};

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
};
const from = parseInt(getArg('from', '1'), 10);
const to = parseInt(getArg('to', '100'), 10);
const speakerArg = getArg('speaker', 'both');
const speakerKeys = speakerArg === 'both' ? ['female', 'male'] : [speakerArg];

const OUT_DIR = `${REPO}/public/audio/poems`;
mkdirSync(OUT_DIR, { recursive: true });

// poems.ts パース
const poemsTs = execSync('cat src/data/poems.ts', { cwd: REPO, encoding: 'utf8' });
const poems = [];
const re =
  /id:\s*(\d+),\s*slug:\s*'([^']+)'[\s\S]*?kamiKana:\s*'([^']+)'[\s\S]*?shimoKana:\s*'([^']+)'/g;
let m;
while ((m = re.exec(poemsTs)) !== null) {
  poems.push({
    id: parseInt(m[1], 10),
    slug: m[2],
    kamiKana: m[3],
    shimoKana: m[4],
  });
}
console.log(`Parsed ${poems.length} poems`);

// 朗詠用にひらがなを少し加工 (句読点で間を作る)
function toRecitationText(kana) {
  // 元データのスペース区切り (5-7-5) を 「、」 に置き換えて朗詠っぽくする
  return kana.replace(/\s+/g, '、') + '。';
}

const targets = poems.filter((p) => p.id >= from && p.id <= to);
console.log(
  `Targets: ${targets.length} poems × ${speakerKeys.length} speakers × 2 (kami/shimo) = ${targets.length * speakerKeys.length * 2} files`,
);

let success = 0;
let skipped = 0;
let failed = 0;

function callApi(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const args = ['-s', '-X', method, `${VOICEVOX}${urlPath}`];
    if (body) args.push('-H', 'Content-Type: application/json', '-d', body);
    const child = spawn('curl', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    child.stdout.on('data', (d) => chunks.push(d));
    let err = '';
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`curl exit ${code}: ${err}`));
      else resolve(Buffer.concat(chunks));
    });
    child.on('error', reject);
  });
}

async function synthesize(text, speakerId, outWav) {
  // 1) audio_query
  const queryParams = `speaker=${speakerId}&text=${encodeURIComponent(text)}`;
  const queryBuf = await callApi('POST', `/audio_query?${queryParams}`);
  const queryStr = queryBuf.toString('utf8');
  const query = JSON.parse(queryStr);
  // 朗詠っぽく: 速度ややゆっくり + 抑揚強め + 後ろの間を長め
  query.speedScale = 0.85;
  query.intonationScale = 1.1;
  query.postPhonemeLength = 0.5;
  // 2) synthesis -> wav
  const wavBuf = await callApi('POST', `/synthesis?speaker=${speakerId}`, JSON.stringify(query));
  writeFileSync(outWav, wavBuf);
}

function wavToMp3(wav, mp3) {
  // ffmpeg でモノラル 64kbps + 音量1.5倍
  execSync(
    `ffmpeg -i ${JSON.stringify(wav)} -ac 1 -b:a 64k -af volume=1.5 -y ${JSON.stringify(mp3)} 2>/dev/null`,
    { stdio: 'ignore' },
  );
  unlinkSync(wav);
}

async function generateOne(p, speakerKey, half) {
  const kana = half === 'kami' ? p.kamiKana : p.shimoKana;
  const speaker = SPEAKERS[speakerKey];
  const outMp3 = `${OUT_DIR}/${p.slug}-${speakerKey}-${half}.mp3`;
  if (existsSync(outMp3)) {
    skipped++;
    return;
  }
  const wavTmp = `${OUT_DIR}/.${p.slug}-${speakerKey}-${half}.wav`;
  try {
    const text = toRecitationText(kana);
    await synthesize(text, speaker.id, wavTmp);
    wavToMp3(wavTmp, outMp3);
    success++;
    if (success % 20 === 0) console.log(`[progress] ${success} ok`);
  } catch (err) {
    console.error(`[fail] ${p.id} ${p.slug} ${speakerKey}/${half}: ${err.message}`);
    failed++;
  }
}

for (const p of targets) {
  for (const speakerKey of speakerKeys) {
    for (const half of ['kami', 'shimo']) {
      await generateOne(p, speakerKey, half);
    }
  }
}

console.log(`\nDone: ${success} ok, ${skipped} skipped, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
