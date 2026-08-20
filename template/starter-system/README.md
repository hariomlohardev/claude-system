# My New System — Starter Template

> **This is a template.** Copy it, rename it, and edit every placeholder before opening a PR. Nothing here is ready to submit as-is.

## What to do

1. **Copy the template**

   ```sh
   cp -r template/starter-system systems/<your-kebab-case-name>
   ```

   The folder name under `systems/` **must exactly match** the `"name"` field in `system.json` or CI will fail.

2. **Edit `system.json`** — every required field is defined in [`schemas/system.schema.json`](../../schemas/system.schema.json) and documented in [`docs/creating-a-system.md`](../../docs/creating-a-system.md):
   - `name` → your kebab-case id (e.g. `rails-review`)
   - `displayName`, `version`, `description`, `keywords`, `category`
   - `author`, `license`, `repository`, `bugs`, `homepage`
   - `claudeSystem.specVersion`, `dependencies`, `permissions`

   The placeholder value `"my-new-system"` is intentionally invalid for submission — you must change it.

3. **Write `CLAUDE.md`** — this is the prompt injected into Claude Code. Replace the placeholder with role, workflow, and conventions for your domain.

4. **Update this `README.md`** — explain what the System does, who it's for, and how to use it. Keep `template/starter-system/README.md` as a short template; your real README lives in `systems/<name>/README.md`.

5. **Tune `settings.json`** — add only the Claude Code settings your System needs (permission defaults, hooks). The template ships with empty `allow`/`deny` lists (most permissive default); narrow them to what you actually need.

6. **Add optional folders** as needed: `skills/`, `agents/`, `commands/`, `hooks/`. Empty folders already contain a `.gitkeep` — replace it with real content or delete the folder if unused.

7. **Validate locally** before pushing (see `docs/creating-a-system.md#testing-locally`).

## Links

- Full guide: [`docs/creating-a-system.md`](../../docs/creating-a-system.md)
- Formal contract: [`SYSTEM_SPEC.md`](../../SYSTEM_SPEC.md)
- Schemas: `schemas/system.schema.json`, `schemas/registry-index.schema.json`

> **Reminder:** `registry/index.json` is generated. Never hand-edit it — edit `system.json` and let `scripts/generate-index.js` rebuild the index.
