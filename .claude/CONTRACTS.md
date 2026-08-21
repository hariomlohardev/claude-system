# Contracts & Invariants

Hard rules — violating any is a bug. Each links to the enforcing file.

## Spec & governance

- **Spec is source of truth** — `SYSTEM_SPEC.md` wins over convenience. See [SYSTEM_SPEC.md](../SYSTEM_SPEC.md) · [CLAUDE.md](../CLAUDE.md).
- **§46 out-of-scope (no marketplace/cloud/runtime/GUI/enterprise auth/multi-resolver)** — MVP first. Enforced by review, not code.

## Registry & validation

- **`registry/index.json` is GENERATED** — never hand-edit. Rebuilt by [`scripts/generate-index.js`](../scripts/generate-index.js) from `systems/*/system.json`. Validates against [`schemas/registry-index.schema.json`](../schemas/registry-index.schema.json). Flag hand-edits in PR review.
- **`validate.yml` must pass before merge** — no bypass. Enforced by [`.github/workflows/validate.yml`](../.github/workflows/validate.yml) (strict: schema + `name===folder` + required files + security).
- **Three must never drift:** [`schemas/system.schema.json`](../schemas/system.schema.json) + [`docs/creating-a-system.md`](../docs/creating-a-system.md) + [`template/starter-system/`](../template/starter-system/) — update together.

## System shape

- **`system.json` folder name === `name` (kebab-case)** — `^[a-z0-9]+(?:-[a-z0-9]+)*$`, length 1–64. Enforced by [`cli/src/utils/validation.ts`](../cli/src/utils/validation.ts) zod + `checkUnsafeContent` and CI. See [`schemas/system.schema.json`](../schemas/system.schema.json) `pattern`.
- **Required files in each `systems/<name>/`:** `system.json` + `CLAUDE.md` + `README.md`. Missing → `validate` fails.
- **`additionalProperties: false`** on `system.json` and `registry/index.json` entries — unknown keys rejected.
- **Sorted registry:** `systems` array sorted by `name` asc (enforced by `generate-index.js`).

## Permissions & security

- **Permissions self-declared + reviewed** — enum `filesystem:read|write`, `network:read|write`, `shell:exec`, `credentials:read`. Declared in `system.json` `permissions[]` (default `[]`), shown by `info`. Reviewed in PR, not runtime-verified. See [docs/security.md](../docs/security.md).
- **`shell:exec` needs `WHY`** — any `setup.sh` must contain `# WHY:` (or `echo` explanation). Checked by `checkUnsafeContent` in [`cli/src/utils/validation.ts`](../cli/src/utils/validation.ts) and surfaced by [`cli/src/lib/setupRunner.ts`](../cli/src/lib/setupRunner.ts) `extractWhyMessage`.
- **`setup.sh` once-only:** on first `run` only, gated by `y/N` prompt (non-TTY → skip), exit `1` surfaces, success sets `setupDone:true` in `~/.claude-system/systems.json` never prompted again. See [`cli/src/lib/setupRunner.ts`](../cli/src/lib/setupRunner.ts) + [`storage.ts`](../cli/src/lib/storage.ts).

## CLI & runtime

- **CLI is thin** — new features should be Systems/Skills/plugins, not CLI bloat. See [CLAUDE.md](../CLAUDE.md) conventions.
- **Always shells out to real `claude` CLI** — never rebuilds it. [`cli/src/lib/claudeLauncher.ts`](../cli/src/lib/claudeLauncher.ts) + [`commands/run.ts`](../cli/src/commands/run.ts) `run <name> -- <args>`.
- **Supported interfaces only** for session/config — never undocumented internals. If unsure, say so.

## Deploy

- **Vercel `Other`, no build** — `Root ./`, Build OFF. Preserve rewrites `/install→/install.sh` and `/api/*` headers (`s-maxage=60`). See [`vercel.json`](../vercel.json).
- **Supabase RLS public read**, `pg_trgm` for fuzzy, `search_vector` for search. Keys not in repo — Vercel env / GitHub Secrets `SUPABASE_*`.
