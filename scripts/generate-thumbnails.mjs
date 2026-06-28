import { mkdirSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const sourceDir = join(process.cwd(), 'public/images/poems');
const targetDir = join(sourceDir, 'thumbs');

mkdirSync(targetDir, { recursive: true });

const files = readdirSync(sourceDir).filter((file) => file.endsWith('.webp'));
let failed = 0;

for (const file of files) {
  const source = join(sourceDir, file);
  const target = join(targetDir, `${basename(file, extname(file))}.webp`);
  const result = spawnSync(
    'ffmpeg',
    ['-y', '-i', source, '-vf', 'scale=480:-2', '-c:v', 'libwebp', '-quality', '60', target],
    { stdio: 'pipe' },
  );

  if (result.status !== 0) {
    failed++;
    console.error(`[fail] ${file}`);
  }
}

if (failed > 0) process.exit(1);

console.log(`Generated ${files.length} thumbnails in ${targetDir}`);
