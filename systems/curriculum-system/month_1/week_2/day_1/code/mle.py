"""
Week 2 Day 1 — Maximum Likelihood Estimation (MLE)
Implement MLE for a univariate Gaussian from scratch.

No sklearn / scipy.stats / np.cov shortcuts — only `math` / `random` (numpy allowed
only for synthetic data generation if you prefer; the MLE logic itself must be stdlib).

Complete each function below, then verify via:
    pytest month_1/week_2/day_1/code/tests -v
"""

import math
import random
from typing import List, Tuple, Optional


def log_likelihood(data: List[float], mu: float, sigma: float) -> float:
    """
    Compute the log-likelihood of `data` under a Gaussian N(mu, sigma^2).

    For a single point x, the PDF is:
        P(x | mu, sigma) = 1/(sigma*sqrt(2*pi)) * exp(-(x-mu)^2 / (2*sigma^2))

    The likelihood for n i.i.d. points is the product of these; the
    log-likelihood is the sum of log-PDFs.

    Args:
        data: list of floats (independent samples).
        mu: mean parameter.
        sigma: standard deviation (>0).

    Returns:
        Sum over data of log P(x_i | mu, sigma) as a float.

    Raises:
        ValueError: if sigma <= 0.

    Hint: write the log-PDF for one point first, then sum.
    - log P(x|mu,sigma) = -0.5*log(2*pi) - log(sigma) - (x-mu)^2/(2*sigma^2)
    """
    raise NotImplementedError("Implement log_likelihood from the formula in the docstring")


def mle_fit_gaussian_closed_form(data: List[float]) -> Tuple[float, float]:
    """
    Closed-form MLE for a Gaussian.

    Derive by setting d/dmu logL = 0  ->  mu_mle = sample mean
         and d/d(sigma^2) logL = 0  ->  sigma^2_mle = (1/n) sum (x_i - mu_mle)^2

    Note: this is the *biased* MLE variance (divide by n, not n-1). Bessel's
    correction is the unbiased sample variance — MLE deliberately doesn't use it.

    Args:
        data: non-empty list of floats.

    Returns:
        (mu_mle, sigma_mle) where sigma_mle = sqrt(variance_mle).

    Raises:
        ValueError: if data is empty.
    """
    raise NotImplementedError("Implement closed-form MLE: mu=mean, sigma²=mean squared deviation")


def mle_fit_gaussian_numerical(
    data: List[float],
    mu_range: Optional[Tuple[float, float]] = None,
    sigma_range: Optional[Tuple[float, float]] = None,
    steps: int = 200,
) -> Tuple[float, float]:
    """
    Numerical MLE — maximise log_likelihood without using the closed form.

    You may implement EITHER:
      (a) Grid search: loop over mu and sigma grids, keep the maximiser of
          log_likelihood, OR
      (b) Gradient ascent: iteratively ascend log_likelihood.

    Grid search is simpler and fully acceptable for this day.

    Args:
        data: non-empty list of floats.
        mu_range: (mu_min, mu_max) to search; if None, infer from data
                  (e.g. mean ± a few sigma / data spread).
        sigma_range: (sigma_min, sigma_max) to search; if None, infer
                     (e.g. 0.1 to data spread). sigma_min must be >0.
        steps: grid resolution per dimension (ignored if you do gradient ascent).

    Returns:
        (mu_mle, sigma_mle) estimated numerically.

    Note: alias `mle_fit_gaussian_grid` is also accepted by tests.
    """
    raise NotImplementedError("Implement numerical MLE via grid search or gradient ascent")


# Alias so tests accepting either name pass
mle_fit_gaussian_grid = mle_fit_gaussian_numerical


def generate_synthetic_gaussian(
    n: int, mu_true: float, sigma_true: float, seed: int = 0
) -> List[float]:
    """
    Helper: generate n i.i.d. samples from N(mu_true, sigma_true^2).

    Use only the standard library (`random.gauss`). Deterministic via `seed`
    so tests and your own checks are reproducible.

    Args:
        n: number of samples.
        mu_true, sigma_true: true parameters used to generate.
        seed: random seed.

    Returns:
        List of n floats.
    """
    raise NotImplementedError("Implement synthetic generation with random.gauss and a fixed seed")


if __name__ == "__main__":
    # Quick sanity demo (run: python month_1/week_2/day_1/code/mle.py)
    # This block is NOT tested, but is useful for your own checks.
    # Example:
    #   data = generate_synthetic_gaussian(1000, mu_true=5.0, sigma_true=2.0, seed=0)
    #   print("closed:", mle_fit_gaussian_closed_form(data))
    #   print("grid:  ", mle_fit_gaussian_numerical(data))
    #   # Both should be close to (5.0, 2.0)
    pass
