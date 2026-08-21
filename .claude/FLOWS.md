# Flows & Lifecycles

Keywords: install.ps1, sync-registry, web-vercel, SHASUMS, update backup

## User flow — discover → install → run

```sh
# 1. discover (always fresh — Cache-Control: no-cache, two-tier Vercel→raw)
claude-system list                          # fetch /api/registry (s-maxage=60) → fallback raw.githubusercontent.com
claude-system search open-source            # fetch /api/search?q=open-source (pg_trgm + search_vector)
claude-system info example-system           # shows system.json + permissions[] + WHY note (from installed copy if present)

# 2. install (copy to global store) — two entrypoints:
# macOS / Linux / Git Bash on Windows:
curl -fsSL https://claude-system-tau.vercel.app/install | sh        # → install.sh:59 Node>=18 gate → SHASUMS verify → npm fallback
# Windows native (no WSL/Bash required):
powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/hariomlohardev/claude-system/main/install.ps1 | iex"
# → install.ps1:9 #Requires -Version 5.1 → npm install -g claude-system → PATH check

claude-system install example-system        # → ~/.claude-system/systems/example-system/ (see [storage.ts:46](../cli/src/lib/storage.ts))
                                            # + ~/.claude-system/systems.json { version, installedAt, setupDone:false, installedFiles[] }

# 3. run — first time: consent; afterwards: just launch
claude-system run example-system            # 1st: read setup.sh → extractWhyMessage → y/N prompt (see [setupRunner.ts:24](../cli/src/lib/setupRunner.ts))
                                            #      setup.sh exit 0 → setupDone:true (persisted)
                                            #      setup.sh exit 1 → surfaced, setupDone stays false
                                            # 2nd+: skip setup, spawn `claude` in that System dir via [claudeLauncher.ts:37](../cli/src/lib/claudeLauncher.ts)
claude-system run example-system -- --help  # forwards `-- <args>` via [run.ts:19 `command.args.slice(1)`](../cli/src/commands/run.ts) → claude --help

# 4. maintain (manifest-aware)
claude-system update example-system         # preserve setupDone; detects Modified+Untracked via sha256 manifest → [o]verwrite / [b]ackup to .bak.<timestamp> / [a]bort (default abort, non-TTY abort)
claude-system update --all
claude-system remove example-system         # flat delete: rm -rf ~/.claude-system/systems/<name>/ (including untracked) — documented in [remove.ts:9](../cli/src/commands/remove.ts)
claude-system list --installed
claude-system doctor                        # diagnostics: Node, claude on PATH, storage health, registry fetch
```

See [`cli/src/commands/run.ts:16`](../cli/src/commands/run.ts) · [`setupRunner.ts`](../cli/src/lib/setupRunner.ts) · [`storage.ts`](../cli/src/lib/storage.ts) · [`registry.ts:13`](../cli/src/lib/registry.ts).

## Contributor flow — add a System via PR

```sh
cp -r template/starter-system systems/my-system
# edit systems/my-system/system.json — name must equal folder (kebab-case), permissions honest (network:write if you push)
# edit systems/my-system/CLAUDE.md and README.md
# permissions[] honestly, setup.sh must contain `# WHY:` if present

npm --prefix cli ci && npm --prefix cli run build
node cli/dist/index.js validate systems/my-system
node cli/dist/index.js validate               # all systems + template
node scripts/generate-index.js               # local check only — validates 2 systems sorted
git restore registry/index.json              # DO NOT commit generated index in PR (CI checks fresh via jq -S '.systems' diff)

# PR: only systems/my-system/ files (CODEOWNERS auto-requests @hariomlohardev)
# CI: .github/workflows/validate.yml must be green — strict checks:
#   schema + name===folder + required files + version bump + permissions vs setup.sh + WHY + unsafe scan + hand-edit guard + stale-registry (jq diff) + scope discipline (raw fallback)
# Merge → registry/index.json regenerated + committed → sync-registry.yml (fetch-depth:0, npm ci hard) syncs to Supabase → /api/registry fresh (Vercel s-maxage=60)
```

Checklist: `system.json` validates (zod mirror of [`schemas/system.schema.json`](../schemas/system.schema.json)), `name===folder`, required files present, `permissions[]` declared, no unsafe patterns, `registry/index.json` not hand-edited.

## Release flow — tag → publish

```sh
npm --prefix cli run build && npm --prefix cli test
node cli/dist/index.js validate && node scripts/generate-index.js
cat CHANGELOG.md | head -n 20                         # hand-curated Keep a Changelog since v0.2.0
git tag vX.Y.Z && git push --follow-tags              # triggers .github/workflows/release.yml (no manual v9.9.9)
# Or dry-run: gh workflow run release.yml --ref main (workflow_dispatch → skips publish, not fail)
```

`release.yml` steps (see [release.yml:42](../.github/workflows/release.yml)):

```text
checkout (fetch-depth:0) → setup-node 20 + setup-python 3.11 (cache npm, cache-dependency-path: cli/package-lock.json) → npm ci hard → npm run build → npm test
→ validate all systems + template → node scripts/generate-index.js → validate registry schema + sorted + stale-registry check
→ package cli/dist artifacts + registry/index.json → sha256sum registry/index.json dist/* → SHASUMS256.txt → verify (sha256sum -c)
→ action-gh-release (dist/*, registry/index.json, SHASUMS256.txt) → publish npm --provenance (hard-fail on tag if NPM_TOKEN missing, soft-skip on workflow_dispatch)
→ publish pypi via OIDC (hard-fail on tag, soft-skip on workflow_dispatch) — id-token: write
```

`install.sh:211` fetches `SHASUMS256.txt` from `$RELEASE_URL/SHASUMS256.txt` and verifies before `chmod +x` — fail-hard.

Vercel web auto-deploys on `push` to `main` — `https://claude-system-tau.vercel.app` (framework `Other`, Root `./`, Build OFF, `web-vercel/` single source).

## Diagram (from README, now with web-vercel + install.ps1 + SHASUMS)

```
Systems PR → validate.yml (jq stale check) → merge → registry/index.json (generated, 2 systems) → Supabase sync (sync-registry.yml:1 ADR read-through cache)
→ claude-system install (via /api/registry s-maxage=60 → fallback raw) → ~/.claude-system/systems/<name>/ + systems.json (setupDone + installedFiles)
→ claude-system run (command.args.slice(1) → claude inside web-vercel System) → SHASUMS verify on install.sh/ps1
Web: web-vercel/ → Vercel Other → https://claude-system-tau.vercel.app → /install.sh + /install.ps1 (text/plain) + /api/registry
```

## Links

- [`cli/src/lib/registry.ts:13`](../cli/src/lib/registry.ts) two-tier fetch · [`scripts/generate-index.js:99`](../scripts/generate-index.js) · [`.github/workflows/validate.yml:30`](../.github/workflows/validate.yml) · [`.github/workflows/release.yml:42`](../.github/workflows/release.yml) · [`sync-registry.yml:1`](../.github/workflows/sync-registry.yml) · [`install.sh:211`](../install.sh) · [`install.ps1:9`](../install.ps1)

See also: Contracts → [CONTRACTS.md](CONTRACTS.md), Operations → [OPERATIONS.md](OPERATIONS.md), Data → [DATA.md](DATA.md)
