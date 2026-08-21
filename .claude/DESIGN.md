# DESIGN.md — Design System Reference for claude-system

> A complete design-system specification for the **claude-system registry** — a minimal, editorial, print-inspired web for a curated Systems marketplace for Claude Code.
> Any agent, model, or developer building or extending these pages MUST follow this document exactly.
> When in doubt: *minimal, editorial, quiet. Paper + ink + one warm accent. Never loud, never glossy, never crowded. This is a lab ledger for workflows, not a marketing site.*

---

## Table of Contents
1. [Philosophy](#1-philosophy)
2. [Brand Identity — claude-system](#2-brand-identity--claude-system)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing, Layout & Grid](#5-spacing-layout--grid)
6. [Borders, Radius, Shadows & Surfaces](#6-borders-radius-shadows--surfaces)
7. [Signature Motifs](#7-signature-motifs)
8. [Component Library — Registry Specific](#8-component-library--registry-specific)
9. [Page Templates — sitemap](#9-page-templates--sitemap)
10. [Motion & Interaction](#10-motion--interaction)
11. [Responsive Breakpoints](#11-responsive-breakpoints)
12. [Accessibility](#12-accessibility)
13. [Iconography & Glyphs](#13-iconography--glyphs)
14. [Content Formatting — CLI-native](#14-content-formatting--cli-native)
15. [Do / Don't](#15-do--dont)
16. [Code Reference](#16-code-reference)
17. [Build Checklist — claude-system](#17-build-checklist--claude-system)

---

## 1. Philosophy

The site reads like a **carefully printed registry ledger or field notebook for Claude Code workflows**, not a SaaS landing page or a template. Every decision serves calm, legible, confident presentation of Systems — versioned bundles of `CLAUDE.md` + `skills` + `agents` + `commands` + `hooks` + MCP that together form a reproducible environment. The user is here to `list`, `search`, `info`, `install`, `run` — in that order.

Priorities, in order:

1. **Minimal & editorial.** Generous whitespace, hairline rules, sharp corners. Restraint is the aesthetic. Remove before you add. A registry should feel like an archive, not a storefront.
2. **Print materials, not decoration.** Every color maps to a physical material — warm *paper*, near-black *ink*, a single warm *stamp* accent, a *verified* green ink. Nothing ornamental. The accent marks `install` actions, permission warnings, and `setup.sh` consent — never large surfaces.
3. **Typography does the design.** A characterful serif for display, a clean sans for body, a typewriter mono for chrome. Contrast in *size, weight, and italics* replaces most ornament. Mono is the voice of the CLI: `kebab-case` names, `system.json` paths, `~/.claude-system/systems/<name>/`.
4. **One accent, used sparingly.** A single warm accent is the only loud color. It marks interactive/important things — `install`, `copy`, `WHY`, permission `shell:exec` — never large surfaces. Green is only for `installed` / `verified` / `validate: passed`.
5. **Honest & legible.** WCAG-AA everywhere, real content from `registry/index.json` and `systems/*/system.json`, no fake gloss, no gradient text, no glassmorphism, no emoji as UI. Permissions are shown honestly before install.
6. **Open & airy.** Content breathes. Prefer flat, borderless reading areas with ample spacing. Boxes are reserved for interactive components: System cards, CLI rows, install blocks.
7. **Motion is a whisper.** Small, eased, purposeful reveals. Always honor `prefers-reduced-motion`.

If a proposed choice conflicts with any principle above, **reject it.**

---

## 2. Brand Identity — claude-system

The identity is the **curated Systems marketplace for Claude Code** — an open, public ledger of reproducible workflows. Not plugins one by one; a complete workflow in one shot. Every visual decision reinforces *archive + lab*.

- **Concept:** an open, public registry. Each System is a versioned record (`name`, `displayName`, `version`, `description`, `keywords`, `category`, `author`, `license`, `permissions[]`) logged daily, validated via `validate.yml`, generated into `registry/index.json`, synced to Supabase, and fetched fresh via `/api/registry` (`s-maxage=60`).
- **Feel:** archival, precise, warm, quiet confidence — like a well-kept lab ledger that lists `systems/example-system` next to `frontend` and `security`, or a letterpress broadsheet that sets `curl -fsSL https://claude-system-tau.vercel.app/install | sh` in ink.
- **Voice in UI:** short, concrete, CLI-native, humble-but-assured. No hype, no exclamation stacking, no marketing filler. Use *kebab-case* for System names (`my-new-system`), `code` for paths/commands (`system.json`, `CLAUDE.md`, `~/.claude-system/systems/<name>/`, `claude-system install <name>`), mono for everything systemic (dates, counts, tags, statuses, `permissions[]`, `setup.sh`).
- **Naming for sections:** numbered, mono, uppercase kickers — `01 — Registry`, `02 — Browse`, `03 — Install`, `04 — Security`. Sub-sections use letter suffixes (`03b — npm/pip`) rather than renumbering. The number is the record number in the ledger.

---

## 3. Color System

Use **only** these tokens. Do not invent hues. The accent is the *install* stamp; green is the *installed/verified* ink.

```css
:root{
  /* surfaces — warm paper, never pure white */
  --paper:   #F6F4EE;   /* page background             */
  --paper-2: #EFECE2;   /* recessed / secondary paper   */
  --sheet:   #FBFAF6;   /* card surface (slightly lighter) */

  /* inks — warm near-black, never pure #000 */
  --ink:    #181611;    /* headings, strong borders     */
  --ink-2:  #37342B;    /* secondary headings           */
  --body:   #3B382E;    /* body copy                    */
  --muted:  #5F594A;    /* meta text   (AA on paper)    */
  --muted-2:#6E6858;    /* faint meta  (AA on paper)    */

  /* lines */
  --line:   #DAD5C6;    /* hairline divider             */
  --line-2: #C4BEAC;    /* stronger hairline            */

  /* the ONE accent — warm stamp — used for install, copy, WHY, permission emphasis */
  --accent:      #B93A13;              /* 5.2:1 on paper — AA for text */
  --accent-soft: rgba(185,58,19,.12);  /* tints / highlights            */

  /* semantic — installed / validated / available */
  --green:      #1E7A4E;               /* installed / verified / validated */
  --green-soft: rgba(30,122,78,.10);
}
```

### Contrast guarantees (do not regress)
| Pair | Ratio | Use |
|---|---|---|
| `--ink` on `--paper` | ~15:1 | headings, `system.json` keys |
| `--body` on `--paper` | ~11:1 | body, `description` |
| `--muted` on `--paper` | 6.3:1 | meta: `v0.1.0 · MIT · other` |
| `--muted-2` on `--paper` | ~4.9:1 | faint meta: `permissions[]` |
| `--accent` on `--paper` | 5.2:1 | `install`, links, `WHY` |
| `--paper` on `--accent` | 5.2:1 | solid accent buttons (`Install →`) |
| `--green` on `--paper` | ~4.8:1 | `installed`, `validate: passed`, `⬇ downloads` |

### Color rules — registry specific
- Backgrounds are always warm paper. **Never `#fff` or `#000` as page backgrounds** — even CLI code blocks use `--ink` bg with `--paper` text, the one dark surface.
- Large surfaces stay `paper` / `paper-2` / `sheet`. The accent appears only on: `install`/`copy` links, thin borders/lines, small bullets/diamonds, solid buttons, monogram crossbar/dot, permission `shell:exec`/`credentials:read` emphasis.
- **Green is semantic only** — `installed` in `list --installed`, `validate` passed, `available`/`verified`. Never decorative.
- Dark code blocks (`curl | sh`, `claude-system install`, `system.json`) use `--ink` bg / `--paper` text — the one place a dark surface is allowed.
- No cool grays, blues, or neon. The registry is warm; the terminal is ink.

---

## 4. Typography

Three roles, three families. Load via Google Fonts or Fontsource.

```css
--serif:'Fraunces',Georgia,serif;          /* display + italics — System displayName */
--sans: 'Archivo',system-ui,sans-serif;    /* body — description, prose              */
--mono: 'Space Mono',ui-monospace,monospace; /* chrome — kebab-case, code, meta      */
```

Required weights/styles:
- **Fraunces:** 400, 600, 400-italic, 600-italic
- **Archivo:** 400, 500, 600
- **Space Mono:** 400, 400-italic

### Roles & scale — tuned for registry
| Element | Family | Weight | Size | Tracking / leading | Notes |
|---|---|---|---|---|---|
| Base body | Archivo | 400 | 16px | lh 1.6 | |
| Body copy | Archivo | 400 | 14.5–16px | lh 1.65–1.75 | max-width ~60–66ch |
| Article prose | Archivo | 400 | 17–17.5px | lh 1.85–1.9 | reading column ~700px — `docs/creating-a-system.md` |
| Hero `h1` | Fraunces | 600 | `clamp(3rem,9.5vw,7.6rem)` | ls -.035em, lh .92–1.08 | `Systems for <em>Claude Code</em>` |
| Section `h2` | Fraunces | 600 | `clamp(2rem,4.6vw,3.4rem)` | ls -.03em, lh .95 | italic `<em>` accent word |
| Article `h2` | Fraunces | 600 | ~1.6–1.7rem | ls -.02em | auto-numbered (§) — docs |
| Card `h3` (System card) | Fraunces | 600 | ~1.3–1.5rem | ls -.02em, lh 1.1–1.2 | `displayName` in card |
| System row title | Fraunces | 600 | 1.15–1.25rem | ls -.02em | ledger row |
| CLI row `code` | Space Mono | 400 | 12.5–13px | ls .02em, lh 1.6 | `claude-system list [--category]` inside ledger |
| Lead / standfirst | Fraunces | 400 italic | `clamp(1.15rem,2.4vw,1.35rem)` | lh 1.55 | *Curated Systems — install a workflow* |
| Kicker / label | Space Mono | 400 | 10–11.5px | ls .16–.22em, UPPERCASE | `01 — Registry` |
| Button / tag | Space Mono | 400 | 10.5–11.5px | ls .1–.15em, UPPERCASE | `INSTALL →`, `#frontend` |
| Meta / timestamps | Space Mono | 400 | 11–11.5px | ls .04–.14em | `v0.1.0 · MIT · ⬇ 12` |
| `system.json` key | Space Mono | 400 | 12px | ls .04em | left col in table |
| Permission badge | Space Mono | 400 | 10px | ls .12em, UPPERCASE | `shell:exec` |

### Typographic signatures — registry
- Headings pair **roman + italic**: `Systems <em>for Claude Code</em>`, `Install <em>in one shot</em>`. The `<em>` is Fraunces italic muted.
- Big numbers (stats: Systems count, downloads) are Fraunces 600 tight; unit `<sup>` italic accent.
- Mono for **all chrome**: `kebab-case` System names, `system.json` keys, `permissions[]`, `~/.claude-system/systems/<name>/`, `setup.sh`, breadcrumbs `Home / Systems / <name>`, tags `#keywords`.
- Article headings auto-numbered `§ 01` via CSS counter — docs.
- CLI commands set in ink code blocks (`--ink` bg / `--paper` text), copy-pasteable.

---

## 5. Spacing, Layout & Grid

```css
--max:1200px;                       /* site content width   */
--read:700px;                       /* article reading column — docs */
--pad:clamp(18px,4.2vw,56px);       /* horizontal gutter    */
--ease:cubic-bezier(.22,1,.36,1);   /* the ONLY easing      */
```

- `.wrap{max-width:var(--max);margin-inline:auto;padding-inline:var(--pad)}`
- `.read{max-width:var(--read);margin-inline:auto;padding-inline:var(--pad)}` for docs & System detail reading.
- **Sections:** `padding:clamp(44px,6vw,76px) 0`, separated by `border-top:1px solid var(--line)`. Hero gets `border-bottom:1px solid var(--ink)`.
- **Airy:** prefer `clamp(44px,6vw,100px)` between major blocks. Let content breathe — the registry is a ledger, not a dashboard.
- **Flat content:** long-form reading sits directly on paper with no box. Boxes only on interactive: System cards, CLI rows, install block.
- **Grids — tuned for Systems:**
  - Desktop (≥1020px): **3-column** Systems grid on Home (cards), **3-col ledger** on Browse (`index/type | body | right meta`), CLI reference 2-col.
  - Tablet (860–1020px): Systems 2-col, ledger 2-col, docs stacked.
  - Mobile (≤760px): 1-col everywhere, ledger collapses, filters stack.
- **Sharp corners.** `border-radius:0` default; `1–3px` only on `.kbd` (and `50%` on tiny meta dot).

### Section header pattern (always)
```
[kicker]   NN — Title              (mono, muted, 24–28px ink dash)
[h2]       Roman <em>italic</em>    (Fraunces)
[sec-tag]  right-aligned mono chip  (hairline, sheet) — e.g. `1 system · Supabase`
```

---

## 6. Borders, Radius, Shadows & Surfaces

- **Hairline:** `1px solid var(--line)` — dividers, ledger rows, tags, `system.json` table rules, filter bar.
- **Ink border:** `1px solid var(--ink)` — System cards, CLI rows (on hover), install block, solid buttons.
- **Card:** `background:var(--sheet); border:1px solid var(--ink)`.
- **Shadow at rest:** none or `0 1px 0 rgba(24,22,17,.05)`.
- **Shadow on hover:** `0 10–16px 24–40px rgba(24,22,17,.08–.12)` — System card lifts `translateY(-3px)`.
- **Film grain:** fixed SVG-noise overlay `opacity:.05` `mix-blend-mode:multiply` (paper texture).
- **Radius:** 0 almost everywhere; `2px` on `.kbd`, `50%` on 4px meta dot.

Guidance: default for *content* is borderless flat. Add border only when interactive or needs grouping — a System card is interactive; a docs paragraph is not.

---

## 7. Signature Motifs — registry ledger

1. **CS monogram.** Two letterforms `C + S` sharing a vertical stem; accent crossbar + accent dot — the stamp of the registry. (Template §16.4 — substitute brand initials; keep accent crossbar/dot.)
2. **Rotated accent diamond** — square 45° as registry bullet / System availability marker: `9px rotated` `var(--accent)`.
3. **Left accent line on hover** — 2px accent bar `scaleY(0→1)` from left edge of ledger rows, stat cells, System cards.
4. **Kicker rule** — 24–28px ink dash preceding `NN — Title`.
5. **Short accent rule** — 48–56px × 2px accent bar separating hero from registry.
6. **Underline highlight** for key italic words: `linear-gradient(transparent 62%, var(--accent-soft) 62%)` — e.g. *complete workflow*.
7. **Auto-numbered sections** — `§ 01` mono labels above docs `h2` via CSS counter.
8. **End-mark** — centered accent diamond `◆` closing a System detail or doc article.
9. **Terminal prompt** — `~/ $ claude-system list` with blinking caret — hero ledger whisper.
10. **Top progress bar** — fixed 2px accent spanning viewport on scroll; `s-maxage=60` freshness hint.

---

## 8. Component Library — Registry Specific

### 8.1 Header
- Sticky `rgba(246,244,238,.94)` + `blur(10px)`; hairline bottom; soft shadow on scroll.
- Left: CS monogram + mono wordmark `CLAUDE-SYSTEM`; desktop nav mono uppercase 11.5px (muted → ink + accent `scaleX` underline); right: solid `Star on GitHub ↗`; mobile hamburger 2→X with dropdown panel.

### 8.2 Desktop nav
- Mono uppercase 11.5px, muted; hover/active → ink with accent underline; `aria-current="page"`.

### 8.3 Mobile menu
- Hamburger 2 bars → X; full-width dropdown paper bg, ink bottom border; links 48px rows with mono index `01`, active accent; closes on link/Esc/outside/resize>760px; `aria-expanded`/`aria-hidden`.

### 8.4 Buttons
```css
.btn{font-family:var(--mono);font-size:11.5px;letter-spacing:.15em;text-transform:uppercase;
  padding:14px 20px;border:1px solid var(--ink);color:var(--ink);min-height:46px;
  display:inline-flex;align-items:center;gap:10px;transition:.2s}
.btn:hover{background:var(--ink);color:var(--paper)}
.btn.solid{background:var(--ink);color:var(--paper)}
.btn.solid:hover{background:var(--accent);border-color:var(--accent)}
```
Arrows are text glyphs `→ ↗`. `Install →` is always solid accent-on-hover.

### 8.5 System card (Home grid, 3-col → 1-col)
- `--sheet` bg + `--ink` border; hover `translateY(-3px)` + soft shadow; corner arrow chip `↗` inverts.
- **Structure:** top kicker `category · v0.1.0` + `⬇ downloads` (green if `>0`), `chip ↗`, `h3` `displayName` (Fraunces 1.35rem), `p` `description` (14.5px), meta `#keywords` as inline mono tags, bottom actions `Copy install` (ghost, copies `claude-system install <name>`) + `View →` (solid).
- **Permission tint:** if `permissions` contains `shell:exec` or `credentials:read`, show mono badge `shell:exec` with accent border.
- **Empty state:** if registry empty, show ghost card with ledger line and link to `docs/creating-a-system`.

### 8.6 Ledger row (Browse list, CLI reference, How-it-works)
- 3-col grid: `index/type` | `body` | `right meta`; hairline dividers; hover left accent bar + `sheet` bg.
- Left: mono `No.001` + type icon (accent diamond / green square / muted circle by `category` or command group).
- Body: mono meta `v0.1.0 · MIT · ⬇` → Fraunces title → `description` or CLI `code` → topic `#tags` or flags `--category`.
- Right: date or count + serif `→` that shifts and turns accent on hover.
- **CLI variant:** body contains ink code block `claude-system list [--installed] [--category <cat>]` with `Copy` ghost button on right.

### 8.7 Install block (Home + System detail + CLI reference)
- **Structure:** tabs `curl | sh` (primary) / `npm` / `pip` (mono pills, active ink). Tab content is `--ink` bg / `--paper` text `pre code`. Always shows `curl -fsSL https://claude-system-tau.vercel.app/install | sh` plus `claude-system list / search / install / run` 4-liner.
- **Copy affordance:** `Copy` ghost button on right of block; on click shows `Copied!` mono feedback.
- **Alt:** below, small muted line `Alternatives: npm i -g claude-system · pip install claude-system`.

### 8.8 Permissions badge & validate strip
- **Permissions badge:** mono uppercase 10px, `shell:exec` → accent border+text, `filesystem:read` → muted hairline, `credentials:read` → accent soft bg + warning dot.
- **Validate strip:** horizontal stat-like strip `✓ valid` (green) / `✗ name mismatch` (accent) — used on `docs/creating-a-system` to illustrate `validate.yml` checks. Border top/bottom `--ink`, cells hairline, hover accent line.

### 8.9 Stats ledger strip (Home)
- 4 cells framed by `--ink` top+bottom, hairlines between; each: Fraunces number + italic accent `<sup>` unit; mono label with diamond bullet; hover left accent line + `--sheet` bg; collapses 2×2 ≤860px. Values: `Systems` (from `/api/registry` count), `Categories` (9), `License MIT`, `Spec 1.0.0`.

### 8.10 Tags / pills / filters (Browse)
- Mono uppercase 10.5–11px; hairline border; `All` pill active = `--ink` bg paper text; inline text tags borderless with `#` prefix; hover `ink` border.

### 8.11 CLI command row (CLI reference page)
- Ledger row variant where `body` is `pre` ink block with command + description. Right: `Copy` + `Try` (links to `browse?q=` for `search`). Used for 10 commands: `list`, `search`, `info`, `install`, `remove`, `update`, `run`, `create`, `validate`, `report`.

### 8.12 Tags / filters
- As 8.10, but filter toolbar on Browse: underline search input (feeds `/api/search?q=`) + pill tabs `All / docs / other` from live categories.

### 8.13 System detail — manifest table
- `system.json` rendered as 2-col table: left mono key (`name`, `displayName`, `version`, `description`, `keywords`, `category`, `author`, `license`, `permissions`, `path`, `specVersion`), right value; `additionalProperties: false` noted; unknown keys rejected.

### 8.14 Breadcrumb
- Mono uppercase, muted; `/` separators; current in `--ink-2`. Example: `Home / Systems / example-system` or `Home / Docs / Creating a System`.

### 8.15 Article / prose — docs reading
- `--read` (~700px), 17–17.5px, lh 1.85–1.9; `h2` auto-numbered `§ 01`; links accent+underline; inline code `paper-2` chip; code blocks `--ink`/`--paper`; blockquote accent left rule + serif italic; ends with `◆`.

### 8.16 System detail — version history & downloads
- Ledger sub-rows for versions: `v0.1.0 · ⬇ 12 · 21 AUG 2026` with `downloads` from Supabase; source `POST /api/systems/:name/install` noted.

### 8.17 Footer
- Ink top border; multi-col grid (brand ledger quote + Systems / Docs / Community columns); mono base bar with `G` kbd hint (press `G` → browse), live clock, mobile `Back to top ↑`.

---

## 9. Page Templates — sitemap

All pages share grain+tokens+fonts+progress+skip+header+footer (§17). Flat airy content, boxes only on cards/rows/install block.

- **Home `/` (landing):** eyebrow `01 — Systems for Claude Code` → `h1` `Systems for <em>Claude Code</em>` → standfirst Fraunces italic *Curated, opinionated Systems — install a complete workflow in one shot* → actions `Install →` (to `#install`) + `Browse →` → terminal `~/ $ claude-system list` → accent rule → stats strip (Systems count / Categories 9 / MIT / 1.0.0) → **About** (what a System is, `CLAUDE.md`+`skills` bundle, `~/.claude-system` store) → **Available Systems** (3-col card grid from `/api/registry` — with `↗` chip) → **How it works** (ledger No.001 PR → 002 validate → 003 merge → 004 install → 005 run) → **Install** (tabs curl/npm/pip, ink code block + copy) → **Trust strip** (permissions badge + `setup.sh` `WHY` → `y/N` + `setupDone`) → **Community/Discussions** (underline input placeholder) → **FAQ** (`<details>` `›` chevron — replaces Claude Code? what must a System contain? permissions? `setup.sh`? registry?) → footer. *Real `example-system` card is fallback if fetch fails.*

- **Browse `/browse` (list):** hero `02 — Browse` → filter toolbar: underline search (feeds `/api/search?q=`) + pill tabs `All / docs / other` from live categories → ledger rows (see 8.6) `No.001` with diamond/green by category, `#keywords`, right date/`→` accent → pagination placeholder (1 page v1) → footer. Supports `?q=` and `?category=` from URL.

- **System detail `/system?name=<name>` (+ `/s/:name` rewrite):** breadcrumb `Home / Systems / <name>` → airy hero (`name` h1, `displayName` lead, mono meta `v·MIT·other·⬇`) → accent rule → `.read` prose: `README` excerpt, `system.json` manifest table (8.13), `CLAUDE.md` blockquote, install ink block (`claude-system install/run/info`) + `setup.sh` note, version history ledger, permissions badges → share + prev/next (via registry order) → end-mark `◆` → footer. Client fetch `GET /api/systems/:name` hydrates.

- **Docs overview `/docs` (list):** hero `03 — Documentation` → ledger rows for `creating-a-system` (No.001 Guide), `security` (No.002 Trust), `spec` (No.003 Contract), `cli` (No.004 CLI reference) → footer.

- **Create guide `/docs/creating-a-system` (article):** breadcrumb → hero → prose rendering `docs/creating-a-system.md` (required files table, `system.json` fields, permissions enum, `repository`/`bugs` fallback, local `validate` commands, PR flow 1–7, `registry/index.json` generated warning, `additionalProperties: false`, `name===folder` rule). Code blocks ink/paper, blockquote accent.

- **CLI reference `/docs/cli` (new) (list + ledger):** hero `04 — CLI` → ledger CLI rows (8.11) for 10 commands (`list`, `search`, `info`, `install`, `remove`, `update`, `run`, `create`, `validate`, `report` + `doctor` if present) with flags (`--installed`, `--category`, `--all`, `--help`, `--version`), forwarded ` -- <args>` for `run`, copy buttons, plus global `--help` theme. Prose intro notes thin CLI vs System/Skill/plugin rule.

- **Security/Trust `/docs/security` (article):** render `docs/security.md` + `SECURITY.md` reporting — permissions table (6 perms), `setup.sh` contract (`# WHY:` + consent `y/N` + `setupDone` + `shell:exec`), Reviewed-but-not-verified, How to read permissions (`info`/`jq`/`ls -R`), For authors, Reporting.

- **Spec `/docs/spec` (article):** render `SYSTEM_SPEC.md` condensed — what a System is, manifest+validation, registry generation, install/run/store + `setup.sh`, §46 out-of-scope (no marketplace/cloud/runtime/GUI/enterprise auth).

- **404 `/404.html`:** flat `04 — Not found` + `Lost <em>page</em>` + mono `404 · No.404` + buttons `Home →` `Browse →` `Docs →` — styled, not Vercel default. Must preserve grain/header/footer.

All HTML is static vanilla — client `fetch('/api/registry')` / `fetch('/api/search?q=')` for live data, but render meaningfully without JS (inline `example-system` as fallback). `vercel.json` rewrites preserve `/install` → `/install.sh` (`text/plain`).

---

## 10. Motion & Interaction

```css
--ease:cubic-bezier(.22,1,.36,1);   /* the ONLY easing curve */
```

- **Scroll reveal:** `.rv{opacity:0;transform:translateY(16px)} .rv.in{…none}` via `IntersectionObserver`; stagger ≤60ms — used for hero, System cards, ledger rows.
- **Line-mask** on hero `h1` (each line rises from overflow-hidden mask) — `Systems / for Claude Code`.
- **Scramble-decode** on eyebrow `01 — Systems for Claude Code`.
- **Count-up** numbers in stats strip (Systems count live).
- **Progress-bar fill** (`#prog` width = `scrollY / (scrollHeight-innerHeight)`).
- **Typing** terminal `~/ $ claude-system list`.
- **Hover:** System card `translateY(-3px)` + shadow; ledger row left accent `scaleY` + `sheet` bg; pill hover `ink` border.
- Durations ~0.2–0.6s. Subtle, never decorative.
- **`prefers-reduced-motion: reduce` → disable ALL animation/transition, show reveals instantly, stop typing/marquees. Mandatory.**

---

## 11. Responsive Breakpoints

| Width | Behavior |
|---|---|
| ≤1020px | Home Systems 3-col → 2-col; CLI 2-col → 1-col; side-by-side hero → stacked |
| ≤860px  | stats 4-col → 2×2; footer 2-col; secondary grids 2-col; install tabs stack |
| ≤760px  | desktop nav → hamburger; ledger 3-col → 1-col (left spans full); search+pip pills stack; `.read` gutters 18px |
| ≤640px  | gutters 18–20px; stats edge-to-edge 2×2; forms full-width; footer 1-col; inputs `16px` (no iOS zoom); cards 1-col |

Touch targets ≥44–46px always. No horizontal scroll at any width. `system.json` table scrolls inside `overflow-x:auto` if needed — body never scrolls horizontally.

---

## 12. Accessibility

- Skip link; semantic landmarks (`header/main/section/footer/nav`).
- One `h1`; logical heading order; `aria-current`, `aria-expanded`, `aria-label`, `aria-hidden` for decoration.
- All text meets §3 contrast.
- Visible `:focus-visible` — `outline:2px solid var(--accent);outline-offset:3px`.
- Every animation honors `prefers-reduced-motion`.
- Images have meaningful `alt`; decorative SVGs `aria-hidden`.
- Forms use real `<label>`s; required fields marked; no placeholder-as-label; mono labels uppercase.
- System cards & ledger rows are real `<a>` or `<article>` with accessible names; copy buttons have `aria-label`.
- `system.json` table has `<th>` scope, captioned for screen readers.

---

## 13. Iconography & Glyphs

- **No emoji as UI.** No icon fonts.
- Use mono text glyphs: `→ ↗ ↓ ↑ ← ✓ ✕ ↻ ⌕ ◆ ● ○ § № ⑂ ★ ·` — only these.
- Small geometric markers (diamonds, squares, circles) drawn with CSS or inline SVG in palette.
- Any illustration is muted, high-contrast, paper/ink mood — e.g., monogram, ledger lines, not glossy product shots.
- Permissions icons: `●` muted for `filesystem:read`, `◆` accent for `shell:exec`.

---

## 14. Content Formatting — CLI-native

- Short, concrete, humble-but-assured. One idea per line where possible. No hype, no `!` stacking, no “revolutionary”.
- Prefer serif italic standfirst to introduce long-form: *Install a complete workflow in one shot.*
- Use mono for anything systemic: `kebab-case` System names (`example-system`), `system.json` keys, `permissions[]`, dates `21 AUG 2026`, counts `⬇ 12`, paths `~/.claude-system/systems/<name>/`, commands `claude-system install <name>`, flags `--installed` / `--category` / `--all`, `setup.sh`, `WHY`, `setupDone`.
- Numbers in stats are large Fraunces; units as italic accent `<sup>`.
- Relative timestamps mono (`3d ago`), absolute dates `DD MON YYYY` uppercase.
- Links for Systems are `name` (kebab) — displayName is secondary in card `h3` subtitle.
- No lorem ipsum; no marketing hyperbole. Every card, row, and code block is real data from `registry/index.json` / `/api/registry`.

---

## 15. Do / Don't — registry edition

**DO**
- Use exact tokens §3 and families §4; `Fraunces` for `displayName`, `Archivo` for `description`, `Space Mono` for `name`/`code`.
- Keep corners sharp, borders hairline-or-ink, shadows soft; System cards lift on hover.
- Mono for chrome, serif for display, sans for body; `kebab-case` names everywhere.
- Accent only on `install`/`copy`/`WHY`/`shell:exec`; green only on `installed`/`validate: passed`/`available`.
- Pair roman + italic in headings; diamond bullets + left accent hover lines on rows/cards.
- Favor flat, airy, borderless reading areas; boxes only on interactive (cards, CLI rows, install block, `system.json` table).
- Collapse gracefully: 3-col Systems → 1-col; keep tap targets large; honor reduced-motion.

**DON'T**
- No pure `#fff`/`#000` page bg; no cool grays/blues; no second loud hue.
- No gradient text, glassmorphism, neon, glossy web3 looks.
- No rounded-2xl cards, heavy shadows, 3-D tilts.
- No emoji as UI icons; no icon fonts.
- No boxed containers around passive reading (docs paragraphs, System `description`).
- No hype copy; no lorem ipsum; no fake gloss.
- No `additionalProperties` violations — `system.json` and registry are strict; don't invent manifest fields in UI copy.

---

## 16. Code Reference — registry ledger

### 16.1 Global base
```css
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{font-family:var(--sans);background:var(--paper);color:var(--body);
  font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
::selection{background:var(--accent);color:var(--paper)}
a{color:inherit;text-decoration:none}
a:focus-visible,button:focus-visible,input:focus-visible{
  outline:2px solid var(--accent);outline-offset:3px}
```

### 16.2 Film grain overlay — ledger paper texture
```css
body::after{content:"";position:fixed;inset:0;z-index:120;pointer-events:none;
  opacity:.05;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");}
```

### 16.3 Reading-progress bar — registry freshness hint
```html
<div id="prog" aria-hidden="true"></div>
```
```css
#prog{position:fixed;top:0;left:0;height:2px;width:0;background:var(--accent);z-index:140}
```
```js
var prog=document.getElementById('prog');
addEventListener('scroll',function(){
  var h=document.documentElement.scrollHeight-innerHeight;
  prog.style.width=(h>0?scrollY/h*100:0)+'%';
},{passive:true});
```

### 16.4 CS monogram template — Claude System stamp
Two letterforms `C` + `S` sharing a stem; accent crossbar + accent dot — **keep accent crossbar/dot, warmed for registry**.
```html
<svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
  <path d="M7 6 V38"  stroke="#181611" stroke-width="5"/>  <!-- left stem — C spine -->
  <path d="M23 6 V38" stroke="#181611" stroke-width="5"/>  <!-- shared stem — S spine -->
  <path d="M7 22 H23" stroke="#B93A13" stroke-width="5"/>  <!-- accent bar — ledger line -->
  <path d="M23 38 H38" stroke="#181611" stroke-width="5"/> <!-- lower bar — S foot -->
  <circle cx="37" cy="7" r="3.4" fill="#B93A13"/>          <!-- accent dot — stamp -->
</svg>
```
*For favicon/og, render at 32×32 paper bg with ink+accent.*

### 16.5 Reveal-on-scroll — ledger entries
```js
function observeReveals(){
  var els=document.querySelectorAll('.rv:not(.in)');
  if('IntersectionObserver' in window &&
     !matchMedia('(prefers-reduced-motion: reduce)').matches){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){
        e.target.classList.add('in'); io.unobserve(e.target);} });
    },{threshold:.08});
    els.forEach(function(el){ io.observe(el); });
  } else els.forEach(function(el){ el.classList.add('in'); });
}
```

### 16.6 Auto-numbered article headings — docs §
```css
.prose{counter-reset:sec}
.prose h2{counter-increment:sec}
.prose h2::before{content:"§ " counter(sec,decimal-leading-zero);
  display:block;font-family:var(--mono);font-size:11px;letter-spacing:.22em;
  color:var(--accent);margin-bottom:14px}
```

### 16.7 System card — registry
```html
<article class="card">
  <div class="card-top"><span class="card-kicker">other · v0.1.0</span><span class="small muted">⬇ 12</span></div>
  <span class="chip" aria-hidden="true">↗</span>
  <h3><a href="/system?name=example-system">Example System</a></h3>
  <p>Reference fixture — not for real use.</p>
  <div class="meta"><span>#example</span> <span class="dot"></span> <span>#fixture</span></div>
  <div style="display:flex;gap:8px"><button class="btn sm">Copy install</button><a class="btn solid sm" href="/system?name=example-system">View →</a></div>
</article>
```

### 16.8 Install block — curl | sh + npm/pip tabs
```html
<div class="install-tabs"><button class="pill active">curl | sh</button><button class="pill">npm</button><button class="pill">pip</button></div>
<pre><code>curl -fsSL https://claude-system-tau.vercel.app/install | sh
claude-system list
claude-system install &lt;name&gt;
claude-system run &lt;name&gt;</code></pre>
```

---

## 17. Build Checklist — claude-system

Before a page ships, confirm:

- [ ] Loads the three families and sets `:root` tokens (§3/§4) — paper/ink/accent, Fraunces/Archivo/Space Mono.
- [ ] Has grain overlay, progress bar, skip link, sticky blurred header + CS monogram + mobile menu (closes on link/Esc/outside/resize>760).
- [ ] Uses `.wrap`/`.read`, section borders (`clamp(44px,6vw,76px)`), and kicker / `h2` roman+italic / `sec-tag` header pattern.
- [ ] System card (8.5) shows `name` kebab + `displayName` + `v` + `category` + `⬇` + `#keywords` + permissions badge + `Copy install`; ledger rows (8.6) have `No.001` + diamond + `→`; install block (8.7) has tabs + ink `pre` + copy; CLI rows (8.11) have `code` + copy; manifest table (8.13) lists `system.json` keys.
- [ ] Motion: `.rv` + `IntersectionObserver` + `prefers-reduced-motion` gate; line-mask, scramble, count-up, typing, progress — all gated.
- [ ] Content flat and airy; boxes only on interactive (cards/rows/install/table); docs prose is borderless, ~700px.
- [ ] Passes §3 contrast and §12 a11y (one `h1`, focus visible, landmarks, `aria-current`/`aria-expanded`, table `<th>`); responsive per §11: 3-col Systems → 1-col, no overflow, tap targets ≥44px.
- [ ] Copy is CLI-native: `kebab-case`, `code` for `system.json`/`CLAUDE.md`/`~/.claude-system/systems/<name>/`, `permissions[]`, `setup.sh` + `WHY`, `registry/index.json`.
- [ ] All interactive targets ≥44px; `Esc` closes overlays; `G` focuses browse/overview appropriately.
- [ ] Nothing from §15 DON'T appears (no `#fff`/`#000` bg, no cool grays, no gradient/glass/emoji UI/second hue/boxed reading/hype/lorem).
- [ ] Pages: Home + Browse + System detail (+ `/s/:name`) + Docs overview + Creating + CLI reference + Security + Spec + 404 all exist and are reachable via `vercel.json` rewrites; `sitemap.xml`/`robots.txt`/`og.png` correct.

---

*End of DESIGN.md — adapted for claude-system's registry. If it doesn't feel like a quiet, printed ledger for Systems — install a workflow, not a plugin — it isn't finished.*
