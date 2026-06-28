import { rmSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'out');

for (const path of [
  'images/poems/source',
  'images/og/source',
  'images/hero.png',
  'images/favicon-source.png',
]) {
  rmSync(join(outDir, path), { force: true, recursive: true });
}
