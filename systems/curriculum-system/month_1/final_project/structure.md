# Final Project — minisklearn: Your Own Classical ML Library

> **Month 1 in this tracker = Roadmap Month 2: Probability, Information Theory & Classical ML From Scratch**
>
> By the end of this month you will have built `minisklearn` — a clean, importable, sklearn-compatible Python package you built entirely from scratch, validated against the real `sklearn` on real data, and polished enough to publish.

## Why this project

A collection of standalone scripts (`week1_probability.py`, etc.) proves you did the work to yourself, but it doesn't prove it to anyone else and it doesn't force you to confront API design, reuse, or testing. Packaging Weeks 1–3 into one library makes every derivation and debugging session load-bearing for something genuinely reusable — the same way `sklearn` is used in production. The comparison day at the end is the proof step: your code getting *essentially the same answers* as the industry standard is a stronger credential than any single algorithm demo.

This also sets up the rest of your roadmap: Month 3 onward (neural networks, deep learning) will be able to import and contrast against these classical baselines instead of starting from zero each time.

## Package skeleton (created on Week 4, Day 1)

```
minisklearn/
  __init__.py              # re-exports public API: from .linear_model import LinearRegression, LogisticRegression
  linear_model.py          # LinearRegression (GD/Adam), LogisticRegression (sigmoid + BCE)
  naive_bayes.py           # NaiveBayesClassifier (from Week 1, Days 1-2) — optional but valuable to include
  tree.py                  # DecisionTreeClassifier (ID3, entropy/information gain from Week 2 Day 3)
  ensemble.py              # RandomForestClassifier (bootstrap + feature randomness + majority vote)
  cluster.py               # KMeans (assignment / update loop, elbow method helper)
  metrics.py               # accuracy, precision, recall, f1_score, confusion_matrix
  utils.py                 # entropy, cross_entropy, kl_divergence, mutual_information,
                           #           expected_value, variance, covariance, gaussian_pdf, etc. (Weeks 1-2 utils)
```

> **Note:** Week 4's handout lists exactly `linear_model.py`, `tree.py`, `ensemble.py`, `cluster.py`, `metrics.py`. Keeping `naive_bayes.py` and `utils.py` as well is a natural extension of that skeleton — it lets you consolidate *every* function from Weeks 1-2 (`bayes_update`, `entropy`, MLE/MAP fitters, CLT helpers) instead of leaving them scattered.

Each model exposes a consistent, `sklearn`-like interface:

```python
model = LinearRegression()          # or LogisticRegression(), DecisionTreeClassifier(max_depth=...), etc.
model.fit(X, y)
pred = model.predict(X_test)        # and model.predict_proba(X_test) where it applies
```

## How daily work feeds the final package

| Week | Days | What you produce | Where it lands in `minisklearn` |
|------|------|------------------|---------------------------------|
| 1 | 1-2 | `bayes_update`, class priors, `P(word|class)` + Laplace smoothing, Naive Bayes classifier + train/test split + accuracy | `naive_bayes.py` + `utils.py` |
| 1 | 3-4 | discrete sampler (inverse-CDF), PMF/CDF plots, `expected_value`, `variance`, `standard_deviation` | `utils.py` |
| 1 | 5-6 | `covariance`, `covariance_matrix`, correlation matrix, Gaussian PDF, CLT simulation (sample-means bell curve) | `utils.py` |
| 2 | 1-2 | `log_likelihood`, `mle_fit_gaussian` (closed-form + GD), `map_fit_gaussian` + prior-strength sweep | `utils.py` |
| 2 | 3-5 | `entropy`, file-level entropy demo, `cross_entropy`, `kl_divergence`, `mutual_information` + feature-selection tool | `utils.py` + `metrics.py` (later) |
| 2 | 6 | consolidated `week2_utils.py` with asserts — becomes the nucleus of `utils.py`/`metrics.py` | `utils.py`, `metrics.py` |
| 3 | 1-6 | Linear/Logistic Regression (GD), SVM (hinge loss + margin plot + polynomial kernel), ID3 tree, Random Forest, K-Means + elbow | `linear_model.py`, `tree.py`, `ensemble.py`, `cluster.py` |
| 4 | 1 | refactor scattered week files into the package above, add `__init__.py`, docstrings, `metrics.py` formalized | the package itself |
| 4 | 2-3 | EDA + stratified split on a real Kaggle dataset, train 2+ minisklearn models, confusion-matrix + side-by-side metrics table, error inspection | validation of the package |
| 4 | 4 | head-to-head comparison: your models vs. `sklearn` on the exact same split — investigate gaps, write honest paragraph | proof of correctness |
| 4 | 5-6 | `README.md` with install/import/usage example, blog post, cleanup + `requirements.txt`, public GitHub push | portfolio artifact |

## Milestone "Done when" (from the plan itself)

* **Week 1:** you can derive Bayes' theorem on a blank sheet in under 2 minutes, and your `bayes_update` matches your hand disease-example.
* **Week 2:** `week2_utils.py` runs cleanly top-to-bottom with all asserts passing, and you can write the two summary paragraphs (Bayes/MLE/MAP and entropy/cross-entropy/KL) without notes.
* **Week 3:** each algorithm demos correctly on synthetic/real data (e.g., K-Means elbow at true k, Random Forest ≥ single tree).
* **Week 4 overall:** `import minisklearn` works from a separate script, 2+ models report a real side-by-side metrics table on a genuine dataset, your numbers are within a small, explainable margin of `sklearn`'s on the same split, and the repo + README + blog post are public.

## Stretch / next-month tie-in

If you came from a Month-1 autograd/PCA project (not tracked in this repo yet), `minisklearn` can later be benchmarked against it: e.g., rerun PCA from Month 1 on the same Week 4 dataset before feeding it to K-Means, or swap in your Month-1 gradient descent/Adam for Week 3's regressions. Month 3's neural-network work will then have a ready set of classical baselines to outperform — the classic "why deep learning?" comparison is only convincing when the classical side is honest and from-scratch.

## What to keep clean from day one

- One running file per week (e.g. `week1_probability.py`) that you *append* to day by day — don't scatter throwaways — so the Week 4 consolidation is mostly moving, not rewriting.
- No `sklearn`/`scipy.stats`/`np.cov` shortcuts until Week 4 Day 4, where comparison is explicitly invited.
- Plots committed where the plan asks for them (histograms, CDFs, loss curves, margin plots, elbow) — they're part of the deliverable.
