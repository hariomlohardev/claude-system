# Final Project Logs

> Append-only log for the `minisklearn` capstone (Month 1 in this tracker / Roadmap Month 2). Each entry is a dated note as days complete — what was built, what broke, what was learned, what needs revisiting.

## 2026-08-20 — Generated Day 7 (Week 2, Day 1): Maximum Likelihood Estimation (MLE)
- Guided mode. Topic bridges Week 1's Bayes into Week 3's training: MLE = maximise `L(μ,σ)=∏P(x_i|μ,σ)` → log-space → closed-form `μ̂=mean`, `σ̂²=mean((x-μ̂)²)` vs. numerical grid/gradient optimisation.
- Materials: `learn.md` (2 verified StatQuest videos), `coding_problems.md`, `roadmap.md`, stub `code/mle.py` + `code/tests/test_mle.py` (hand example + synthetic agreement check + Law-of-Large-Numbers comment). No external dataset — synthetic Gaussian via `random.gauss` (seeded).
- Capstone tie-in: `log_likelihood` thinking becomes `cross_entropy`/`KL` (Week 2 Days 3-5) and every loss minimised in Week 3; this day's two-method agreement discipline mirrors Week 4 Day 4's `minisklearn` vs. `sklearn` validation.
- No new dependency introduced today — `math`/`random` only (synthetic helper). `requirements.txt` unchanged.

No earlier entries — this is the first generated day after the Week 1 fast-forward (skip-to).
