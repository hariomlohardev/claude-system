# Week 2, Day 1 — Maximum Likelihood Estimation (MLE)

> **Mode:** guided · **Topic:** Maximum Likelihood Estimation for a Gaussian — how models *learn* by maximising likelihood
> **Language:** python (intermediate) · **Day 7 / 24 overall**

## Why this matters

Nearly every “training” step in ML is MLE in disguise. When you later minimise cross-entropy loss, you are *maximising likelihood* under the hood. Today you’ll see the full chain — write the likelihood, move to log-space, differentiate, and solve — and then code it two different ways that must agree. Once this clicks, the entire arc from Week 2 (entropy → cross-entropy → KL) through Week 3 (every gradient-trained model) becomes one coherent story instead of a bag of tricks.

---

## Watch first — before you code

> **Do not rely on autoplay or recommendations — search YouTube for the exact phrases given and pick the verified result below.** These were verified live (HTTP 200 + title check on 2026-08-20) so they’re not hallucinations.

### 1) StatQuest — “Maximum Likelihood, clearly explained!!!”
- **Channel:** StatQuest with Josh Starmer
- **URL:** https://www.youtube.com/watch?v=XepXtl9YKwc
- **Verified title on YouTube:** `Maximum Likelihood, clearly explained!!!`
- **Length:** ~8–9 min (StatQuest short-form)
- **Why watch this one:** This is the canonical MLE explainer you need. Josh builds the likelihood for a normal distribution from scratch on pen-and-paper, shows why the product of densities is the likelihood, why you *have* to move to log-likelihood immediately (products of tiny numbers underflow; sums don’t), and walks the derivative intuition that lands on the sample mean. It’s the exact derivation you’ll reproduce by hand today — watch it once straight through, then pause-and-copy the algebra yourself.

### 2) StatQuest — “In Statistics, Probability is not Likelihood.” (Probability vs. Likelihood)
- **Channel:** StatQuest with Josh Starmer
- **URL:** https://www.youtube.com/watch?v=pYxNSUDSFH4
- **Verified title on YouTube:** `In Statistics, Probability is not Likelihood.`
- **Length:** ~6–7 min
- **Why watch this one:** MLE is constantly confused with “most probable parameters” — this companion piece kills that confusion. It makes the *likelihood* vs. *probability* distinction surgical (probability: data varies, parameters fixed; likelihood: data fixed, parameters vary), which is precisely the mental flip you need for `L(μ,σ) = ∏ P(x_i | μ,σ)` and for understanding tomorrow’s MAP. Watch this second; it cements *why* you’re maximising over μ,σ at all.

> **How to watch:** First video straight through, then re-derive the Gaussian log-likelihood on a blank sheet while the video is paused. Second video after your derivation — see if you can explain the probability/likelihood flip in one sentence before Josh says it. If you still want the full calculus lecture, watch 3 (first 30 min) after the two short ones.

> **If a link ever rots:** search YouTube for the exact phrases **“StatQuest maximum likelihood clearly explained”** and **“StatQuest probability is not likelihood”** — they are the top results and have been stable for years. Supplementary reading is *not* bundled into this day — if you want articles/papers, run `/for-read` any time (opt-in only).

### 3) MIT OpenCourseWare — Lecture 4: Parametric Inference (cont.) and Maximum Likelihood Estimation *(extra depth, ~30 min recommended)*
- **Channel:** MIT OpenCourseWare (18.650 Statistics for Applications, Fall 2016)
- **URL:** https://www.youtube.com/watch?v=rLlZpnT02ZU
- **Verified via:** `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=rLlZpnT02ZU&format=json` → title `"4. Parametric Inference (cont.) and Maximum Likelihood Estimation"`, author `"MIT OpenCourseWare"` + MIT OCW video gallery `ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/video_galleries/lecture-videos/` lists `img.youtube.com/vi/rLlZpnT02ZU` as the same lecture. Agent `video-researcher` verified live on 2026-08-20 (WebSearch was `400 max_uses not supported`, so verification fell back to oEmbed + page parse).
- **Length:** ~50 min full lecture — **watch 0:00–30:00 for Day 1**
- **Why watch this one:** The rigorous complement to StatQuest — exact match for your hand math. The professor derives the Gaussian log-likelihood, takes `∂/∂μ → μ̂ = (1/n)Σx_i` and `∂/∂σ² → σ̂² = (1/n)Σ(x_i-μ̂)²` (biased, vs. Bessel’s `1/(n-1)`), and discusses bias. Directly prepares you to implement *both* `mle_fit_gaussian_closed_form` *and* to understand what your grid/gradient numerical optimiser should converge to on synthetic data.

### 4) MIT OpenCourseWare — Lecture 5: Maximum Likelihood Estimation (cont.) *(optional continuation)*
- **Channel:** MIT OpenCourseWare
- **URL:** https://www.youtube.com/watch?v=0Va2dOLqUfM
- **Verified via:** same MIT OCW gallery lists `img.youtube.com/vi/0Va2dOLqUfM` as `"Lecture 5: Maximum Likelihood Estimation (cont.)"` + oEmbed → title `"5. Maximum Likelihood Estimation (cont.)"`, author `"MIT OpenCourseWare"`, verified live on 2026-08-20.
- **Length:** ~50 min
- **Why worth queueing:** Continuation of Lecture 4 — MLE properties (invariance, consistency, efficiency) that explain *why* MLE underpins cross-entropy minimisation in modern ML. Watch after your closed-form + numerical code passes; it foreshadows Week 2 Days 3–5 (entropy/KL) beautifully.

> **Agent note:** All four URLs above are real, public, and accessible as of 2026-08-20. The `video-researcher` subagent verified 1 & 2 via `youtube.com/oembed` + `noembed.com/embed` and 3 & 4 via oEmbed + MIT OCW page parse (direct `WebSearch` queries returned `400` this session, so oEmbed was the fallback). Order the agent recommends: **2 → 1 → 3 (first 30 min)** — intuition → likelihood definition → full Gaussian calculus.

---

## What to learn today

By the end of today you can:

1. **Write the likelihood** for `n` i.i.d. Gaussian samples: `L(μ,σ) = ∏ [ 1/(σ√(2π)) · exp(-(x_i - μ)²/(2σ²)) ]`
2. **Move to log-likelihood** and explain *why*: numerical stability (products of <1 numbers → 0) + turns a product into a sum, which is trivial to differentiate. Write `ℓ(μ,σ) = Σ log P(x_i|μ,σ) = -n·0.5·log(2π) - n·log σ - Σ(x_i - μ)²/(2σ²)`
3. **Derive the MLE** by calculus: `∂ℓ/∂μ = 0 → μ̂ = (1/n) Σ x_i` (sample mean) and `∂ℓ/∂σ² = 0 → σ̂² = (1/n) Σ (x_i - μ̂)²` (biased MLE variance — Bessel’s `n-1` is the *unbiased* correction, MLE deliberately doesn’t use it)
4. **Explain MLE vs. MAP** in one line (tomorrow’s bridge): MLE maximises `P(data|θ)`, MAP maximises `P(data|θ)·P(θ)` — i.e. “what data says alone” vs. “what data says plus what you believed beforehand”

---

## Work through by hand (before you touch your editor)

- Start from the Gaussian PDF, write it for one `x_i`, then for `n` points as a product.
- Take `log` on both sides, expand the sum. Keep `σ` symbolic; don’t plug numbers yet.
- Differentiate `ℓ` w.r.t `μ`: the `log σ` term drops, the quadratic term yields `Σ (x_i - μ)/σ²`. Set to 0 → solve.
- Differentiate w.r.t `σ` (or `σ²` — either works, but be explicit which you picked). Show the step that turns “maximise `P(data|θ)`” into “minimise negative log-likelihood” — this is the same loss you’ll meet as cross-entropy in Week 2 Day 4.
- Tiny numerical check on paper: `data=[2.0, 3.0]`, `μ=2.5`, `σ=1.0`. Compute `ℓ` by hand: each `log P = -0.5 log(2π) - log 1 - (x-2.5)²/2`. Sum should be ≈ `-2.08788`. Your `log_likelihood` function must return this exact number.

---

## How this ties to the capstone (`minisklearn`)

- `log_likelihood` + the MLE idea become the *loss function* for every model in `minisklearn`. Linear regression’s MSE (Week 3 Day 1) is literally Gaussian MLE with fixed σ. Logistic regression’s binary cross-entropy (Week 3 Day 2) is Bernoulli MLE.
- The “closed-form vs. numerical optimiser must agree” check you do today is the same discipline as Week 4 Day 4’s “your `minisklearn` must match `sklearn` on the same split or you debug a real gap.”
- Keep `code/mle.py` clean — on consolidation day (Week 2 Day 6 / Week 4 Day 1) its functions will seed `minisklearn/utils.py`.

---

## What to do next

1. Follow `roadmap.md` top-to-bottom.
2. Fill `code/mle.py` stubs — keep comments linking each formula back to the hand derivation.
3. `pytest month_1/week_2/day_1/code/tests -v` must pass before `/done` will let you close the day.
4. Stuck? Run `/explain "maximum likelihood"` for a deeper dive on today’s math, or `/for-read` if you want papers/articles (optional, never required).

> **Data note:** No external dataset needed today. You’ll generate your own synthetic Gaussian with `random.gauss` (see `generate_synthetic_gaussian` stub) — deterministic via `seed` so checks are reproducible.

