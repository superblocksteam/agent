# worker-python

[![[parent] default](https://github.com/superblocksteam/worker-python/actions/workflows/default.yml/badge.svg)](https://github.com/superblocksteam/worker-python/actions/workflows/default.yml)

## About

A Python implementation of the Agent Platform worker component.

## Development

```sh
$ brew install pyenv
$ pyenv install 3.10.1
```

## Run the Worker

```sh
$ make deps
$ make up
```

### Packages

#### Github Actions

🙌 Adding customer-requested python packages is now automated via [this Github workflow](./.github/workflows/add-package.yml)! A pull request will be automatically generated for you when you run this workflow with a package name (and optional package version).

However, if you want to add a package manually, you can follow the instructions in the following section.

#### Manual

To add a new customer-requested python package, run the following command:

```bash
make add-package name=<pkg-name> [version=<pkg-version>] [import_name=<pkg-import-name>] [tag=<worker-image-tag>]
```

The `version` and `tag` arguments are optional. If not specified, the latest version of the package and the latest worker tag will be used respectively. The `import_name` arg is also optional and meant to be used when the package's install and import names differ, as the `name` arg is used in the `pip install <name>` command. If `import_name` is not specified, the value of `name` gets used as the import name.

Usage example(s):

```bash
make add-package name=pycryptodome version=3.10.1 tag=v0.119.0

# example of package where install and import names differ
make add-package name=Riskfolio-Lib version=4.1.1 import_name=riskfolio
```

This will add the package to the `requirements.txt` file and update the `src/speed.py` file to include the package import. Additionally, it will print out the size increase in the image. Add the size increase info to the PR description.

## Deployment

The CI for this repository will end with building an image asset. This asset can be updated in `github.com/superblocksteam/superblocks/helm/superblocks-agent/values.yaml` at `.worker.fleets.python.image`. This development flow is identical to how we bump the version of our Helm chart.

## Testing

There is none. BUT! similar to what I do with the reconciler and intake service, we can spin this up in a Kind cluster inside of GitHub Actions and emit socktio events to it (mocking the controller) and do a real e2e test. This will be super cool and badly needed.

## Oddities

- If the server is unable to be reached, the python client doesn't recognize this until after an interval. The JavaScript client recognizes immediately. Mostly likely something I'm not configuring properly.
