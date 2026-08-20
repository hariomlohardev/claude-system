import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { findTemplateSource } from '../lib/repo.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';

export function registerCreate(program: Command): void {
  program
    .command('create')
    .description('Scaffold a new System from the starter template (for PR contributors)')
    .argument('<name>', 'new System name (kebab-case, must be unique)')
    .action(async (name: string) => {
      try {
        await runCreate(name);
      } catch (err) {
        handleError(err);
      }
    });
}

async function runCreate(name: string): Promise<void> {
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    console.error(theme.error(`Invalid System name "${name}". Must be kebab-case (e.g. my-new-system).`));
    console.error(theme.dim('  Pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$'));
    process.exit(1);
  }

  if (name === 'template' || name === 'starter-system') {
    console.error(theme.error(`Name "${name}" is reserved.`));
    process.exit(1);
  }

  const templatePath = findTemplateSource();
  if (!templatePath) {
    console.error(theme.error('Starter template not found.'));
    console.error(theme.dim('  Expected: template/starter-system/ in the repo'));
    console.error(theme.dim(`  Searched from: ${process.cwd()} and cli/dist`));
    process.exit(1);
  }

  // Destination is systems/<name> in the repo (cwd is assumed to be repo root)
  // Try to find repo root by walking up looking for systems/ and template/
  let destPath: string | null = null;
  const candidates = [
    resolve(process.cwd(), 'systems', name),
    resolve(process.cwd(), '..', 'systems', name),
    resolve(templatePath, '../../systems', name),
  ];

  // Prefer cwd/systems/<name> if cwd looks like repo root (has systems/)
  if (existsSync(join(process.cwd(), 'systems'))) {
    destPath = join(process.cwd(), 'systems', name);
  } else if (existsSync(join(resolve(templatePath, '../..'), 'systems'))) {
    destPath = join(resolve(templatePath, '../..'), 'systems', name);
  } else {
    destPath = candidates[0]!;
  }

  if (existsSync(destPath)) {
    console.error(theme.error(`Destination already exists: ${destPath}`));
    console.error(theme.dim('  Choose a different name or remove the existing folder.'));
    process.exit(1);
  }

  // Check if name already exists in systems/ (case-sensitive)
  try {
    const { readdir } = await import('node:fs/promises');
    const systemsDir = resolve(destPath, '..');
    if (existsSync(systemsDir)) {
      const entries = await readdir(systemsDir);
      if (entries.includes(name)) {
        console.error(theme.error(`System "${name}" already exists in ${systemsDir}`));
        process.exit(1);
      }
    }
  } catch {
    // ignore
  }

  try {
    await cp(templatePath, destPath, { recursive: true, force: false });
  } catch (err) {
    console.error(theme.error(`Failed to scaffold: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }

  // Update system.json name field to equal folder name
  const systemJsonPath = join(destPath, 'system.json');
  try {
    const raw = await readFile(systemJsonPath, 'utf-8');
    const json = JSON.parse(raw);
    json.name = name;
    // Also update displayName placeholder if it still says My New System
    if (json.displayName === 'My New System') {
      // Convert kebab to Title Case as a helpful default
      json.displayName = name
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    await writeFile(systemJsonPath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
  } catch (err) {
    console.error(theme.warn(`Scaffolded but failed to patch system.json name: ${err instanceof Error ? err.message : String(err)}`));
    console.error(theme.dim(`  Manually set "name": "${name}" in ${systemJsonPath}`));
  }

  console.log(theme.success(`Created ${theme.cyan(name)} at ${theme.dim(destPath)}`));
  console.log('');
  console.log(theme.bold('Next steps:'));
  console.log(`  ${theme.dim('1.')} Edit ${theme.cyan(`${destPath}/system.json`)}  ${theme.dim('(replace placeholder values)')}`);
  console.log(`  ${theme.dim('2.')} Write ${theme.cyan(`${destPath}/CLAUDE.md`)}   ${theme.dim('(real instructions for the System)')}`);
  console.log(`  ${theme.dim('3.')} Update ${theme.cyan(`${destPath}/README.md`)}    ${theme.dim('(human docs)')}`);
  console.log(`  ${theme.dim('4.')} Validate: ${theme.cyan(`claude-system validate ${destPath}`)}`);
  console.log(`  ${theme.dim('5.')} Open PR: ${theme.dim('fork → branch → commit → PR into systems/' + name)}`);
  console.log('');
  console.log(theme.dim(`  Guide: docs/creating-a-system.md`));
}
