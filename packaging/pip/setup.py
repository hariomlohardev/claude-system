"""
setup.py — legacy shim for pip wrapper. Real config lives in pyproject.toml.
This package is a THIN wrapper: it does not reimplement the CLI.
The Python entry point fetches the appropriate GitHub Release asset
and delegates to the real Node-based cli/dist.
"""
from setuptools import setup

setup()
