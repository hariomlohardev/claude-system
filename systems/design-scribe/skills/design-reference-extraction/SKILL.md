---
name: design-reference-extraction
description: How to process a single design reference — a URL, an image file, or a plain-text tweak — into structured notes for Design Scribe. Use this whenever /design-example receives a new reference, before regenerating the HTML preview. Covers when to run scripts/fetch_url_design.py, when to view an image directly, and how to hand off to the design-extractor subagent.
---

# Design Reference Extraction

Every reference, regardless of type, ends with one thing: a new entry appended to `.design-scribe/references.md`, written by the `design-extractor` subagent (see `agents/design-extractor.md`). This skill covers how to get each reference *into* a form that subagent can work with.

## Step 1 — identify the reference type

- Starts with `http://` or `https://` → **URL reference**
- A path that resolves to an existing image file (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`) → **image reference**
- Anything else → **text tweak** (a direction, not a new source of truth — e.g. "sharper corners", "more playful")

A single `/design-example` call may include a reference *and* a text tweak together — handle both.

## Step 2 — get the raw material

### URL reference

Run the script, giving it an output directory under `.design-scribe/refs/<n>-<slug>/`:

```bash
python3 scripts/fetch_url_design.py "<url>" ".design-scribe/refs/<n>-<slug>/"
```

This does **both** of the following in one pass (never just one):
- Launches Playwright/Chromium, takes a full-page screenshot → `screenshot.png`
- Fetches the page HTML plus linked stylesheets via requests/BeautifulSoup, extracts colors, font stacks, spacing/radius values, and the raw `<head>`/inline `<style>` content → `tokens.json` + `source.html`

Read the script's JSON stdout summary. If it reports `"screenshot": null` with an error (timeout, bot-block, auth wall), that's a **partial success, not a failure** — proceed with `tokens.json` alone, and say so explicitly in the extractor notes ("screenshot unavailable: <reason>").

### Image reference

Don't run any script — view the image file directly (you have native image understanding). Look for: dominant colors, typographic style if text is visible, spacing/density, corner radius/shadow style, overall mood (minimal, maximalist, brutalist, playful, corporate, etc.).

### Text tweak

No extraction step — pass the text straight through to both the extractor (so it's logged) and the preview-regeneration step.

## Step 3 — hand off to design-extractor

Invoke the `design-extractor` subagent with:
- the reference type
- the raw material (screenshot path + tokens.json for URLs; the image itself for images; the tweak text for tweaks)
- the existing `.design-scribe/references.md` (so it can note agreements/contradictions with prior references, not just describe this one in isolation)

Append its output as a new entry to `.design-scribe/references.md`. Never overwrite prior entries — this file is append-only.

## Step 4 — regenerate the preview

After the reference is logged, regenerate `.design-scribe/preview.html` incorporating the full accumulated `references.md`, not just the newest entry. If references conflict (e.g. reference 1 was minimal, reference 3 is maximalist), the most recent reference or explicit text tweak wins — but note the override in the preview's HTML as an inline comment, so it's traceable.

Then hand off to the `design-critic` subagent automatically (see `agents/design-critic.md`) — this is not optional, even if the user didn't ask for a score.
