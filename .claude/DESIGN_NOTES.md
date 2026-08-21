# Design & Web (pointer)

Keywords: web-vercel, DESIGN.md, design-exaples, SHASUMS, install.ps1

This is a **pointer** — not a rewrite. The canonical design spec is [`.claude/DESIGN.md`](DESIGN.md).

## Current state (as of 2026-08-21 · commit `650e2b9`)

- **Host:** Vercel `Other` (Root `./`, Build OFF), vanilla HTML/CSS/JS, **single folder `web-vercel/`** (not `public/` at repo root). Single shared stylesheet [`web-vercel/public/style.css`](../web-vercel/public/style.css) (tokens `--paper:#F6F4EE --ink:#181611 --accent:#B93A13` + `--serif Fraunces --sans Archivo --mono Space Mono`, `Header 56px` `Sidebar 256px` `Content 720px` `Radius 0` ledger), single [`web-vercel/public/app.js`](../web-vercel/public/app.js) (sidebar/search/TOC/copy/tabs/`#prog`).
- **Chrome:** sticky 56px header (brand `CS` + nav Registry/Browse/Docs/GitHub + `Star` CTA), hero with dark `bash — claude-system` card `#0B0C0E`, stats 4-col, cards `12px` + line `#DAD5C6`, ledger rows `80px 1fr 110px ::before accent`, docs shell `256px` sidebar + prose `720px` + TOC `≥1100px`, search `⌘K`, mobile drawer, multi-col footer. No AI chat widget. See [DESIGN.md:1 Philosophy](../.claude/DESIGN.md) — *paper + ink + one warm accent*.
- **Pages (single source `web-vercel/`):** `/` ([`web-vercel/index.html`](../web-vercel/index.html)) · `/browse` ([`web-vercel/browse/index.html`](../web-vercel/browse/index.html)) · `/system?name=<name>` + `/s/:name` ([`web-vercel/system/index.html`](../web-vercel/system/index.html)) · `/docs` hub + `/docs/creating-a-system` `/security` `/spec` `/cli` `/contributing` ([`web-vercel/docs/`](../web-vercel/docs/)) · [`web-vercel/404.html`](../web-vercel/404.html) · `robots.txt`/`sitemap.xml` at `web-vercel/`.
- **Live:** `https://claude-system-tau.vercel.app` · `…/api/registry` (s-maxage=60) · `…/api/search?q=` backed by Supabase via [`api/`](../api/) (see [DATA.md](DATA.md)).
- **Routing:** [`vercel.json:3`](../vercel.json) rewrites `/install→/install.sh` (text/plain), `/install.ps1→text/plain` (new), `/browse→/web-vercel/browse/index.html`, `/s/:name→/web-vercel/system`, `/docs*→/web-vercel/docs*`, catch-all `/(.*)→/web-vercel/$1` keeps `Other` green. No `public/` at repo root as source.
- **Design source:** [`.claude/DESIGN.md`](DESIGN.md) is the law (editorial/ledger system — paper + ink + accent). The 5 HTML examples are in [`.claude/design-exaples/`](../.claude/design-exaples/) (`index.html`, `systems.html`, `cli.html`, `docs.html`, `create-system.html`) — see [DESIGN_EXAMPLES_PLAN.md](DESIGN_EXAMPLES_PLAN.md) for keep-vs-tweak table (now reflects unified `curl .../install | sh` primary + `install.ps1` alternative).

## Where to edit

- Design tokens/chrome → [`web-vercel/public/style.css`](../web-vercel/public/style.css) + [`web-vercel/public/app.js`](../web-vercel/public/app.js) + page shells in `web-vercel/`.
- Design intent → [`.claude/DESIGN.md`](DESIGN.md) (editorial/ledger, minimal, paper + ink + stamp accent, single `--accent` used sparingly).
- Site IA → [`vercel.json`](../vercel.json) rewrites + [`web-vercel/README.md`](../web-vercel/README.md) one-para “single folder” note.
- Docs mirror → [`docs/creating-a-system.md`](../docs/creating-a-system.md) (must stay in sync with schema + template).

## Note

Read the actual [`web-vercel/public/style.css:1`](../web-vercel/public/style.css) `:root` tokens before changing design — this file only points. Never add a second web folder (`public/` at root) — the migration to `web-vercel/` is complete and `validate.yml` scope discipline step proves raw fallback still works.

See also: Stack → [STACK.md](STACK.md), Structure → [STRUCTURE.md](STRUCTURE.md), Flows → [FLOWS.md](FLOWS.md)
