# Flows & Lifecycles

## User flow — discover → install → run

```sh
# 1. discover (always fresh — Cache-Control: no-cache)
claude-system list                          # fetch /api/registry → registry/index.json
claude-system search open-source            # fetch /api/search?q=open-source
claude-system info example-system           # shows system.json + permissions[] + WHY note

# 2. install (copy to global store)
claude-system install example-system        # → ~/.claude-system/systems/example-system/
                                            # + ~/.claude-system/systems.json { version, installedAt, setupDone:false }

# 3. run — first time: consent; afterwards: just launch
claude-system run example-system            # 1st: read setup.sh → extractWhyMessage → y/N prompt
                                            #      setup.sh exit 0 → setupDone:true (persisted)
                                            #      setup.sh exit 1 → surfaced, setupDone stays false
                                            # 2nd+: skip setup, spawn `claude` in that System dir
claude-system run example-system -- --help  # forwards `-- <args>` to claude

# 4. maintain
claude-system update example-system         # preserve setupDone
claude-system update --all
claude-system remove example-system
claude-system list --installed
claude-system doctor                        # diagnostics
```

See [`cli/src/commands/run.ts`](../cli/src/commands/run.ts) · [`cli/src/lib/setupRunner.ts`](../cli/src/lib/setupRunner.ts) · [`cli/src/lib/storage.ts`](../cli/src/lib/storage.ts).

## Contributor flow — add a System via PR

```sh
cp -r template/starter-system systems/my-system
# edit systems/my-system/system.json — name must equal folder (kebab-case)
# edit systems/my-system/CLAUDE.md and README.md
# permissions[] honestly, setup.sh must contain `# WHY:` if present

npm --prefix cli ci && npm --prefix cli run build
node cli/dist/index.js validate systems/my-system
node cli/dist/index.js validate               # all systems + template
node scripts/generate-index.js               # local check only
git restore registry/index.json              # DO NOT commit generated index in PR

# PR: only systems/my-system/ files
# CI: .github/workflows/validate.yml must be green — strict checks
# Merge → generate-index + sync-registry.yml syncs to Supabase → /api/registry fresh
```

Checklist: `system.json` validates (zod mirror of [`schemas/system.schema.json`](../schemas/system.schema.json)), `name===folder`, required files present, `permissions[]` declared, no unsafe patterns, `registry/index.json` not hand-edited.

## Release flow — tag → publish

```sh
git tag vX.Y.Z
git push --follow-tags                        # triggers .github/workflows/release.yml
```

`release.yml` steps:

```text
checkout → setup-node 20 + setup-python 3.11 → npm ci → npm run build → npm test
→ validate all systems + template → node scripts/generate-index.js → validate registry schema + sorted
→ package cli/dist artifacts + registry/index.json → publish npm + PyPI (packaging/*) → GitHub Release
```

Vercel web auto-deploys on `push` to `main` — `https://claude-system-tau.vercel.app`.

## Diagram (from README)

```
Systems PR → validate.yml → merge → registry/index.json (generated) → Supabase sync
→ claude-system install (via /api/registry) → ~/.claude-system/systems/<name>/
→ claude-system run → claude inside System
```

## Links

- [`cli/src/lib/registry.ts`](../cli/src/lib/registry.ts) · [`scripts/generate-index.js`](../scripts/generate-index.js) · [`.github/workflows/validate.yml`](../.github/workflows/validate.yml) · [`.github/workflows/release.yml`](../.github/workflows/release.yml)
