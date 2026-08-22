---
description: Add a design reference (URL, image, or text tweak) and regenerate the HTML preview, then automatically score it against everything gathered so far.
argument-hint: <url | image-path> [additional tweak/prompt text]
---

# /design-example

You've been given: `$ARGUMENTS`

Do the following, in order, every time this command runs:

1. **Ensure working state exists.** If `.design-scribe/` doesn't exist yet, create it (`references.md`, `critique-log.md` as empty files, `refs/` as a directory).

2. **Parse the input.** Split `$ARGUMENTS` into a reference (URL or image path, if present) and any remaining free text (the tweak/prompt). Either can be absent, but not both — if there's truly nothing, ask the user what they'd like to add.

3. **Extract.** Follow `skills/design-reference-extraction/SKILL.md` exactly:
   - URL → run `scripts/fetch_url_design.py` for **both** the screenshot and the HTML/CSS token extraction (never just one), then invoke `agents/design-extractor.md`.
   - Image path → view it directly, then invoke `agents/design-extractor.md`.
   - Text-only tweak → invoke `agents/design-extractor.md` with the tweak text (no raw material to fetch).
   - Append the resulting entry to `.design-scribe/references.md`.

4. **Regenerate the preview.** Rewrite `.design-scribe/preview.html` from scratch using the *entire* accumulated `references.md` (not just the newest entry), applying the rules in the skill about later references/tweaks overriding earlier ones where they conflict. This should be a real, viewable static HTML page (inline `<style>` is fine) that demonstrates the direction — not a token list.

5. **Critique automatically.** Invoke `agents/design-critic.md` against the fresh `preview.html` and the full `references.md`. This step is **never skipped or made conditional on the user asking for it.**

6. **Report back to the user:**
   - Confirm what was added (one line)
   - The critic's score and its top 1-3 fixes
   - Remind them they can call `/design-example` again with another reference or tweak, or run `/design-doc` when satisfied

## Notes

- If the URL screenshot fails (Playwright timeout, bot-block, auth wall), don't stop the loop — proceed with CSS-only extraction for that reference, and say plainly in your report that the screenshot didn't work and why.
- If `setup.sh` prerequisites are missing entirely (Playwright/Chromium not installed), URL references can't be processed at all — tell the user exactly what to run, and suggest they use image or text-tweak references in the meantime.
