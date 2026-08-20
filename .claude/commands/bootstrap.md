---
description: Scaffold the claude-system TypeScript CLI project into a working, installable state
---

You are bootstrapping the `claude-system` repository into a real, working
TypeScript project. The folder structure and empty placeholder files already
exist. Your job is to fill them in so the project builds, lints, and runs.

Read `CLAUDE.md` and `SYSTEM_SPEC.md` at the repo root first — they define
the architecture and conventions you must follow. Do not deviate from them
without flagging it to the user.

## Do the following, in order

1. **`cli/` — the CLI itself**
   - Initialize a TypeScript project: `package.json`, `tsconfig.json`.
   - Add dependencies: `commander` (CLI framework), `zod` (schema
     validation), `simple-git` or `execa` (git/process ops). Use native
     `fetch` — do not add an HTTP client dependency.
   - Create `cli/src/index.ts` as the entrypoint, wiring up commands:
     `install`, `list`, `info`, `run`, `remove`, `create`, `validate`.
     Each command gets its own file under `cli/src/commands/`.
     Stub bodies are fine for now — `console.log("not yet implemented")` —
     the goal is a working command surface, not full logic.
   - Add `cli/src/lib/registry.ts` — fetches and parses
     `registry/index.json` (from a configurable URL, defaulting to this
     repo's raw GitHub URL).
   - Add `cli/src/lib/local-state.ts` — reads/writes
     `~/.claude-system/registry.json` per `SYSTEM_SPEC.md` §33.
   - Add a `build` script (`tsc`) and a `dev` script (`tsx` or `ts-node`).
   - Set up `cli/tests/` with a test runner (`vitest`) and one smoke test
     per command confirming it runs without crashing.

2. **`schemas/system.schema.json`**
   - Write the actual JSON Schema for a valid `system.json`, based on the
     example in `SYSTEM_SPEC.md` §18: `name`, `version`, `description`,
     `author`, `license`, `repository`, `claudeSystem.version`,
     `dependencies`, `tags`.

3. **`schemas/registry-index.schema.json`**
   - Write the schema for one entry in `registry/index.json`: `name`,
     `displayName`, `version`, `description`, `author`, `license`, `tags`,
     `path`. Keep field names consistent with `system.schema.json`.

4. **`template/starter-system/`**
   - Fill in `system.json` (valid example matching the schema),
     `CLAUDE.md` (placeholder instructions a new System author edits),
     `settings.json` (empty/minimal valid Claude Code settings),
     `README.md` (explains what to fill in).

5. **`scripts/generate-index.js`**
   - Walk `systems/*/system.json`, validate each against
     `schemas/system.schema.json`, and write the aggregated
     `registry/index.json`. Exit non-zero on any invalid entry so CI fails
     loudly instead of silently writing a bad index.

6. **`.github/workflows/validate.yml`**
   - On PRs touching `systems/**`: run schema validation
     (`scripts/generate-index.js` in a dry-run/check mode), confirm
     required files exist, and fail the build on any issue.

7. **`.github/workflows/release.yml`**
   - On tag push matching `v*`: build `cli/`, create a GitHub Release,
     publish `packaging/npm` to npm, publish `packaging/pip` to PyPI.
     Use repository secrets for tokens — do not hardcode anything.

8. **`install.sh`**
   - POSIX shell script: detect OS/arch, fetch the matching asset from the
     latest GitHub Release, place it on `$PATH`. Fail with a clear message
     on unsupported platforms rather than silently doing nothing.

9. **`packaging/npm/` and `packaging/pip/`**
   - Thin wrappers only, per `CLAUDE.md`. Do not reimplement CLI logic here.

## When done

- Run the build and test commands you just added and confirm they pass.
- Report back a short summary of what was created and what is still a stub
  vs. fully implemented, so the user knows what to tackle next.
- Do not invent scope beyond this list. If something in `SYSTEM_SPEC.md` is
  ambiguous, ask rather than guess.