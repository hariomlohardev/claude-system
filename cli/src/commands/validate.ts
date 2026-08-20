import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, basename, resolve } from 'node:path';
import { systemJsonSchema, checkUnsafeContent } from '../utils/validation.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';

export function registerValidate(program: Command): void {
  program
    .command('validate')
    .description('Validate a System (CI checks: schema, required files, name === folder, security)')
    .argument('[path]', 'path to System folder or repo root (defaults to current directory)')
    .action(async (targetPath?: string) => {
      try {
        const p = targetPath ?? process.cwd();
        const results = await runValidate(p);
        const failed = results.filter((r) => !r.pass);
        if (failed.length > 0) process.exit(1);
      } catch (err) {
        handleError(err);
      }
    });
}

interface ValidateResult {
  systemPath: string;
  pass: boolean;
  errors: string[];
  warnings: string[];
}

async function validateOne(systemPath: string): Promise<ValidateResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const folderName = basename(resolve(systemPath));

  // Required files
  const requiredFiles = ['system.json', 'CLAUDE.md', 'README.md'];
  for (const f of requiredFiles) {
    if (!existsSync(join(systemPath, f))) {
      errors.push(`Missing required file: ${f}`);
    }
  }

  // system.json checks
  const systemJsonPath = join(systemPath, 'system.json');
  if (existsSync(systemJsonPath)) {
    try {
      const raw = await readFile(systemJsonPath, 'utf-8');
      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch (e) {
        errors.push(`system.json is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
        return { systemPath, pass: errors.length === 0, errors, warnings };
      }

      const parsed = systemJsonSchema.safeParse(json);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push(`system.json: ${issue.path.join('.') || '(root)'} — ${issue.message}`);
        }
      } else {
        // name === folder name — skip for template (placeholder "my-new-system" vs "starter-system" is intentional)
        const isTemplate = folderName === 'starter-system' && systemPath.includes('template');
        // Only enforce for real Systems under systems/
        if (!isTemplate && parsed.data.name !== folderName) {
          errors.push(`name "${parsed.data.name}" must exactly match folder name "${folderName}"`);
        }
      }
    } catch (err) {
      errors.push(`Failed to read system.json: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Security checks — scan hooks/, setup.sh, skills/, agents/, commands/
  const scanDirs = ['hooks', 'skills', 'agents', 'commands'];
  const scanFiles = ['setup.sh'];
  for (const dir of scanDirs) {
    const dirPath = join(systemPath, dir);
    if (existsSync(dirPath)) {
      try {
        const entries = await readdir(dirPath, { withFileTypes: true });
        for (const e of entries) {
          if (e.isFile()) {
            const filePath = join(dirPath, e.name);
            try {
              const content = await readFile(filePath, 'utf-8');
              const issues = checkUnsafeContent(content);
              for (const iss of issues) {
                warnings.push(`${dir}/${e.name}:${iss.line} — ${iss.message} — "${iss.snippet}"`);
              }
            } catch {
              // binary or unreadable — ignore
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }
  for (const f of scanFiles) {
    const filePath = join(systemPath, f);
    if (existsSync(filePath)) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const issues = checkUnsafeContent(content);
        for (const iss of issues) {
          warnings.push(`${f}:${iss.line} — ${iss.message} — "${iss.snippet}"`);
        }
      } catch {}
    }
  }

  return { systemPath, pass: errors.length === 0, errors, warnings };
}

export async function runValidate(targetPath: string): Promise<ValidateResult[]> {
  const resolved = resolve(targetPath);
  let systemPaths: string[] = [];

  // Determine if target is a single System folder or a repo root containing systems/*
  const isSystemFolder = existsSync(join(resolved, 'system.json'));
  if (isSystemFolder) {
    systemPaths = [resolved];
  } else if (existsSync(join(resolved, 'systems'))) {
    // Repo root — validate all systems/*
    const systemsDir = join(resolved, 'systems');
    const entries = await readdir(systemsDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const p = join(systemsDir, e.name);
        if (existsSync(join(p, 'system.json'))) systemPaths.push(p);
      }
    }
    if (systemPaths.length === 0) {
      console.log(theme.dim(`No Systems found in ${systemsDir}`));
      return [];
    }
  } else {
    // Fallback: treat as System folder even if system.json missing — will error about missing files
    try {
      const s = await stat(resolved);
      if (s.isDirectory()) systemPaths = [resolved];
      else {
        console.error(theme.error(`Path is not a System folder or repo root: ${resolved}`));
        process.exit(1);
      }
    } catch {
      console.error(theme.error(`Path not found: ${resolved}`));
      process.exit(1);
    }
  }

  const results: ValidateResult[] = [];
  for (const p of systemPaths) {
    const res = await validateOne(p);
    results.push(res);

    const rel = p.replace(process.cwd() + '/', '');
    if (res.pass) {
      console.log(theme.success(`${theme.cyan(rel)} — valid`));
      if (res.warnings.length > 0) {
        for (const w of res.warnings) console.log(`  ${theme.warn(w)}`);
      }
    } else {
      console.log(theme.error(`${theme.cyan(rel)} — invalid`));
      for (const e of res.errors) console.log(`  ${theme.red('✗')} ${e}`);
      for (const w of res.warnings) console.log(`  ${theme.warn(w)}`);
    }
  }

  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;
  console.log('');
  if (failed === 0) {
    console.log(theme.success(`All ${total} System(s) passed validation.`));
  } else {
    console.log(theme.error(`${failed}/${total} System(s) failed validation.`));
    console.log(theme.dim('  Fix errors above and run again. CI validate.yml will fail until green.'));
  }

  return results;
}
