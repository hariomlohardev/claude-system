# Creating a System

A **System** is a versioned, distributable bundle of `CLAUDE.md`, skills, agents, commands, hooks, and config that together form a reproducible, purpose-built Claude Code environment — for example an "open-source contributor" setup or a "frontend development" setup. The formal contract is defined in [`SYSTEM_SPEC.md`](../SYSTEM_SPEC.md); this guide is the contributor-facing how-to. When in doubt, the spec wins.

> **Scope reminder from `CLAUDE.md`:** `claude-system` is the ecosystem/package layer *around* Claude Code. It never replaces Claude Code — it prepares an environment and shells out to the real `claude` CLI. A System should not try to build a chat runtime or coding agent; it configures Claude Code.

---

## 1. Minimum required files

Every System lives under `systems/<name>/` where `<name>` is the kebab-case id. **Folder name must exactly equal the `"name"` field in `system.json`** — CI enforces this and will fail your PR on a mismatch. See [`systems/README.md`](../systems/README.md).

A valid System must contain at minimum:

```
systems/<name>/
├── system.json   # required — manifest, validates against schemas/system.schema.json
├── CLAUDE.md     # required — prompt injected into Claude Code at session start
└── README.md     # required — human docs for browsing on GitHub
```

Additional folders are optional — add them only if you need them:

```
├── skills/       # optional — Claude Code skills
├── agents/       # optional — subagents
├── commands/     # optional — slash commands
├── hooks/        # optional — hooks
└── settings.json # optional — Claude Code settings overrides (see template)
```

Both [`template/starter-system/`](../template/starter-system/) (the copy-me template) and [`systems/example-system/`](../systems/example-system/) (a permanently-valid CI fixture) demonstrate the minimal structure. Prefer copying the template:

```sh
cp -r template/starter-system systems/my-new-system
```

---

## 2. system.json — field by field

`system.json` validates against [`schemas/system.schema.json`](../schemas/system.schema.json) (JSON Schema draft-07, `additionalProperties: false` at every level — unknown fields are rejected). The schema and this doc, plus [`template/starter-system/`](../template/starter-system/), must never drift apart; if you change what's required, update all three.

### Required fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `name` | string | **required**, kebab-case `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 1–64 chars, **must equal the containing folder name** | Unique across the registry. CI checks uniqueness and folder equality; the JSON Schema checks only the pattern. |
| `displayName` | string | **required**, 1–80 chars | Human title shown in `list`/`info`/`search`. Example: `"Open Source Contributor"` |
| `version` | string | **required**, semver 2.0.0 | Pattern checks `MAJOR.MINOR.PATCH` with optional prerelease/build. Examples: `1.0.0`, `0.1.0`, `2.3.1-beta.1`. Bump following semver when you publish changes. |
| `description` | string | **required**, 10–300 chars | One-to-two-sentence summary shown in registry and `search` results. Write for a user scanning a list. |
| `keywords` | string[] | **required**, 1–15 items, each 1–32 chars, unique | Lowercase search terms, e.g. `["open-source","review","pr"]`. Used by `claude-system search`. |
| `author` | object | **required**, `additionalProperties: false` | `{ name (required), github (optional), url (optional) }`. `name` is display name (1–80 chars). `github` is handle without `@` (`^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$`). `url` is `https://` URI. |
| `license` | string | **required**, 1–64 chars | SPDX expression, e.g. `MIT`, `Apache-2.0`, `ISC`. Use a real SPDX id — CI does not validate against the full SPDX list but reviewers will flag non-SPDX values. |
| `claudeSystem` | object | **required**, `additionalProperties: false` | `{ specVersion (required string) }`. The System spec version this manifest targets, as semver (e.g. `"1.0.0"`). Used to detect breaking spec changes. Keep in sync with [`SYSTEM_SPEC.md`](../SYSTEM_SPEC.md). |
| `permissions` | string[] | **required**, default `[]`, unique, enum | See §3 below. Must be an honest superset of what the System may do. Empty means "no special capabilities declared". |

### Optional fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `category` | string | optional, enum | One of `["open-source","frontend","backend","testing","security","docs","research","devops","other"]`. Omit → treated as `other` for display. |
| `repository` | string (URI) | optional, `format: uri`, `^https?://` | **Recommended but optional.** URL of the author's *own* repo for this System if they maintain one outside this monorepo. If omitted, the System lives only in this monorepo under `systems/<name>/` — that's normal and preferred for most contributions. Do not fabricate a URL. |
| `bugs` | object | optional, `additionalProperties: false` | `{ url (required, https URI) }`. Where issue reports for this System should go. |
| `homepage` | string (URI) | optional, `format: uri`, `^https?://` | Docs or landing page for the System. |
| `dependencies` | `{name,version}[]` | optional, default `[]`, unique | Other Systems this one depends on. Each entry: `name` (kebab-case) + `version` (semver string or range like `^1.0.0`, `~0.2.3` — validated only as non-empty string). Keep empty unless you truly depend on another System. Multi-system resolution beyond the simple case is out of scope for MVP (see `SYSTEM_SPEC.md` §46). |

### repository / bugs fallback behavior (important)

These two fields trip up most first-time contributors:

- **`repository` is optional.** If you maintain the System only in this monorepo, omit `repository`. That's the expected case — don't invent a repo URL.
- **`bugs.url` is where to file issues for this System.** If `bugs` is **omitted**, tooling treats the default as **`<this monorepo>/issues` tagged with the System name** (e.g. `https://github.com/claude-system/claude-system/issues` with label `system:<name>`). It does **NOT** assume `repository + "/issues"` exists. If you set `repository`, you may still want an explicit `bugs.url` pointing either to that repo's issues or to this monorepo's issues — be explicit rather than relying on inference.
- **`homepage`** is purely informational; omitting it is fine.

**Example — minimal valid manifest (no external repo):**

```json
{
  "name": "my-team-docs",
  "displayName": "Team Docs Helper",
  "version": "0.1.0",
  "description": "Opinionated docs workflow with review checklists and release notes.",
  "keywords": ["docs", "writing"],
  "author": { "name": "Your Name" },
  "license": "MIT",
  "claudeSystem": { "specVersion": "1.0.0" },
  "permissions": ["filesystem:read"]
}
```

**Example — with external repo and explicit bugs:**

```json
{
  "name": "rails-review",
  "displayName": "Rails Review",
  "version": "1.2.0",
  "description": "Rails-focused code review System with custom skills and PR checklists.",
  "keywords": ["rails", "review", "backend"],
  "category": "backend",
  "author": { "name": "Ada Lovelace", "github": "ada", "url": "https://example.com" },
  "license": "MIT",
  "repository": "https://github.com/ada/rails-review-system",
  "bugs": { "url": "https://github.com/ada/rails-review-system/issues" },
  "homepage": "https://example.com/rails-review",
  "claudeSystem": { "specVersion": "1.0.0" },
  "dependencies": [],
  "permissions": ["filesystem:read", "network:read"]
}
```

Copy [`template/starter-system/system.json`](../template/starter-system/system.json) and replace the obviously-placeholder values (`"my-new-system"`, `"Your Name"`, `"https://example.com"`) — a PR that still contains them will be flagged in review.

---

## 3. Permissions — declare honestly

`permissions` is a **self-declared** list of capabilities the System may exercise at install/run time. It is **reviewed by maintainers during PR review but not independently verified at runtime** (see [`docs/security.md`](security.md)). Declare the honest superset:

| Permission | Meaning |
|---|---|
| `filesystem:read` | Reads files outside the installed System folder |
| `filesystem:write` | Writes or mutates files |
| `network:read` | Makes outbound network requests (fetch, clone) |
| `network:write` | Sends data out / pushes |
| `shell:exec` | Executes shell commands or scripts |
| `credentials:read` | Accesses credentials, tokens, or secrets |

Rules:

- **Default to least privilege.** Start with `[]` and add only what you need. An empty list is valid and preferred if your System only provides prompt/skills.
- **If your `hooks/` or `skills/` run `exec`, you need `shell:exec`.** Don't hide it.
- **If you fetch remote content at install or run time, include `network:read` (and `network:write` if you push).**
- **Reviewers will compare `permissions` against `skills/`, `agents/`, `commands/`, `hooks/`, and `CLAUDE.md`.** A System that declares `[]` but ships a hook that `curl | bash` will be rejected. This is a trust signal for users running `claude-system install` — see `docs/security.md`.

Users are expected to read `permissions` before installing, with the same scrutiny they'd give any third-party package.

---

## 4. Other files

### CLAUDE.md

This is the prompt injected when the user runs `claude-system run <name>`. Write it for the model, not for GitHub browsers:

- Role and goals ("You are a …")
- Workflows and quality bars
- When to use which `skills/`, `agents/`, `commands/`
- Repo-local gotchas and checklists

Keep it concise and actionable. See the placeholder in [`template/starter-system/CLAUDE.md`](../template/starter-system/CLAUDE.md) for structure.

### README.md

Human docs shown on GitHub under `systems/<name>/`. Explain what the System does, who it's for, prerequisites, and usage (`claude-system install <name>` → `claude-system run <name>`). Link to external docs if needed. The template's [`README.md`](../template/starter-system/README.md) tells you what to replace.

### settings.json (optional)

If you need to ship Claude Code settings, include `settings.json` at the System root. The template ships with minimal permissive defaults:

```json
{
  "permissions": {
    "allow": [],
    "deny": []
  }
}
```

Only add settings you truly need — prefer empty/permissive defaults and let the user narrow them.

---

## 5. Testing locally before opening a PR

Validate at least these checks before pushing — they mirror what `validate.yml` does in CI:

1. **Schema validity**

   ```sh
   # any draft-07 validator works; example with ajv-cli
   npx -y ajv-cli validate \
     -s schemas/system.schema.json \
     -d systems/<name>/system.json --strict
   ```

   Or, when the CLI is built:

   ```sh
   node cli/src/index.js validate systems/<name>
   # or: claude-system validate <name>
   ```

2. **Folder-name rule**

   ```sh
   # must pass: folder name == system.json name
   name=$(jq -r .name systems/<name>/system.json)
   [ "$name" = "<name>" ] && echo "ok" || echo "MISMATCH: folder <name> vs name $name"
   ```

3. **Required files present**

   ```sh
   test -f systems/<name>/system.json && test -f systems/<name>/CLAUDE.md && test -f systems/<name>/README.md && echo "required files ok"
   ```

4. **No unsafe hooks/scripts** — scan `hooks/` and `skills/` for `curl | sh`, `rm -rf /`, credential exfiltration, etc. (CI runs these checks; run them locally too.)

5. **Registry preview (optional)**

   ```sh
   node scripts/generate-index.js
   cat registry/index.json | jq '.systems[] | select(.name=="<name>")'
   git restore registry/index.json   # don't commit the generated file
   ```

If any check fails, fix it before opening the PR — it will fail in CI anyway.

---

## 6. PR flow

1. **Fork** this repo and clone your fork.

2. **Create a branch** from `main`:

   ```sh
   git checkout -b system/<your-name>
   ```

3. **Copy the template:**

   ```sh
   cp -r template/starter-system systems/<your-name>
   ```

   Replace `<your-name>` with the same kebab-case value you'll use for `"name"` in `system.json`.

4. **Edit** `systems/<your-name>/`:
   - `system.json` — fill every required field; change all placeholder values
   - `CLAUDE.md` — replace placeholder with real instructions
   - `README.md` — describe the System for humans
   - Add `skills/`, `agents/`, `commands/`, `hooks/`, `settings.json` as needed (delete empty placeholder folders if unused)

5. **Test locally** (see §5 above).

6. **Commit and push**, then **open a PR** targeting `main` with title like `Add system: <your-name>`. Fill the PR template — describe what the System does, why it's useful, and any `permissions` you declare.

7. **CI (`validate.yml`) runs** on every PR touching `systems/**`:
   - Schema validity against `schemas/system.schema.json`
   - Required files present (`system.json`, `CLAUDE.md`, `README.md`)
   - Folder name == `system.json:name`
   - Security checks on hooks/scripts
   - `registry/index.json` not hand-edited

   **All checks must pass before merge.** Keep pushing fixes until green — never ask a maintainer to bypass CI.

8. **Maintainer review** — a maintainer reviews `permissions`, content quality, and policy. They may request changes.

9. **Merge** — on merge, `scripts/generate-index.js` regenerates `registry/index.json` (or a maintainer runs it). Users can then:

   ```sh
   claude-system search <keyword>
   claude-system info <your-name>
   claude-system install <your-name>
   claude-system run <your-name>
   ```

---

## 7. `registry/index.json` is generated — never hand-edit it

`registry/index.json` is a **build artifact** rebuilt by `scripts/generate-index.js` from `systems/*/system.json`. It is the small file the CLI fetches for `search`/`list`/`info` so users don't clone the whole repo.

- **Do not edit `registry/index.json` by hand** in a System PR. Edit your `systems/<name>/system.json` instead; the index will be regenerated automatically.
- PRs that hand-edit `registry/index.json` (instead of editing a `system.json` and regenerating) will be flagged and required to fix.
- To preview what the index would contain after your change, run `node scripts/generate-index.js` locally and inspect the diff — but **restore it before committing** (`git restore registry/index.json`) unless you're the release path that intentionally commits the generated file.

---

## 8. Keeping the contract in sync

If you change what's required in a System, update **all three** together or the repo drifts:

- [`schemas/system.schema.json`](../schemas/system.schema.json)
- [`docs/creating-a-system.md`](creating-a-system.md) (this file)
- [`template/starter-system/`](../template/starter-system/)

See `CLAUDE.md` → *Common tasks*.

Questions? Open an issue or check [`docs/architecture.md`](architecture.md), [`docs/registry.md`](registry.md), and [`SYSTEM_SPEC.md`](../SYSTEM_SPEC.md).
