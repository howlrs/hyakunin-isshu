// 100首の情景画像を Gemini で生成するスクリプト
// 使い方: node scripts/generate-poem-images.mjs [--from N] [--to M] [--type scene|og]

import { execSync } from 'node:child_process';
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
console.log(`Generating ${targets.length} images (id ${from}-${to}, type=${type})`);

let success = 0;
let skipped = 0;
let failed = 0;

for (const p of targets) {
  const outPath = `${REPO}/${cfg.dir}/${p.slug}.png`;
  if (existsSync(outPath)) {
    console.log(`[skip] ${p.id} ${p.slug} (exists)`);
    skipped++;
    continue;
  }

  const prompt = `百人一首 第${p.id}番『${p.kami} ${p.shimo}』(${p.author})。${p.scene} ${cfg.promptSuffix}`;

  try {
    // gemini-review.sh image を呼ぶ
    const result = execSync(
      `~/.claude/hooks/gemini-review.sh image ${JSON.stringify(prompt)} --output ${JSON.stringify(outPath)} 2>&1`,
      { encoding: 'utf8', timeout: 120000, shell: '/bin/bash' },
    );
    const ok = result.includes('Image saved') || existsSync(outPath);
    if (ok) {
      console.log(`[ok]   ${p.id} ${p.slug}`);
      success++;
    } else {
      console.error(`[fail] ${p.id} ${p.slug}: ${result.slice(0, 200)}`);
      failed++;
    }
  } catch (err) {
    console.error(`[fail] ${p.id} ${p.slug}: ${String(err.message || err).slice(0, 200)}`);
    failed++;
  }
}

console.log(`\nDone: ${success} ok, ${skipped} skipped, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
