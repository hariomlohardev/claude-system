import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../cli/dist');
const dest = join(here, 'dist');

if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true, force: true });
  console.log(`copied ${src} to ${dest}`);
} else {
  console.log(`no cli/dist at ${src} — run npm --prefix ${join(here, '../../cli')} run build first`);
}
