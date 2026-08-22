"""
Tests for Week 2 Day 1 — MLE (month_1/week_2/day_1/code/mle.py)

Run: pytest month_1/week_2/day_1/code/tests -v
"""

import math
import pytest


def _import_mle():
    import importlib.util
    import pathlib
    p = pathlib.Path(__file__).parent.parent / "mle.py"
    spec = importlib.util.spec_from_file_location("mle", p)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture(scope="module")
def mle_module():
    return _import_mle()


def test_log_likelihood_hand_example(mle_module):
    """Hand-worked example: data=[2.0,3.0], mu=2.5, sigma=1.0"""
    data = [2.0, 3.0]
    mu, sigma = 2.5, 1.0
    got = mle_module.log_likelihood(data, mu, sigma)
    # Independent expected via formula in docstring
    def log_pdf(x, mu, sigma):
        return -0.5 * math.log(2 * math.pi) - math.log(sigma) - (x - mu) ** 2 / (2 * sigma ** 2)
    expected = sum(log_pdf(x, mu, sigma) for x in data)
    assert got == pytest.approx(expected, rel=1e-9, abs=1e-9), f"got {got}, expected {expected}"


def test_log_likelihood_raises_on_bad_sigma(mle_module):
    with pytest.raises(ValueError):
        mle_module.log_likelihood([1.0, 2.0], mu=0.0, sigma=0.0)
    with pytest.raises(ValueError):
        mle_module.log_likelihood([1.0], mu=0.0, sigma=-1.0)


def test_log_likelihood_empty_data(mle_module):
    # Spec says empty -> return 0.0 OR raise. Accept either but must not crash silently with nonsense.
    try:
        got = mle_module.log_likelihood([], mu=0.0, sigma=1.0)
        assert got == pytest.approx(0.0, abs=1e-12)
    except ValueError:
        pass  # also acceptable if documented


def test_closed_form_on_simple_data(mle_module):
    data = [1.0, 2.0, 3.0, 4.0, 5.0]
    mu, sigma = mle_module.mle_fit_gaussian_closed_form(data)
    assert mu == pytest.approx(3.0, rel=1e-9)
    # variance_mle = 2.0 -> sigma = sqrt(2)
    assert sigma == pytest.approx(math.sqrt(2.0), rel=1e-9)


def test_closed_form_empty_raises(mle_module):
    with pytest.raises(ValueError):
        mle_module.mle_fit_gaussian_closed_form([])


def test_closed_form_matches_numpy_if_available(mle_module):
    """Optional sanity: our closed form must match the statistical definition."""
    data = [2.5, -1.0, 0.0, 4.2, 3.3]
    mu, sigma = mle_module.mle_fit_gaussian_closed_form(data)
    mean_expected = sum(data) / len(data)
    var_expected = sum((x - mean_expected) ** 2 for x in data) / len(data)
    assert mu == pytest.approx(mean_expected, rel=1e-9)
    assert sigma == pytest.approx(math.sqrt(var_expected), rel=1e-9)


def test_generate_synthetic_deterministic(mle_module):
    a = mle_module.generate_synthetic_gaussian(50, mu_true=5.0, sigma_true=2.0, seed=42)
    b = mle_module.generate_synthetic_gaussian(50, mu_true=5.0, sigma_true=2.0, seed=42)
    assert a == b, "same seed must give same data (determinism)"
    assert len(a) == 50
    # very rough: sample mean should not be wildly off
    mean = sum(a) / len(a)
    assert abs(mean - 5.0) < 1.0  # loose, just checks not obviously broken


def test_numerical_and_closed_form_agree_on_synthetic(mle_module):
    # Synthetic with known truth — the core "Done when" check
    n = 500
    mu_true, sigma_true = 5.0, 2.0
    data = mle_module.generate_synthetic_gaussian(n, mu_true, sigma_true, seed=0)
    mu_closed, sigma_closed = mle_module.mle_fit_gaussian_closed_form(data)

    # Support either name
    num_fn = getattr(mle_module, "mle_fit_gaussian_numerical", None) or getattr(
        mle_module, "mle_fit_gaussian_grid", None
    )
    assert num_fn is not None, "Missing numerical fitter (mle_fit_gaussian_numerical / mle_fit_gaussian_grid)"
    mu_num, sigma_num = num_fn(data)

    # Numerical grid is coarse by nature — tolerance intentionally loose but still meaningful
    assert mu_num == pytest.approx(mu_closed, abs=0.08), f"mu mismatch: closed {mu_closed}, num {mu_num}"
    assert sigma_num == pytest.approx(sigma_closed, abs=0.12), f"sigma mismatch: closed {sigma_closed}, num {sigma_num}"

    # Both close to truth (with n=500 they should be)
    assert abs(mu_closed - mu_true) < 0.25
    assert abs(sigma_closed - sigma_true) < 0.25


def test_numerical_respects_data_scale(mle_module):
    """Small n vs large n — just checks numerical still tracks closed form."""
    for n in [20, 200]:
        data = mle_module.generate_synthetic_gaussian(n, mu_true=-2.0, sigma_true=0.8, seed=123)
        mu_c, sigma_c = mle_module.mle_fit_gaussian_closed_form(data)
        num_fn = getattr(mle_module, "mle_fit_gaussian_numerical", None) or getattr(
            mle_module, "mle_fit_gaussian_grid", None
        )
        mu_num, sigma_num = num_fn(data)
        assert mu_num == pytest.approx(mu_c, abs=0.12)
        assert sigma_num == pytest.approx(sigma_c, abs=0.20)
