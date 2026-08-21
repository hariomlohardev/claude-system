# Design & Web (pointer)

This is a **pointer** — not a rewrite. The canonical design spec is [`.claude/DESIGN.md`](DESIGN.md).

## Current state (as of 2026-08 · commit `005cd75`)

- **Host:** Vercel `Other` (Root `./`, Build OFF), vanilla HTML/CSS/JS. Single shared stylesheet [`public/style.css`](../public/style.css) (Inter + JetBrains Mono, tokens `#FDFDF7` bg / `#141413` text / `#D97757` clay / `#DEDCD1` line / `#0B0C0E` code dark, `Header 56px` `Sidebar 256px` `Content 720px` `Radius 8/12/16`), single [`public/app.js`](../public/app.js) (sidebar/search/TOC).
- **Chrome:** sticky 56px header (brand `CS` + nav Registry/Browse/Docs/GitHub + `Star` CTA), hero with dark `bash — claude-system` card `#0B0C0E`, stats 4-col, cards `12px` + line `#DEDCD1`, ledger rows, docs shell `256px` sidebar + prose `720px` + TOC `≥1100px`, search `⌘K`, mobile drawer, multi-col footer. No AI chat widget.
- **Pages:** `/` ([`index.html`](../index.html)) · `/browse` ([`browse/index.html`](../browse/index.html)) · `/system?name=<name>` + `/s/:name` ([`system/index.html`](../system/index.html)) · `/docs` hub + `/docs/creating-a-system` `/security` `/spec` `/cli` `/contributing` ([`docs/`](../docs/)) · [`404.html`](../404.html).
- **Live:** `https://claude-system-tau.vercel.app` · `…/api/registry` · `…/api/search?q=` backed by Supabase via [`api/`](../api/).
- **Routing:** [`vercel.json`](../vercel.json) rewrites `/install→/install.sh` (text/plain), `/browse→/browse/index.html` etc., headers `/api` `s-maxage=60` CORS, `cleanUrls: true`.

## Where to edit

- Design tokens/chrome → [`public/style.css`](../public/style.css) + [`public/app.js`](../public/app.js) + page shells.
- Design intent → [`.claude/DESIGN.md`](DESIGN.md) (editorial/ledger system).
- Docs mirror → [`docs/creating-a-system.md`](../docs/creating-a-system.md).

## Note

Read the actual [`public/style.css`](../public/style.css) before changing design — this file only points.
