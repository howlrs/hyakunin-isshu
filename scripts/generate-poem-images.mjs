// 100首の情景画像を Gemini で生成するスクリプト (並列対応)
// 使い方: node scripts/generate-poem-images.mjs [--from N] [--to M] [--type scene|og] [--parallel K]

import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');

// 引数解析
const args = process.argv.slice(2);
const getArg = (name, def) => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
};
const from = parseInt(getArg('from', '1'), 10);
const to = parseInt(getArg('to', '100'), 10);
const type = getArg('type', 'scene'); // scene | og
const parallel = Math.max(1, parseInt(getArg('parallel', '1'), 10));

const TYPE_CONFIG = {
  scene: {
    dir: 'public/images/poems/source',
    promptSuffix: '和の意匠、墨絵風、淡い和紙の質感、雅な色合い。テキストや文字は一切入れないでください。',
  },
  og: {
    dir: 'public/images/og/source',
    promptSuffix:
      '和の意匠、墨絵風、淡い和紙の質感、雅な色合い。横長16:9の構図でSNS共有に映える視覚的インパクトのある絵に。テキストや文字は一切入れないでください。',
  },
};

const cfg = TYPE_CONFIG[type];
if (!cfg) {
  console.error(`Unknown type: ${type}. Use scene or og.`);
  process.exit(1);
}

execSync(`mkdir -p ${cfg.dir}`, { cwd: REPO });

// poems.ts を雑にパース (ESM importは循環依存避けるため正規表現)
const poemsTs = execSync('cat src/data/poems.ts', { cwd: REPO, encoding: 'utf8' });
const poems = [];
const poemRegex =
  /id:\s*(\d+),\s*slug:\s*'([^']+)',\s*kamiNoKu:\s*'([^']+)',\s*shimoNoKu:\s*'([^']+)'[\s\S]*?author:\s*'([^']+)'[\s\S]*?scene:\s*'([^']+)'/g;
let m;
while ((m = poemRegex.exec(poemsTs)) !== null) {
  poems.push({
    id: parseInt(m[1], 10),
    slug: m[2],
    kami: m[3],
    shimo: m[4],
    author: m[5],
    scene: m[6],
  });
}

console.log(`Parsed ${poems.length} poems`);

const targets = poems.filter((p) => p.id >= from && p.id <= to);
console.log(
  `Generating ${targets.length} images (id ${from}-${to}, type=${type}, parallel=${parallel})`,
);

let success = 0;
let skipped = 0;
let failed = 0;

function generateOneAttempt(p) {
  return new Promise((resolve) => {
    const outPath = `${REPO}/${cfg.dir}/${p.slug}.png`;
    const prompt = `百人一首 第${p.id}番『${p.kami} ${p.shimo}』(${p.author})。${p.scene} ${cfg.promptSuffix}`;
    // spawn でAPIキー等の環境変数を子プロセスに渡す
    const child = spawn(
      '/home/o9oem/.claude/hooks/gemini-review.sh',
      ['image', prompt, '--output', outPath],
      { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
    }, 180000);
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('close', (code) => {
      clearTimeout(timer);
      const ok =
        existsSync(outPath) || out.includes('Image saved') || err.includes('Image saved');
      const log = (out + '\n' + err).slice(-500);
      resolve({ ok, log: `code=${code} ${log}` });
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ ok: false, log: `spawn-error: ${e.message}` });
    });
  });
}

async function generateOne(p) {
  const outPath = `${REPO}/${cfg.dir}/${p.slug}.png`;
  if (existsSync(outPath)) {
    console.log(`[skip] ${p.id} ${p.slug} (exists)`);
    skipped++;
    return;
  }
  // 最大3回リトライ (リトライ間で5秒待機)
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { ok, log } = await generateOneAttempt(p);
    if (ok) {
      console.log(`[ok]   ${p.id} ${p.slug}${attempt > 1 ? ` (retry ${attempt - 1})` : ''}`);
      success++;
      return;
    }
    console.error(`[try${attempt}] ${p.id} ${p.slug}: ${log.replace(/\n/g, ' | ').slice(0, 400)}`);
    if (attempt < 3) await new Promise((r) => setTimeout(r, 5000));
  }
  console.error(`[FAIL] ${p.id} ${p.slug} (3 retries exhausted)`);
  failed++;
}

// 並列実行 (chunked)
async function processInParallel(tasks, concurrency) {
  const queue = [...tasks];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) await generateOne(task);
    }
  });
  await Promise.all(workers);
}

await processInParallel(targets, parallel);

console.log(`\nDone: ${success} ok, ${skipped} skipped, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
