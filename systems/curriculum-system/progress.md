# Progress

> Human-readable log, across all months. Machine truth lives in `state.json` — this file is for you to skim.

---

## Month 1 — Probability, Information Theory & Classical ML From Scratch

*Roadmap source: `month-2-detailed.md` — tracked here as Month 1 because this is the first month in this repo. Future roadmap months will follow as Month 2, 3, …*
- **Started:** 2026-08-20
- **Language:** python — `pytest` (`pip install -r requirements.txt`)
- **Skill level:** intermediate
- **Status:** in progress — Day 7 (Week 2, Day 1) is current — fast-forwarded via `/skip-to day 7` (Week 1 marked done)

### Week 1 — Probability & Bayesian Inference

*Done when: Bayes' theorem is the single most important idea in this week — everything else (Naive Bayes, MLE, MAP, even how LLMs sample the next token) traces back to it. By the end of this week you should be able to derive Bayes' theorem from scratch, on paper, without looking it up.* — **review: pending**

| Global | Day | Topic (from /i-am-in) | Status | Flags | Confidence | Time |
|--------|-----|------------------------|--------|-------|------------|------|
| 1 | W1 D1 — Bayes' Theorem & Conditional Probability | — | done (via skip-to) | — | — | — |
| 2 | W1 D2 — Naive Bayes Classifier | — | done (via skip-to) | — | — | — |
| 3 | W1 D3 — Random Variables & Distributions (PMF, PDF, CDF) | — | done (via skip-to) | — | — | — |
| 4 | W1 D4 — Expected Value & Variance | — | done (via skip-to) | — | — | — |
| 5 | W1 D5 — Covariance Matrices | — | done (via skip-to) | — | — | — |
| 6 | W1 D6 — Gaussian, Bernoulli, Multinomial + The Central Limit Theorem | — | done (via skip-to) | — | — | — |

### Week 2 — Maximum Likelihood, MAP & Information Theory

*Done when: Learn how models actually learn parameters from data (MLE/MAP), then learn the mathematical vocabulary of "surprise" and "difference between distributions" (entropy, cross-entropy, KL divergence) — this is the exact math behind every loss function you'll use for the rest of this roadmap.* — **review: pending**

| Global | Day | Topic | Status | Flags | Confidence | Time |
|--------|-----|-------|--------|-------|------------|------|
| 7 | W2 D1 — Maximum Likelihood Estimation (MLE) | — | **current** | — | — | — |
| 8 | W2 D2 — MAP Estimation & Priors | — | pending | — | — | — |
| 9 | W2 D3 — Shannon Entropy | — | pending | — | — | — |
| 10 | W2 D4 — Cross-Entropy & KL Divergence | — | pending | — | — | — |
| 11 | W2 D5 — Mutual Information | — | pending | — | — | — |
| 12 | W2 D6 — Review + Consolidation | — | pending | — | — | — |

### Week 3 — Classical ML From Scratch

*Done when: Build the algorithms that ran the world before deep learning — and understand that they're not "outdated," they're still the right tool for a huge fraction of real-world problems (tabular data, small datasets, interpretability requirements).* — **review: pending**

| Global | Day | Topic | Status | Flags | Confidence | Time |
|--------|-----|-------|--------|-------|------------|------|
| 13 | W3 D1 — Linear Regression (Gradient Descent Version) | — | pending | — | — | — |
| 14 | W3 D2 — Logistic Regression | — | pending | — | — | — |
| 15 | W3 D3 — Support Vector Machines & the Kernel Trick | — | pending | — | — | — |
| 16 | W3 D4 — Decision Trees (ID3 Algorithm) | — | pending | — | — | — |
| 17 | W3 D5 — Random Forests | — | pending | — | — | — |
| 18 | W3 D6 — K-Means Clustering | — | pending | — | — | — |

### Week 4 — Month 2 Capstone (minisklearn)

*Done when: Stop writing isolated scripts. Package everything from Weeks 1–3 into one real, reusable, tested library — and use it on a genuine dataset the way you'd use sklearn.* — **review: pending**

| Global | Day | Topic | Status | Flags | Confidence | Time |
|--------|-----|-------|--------|-------|------------|------|
| 19 | W4 D1 — Package Structure | — | pending | — | — | — |
| 20 | W4 D2 — Apply to a Real Dataset | — | pending | — | — | — |
| 21 | W4 D3 — Evaluate | — | pending | — | — | — |
| 22 | W4 D4 — Compare Against Real sklearn | — | pending | — | — | — |
| 23 | W4 D5 — Write It Up | — | pending | — | — | — |
| 24 | W4 D6 — Push to GitHub + Rest | — | pending | — | — | — |

### Final project for this month

`month_1/final_project/structure.md` — `minisklearn`: a clean `sklearn`-like package (`linear_model.py`, `tree.py`, `ensemble.py`, `cluster.py`, `metrics.py` + `naive_bayes.py`/`utils.py` consolidation) validated side-by-side against real `sklearn` and published with README + blog post. See that file for the full skeleton and daily feed-in map.
