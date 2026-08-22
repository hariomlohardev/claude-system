# Project History

> How each month's final project connects to the next. Updated by `/month` whenever a new month is added.

## Month 1 — Starting point: Probability, Information Theory & Classical ML From Scratch

- **Source:** Roadmap Month 2 (`month-2-detailed.md`) — this repo's first tracked month, so it lands as `month_1` here.
- **Final project:** `minisklearn` — a from-scratch, `sklearn`-compatible Python package (Linear/Logistic Regression, Naive Bayes, Decision Trees/ID3, Random Forests, K-Means, plus `metrics.py` and `utils.py` for entropy/KL/MI/covariance/CLT). Built day-by-day from Weeks 1–3 standalone scripts and hardened in Week 4 (package refactor → real Kaggle dataset → sklearn head-to-head → README + blog post → public GitHub repo).
- **Why it matters:** This is the classical foundation everything later builds on. MLE/MAP become the language for training, entropy/cross-entropy/KL become the losses, and the five classical models become honest baselines that Month 3's neural nets will have to actually beat — not just replace with hype.

*Next month's entry will describe explicitly how its final project builds on `minisklearn` (e.g., reusing its metrics, datasets, or train/test discipline, and contrasting classical vs. neural results on the same data).*
