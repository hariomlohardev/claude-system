# Contracts & Invariants

Keywords: SHASUMS, CODEOWNERS, oss-contrib-finder, network:write, registry cache

Hard rules — violating any is a bug. Each links to the enforcing file.

## Spec & governance

- **Spec is source of truth** — `SYSTEM_SPEC.md` wins over convenience. See [SYSTEM_SPEC.md](../SYSTEM_SPEC.md) · [CLAUDE.md](../CLAUDE.md).
- **§46 out-of-scope (no marketplace/cloud/runtime/GUI/enterprise auth/multi-resolver)** — MVP first. **Footnote:** registry cache (`https://claude-system-tau.vercel.app/api/registry` + Supabase + `raw` fallback) is **not** scope creep — see [sync-registry.yml:1 ADR](../.github/workflows/sync-registry.yml) + [SYSTEM_SPEC.md §46 footnote](../SYSTEM_SPEC.md). Enforced by review, not code.

## Registry & validation

- **`registry/index.json` is GENERATED** — never hand-edit. Rebuilt by [`scripts/generate-index.js:99`](../scripts/generate-index.js) from `systems/*/system.json`. Validates against [`schemas/registry-index.schema.json`](../schemas/registry-index.schema.json). Guard: `expectedCount` vs `systems.length` + sorted by `name`. Flag hand-edits in PR review.
- **`validate.yml` must pass before merge** — no bypass (except `hariomlohardev` Bypass for docs). Enforced by [`.github/workflows/validate.yml:30`](../.github/workflows/validate.yml) (strict: schema + `name===folder` + required files + `permissions vs setup.sh` + `stale-registry check: jq -S '.systems' diff` + security + `raw fallback` check).
- **Three must never drift:** [`schemas/system.schema.json`](../schemas/system.schema.json) + [`docs/creating-a-system.md`](../docs/creating-a-system.md) + [`template/starter-system/`](../template/starter-system/) — update together.
- **`cli/package-lock.json` tracked + `npm ci` hard** — [release.yml](../.github/workflows/release.yml) + [sync-registry.yml](../.github/workflows/sync-registry.yml) use `cache-dependency-path: cli/package-lock.json` + `npm ci` (no `|| npm install` fallback). Reproducible.

## System shape

- **`system.json` folder name === `name` (kebab-case)** — `^[a-z0-9]+(?:-[a-z0-9]+)*$`, length 1–64. Enforced by [`cli/src/utils/validation.ts:18`](../cli/src/utils/validation.ts) zod + `checkUnsafeContent` and CI. See [`schemas/system.schema.json:14`](../schemas/system.schema.json) `pattern`.
- **Required files in each `systems/<name>/`:** `system.json` + `CLAUDE.md` + `README.md`. Missing → `validate` fails.
- **`additionalProperties: false`** on `system.json` and `registry/index.json` entries — unknown keys rejected (includes `trustTier` not allowed).
- **Sorted registry:** `systems` array sorted by `name` asc (enforced by `generate-index.js:175`).

## Permissions & security

- **Permissions self-declared + reviewed** — enum `filesystem:read|write`, `network:read|write`, `shell:exec`, `credentials:read`. Declared in `system.json` `permissions[]` (default `[]`), shown by `info`. Reviewed in PR, not runtime-verified. See [docs/security.md](../docs/security.md).
- **`oss-contrib-finder` honest:** [`systems/oss-contrib-finder/system.json:24`](../systems/oss-contrib-finder/system.json) now `["filesystem:read","filesystem:write","network:read","network:write","shell:exec"]` — `network:write` required for `shadow-reviewer` pushes + `gh pr create` (was `network:read` only).
- **`shell:exec` needs `WHY`** — any `setup.sh` must contain `# WHY:` (or `echo` explanation). Checked by `checkUnsafeContent` in [`cli/src/utils/validation.ts`](../cli/src/utils/validation.ts) and surfaced by [`cli/src/lib/setupRunner.ts:24`](../cli/src/lib/setupRunner.ts) `extractWhyMessage`.
- **`setup.sh` once-only:** on first `run` only, gated by `y/N` prompt (non-TTY → skip), exit `1` surfaces, success sets `setupDone:true` in `~/.claude-system/systems.json` never prompted again. See [`storage.ts:137`](../cli/src/lib/storage.ts) + [`setupRunner.ts:42`](../cli/src/lib/setupRunner.ts).
- **`update` manifest-aware:** `storage.ts:196` `collectInstalledFiles` hashes every file (`sha256`), saves `installedFiles[]` on `install`; `update.ts:44` re-hashes, prompts `[o]verwrite / [b]ackup to .bak.<timestamp> / [a]bort` (default abort, non-TTY abort), clean `rm -rf + cp` to drop untracked.
- **`remove` flat delete documented:** [`commands/remove.ts:9`](../cli/src/commands/remove.ts) `rm -rf ~/.claude-system/systems/<name>/` — flat delete including untracked, documented in `--help` + `README.md`.

## Security — SHASUMS & CODEOWNERS

- **SHASUMS checked before `chmod` (fail-hard):** [`release.yml:42`](../.github/workflows/release.yml) generates `SHASUMS256.txt` (`sha256sum registry/index.json dist/*`) and attaches to GitHub Release; [`install.sh:211`](../install.sh) fetches `SHASUMS256.txt` via `$RELEASE_URL/SHASUMS256.txt` and verifies before `chmod +x` — mismatch → `exit 1`; missing on non-old tag (`!~ ^v0.(0|1).`) → `exit 1`; warn only for `v0.0`/`v0.1`.
- **CODEOWNERS + Ruleset `protect-main`:** [`.github/CODEOWNERS:1`](../.github/CODEOWNERS) `* @hariomlohardev`, `systems/** @hariomlohardev`, `.github/workflows/** @hariomlohardev`; Ruleset `protect-main` — `hariomlohardev` in Bypass (you bypass, others need 1 review) + required `validate` check.

## CLI & runtime

- **CLI is thin** — new features should be Systems/Skills/plugins, not CLI bloat. See [CLAUDE.md](../CLAUDE.md) conventions.
- **Always shells out to real `claude` CLI** — never rebuilds it. [`cli/src/lib/claudeLauncher.ts:37`](../cli/src/lib/claudeLauncher.ts) + [`commands/run.ts:16`](../cli/src/commands/run.ts) `command.args.slice(1)` forwards `-- <args>`.
- **`run` handler is 5 lines:** [`run.ts:16`](../cli/src/commands/run.ts) `const claudeArgs = command.args.slice(1)` — one derivation via `command.args` (commander strips `--`), no `process.argv.indexOf('run')`, no dead `passthrough`/`systemIndex`.
- **Supported interfaces only** for session/config — never undocumented internals. If unsure, say so.

## Deploy

- **Vercel `Other`, no build** — `Root ./`, Build OFF. Rewrites `/(.*)->/web-vercel/$1` with `/install→/install.sh` + `/install.ps1` text/plain + `/api` `s-maxage=60` first. See [`vercel.json:1`](../vercel.json).
- **Supabase RLS public read**, `pg_trgm` for fuzzy, `search_vector` for search, `downloads` counter. Keys not in repo — Vercel env / GitHub Secrets `SUPABASE_*`. Two-tier fetch: `VercelRegistry` primary → `raw.githubusercontent.com` fallback (see [registry.ts:13](../cli/src/lib/registry.ts)).
- **Registry cache is not scope creep:** [sync-registry.yml:1 ADR](../.github/workflows/sync-registry.yml) read-through cache, source of truth remains `registry/index.json`; if Vercel/Supabase dies, `raw` fallback keeps `install` working — proven by `validate.yml` `Scope discipline — raw fallback` step.

See also: Stack → [STACK.md](STACK.md), Data → [DATA.md](DATA.md), Ops → [OPERATIONS.md](OPERATIONS.md)
