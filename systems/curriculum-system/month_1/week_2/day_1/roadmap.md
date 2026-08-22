# Roadmap — Day 7 (Week 2, Day 1): Maximum Likelihood Estimation

**Mode:** guided · **Topic:** Maximum Likelihood Estimation (MLE) for a Gaussian

This is your checklist for the day. Work top-to-bottom; code comes after the paper.

### 1) Watch first (see `learn.md` for links — watch before you code)
- StatQuest: Maximum Likelihood — the core explainer (clear derivation + visual intuition)
- Second video (complement — math-focused derivation / numerical perspective)
- As you watch, write down: likelihood vs. probability, why log, how derivative w.r.t μ gives the sample mean

> Search YouTube for the exact phrases if links ever rot: the plan's canonical search is **"StatQuest maximum likelihood clearly explained"**.

### 2) Work through the math — by hand, no editor
- Write the Gaussian likelihood for `n` i.i.d. samples: `L(μ,σ) = ∏ P(x_i | μ,σ)`
- Take the log → log-likelihood; explain log-space (stability + products → sums, easier to differentiate)
- Differentiate w.r.t `μ`, set `∂logL/∂μ = 0`, solve → `μ̂ = mean(x)`. Do the same for `σ²` → `σ̂² = (1/n) Σ (x_i - μ̂)²`

### 3) Code (`code/mle.py` + `code/tests/`)
1. Implement `log_likelihood(data, mu, sigma)` — pure `math`, handle `sigma <= 0`
2. Implement `mle_fit_gaussian_closed_form(data)` — direct mean/variance formulas
3. Implement `mle_fit_gaussian_numerical(data)` — grid search (or gradient ascent) that maximises `log_likelihood` without using the closed form
4. Generate synthetic Gaussian data with known `μ_true, σ_true` (`random.gauss` or `numpy`) and confirm closed-form and numerical fitters agree
5. Hand-check `log_likelihood` on a tiny example: `data=[2.0,3.0], μ=2.5, σ=1.0`
6. Stretch: try `n=2` and `n=1` — what happens to `σ̂`?

Run tests as you go: `pytest month_1/week_2/day_1/code/tests -v` (from repo root).

### 4) Practice questions (paper first)
- See `coding_problems.md` → Practice questions 1–4. Answer before opening your editor for that section.

### 5) Check today's "Done when"
- Closed-form and numerical MLE fitters agree on synthetic data with known truth
- You can derive `μ̂ = sample mean` from the Gaussian log-likelihood alone on a blank sheet

### 6) Tie into the capstone
- The MLE you build today is exactly `"training"` for every model in `minisklearn` later. Today's `log_likelihood` thinking becomes `cross_entropy` (Week 2 Day 4) and every loss you minimise in Week 3. Keep `mle.py` clean — it will seed `minisklearn/utils.py` on consolidation day.

> Supplementary reading is opt-in: `/for-read` any time if you want articles/papers on MLE — not required for the base day.
