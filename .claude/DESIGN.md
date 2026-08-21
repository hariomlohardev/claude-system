# DESIGN.md — hariomlohardev/claude-system

> The single source of truth for **all visual & interaction design** in this repository.
> Every page, component, template, and snippet here MUST conform to this document.
>
> **Two ways to use this file:**
> 1. **Building something new** → follow this spec top to bottom.
> 2. **Updating something existing** → run it through the [Migration Checklist](#17-migration-checklist-for-existing-pages) and fix every miss.
>
> When in doubt: *minimal, editorial, quiet. Paper + ink + one warm accent. Never loud, never glossy, never crowded.*

---

## Table of Contents
1. [Purpose & Scope](#1-purpose--scope)
2. [How to Use This File](#2-how-to-use-this-file)
3. [Design Principles](#3-design-principles)
4. [Color System](#4-color-system)
5. [Typography](#5-typography)
6. [Spacing, Layout & Grid](#6-spacing-layout--grid)
7. [Borders, Radius, Shadows & Surfaces](#7-borders-radius-shadows--surfaces)
8. [Signature Motifs](#8-signature-motifs)
9. [Component Library](#9-component-library)
10. [Page Templates](#10-page-templates)
11. [Motion & Interaction](#11-motion--interaction)
12. [Responsive Breakpoints](#12-responsive-breakpoints)
13. [Accessibility](#13-accessibility)
14. [Iconography & Glyphs](#14-iconography--glyphs)
15. [Content Formatting](#15-content-formatting)
16. [Do / Don't](#16-do--dont)
17. [Migration Checklist for Existing Pages](#17-migration-checklist-for-existing-pages)
18. [Repository Conventions](#18-repository-conventions)
19. [Code Reference](#19-code-reference)
20. [Final Checklist](#20-final-checklist)

---

## 1. Purpose & Scope

This document defines the design language for **`hariomlohardev/claude-system`**. It applies to:

- All HTML pages (`.html`)
- All stylesheets and inline `<style>` blocks
- Any generated output, templates, or snippets that produce UI
- Any docs or README sections that render visually

**If a file renders pixels, it follows this file.** No exceptions, no one-off styles.

---

## 2. How to Use This File

### 2.1 Creating a new page
1. Copy the [base skeleton](#19-code-reference).
2. Apply the [color](#4-color-system), [type](#5-typography), and [layout](#6-spacing-layout--grid) tokens.
3. Assemble only from the [Component Library](#9-component-library).
4. Verify against the [Final Checklist](#20-final-checklist).

### 2.2 Updating an existing page
1. Open the page alongside this file.
2. Work through the [Migration Checklist](#17-migration-checklist-for-existing-pages) section by section.
3. Replace any off-system color, font, radius, shadow, or layout with the token/component equivalent.
4. Re-verify against the [Final Checklist](#20-final-checklist).

### 2.3 Rule of precedence
`DESIGN.md` (this file) > any page's existing inline styles. If a page conflicts with this file, **the page changes, not the spec.**

---

## 3. Design Principles

1. **Minimal & editorial.** Generous whitespace, hairline rules, sharp corners. Restraint is the aesthetic. Remove before you add.
2. **Print materials, not decoration.** Every color maps to a physical material — warm *paper*, near-black *ink*, one warm *stamp* accent, a *verified* green ink.
3. **Typography does the design.** A characterful serif for display, a clean sans for body, a typewriter mono for chrome. Contrast in *size/weight/italics* replaces ornament.
4. **One accent, used sparingly.** A single warm accent is the only loud color; it marks interactive/important things — never large surfaces.
5. **Honest & legible.** WCAG-AA contrast everywhere, real content, no fake gloss, no gradient text, no glassmorphism, no emoji used as UI.
6. **Open & airy.** Content breathes. Flat, borderless content areas with ample spacing; boxes reserved for interactive components.
7. **Motion is a whisper.** Small, eased, purposeful reveals; always honor `prefers-reduced-motion`.

If a proposed choice conflicts with any principle, **reject it.**

---

## 4. Color System

Use **only** these tokens. Do not invent new hues.

```css
:root{
  /* surfaces — warm paper, never pure white */
  --paper:   #F6F4EE;
  --paper-2: #EFECE2;
  --sheet:   #FBFAF6;

  /* inks — warm near-black, never pure #000 */
  --ink:    #181611;
  --ink-2:  #37342B;
  --body:   #3B382E;
  --muted:  #5F594A;
  --muted-2:#6E6858;

  /* lines */
  --line:   #DAD5C6;
  --line-2: #C4BEAC;

  /* the ONE accent — warm stamp */
  --accent:      #B93A13;
  --accent-soft: rgba(185,58,19,.12);

  /* semantic */
  --green:      #1E7A4E;
  --green-soft: rgba(30,122,78,.10);
}
```

### Contrast guarantees (do not regress)
| Pair | Ratio | Use |
|---|---|---|
| `--ink` on `--paper` | ~15:1 | headings |
| `--body` on `--paper` | ~11:1 | body copy |
| `--muted` on `--paper` | 6.3:1 | meta / labels |
| `--muted-2` on `--paper` | ~4.9:1 | faint meta |
| `--accent` on `--paper` | 5.2:1 | links, small accent text |
| `--paper` on `--accent` | 5.2:1 | solid accent buttons |
| `--green` on `--paper` | ~4.8:1 | success / verified text |

### Color rules
- Backgrounds are always warm paper tones. **Never `#fff`/`#000` as page backgrounds.**
- Large surfaces stay paper / paper-2 / sheet. Accent only on: links, short text, thin lines, small bullets, solid buttons, and the monogram's crossbar/dot.
- **Green is semantic only** — verified / available / merged / success. Never decorative.
- Dark code blocks use `--ink` bg + `--paper` text (the one allowed dark surface).
- No cool grays, blues, yellows, or neon. **Remove any `#FFD400`, `#0050FF`, blue links, or grid-paper backgrounds found in legacy pages.**

---

## 5. Typography

Three roles, three families. Load via Fontsource CDN (not Google Fonts).

```css
--serif:'Fraunces',Georgia,serif;          /* display + italics */
--sans: 'Archivo',system-ui,sans-serif;    /* body              */
--mono: 'Space Mono',ui-monospace,monospace; /* chrome / labels  */
```

Required weights/styles:
- **Fraunces:** 400, 600, 400-italic, 600-italic
- **Archivo:** 400, 500, 600
- **Space Mono:** 400, 400-italic

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/fraunces/latin-400.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/fraunces/latin-600.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/fraunces/latin-400-italic.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/fraunces/latin-600-italic.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/archivo/latin-400.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/archivo/latin-500.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/archivo/latin-600.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/space-mono/latin-400.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/space-mono/latin-400-italic.css">
```

### Roles & scale
| Element | Family | Weight | Size | Tracking / leading | Notes |
|---|---|---|---|---|---|
| Base body | Archivo | 400 | 16px | lh 1.6 | |
| Body copy | Archivo | 400 | 14.5–16px | lh 1.65–1.75 | max-width ~60–66ch |
| Article prose | Archivo | 400 | 17–17.5px | lh 1.85–1.9 | reading column ~700px |
| Hero `h1` | Fraunces | 600 | `clamp(3rem,9.5vw,7.6rem)` | ls -.035em, lh .92–1.08 | roman + italic mix |
| Section `h2` | Fraunces | 600 | `clamp(2rem,4.6vw,3.4rem)` | ls -.03em, lh .95 | italic `<em>` accent word |
| Article `h2` | Fraunces | 600 | ~1.6–1.7rem | ls -.02em | auto-numbered (§) |
| Card `h3` | Fraunces | 600 | ~1.3–1.5rem | ls -.02em, lh 1.1–1.2 | |
| Lead / standfirst | Fraunces | 400 italic | `clamp(1.15rem,2.4vw,1.35rem)` | lh 1.55 | editorial pull-in |
| Kicker / label | Space Mono | 400 | 10–11.5px | ls .16–.22em, UPPERCASE | `--muted` |
| Button / tag | Space Mono | 400 | 10.5–11.5px | ls .1–.15em, UPPERCASE | |
| Meta / timestamps | Space Mono | 400 | 11–11.5px | ls .04–.14em | `--muted` |

### Typographic signatures
- Headings pair a **roman word + italic word**: `Field <em>notes</em>`, `Proof <em>over claims</em>`.
- Big numbers: Fraunces 600, tight tracking; units as italic accent `<sup>`.
- Mono for **all chrome**: kickers, tags, buttons, meta, breadcrumbs, timestamps, nav.
- Article section headings may carry an auto-numbered mono label (§ 01, § 02) via CSS counter.

---

## 6. Spacing, Layout & Grid

```css
--max:1200px;                       /* site content width   */
--read:700px;                       /* article reading column */
--pad:clamp(18px,4.2vw,56px);       /* horizontal gutter    */
```

- `.wrap{max-width:var(--max);margin-inline:auto;padding-inline:var(--pad)}`
- `.read{max-width:var(--read);margin-inline:auto;padding-inline:var(--pad)}` for articles.
- **Sections:** vertical padding `clamp(44px,6vw,76px)`; separated by `border-top:1px solid var(--line)` between siblings; hero gets `border-bottom:1px solid var(--ink)`.
- **Airy spacing:** prefer large gaps between major blocks; spacing is a feature.
- **Flat content:** long-form content sits directly on paper (no box). Boxes/borders reserved for interactive components.
- Grids are 2-column on desktop → 1 column ≤1020px.
- **Sharp corners.** `border-radius` is 0 by default; only 1–3px on micro elements. No rounded-2xl cards.

### Section header pattern (always)
```
[kicker]   NN — Title              (mono, muted, preceded by a 24–28px ink dash)
[h2]       Roman <em>italic</em>    (Fraunces)
[sec-tag]  right-aligned mono chip  (hairline border, sheet bg) — optional
```

---

## 7. Borders, Radius, Shadows & Surfaces

- **Hairline:** `1px solid var(--line)` — dividers, list rows, tags.
- **Ink border:** `1px solid var(--ink)` — interactive cards, buttons, framed boxes.
- **Card:** `background:var(--sheet); border:1px solid var(--ink)`.
- **Shadow at rest:** none, or `0 1px 0 rgba(24,22,17,.05)`.
- **Shadow on hover:** `0 10–16px 24–40px rgba(24,22,17,.08–.12)`.
- **Film grain:** fixed, low-opacity SVG-noise overlay (see §19).
- **Radius:** 0 for almost everything; 1–3px only for micro elements.

**Default for *content* is borderless and flat.** Add borders only for interactive or grouping needs.

---

## 8. Signature Motifs

Use these consistently — they make the design recognizable.

1. **Two-letter monogram.** Two letterforms sharing a vertical stem; one crossbar + one terminal dot in accent. Used as logo & favicon (template in §19 — swap in the brand initials).
2. **Rotated accent diamond** — small square rotated 45° as eyebrow bullets / markers.
3. **Left accent line on hover** — 2–3px accent bar scaling in from the left edge of rows/cells.
4. **Kicker rule** — short 24–28px ink dash before each section's mono label.
5. **Short accent rule** — 48–56px × 2px accent bar separating hero from body.
6. **Underline highlight** for key italic words: `linear-gradient(transparent 62%, var(--accent-soft) 62%)`.
7. **Auto-numbered sections** — § 01, § 02 mono labels via CSS counter.
8. **End-mark** — single centered accent diamond `◆` closing articles.
9. **Terminal prompt line** — `~/ $ …` with blinking caret (subtle hero detail).
10. **Top reading-progress bar** — fixed, 2px, accent.

---

## 9. Component Library

### 9.1 Header
Sticky; `rgba(246,244,238,.94)` + `backdrop-filter:blur(10px)`; hairline bottom; shadow once scrolled. Contains monogram + mono wordmark, desktop nav, action pill, mobile hamburger.

### 9.2 Desktop nav
Mono uppercase 11.5px, muted; hover/active → ink with accent underline growing from the left (`scaleX(0→1)`).

### 9.3 Mobile menu
Hamburger = 2 bars morphing into `X`. Full-width dropdown panel (paper bg, ink bottom border). Links are 48px rows with mono index numbers; active in accent. Closes on link click / `Esc` / outside click / resize >760px. Uses `aria-expanded`/`aria-hidden`.

### 9.4 Buttons
```css
.btn{font-family:var(--mono);font-size:11.5px;letter-spacing:.15em;text-transform:uppercase;
  padding:14px 20px;border:1px solid var(--ink);color:var(--ink);min-height:46px;
  display:inline-flex;align-items:center;gap:10px;transition:.2s}
.btn:hover{background:var(--ink);color:var(--paper)}
.btn.solid{background:var(--ink);color:var(--paper)}
.btn.solid:hover{background:var(--accent);border-color:var(--accent)}
```
Arrows are text glyphs (`→ ↗ ↓ ↑ ←`). No icon fonts.

### 9.5 Interactive cards
`--sheet` bg + `--ink` border; hover `translateY(-3px)` + soft shadow; corner arrow chip `↗` inverting on hover. Used only for clickable items.

### 9.6 Ledger rows (list-style records)
For list pages, use full-width rows instead of card grids:
- 3-column grid: `index/type` | `body` | `right meta`; hairline separators.
- Hover: left accent bar draws in; row lifts to `--sheet`.
- Left: mono index (`No.001`) + type icon (accent diamond / green square / muted circle).
- Body: mono meta tags → Fraunces title → description → `#tags`.
- Right: dates/counts + serif arrow shifting & turning accent on hover.

### 9.7 Stats ledger strip
4 columns framed by ink top+bottom borders, hairline dividers. Fraunces number + italic accent `<sup>`; mono label with accent diamond. Hover: left accent line + number tints accent. Collapses to 2×2.

### 9.8 Tags / pills / filters
Mono uppercase 10.5–11px; hairline border; `--paper`/`--sheet` bg. Active/inverted = ink bg, paper text. Borderless text tags with accent `#` prefix for airy layouts.

### 9.9 Forms
- **Underline input:** `border-bottom:1px solid var(--ink)`; focus → accent.
- **Bordered input:** on `--paper`; focus → accent border.
- Mobile inputs `font-size:16px` (prevents iOS zoom). Labels mono uppercase, small, muted.

### 9.10 FAQ
`<details>/<summary>`; hidden marker; mono `›` chevron rotating 90° and turning accent when open.

### 9.11 Modal + lightbox
Flat trigger → centered modal (paper card, ink border, blurred dark backdrop). Close via ✕ / backdrop / `Esc`; locks body scroll while open.

### 9.12 Breadcrumb
Mono uppercase, muted; `/` separators; current page in `--ink-2`.

### 9.13 Article / prose
Reading column `--read`; 17–17.5px lh 1.85–1.9; `h2` auto-numbered; links accent + underline; inline code borderless `--paper-2` chip; code blocks ink bg/paper text; blockquote accent left rule + serif italic; ◆ end-mark.

### 9.14 Footer
Ink top border; multi-column grid; mono base bar with `G` kbd hint, live clock, and full-width "Back to top ↑" on mobile.

---

## 10. Page Templates

- **Home / landing:** hero → stats ledger strip → numbered sections → footer.
- **List page:** hero → filter toolbar (search + pill tabs) → ledger rows → pagination → footer.
- **Detail / article page:** breadcrumb → airy hero → accent rule → prose → ◆ → comments/share → prev/next → footer. Flat, no content boxes.
- **Docs page:** sidebar nav + content + on-this-page TOC; `§` headings; code blocks with copy; callouts; tables; pager.
- **Credentials / proof:** flat trigger → modal list → lightbox.

---

## 11. Motion & Interaction

```css
--ease:cubic-bezier(.22,1,.36,1);   /* the ONLY easing curve */
```

- **Scroll reveal:** `.rv{opacity:0;transform:translateY(16px)} .rv.in{…}` via IntersectionObserver; stagger ≤60ms.
- **Line-mask reveal** on hero `h1`.
- **Scramble-decode** on hero eyebrow.
- **Count-up** numbers; **progress-bar fill**; **typing** terminal line.
- **Pulse/blink** for live dots/carets.
- Durations ~0.2–0.6s. Subtle, purposeful.
- **`prefers-reduced-motion: reduce`** → disable ALL animation/transition, show reveals instantly. **Mandatory.**

---

## 12. Responsive Breakpoints

| Width | Behavior |
|---|---|
| ≤1020px | 2-col grids → 1 col; hero/mission stacks |
| ≤860px  | stats 2×2; footer 2-col; secondary grids 2-col |
| ≤760px  | desktop nav → hamburger; list grids → 1 col |
| ≤640px  | gutters 18–20px; stats edge-to-edge 2×2; forms full-width; footer 1-col; inputs 16px |

Touch targets ≥44–46px always. No horizontal scroll at any width.

---

## 13. Accessibility

- Skip link; semantic landmarks (`header/main/section/footer/nav`).
- One `h1`; logical heading order; `aria-current`, `aria-expanded`, `aria-label`, `aria-hidden` for decoration.
- All text meets §4 contrast. Visible `:focus-visible` (accent outline).
- Every animation honors `prefers-reduced-motion`.
- Images have meaningful `alt`; decorative SVGs `aria-hidden`.
- Forms use real `<label>`s; no placeholder-as-label.

---

## 14. Iconography & Glyphs

- **No emoji as UI.** No icon fonts required.
- Use mono text glyphs: `→ ↗ ↓ ↑ ← ✓ ✕ ↻ ⌕ ◆ ● ○ § № ⑂ ★ ·`.
- Small geometric markers drawn with CSS or inline SVG in palette colors.
- Illustrations (if any): muted, high-contrast, matching the paper/ink mood.

---

## 15. Content Formatting

- Short, concrete sentences; one idea per line where possible.
- Serif italic standfirst to introduce long-form content.
- Mono for anything systemic (dates, counts, tags, statuses, paths).
- Numbers in stats are large Fraunces; units italic accent `<sup>`.
- Relative timestamps in mono; absolute dates `DD MON YYYY` uppercase.
- No lorem ipsum; no marketing hyperbole.

---

## 16. Do / Don't

**DO**
- Use exact tokens (§4) and fonts (§5).
- Sharp corners, hairline-or-ink borders, soft shadows.
- Mono for chrome, serif for display, sans for body.
- Accent only as accent; green only for success/verified.
- Roman + italic heading pairs; diamond bullets; left accent hover lines.
- Flat, airy, borderless content areas with generous spacing.
- Collapse gracefully; large tap targets; honor reduced-motion.

**DON'T**
- No pure `#fff`/`#000` backgrounds; no cool grays/blues/yellows.
- No gradient text, glassmorphism, neon, or glossy looks.
- No rounded-2xl cards, heavy shadows, or 3-D tilts.
- No emoji as UI icons; no second loud hue.
- No boxed containers around passive reading content.
- No grid-paper backgrounds or yellow highlight accents (legacy patterns to remove).
- No hype copy; no lorem ipsum.

---

## 17. Migration Checklist for Existing Pages

Run every existing page through this. Fix **all** misses before considering it done.

### Colors
- [ ] All backgrounds use `--paper`/`--paper-2`/`--sheet` (no `#fff`, no blue/yellow tints).
- [ ] All text uses `--ink`/`--ink-2`/`--body`/`--muted` (no cool grays/blues).
- [ ] All accents use `--accent` (replace any `#FFD400`, `#0050FF`, `#E10600`).
- [ ] Green used only for success/verified/merged.
- [ ] Removed any grid-paper or blue grid `background-image`.

### Typography
- [ ] Replaced legacy display fonts with **Fraunces**; body with **Archivo**; chrome with **Space Mono**.
- [ ] Loaded fonts via Fontsource, not Google Fonts.
- [ ] Headings use roman + italic pairing; kickers/labels are mono uppercase.
- [ ] Removed `text-transform:uppercase` from large serif headings (keep only for mono labels).

### Layout & surfaces
- [ ] Content areas are flat/borderless; boxes only on interactive components.
- [ ] Sharp corners (radius 0 except micro elements).
- [ ] Spacing is generous; sections separated by hairlines.
- [ ] Removed "tape"/sticker `::before` decorations and oversized watermarks/marquees unless they fit §8.

### Components
- [ ] Buttons match §9.4 (mono, uppercase, min-height 46px).
- [ ] Cards/rows match §9.5/§9.6; stats use the ledger strip (§9.7).
- [ ] Header/nav/footer match §9.1–§9.3/§9.14; mobile hamburger present.
- [ ] Forms match §9.9; inputs 16px on mobile.

### Motion & a11y
- [ ] Only `--ease` used; reveals via `.rv`; honors `prefers-reduced-motion`.
- [ ] Reading-progress bar present; skip link present.
- [ ] Contrast passes §4; focus states visible; landmarks + `alt` text present.

### Responsive
- [ ] Breakpoints at 1020/860/760/640 behave per §12; no horizontal overflow; tap targets ≥44px.

---

## 18. Repository Conventions

- **Placement:** shared design tokens may live inline per page or in a common `<style>` block; keep the token names identical everywhere.
- **Naming:** component class names are short and semantic (`.btn`, `.row`, `.stat`, `.pill`, `.callout`, `.prose`, `.kicker`).
- **No frameworks.** Vanilla HTML/CSS/JS only. No build step required to view.
- **Generated output:** any script that emits HTML must emit markup that conforms to this spec.
- **Docs:** any rendered documentation follows the docs layout (sidebar + content + TOC) and uses `§` headings, code blocks with copy, and callouts.
- **Review:** treat this file as the rubric in code review — a page that fails the checklist is not merged.

---

## 19. Code Reference

### 19.1 Base skeleton
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#F6F4EE" />
<script>document.documentElement.classList.add('js')</script>
<!-- Fontsource links from §5 -->
<style>
:root{
  --paper:#F6F4EE;--paper-2:#EFECE2;--sheet:#FBFAF6;
  --ink:#181611;--ink-2:#37342B;--body:#3B382E;
  --muted:#5F594A;--muted-2:#6E6858;
  --line:#DAD5C6;--line-2:#C4BEAC;
  --accent:#B93A13;--accent-soft:rgba(185,58,19,.12);
  --green:#1E7A4E;--green-soft:rgba(30,122,78,.10);
  --max:1200px;--read:700px;--pad:clamp(18px,4.2vw,56px);
  --serif:'Fraunces',Georgia,serif;--sans:'Archivo',system-ui,sans-serif;
  --mono:'Space Mono',ui-monospace,monospace;
  --ease:cubic-bezier(.22,1,.36,1);
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--paper);color:var(--body);
  font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
body::after{content:"";position:fixed;inset:0;z-index:120;pointer-events:none;
  opacity:.05;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E")}
::selection{background:var(--accent);color:var(--paper)}
a{color:inherit;text-decoration:none}
a:focus-visible,button:focus-visible,input:focus-visible{
  outline:2px solid var(--accent);outline-offset:3px}
.wrap{max-width:var(--max);margin-inline:auto;padding-inline:var(--pad)}
</style>
</head>
<body>
<!-- header / main / footer here -->
</body>
</html>
```

### 19.2 Monogram template
Two letterforms sharing a stem; accent crossbar + accent dot. **Swap paths to the brand initials.**
```html
<svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
  <path d="M7 6 V38"  stroke="#181611" stroke-width="5"/>
  <path d="M23 6 V38" stroke="#181611" stroke-width="5"/>
  <path d="M7 22 H23" stroke="#B93A13" stroke-width="5"/>
  <path d="M23 38 H38" stroke="#181611" stroke-width="5"/>
  <circle cx="37" cy="7" r="3.4" fill="#B93A13"/>
</svg>
```

### 19.3 Reading-progress bar
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

### 19.4 Reveal-on-scroll
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

### 19.5 Auto-numbered article headings
```css
.prose{counter-reset:sec}
.prose h2{counter-increment:sec}
.prose h2::before{content:"§ " counter(sec,decimal-leading-zero);
  display:block;font-family:var(--mono);font-size:11px;letter-spacing:.22em;
  color:var(--accent);margin-bottom:14px}
```

---

## 20. Final Checklist

Before any page ships in this repo, confirm:

- [ ] Loads the three font families and uses the exact `:root` tokens.
- [ ] Has grain overlay, progress bar, skip link, sticky blurred header + monogram + mobile menu.
- [ ] Uses `.wrap`/`.read`, section borders, and the kicker / h2 / sec-tag pattern.
- [ ] Buttons, cards, rows, tags, forms match §9; motion matches §11 with reduced-motion fallback.
- [ ] Content areas are flat and airy; boxes only on interactive components.
- [ ] Passes §4 contrast and §13 accessibility; responsive per §12 with no overflow.
- [ ] Copy follows §15; nothing from the DON'T list appears.
- [ ] Passed the [Migration Checklist](#17-migration-checklist-for-existing-pages) if it pre-existed.
- [ ] All interactive targets ≥44px; focus states visible; `Esc` closes overlays.

---

*End of DESIGN.md for `hariomlohardev/claude-system` — if a result doesn't feel like a quiet, printed field notebook, it isn't finished.*
