---
name: design-md-writing
description: Required structure, tone, and level of detail for the final DESIGN.md that /design-doc produces. Use this whenever synthesizing accumulated references, preview HTML, and critique feedback into the final design-reference file. Ensures the output is written for an AI reader with zero prior context, not a human skimming for vibes.
---

# Writing DESIGN.md

`DESIGN.md` is read by other Claude Code sessions and subagents that have never seen this conversation. Write for that reader: no "as discussed," no unresolved pronouns, no adjectives standing in for a value when a reference actually supports a concrete one.

## Required sections, in order

1. **Overview** — one paragraph: what this design language is for (product/brand name if known) and the one-line aesthetic summary (e.g. "warm, editorial, high-contrast serif headlines over a muted neutral palette").
2. **Color palette** — a table: token name, hex value, usage (e.g. `--color-accent`, `#2D5C4F`, "primary CTA background"). Pull exact hex values from `tokens.json`/extractor notes wherever available; only use a named color ("forest green") when no hex was ever captured for it, and flag it as approximate.
3. **Typography** — font family/stack for headings and body, weight usage, approximate type scale (sizes in rem/px) if derivable from references.
4. **Spacing & layout** — base spacing unit if one is discernible, common radius/shadow values, grid/layout conventions observed.
5. **Components & patterns** — recurring UI patterns seen across references (button styles, card treatment, nav patterns) — described concretely enough that another agent could implement one without seeing the original reference.
6. **Voice & tone** — only include this if references actually carried copy/text to observe; don't invent a tone from a screenshot with no visible text.
7. **Accessibility notes** — anything relevant surfaced by the critic across iterations (contrast concerns, font-size floors, etc.) — carry these forward as constraints, not just history.
8. **Do's and don'ts** — a short bullet list contrasting the direction with explicitly rejected alternatives (things earlier references suggested but later references/tweaks overrode) — this is often the most useful section for an agent avoiding regressions.
9. **Source references** — list what fed this (URLs, image filenames, tweak prompts) with the date, and the final critic score, so a future reader knows how much iteration this has been through.

## Rules

- Every claim should be traceable to something in `.design-scribe/references.md` or the critic log — don't add generic design-system boilerplate that wasn't actually observed.
- Prefer tables and short bullets over prose paragraphs — this file is meant to be scanned and pattern-matched by an LLM, not read start to finish by a human.
- If references conflicted and a later one won, say so in "Do's and don'ts" rather than silently dropping the earlier direction — that context prevents an agent from reintroducing the rejected version.
- Keep it as short as it can be while staying complete — an agent loading this into context pays for every line.
