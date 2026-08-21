# Operations Playbook

Keywords: install.ps1, CODEOWNERS, Ruleset bypass, Supabase sync, web-vercel

## Local dev — copy-pasteable

```sh
git clone https://github.com/hariomlohardev/claude-system && cd claude-system
npm --prefix cli ci
npm --prefix cli run build            # tsc → cli/dist
npm --prefix cli test                 # vitest (47 tests) — must pass before PR
node cli/dist/index.js validate       # all systems + template (checks name===folder, permissions, SHASUMS not needed)
node cli/dist/index.js validate systems/my-system
node scripts/generate-index.js        # local registry check only — validates 2 systems sorted, guard expectedCount
git restore registry/index.json       # do NOT commit generated index in PR (validate.yml checks stale via jq -S '.systems')
```

## Add a System (PR)

```sh
cp -r template/starter-system systems/my-system
# edit systems/my-system/system.json — name === folder, kebab-case, permissions honest (add network:write if you push)
# edit systems/my-system/CLAUDE.md and README.md
# declare permissions[] honestly; setup.sh must have `# WHY:` if present
npm --prefix cli run build && node cli/dist/index.js validate systems/my-system
# open PR with only systems/my-system/ — validate.yml must be green (strict + stale-registry + scope discipline raw fallback)
# CODEOWNERS auto-requests @hariomlohardev; Ruleset protect-main requires validate + 1 review unless you bypass
```

CI: [`.github/workflows/validate.yml:30`](../.github/workflows/validate.yml) (strict: schema, `name===folder`, required files, `version bump`, `permissions vs setup.sh`, `WHY`, `unsafe scan`, `hand-edit guard`, `stale-registry jq`, `scope discipline` raw fallback) + `.github/workflows/sync-registry.yml:1` ADR cache. Merge → `scripts/generate-index.js` + `sync-registry.yml` (fetch-depth:0, `npm ci` hard, `cache-dependency-path`) syncs to Supabase.

**Example honest System:** [`systems/oss-contrib-finder/system.json:24`](../systems/oss-contrib-finder/system.json) — 5 perms `filesystem:read/write + network:read/write + shell:exec` for shadow-reviewer pushes.

## Cut a release

```sh
npm --prefix cli run build && npm --prefix cli test
node cli/dist/index.js validate && node scripts/generate-index.js
cat CHANGELOG.md | head -n 30                         # hand-curated Keep a Changelog since v0.2.0 (SemVer)
git tag vX.Y.Z && git push --follow-tags              # triggers release.yml — do NOT spam v9.9.9 tags to test
# dry-run: gh workflow run release.yml --ref main (workflow_dispatch → skips npm/pypi publish, not fail)
# hard-fail on tag if NPM_TOKEN missing (soft-skip only on workflow_dispatch), npm ci hard (no || fallback)
```

[`.github/workflows/release.yml:42`](../.github/workflows/release.yml): validates, regenerates registry, `sha256sum registry/index.json dist/* > SHASUMS256.txt` + `sha256sum -c` verify, packages `cli/dist`, publishes npm `--provenance` + PyPI OIDC (`id-token: write`), creates GitHub Release with `dist/* + registry/index.json + SHASUMS256.txt`. `install.sh:211` fetches `$RELEASE_URL/SHASUMS256.txt` and verifies before `chmod +x` — fail-hard.

`install.sh` EACCES handling: `npm_install_fallback` tries global then `~/.npm-global` prefix if apt node.

## Install — bash vs PowerShell

```sh
# macOS / Linux / Git Bash on Windows:
curl -fsSL https://claude-system-tau.vercel.app/install | sh
curl -fsSL https://raw.githubusercontent.com/hariomlohardev/claude-system/main/install.sh | sh

# Windows native (no WSL/Bash required) — PowerShell 5.1:
powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/hariomlohardev/claude-system/main/install.ps1 | iex"
# or download then run:
curl -fsSL https://claude-system-tau.vercel.app/install.ps1 -o install.ps1; powershell -ExecutionPolicy Bypass -File install.ps1
# Verify:
claude-system --help && claude-system list
```

`install.ps1:9` mirrors `install.sh:59` Node>=18 gate fail-hard, then `npm install -g claude-system --prefix $env:APPDATA\npm` → PATH check `Get-Command claude-system`.

Alternatives: `npm i -g claude-system` · `pip install claude-system` (thin wrappers publish same `cli/dist`).

## Vercel deploy

- `push` to `main` auto-deploys `https://claude-system-tau.vercel.app` (framework `Other`, Root `./`, Build OFF, **single source `web-vercel/`**).
- Check live:

```sh
curl -s https://claude-system-tau.vercel.app/api/registry | head -n 40
curl -s "https://claude-system-tau.vercel.app/api/search?q=oss-contrib-finder" | head -n 40
curl -s https://claude-system-tau.vercel.app/install | head -n 20
curl -s https://claude-system-tau.vercel.app/install.ps1 | head -n 20
curl -I https://claude-system-tau.vercel.app/install.ps1 | head -n 5
curl -s https://raw.githubusercontent.com/hariomlohardev/claude-system/main/install.ps1 | head -n 20
curl -s https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/oss-contrib-finder/system.json | python -c "import json,sys; print(json.load(sys.stdin)['permissions'])"
```

Config: [`vercel.json:1`](../vercel.json) rewrites `/install→/install.sh`, `/install.ps1` text/plain, `/browse→/web-vercel/browse/index.html`, `/s/:name→/web-vercel/system`, `/docs*→/web-vercel/docs*`, catch-all `/(.*)→/web-vercel/$1`; headers `/api` `s-maxage=60` + CORS; `cleanUrls: true`. Site is vanilla — [`web-vercel/public/style.css`](../web-vercel/public/style.css) + [`web-vercel/public/app.js`](../web-vercel/public/app.js) (see [DESIGN_NOTES.md](DESIGN_NOTES.md) → [DESIGN.md](DESIGN.md) for tokens).

## Supabase

- Project `claude-system` — tables `systems` + `system_versions`, RLS public read, `pg_trgm`, `search_vector`, `downloads` counter, `pg_trgm` index.
- API: [`api/registry.js:18`](../api/registry.js) · [`api/search.js:12`](../api/search.js) via [`api/_lib/supabase.js:8`](../api/_lib/supabase.js) (`s-maxage=60`, `stale-while-revalidate=300`).
- Sync: [`scripts/sync-supabase.js:12`](../scripts/sync-supabase.js) upserts `registry/index.json` → `systems` (service_role). Triggered by `.github/workflows/sync-registry.yml` on `push:main` paths `systems/**, registry/index.json, scripts/generate-index.js` (fetch-depth:0, npm ci hard).
- Keys: not in repo — Vercel env + GitHub Secrets `SUPABASE_*` (URL, anon, service role). Do not commit.
- Check counts:

```sh
# via API (public):
curl -s https://claude-system-tau.vercel.app/api/registry | python -c "import json,sys; d=json.load(sys.stdin); print(len(d['systems']))"
# via SQL (service_role in Vercel/GitHub only):
# SELECT count(*) FROM systems; SELECT name, version, permissions FROM systems WHERE name='oss-contrib-finder';
```

## CODEOWNERS & Ruleset

```sh
cat .github/CODEOWNERS
# * @hariomlohardev
# systems/** @hariomlohardev
# .github/workflows/** @hariomlohardev

gh api repos/hariomlohardev/claude-system/contents/.github/CODEOWNERS --jq .name
# Check Ruleset (Bypass = you):
gh api repos/hariomlohardev/claude-system/rulesets --jq '.[] | {name: .name, enforcement: .enforcement, bypass: .bypass_actors}'
# protect-main — hariomlohardev in Bypass (you bypass, others need 1 review + validate)
```

Direct push (you bypass) — no PR needed for docs:
```sh
git push origin HEAD:main  # succeeds via Bypass, else add yourself in Settings → Rulesets → protect-main → Bypass list → Users → hariomlohardev
```

Otherwise PR + `gh pr create` → `validate.yml` must be green before merge.

## Secrets — never commit

- No Supabase values, no private keys, no npm tokens in any file. Point to env instead (Vercel env / GitHub Secrets).

## Links

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) · [`docs/creating-a-system.md`](../docs/creating-a-system.md) · [`docs/security.md`](../docs/security.md) · [`.github/CODEOWNERS`](../.github/CODEOWNERS) · [`install.sh`](../install.sh) · [`install.ps1`](../install.ps1)

See also: Contracts → [CONTRACTS.md](CONTRACTS.md), Flows → [FLOWS.md](FLOWS.md), Data → [DATA.md](DATA.md)
