# web-vercel — Vercel static UI

`web-vercel/` is the **single folder for Vercel static output** — everything `https://claude-system-tau.vercel.app` serves as UI lives here.

- `web-vercel/index.html` → `https://claude-system-tau.vercel.app/` (via `vercel.json` rewrite `/(.*)` → `/web-vercel/$1`)
- `web-vercel/browse/` → `/browse`
- `web-vercel/system/` → `/system` + `/s/:name`
- `web-vercel/docs/**` → `/docs` + `/docs/:path*`
- `web-vercel/public/**` → `/public/:path*` (style.css, app.js, og images)
- `web-vercel/docs/assets/demo.*` — Vercel copy of the demo; `docs/assets/demo.*` at repo root is kept for GitHub README (`./docs/assets/demo.gif`) so both places serve the same file (duplicated, not symlinked).
- `web-vercel/sitemap.xml` + `web-vercel/robots.txt` — site-root statics

**What stays at repo root (not UI):**

- `api/` — Vercel serverless functions (`/api/registry`, `/api/search`, …) — must stay at root because Vercel looks for `api/` at root by default. No `outputDirectory` dashboard change needed; Strategy A rewrites keep `/api` first.
- `install.sh` — stays at root and is exposed as `/install` via `vercel.json` `"/install"` → `"/install.sh"`.
- `vercel.json` — stays at root, rewrites everything to `/web-vercel/*` (catch-all last, `/install` + `/api` first).
- `cli/`, `schemas/`, `systems/`, `scripts/`, `template/` — never moved — not Vercel UI.
- `docs/*.md` markdown sources stay at root; only built HTML moved.

**Strategy:** **A — rewrites** (no `outputDirectory` dashboard setting). Keeps `api/` and `install.sh` at root, no dashboard change, fully provable via `curl` before/after.
