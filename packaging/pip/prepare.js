import { cpSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcDist = join(here, '../../cli/dist');
const destDist = join(here, 'claude_system/dist');
const srcPkg = join(here, '../../cli/package.json');
const destPkg = join(here, 'claude_system/package.json');

if (existsSync(srcDist)) {
  mkdirSync(destDist, { recursive: true });
  cpSync(srcDist, destDist, { recursive: true, force: true });
  console.log(`copied ${srcDist} to ${destDist}`);
  if (existsSync(srcPkg)) {
    copyFileSync(srcPkg, destPkg);
    console.log(`copied ${srcPkg} to ${destPkg}`);
  }
} else {
  console.log(`no cli/dist at ${srcDist} — run npm --prefix ${join(here, '../../cli')} run build first`);
}
