// PNG → WebP 一括変換 (sharp使用)
// 使い方: node scripts/convert-to-webp.mjs <source-dir> <dest-dir> [quality]

import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { resolve, basename, extname } from 'node:path';

const [, , srcArg, dstArg, qualityArg] = process.argv;
if (!srcArg || !dstArg) {
  console.error('Usage: node convert-to-webp.mjs <source-dir> <dest-dir> [quality=85]');
  process.exit(1);
}

const src = resolve(srcArg);
const dst = resolve(dstArg);
const quality = parseInt(qualityArg || '85', 10);

mkdirSync(dst, { recursive: true });

const files = readdirSync(src).filter((f) => /\.(png|jpe?g)$/i.test(f));
console.log(`Converting ${files.length} files: ${src} -> ${dst} (quality=${quality})`);

let totalIn = 0;
let totalOut = 0;
let success = 0;
let failed = 0;

for (const f of files) {
  const inPath = `${src}/${f}`;
  const outPath = `${dst}/${basename(f, extname(f))}.webp`;
  try {
    const inSize = statSync(inPath).size;
    await sharp(inPath).webp({ quality }).toFile(outPath);
    const outSize = statSync(outPath).size;
    totalIn += inSize;
    totalOut += outSize;
    success++;
    console.log(
      `[ok] ${f}: ${(inSize / 1024).toFixed(0)}KB -> ${(outSize / 1024).toFixed(0)}KB (${((1 - outSize / inSize) * 100).toFixed(0)}% smaller)`,
    );
  } catch (err) {
    failed++;
    console.error(`[fail] ${f}: ${err.message}`);
  }
}

console.log(
  `\nDone: ${success} ok, ${failed} failed. Total: ${(totalIn / 1024 / 1024).toFixed(1)}MB -> ${(totalOut / 1024 / 1024).toFixed(1)}MB (${((1 - totalOut / totalIn) * 100).toFixed(0)}% smaller)`,
);
