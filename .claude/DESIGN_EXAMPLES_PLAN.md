# Design Examples Plan — keep design, tweak copy

Keywords: web-vercel, install.ps1, DESIGN.md, SHASUMS, oss-contrib-finder

> Inventory of `.claude/design-exaples/` (5 HTML) then tweaks to make them our registry. Design tokens/fonts/motifs stay **exactly** as `DESIGN.md` — only text/commands/links are custom. Last updated: 2026-08-21 · commit 650e2b9 · `web-vercel/` live, `install.ps1` added.

## Inventory

| File | Sections | Key components | Keep vs tweak |
|---|---|---|---|
| `index.html` | hero / 01 Install (OS tabs) / 02 Systems (3 rows) / 03 Activity (commits) / footer | eyebrow `11.5px+9px diamond` + `h1 clamp(3rem,9.5vw,7.6rem)` + `os-tabs pill on` + `os-panel show` + `codeblock ink+Copy` + `ledger .row 80px 1fr 110px ::before accent` + `type-icon docs/create/start/commit` + `.rv` | Keep all structure/tokens/motifs. Tweak eyebrow, h1, lede, OS tabs (bash + PowerShell), rows → Browse/Create/CLI, commit hashes |
| `systems.html` | hero "The systems" / toolbar (search+count+filters) / ledger 4 rows / In detail 4 × detail / CTA band | `toolbar` underline search + `pill[aria-pressed]` + `row 110px 1fr 120px` + `row-tags #` + `row-cmd code` + `detail 1.05fr .95fr` + `codeblock ink` + `cta-band sheet+ink` | Keep toolbar/ledger/detail patterns. Tweak rows from built-ins (editorial/ledger/notebook/docs) → live `example-system` + `oss-contrib-finder` + filter by `category` |
| `cli.html` | sidebar Filter + groups (Basics/Commands/Reference) / content Overview+Global+6 commands / TOC | `docs 260px 1fr 210px` + `side-search` + `side-group a::before accent` + `crumb` + `doc-h1/doc-lede/doc-meta` + `cmd-sig ink` + `codeblock` + `callout/tip/warn` + `table-wrap` + `pager/endmark` | Keep sidebar/toc/prose/codeblock/table/callout. Tweak commands from `init/new/serve/build/check/list` → our 12 (`list/search/info/install/remove/update/run/create/validate/report/doctor/completion`) |
| `docs.html` | sidebar Start/Guide/Reference/Help / content 9 sections | same 3-zone docs layout + `prose h2 § counter` + `codeblock` + `callout` + `table` | Keep layout. Tweak sections from generic guide (tokens/components) → `creating-a-system/security/spec/cli` from real `docs/*.md` |
| `create-system.html` | sidebar Start/Build/Assemble/Ship / content 11 steps | same docs layout + `prose` + `codeblock` + `table` + `pager` | Keep layout. Tweak steps from generic system builder → our contributor flow (`cp -r template/starter-system` + `system.json` + `validate` + PR) |

## Design stays same

Tokens/fonts/motifs/components/templates from `DESIGN.md` are kept — no new palette/font:

- `:root` `--paper:#F6F4EE --ink:#181611 --accent:#B93A13 --green:#1E7A4E --line:#DAD5C6` + `--max:1200px --pad:clamp --serif Fraunces --sans Archivo --mono Space Mono`
- Grain `body::after` SVG noise `opacity .05 multiply`, `#prog` 2px accent, header `rgba(246,244,238,.94)+blur(10px)`, `CS` monogram accent crossbar+dot, 9px rotated diamond, left 2px accent `scaleY`, section `clamp(44px,6vw,76px)+hairlines`, sharp `border-radius:0`, ledger `80px 1fr 110px` etc.
- Fonts Fraunces 400/600/400i/600i + Archivo 400/500/600 + Space Mono 400 — not Inter/Geist.

## Tweaks — text / commands / customization

| Area | From (example) | To (our customization) | Reason |
|---|---|---|---|
| Hero eyebrow | `DESIGN SYSTEM · VERSION 1.0` | `01 — Registry · Supabase live · v0.2.0` | Name registry + liveness + version (now v0.2.0, Supabase `systems` 2) |
| Hero h1 | `Claude System` | `Systems for <em>Claude Code</em>` | Product is Systems for Claude Code |
| Hero lede | quiet design system … via curl/npm/pip | `A curated registry — install a complete workflow in one shot. Fetched fresh from <code>/api/registry</code> (Supabase live, raw fallback).` | Must mention registry + fresh fetch + curl + fallback |
| Install tabs | win `install.ps1` + npm + pip / mac `install.sh` | **Bash primary:** `curl -fsSL https://claude-system-tau.vercel.app/install \| sh` (also Git Bash on Windows) + **Windows native:** `irm https://raw.githubusercontent.com/hariomlohardev/claude-system/main/install.ps1 \| iex` (PowerShell 5.1, no WSL) + alt `npm i -g claude-system` / `pip install claude-system` | Both entrypoints at repo root (`install.sh` + `install.ps1` at root, `vercel.json:65` text/plain) serve same artifact; Windows no longer needs WSL — see [OPERATIONS.md](../OPERATIONS.md#install--bash-vs-powershell) |
| Systems rows | `01 Docs / 02 Create a system / 03 Get started` | `01 Browse → /browse` (live grid from /api/registry), `02 Create → /docs/creating-a-system`, `03 CLI → /docs/cli` · tags `browse / create / cli` + live `oss-contrib-finder` row | Our IA is browse/docs/cli + real 2 systems |
| Activity | `a3f9c21 / 7b4e8d0 / e19ab44` placeholders | Live `git log --oneline -3` hashes+titles+dates, links to `hariomlohardev/claude-system/commits` (now `650e2b9`, `bf1f4d7`, `abb8c55`) | Must show real commits including `install.ps1` |
| Docs hub | Tokens/components/templates | `01 Guide / 02 Trust / 03 Contract / 04 CLI` → real `docs/creating-a-system.md` etc. (now with `network:write` honest) | Docs are about Systems not tokens |
| CLI rows | 6 commands `init/new/serve/build/check/list` | 12 commands `list/search/info/install/remove/update/run/create/validate/report/doctor/completion` with real flags `--installed/--category/--all/ -- <args>` (incl. manifest-aware `update`) | Our CLI is the product |
| Footer System/Spec/Repo | → `DESIGN.md` | `Registry→/browse · Docs→/docs · Community→ https://github.com/hariomlohardev/claude-system/discussions` + `©+G→repo+Back to top` | Community is Discussions |
| Nav | Home/Install/Systems/Docs/Activity | `Home / Browse / Docs / CLI / GitHub` + `Install` anchor `#install` — every `href` has matching `id` | Registry-first IA |

## Sitemap we implement — now `web-vercel/` single source

```
/               → web-vercel/index.html (hero + install bash/ps1 tabs + systems rows + activity)
/browse         → web-vercel/browse/index.html (from systems.html: search → /api/search?q= + pills ?category=)
/system?name=<name> → web-vercel/system/index.html (row+manifest table+install block)
/s/:name        → rewrite → web-vercel/system via vercel.json:8
/docs           → web-vercel/docs/index.html (from docs.html hub)
/docs/creating-a-system, /docs/security, /docs/spec, /docs/cli, /docs/contributing → web-vercel/docs/<name>/index.html
/install        → /install.sh (bash, text/plain, SHASUMS verify)
/install.ps1    → /install.ps1 (PowerShell 5.1, text/plain, Node>=18 gate)
404.html         → web-vercel/404.html
```

`system detail` uses `row` + `install block` + `manifest table` (DESIGN.md §8.13) — not in examples but composed from them.

## Implementation order — now `web-vercel/`

`web-vercel/public/style.css` (verify tokens --paper/--ink/--accent) → `web-vercel/public/app.js` (reveal/menu/copy/tabs/G + search) → `web-vercel/index.html` → `web-vercel/browse/index.html` → `web-vercel/system/index.html` → `web-vercel/docs/**` → `vercel.json:3` rewrites/headers (web-vercel + install.ps1) → verify → push.

Plan is record — future AI reads this + `DESIGN.md` to rebuild. See also: [DESIGN_NOTES.md](DESIGN_NOTES.md) → single folder, [STRUCTURE.md](STRUCTURE.md) → annotated tree.

Last tweak sync: 2026-08-21 — `install.ps1` alternative added, `web-vercel/` consolidation done, `oss-contrib-finder` @ network:write live.
