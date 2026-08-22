# Week 2, Day 1 — Maximum Likelihood Estimation (MLE)

> Intermediate — Python. This day is the bridge from probability (Week 1) to actual model training: every "fit" and every cross-entropy loss you will use later *is* MLE.

## Why this day matters

Nearly every training step in ML is MLE in disguise. Minimizing cross-entropy loss *is* maximizing likelihood. Understanding MLE turns "the model learns" from magic into a concrete optimisation problem you can write, differentiate, and code.

---

## Coding problems

Complete `code/mle.py` (stubs provided). No `sklearn`, `scipy.stats`, or `np.cov` shortcuts — use only `math` and the Python standard library (or `numpy` only for synthetic data generation if you prefer; the core functions themselves must not rely on it).

### 1) `log_likelihood(data, mu, sigma)` — from scratch

- **Signature:** `log_likelihood(data: list[float], mu: float, sigma: float) -> float`
- **Task:** Given `n` independent samples assumed to come from a Gaussian `N(μ, σ²)`, compute the *log*-likelihood. Recall for a single point the Gaussian PDF is `(1 / (σ√(2π))) * exp(-(x-μ)²/(2σ²))`. The likelihood for the dataset is the product over points; the log-likelihood is the sum of log-PDFs.
- **Why log:** Working in log-space avoids underflow (products of many small probabilities → 0) and turns products into sums that are easy to differentiate. Explain this in a comment above the function.
- **Edge cases:** `sigma <= 0` must raise `ValueError`. Empty `data` should return `0.0` or raise — document your choice.
- **Verify by hand:** On paper, compute the log-likelihood for `data=[2.0, 3.0]`, `μ=2.5`, `σ=1.0` using the formula, then confirm your function returns the same number.

### 2) `mle_fit_gaussian_closed_form(data)` — closed-form solution

- **Signature:** `mle_fit_gaussian_closed_form(data: list[float]) -> tuple[float, float]` returns `(mu_mle, sigma_mle)`
- **Task:** Derive and implement the MLE estimators you derived on paper: `μ̂ = sample mean` and `σ̂² = (1/n) Σ (x_i - μ̂)²` (the *biased* MLE variance — not Bessel's `n-1` correction).
- **Requirement:** Show derivation in a short comment or docstring: start from `log L(μ,σ)`, differentiate w.r.t `μ`, set to `0`, solve. Same for `σ²`.
- **Check:** On `data = [1.0, 2.0, 3.0, 4.0, 5.0]` the answer should be `μ̂=3.0`, `σ̂²=2.0`.

### 3) `mle_fit_gaussian_numerical(data, ...)` — numerical optimisation

- **Signature:** `mle_fit_gaussian_numerical(data: list[float], mu_range: tuple[float,float] | None = None, sigma_range: tuple[float,float] | None = None, steps: int = 200) -> tuple[float, float]`
  - Alternative name `mle_fit_gaussian_grid` is also accepted by the tests if you prefer a grid search.
- **Task:** Implement MLE *without* using the closed form. Two options — pick one (or both) and document which you chose:
  1. **Grid search:** loop over a grid of `(μ, σ)` values, call `log_likelihood` for each, keep the maximiser. Choose sensible default ranges if `mu_range`/`sigma_range` not given (e.g. μ around data mean ± a few sigma, σ in `[0.1, max spread]`).
  2. **Gradient ascent:** implement a tiny gradient-ascent loop that *maximises* `log_likelihood` (use your Month 1 gradient-descent intuition but ascending; or reuse an Adam optimizer if you built one in Month 1).
- **Goal:** On a synthetic dataset drawn from a *known* `μ_true, σ_true` (see task 4), this numerical optimiser and the closed-form answer must agree within tolerance (see tests). If they diverge, you have a bug — debug at least one discrepancy fully rather than waving it away.

### 4) Synthetic-data sanity check (script-level, not just a function)

- **Task:** In `if __name__ == "__main__":` or a helper `generate_synthetic_gaussian(n, mu_true, sigma_true, seed=0) -> list[float]`:
  - Generate data from a known `μ_true, σ_true` (e.g. `μ=5.0, σ=2.0` or any you pick) using only `random.gauss` (or `numpy.random` if you prefer, but keep the MLE logic stdlib-only).
  - Run *both* fitters on the same dataset and assert they agree (`abs(mu_closed - mu_grid) < 0.05` and similarly for sigma, with enough samples).
  - Repeat for `n=5` and `n=5_000` drawn from the *same* true distribution — observe how the estimates' variance shrinks with `n`. Leave a short comment linking this to the Law of Large Numbers.

### 5) (Stretch) Small-data intuition

- Run `mle_fit_gaussian_closed_form` on a tiny dataset of size `2` and then `1`. What does it return for `σ̂` when `n=1`? Is that a *reasonable* estimate? Write your answer as a comment in the file — it foreshadows why MAP (tomorrow) exists.

---

## Practice questions (do on paper first)

These are from the plan — answer without code, then check with code where noted.

1. **Why log?** Why do we maximise the *log*-likelihood instead of the likelihood directly? Show mathematically what happens to `∏ P(x_i|μ,σ)` when each `P` is < 1 and `n` grows, and why the log fixes both numerical and calculus problems.

2. **Derive μ̂.** Starting from `log L(μ,σ) = Σ log P(x_i|μ,σ)` for a Gaussian, take `∂/∂μ`, set to `0`, and solve — you should land on `μ̂ = (1/n) Σ x_i`. Show every step; don't just quote the result.

3. **Tiny data.** If you had only 2 data points, would MLE still give a reasonable estimate? What about just 1 point? Work through what `μ̂` and `σ̂` become in each case and judge.

4. **Code check — n=5 vs 5 000.** Run both fitters on datasets of size `5` vs `5,000` from the same true distribution. How much does the estimate vary across repeated runs? Explain what you observe in terms of the Law of Large Numbers.

---

## Done when

- `log_likelihood` matches your hand-worked `μ=2.5, σ=1.0` example.
- Closed-form and numerical fitters converge to the same answer (within tolerance) on a synthetic dataset with known `μ_true, σ_true`.
- You can derive `μ̂ = sample mean` from the Gaussian log-likelihood on a blank sheet without notes.
