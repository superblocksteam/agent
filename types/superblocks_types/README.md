# Superblocks Python Types

[![Python version](https://img.shields.io/badge/python-%3E=_3.10-teal.svg)](https://www.python.org/downloads/)

## Quickstart

Use the package manager [pip](https://pip.pypa.io/en/stable/) to install.

```sh
pip install superblocks-types
```

## Development

Install Dependencies

```sh
make deps
```

Build Package

```sh
make pypi-pkg-build
```

Publish a New Version to PyPi

1. Bump the version for `__version__` in `superblocks_types/_version.py`.
   We follow [semantic versioning](https://semver.org/) for now.
   In the future we could just match the version being published for js/ts/go.
2. Build the package: `make pypi-pkg-build`
3. Publish the package to the test PyPi site: `make pypi-pkg-test PYPI_TEST_TOKEN={token_from_1pass}`
4. Publish the package to the official PyPi site: `make pypi-pkg-prod PYPI_TOKEN={token_from_1pass}`
