# Operations Playbook

## Local dev — copy-pasteable

```sh
git clone https://github.com/hariomlohardev/claude-system && cd claude-system
npm --prefix cli ci
npm --prefix cli run build            # tsc → cli/dist
npm --prefix cli test                 # vitest — must pass before PR
node cli/dist/index.js validate       # all systems + template
node cli/dist/index.js validate systems/my-system
node scripts/generate-index.js        # local registry check only
git restore registry/index.json       # do NOT commit generated index in PR
```

## Add a System (PR)

```sh
cp -r template/starter-system systems/my-system
# edit systems/my-system/system.json — name === folder, kebab-case
# edit systems/my-system/CLAUDE.md and README.md
# declare permissions[] honestly; setup.sh must have `# WHY:`
npm --prefix cli run build && node cli/dist/index.js validate systems/my-system
# open PR with only systems/my-system/ — validate.yml must be green
```

CI: [`.github/workflows/validate.yml`](../.github/workflows/validate.yml) (strict: schema, `name===folder`, required files, security). Merge → `scripts/generate-index.js` + [`.github/workflows/sync-registry.yml`](../.github/workflows/sync-registry.yml) syncs to Supabase.

## Cut a release

```sh
npm --prefix cli run build && npm --prefix cli test
node cli/dist/index.js validate && node scripts/generate-index.js
git tag vX.Y.Z && git push --follow-tags   # triggers release.yml
```

[`.github/workflows/release.yml`](../.github/workflows/release.yml): validates, regenerates registry, checks sorted, packages `cli/dist`, publishes npm + PyPI via thin wrappers, creates GitHub Release. `install.sh` fetches that Release asset.

## Vercel deploy

- `push` to `main` auto-deploys `https://claude-system-tau.vercel.app` (framework `Other`, Root `./`, Build OFF).
- Check:

```sh
curl -s https://claude-system-tau.vercel.app/api/registry | head -n 40
curl -s "https://claude-system-tau.vercel.app/api/search?q=example" | head -n 40
curl -s https://claude-system-tau.vercel.app/install | head -n 20
```

Config: [`vercel.json`](../vercel.json) rewrites `/install→/install.sh`, `/browse`, `/system`, `/s/:name`, `/docs*`; headers `/api` `s-maxage=60` + CORS; `cleanUrls: true`. Site is vanilla — [`public/style.css`](../public/style.css) + [`public/app.js`](../public/app.js).

## Supabase

- Project `claude-system` — tables `systems` + `system_versions`, RLS public read, `pg_trgm`, `search_vector`.
- API: [`api/registry.js`](../api/registry.js) · [`api/search.js`](../api/search.js) via [`api/_lib/supabase.js`](../api/_lib/supabase.js).
- Keys: not in repo — Vercel env + GitHub Secrets `SUPABASE_*` (URL, anon, service role). Do not commit.

## Secrets — never commit

- No `SUPABASE_*` values, no `private key material` in any file. Point to env instead.

## Links

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) · [`docs/creating-a-system.md`](../docs/creating-a-system.md) · [`docs/security.md`](../docs/security.md)
