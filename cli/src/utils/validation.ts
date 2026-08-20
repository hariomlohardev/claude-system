/**
 * validation.ts — zod schemas mirroring schemas/system.schema.json
 * Must stay in sync with that JSON Schema + docs/creating-a-system.md + template.
 */
import { z } from 'zod';

const kebabPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const httpsPattern = /^https?:\/\/.+/;
const githubPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

export const permissionsEnum = [
  'filesystem:read',
  'filesystem:write',
  'network:read',
  'network:write',
  'shell:exec',
  'credentials:read',
] as const;

export const categoryEnum = [
  'open-source',
  'frontend',
  'backend',
  'testing',
  'security',
  'docs',
  'research',
  'devops',
  'other',
] as const;

export const authorSchema = z
  .object({
    name: z.string().min(1).max(80),
    github: z.string().min(1).max(39).regex(githubPattern).optional(),
    url: z.string().regex(httpsPattern).optional(),
  })
  .strict();

export const bugsSchema = z
  .object({
    url: z.string().regex(httpsPattern),
  })
  .strict();

export const claudeSystemSchema = z
  .object({
    specVersion: z.string().min(1).max(32).regex(semverPattern),
  })
  .strict();

export const dependencySchema = z
  .object({
    name: z.string().min(1).max(64).regex(kebabPattern),
    version: z.string().min(1).max(64),
  })
  .strict();

export const systemJsonSchema = z
  .object({
    $schema: z.string().optional(),
    name: z.string().min(1).max(64).regex(kebabPattern),
    displayName: z.string().min(1).max(80),
    version: z.string().regex(semverPattern),
    description: z.string().min(10).max(300),
    keywords: z.array(z.string().min(1).max(32)).min(1).max(15),
    category: z.enum(categoryEnum).optional(),
    author: authorSchema,
    license: z.string().min(1).max(64),
    repository: z.string().regex(httpsPattern).optional(),
    bugs: bugsSchema.optional(),
    homepage: z.string().regex(httpsPattern).optional(),
    claudeSystem: claudeSystemSchema,
    dependencies: z.array(dependencySchema).default([]).optional(),
    permissions: z.array(z.enum(permissionsEnum)).default([]),
  })
  .strict();

export const registryEntrySchema = z
  .object({
    name: z.string().min(1).max(64).regex(kebabPattern),
    displayName: z.string().min(1).max(80),
    version: z.string().regex(semverPattern),
    description: z.string().min(10).max(300),
    author: authorSchema,
    license: z.string().min(1).max(64),
    keywords: z.array(z.string().min(1).max(32)).min(1).max(15),
    category: z.enum(categoryEnum).optional(),
    path: z.string().regex(/^systems\/[a-z0-9]+(?:-[a-z0-9]+)*$/),
  })
  .strict();

export const registryIndexSchema = z
  .object({
    $schema: z.string().optional(),
    generatedAt: z.string(),
    systems: z.array(registryEntrySchema),
  })
  .strict();

export type SystemJson = z.infer<typeof systemJsonSchema>;
export type RegistryEntry = z.infer<typeof registryEntrySchema>;
export type RegistryIndex = z.infer<typeof registryIndexSchema>;

// Unsafe pattern checks for validate command / validate.yml
export const UNSAFE_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /curl\s+.*\|\s*(?:sh|bash)/i, message: 'curl | sh/bash pattern — requires explicit consent and permissions: network:read + shell:exec' },
  { pattern: /wget\s+.*\|\s*(?:sh|bash)/i, message: 'wget | sh/bash pattern — requires explicit consent' },
  { pattern: /rm\s+-rf\s+\//, message: 'rm -rf / — destructive, must be reviewed carefully' },
  { pattern: /:\(\)\s*\{\s*:\|\s*:&\s*;\s*\}\s*;?\s*:/, message: 'fork bomb pattern' },
  { pattern: /credentials:\s*read/i, message: 'mentions credential access — ensure permissions includes credentials:read' },
];

export function checkUnsafeContent(content: string): Array<{ line: number; message: string; snippet: string }> {
  const issues: Array<{ line: number; message: string; snippet: string }> = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    for (const { pattern, message } of UNSAFE_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({ line: i + 1, message, snippet: line.trim().slice(0, 120) });
      }
    }
  }
  return issues;
}
