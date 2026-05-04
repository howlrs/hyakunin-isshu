// favicon-source.png を様々なサイズに変換
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const SRC = `${REPO}/public/images/favicon-source.png`;
const PUB = `${REPO}/public`;

mkdirSync(PUB, { recursive: true });

const tasks = [
  { size: 16, out: `${PUB}/favicon-16x16.png` },
  { size: 32, out: `${PUB}/favicon-32x32.png` },
  { size: 180, out: `${PUB}/apple-touch-icon.png` },
  { size: 192, out: `${PUB}/android-chrome-192x192.png` },
  { size: 512, out: `${PUB}/android-chrome-512x512.png` },
];

for (const { size, out } of tasks) {
  await sharp(SRC).resize(size, size, { fit: 'cover' }).png().toFile(out);
  console.log(`[ok] ${out} (${size}x${size})`);
}

// favicon.ico は 16+32+48 のmulti-size
// sharp は ico を直接出さないので 32x32 PNG を favicon.ico に流用 (現代ブラウザはPNG ICO対応)
await sharp(SRC).resize(32, 32, { fit: 'cover' }).toFormat('png').toFile(`${PUB}/favicon.ico`);
console.log(`[ok] ${PUB}/favicon.ico (32x32 PNG)`);
