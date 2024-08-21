PYTHON_CMD = python
PYTEST_CMD = coverage run -m pytest
CHECK_ONLY=false
RUFF_FIX_FLAG=--fix
RUFF_CHECK_FLAG=

# ":" delimited string of paths
PYTHONPATH=.:superblocks_agent_sdk

PYTEST_ARGS=
PYTEST_PACKAGES=test_unit/ test_e2e/

# please don't ever commit with these set
PYPI_TEST_TOKEN=
PYPI_TOKEN=

.PHONY: deps-dev
deps-dev:
	@$(PYTHON_CMD) -m pip install -r requirements.dev.txt

.PHONY: deps
deps: deps-dev
	@$(PYTHON_CMD) -m pip install -r requirements.txt


.PHONY: fmt
fmt:
ifeq ($(CHECK_ONLY),true)
	$(eval RUFF_FIX_FLAG=)
	$(eval RUFF_CHECK_FLAG=--check)
endif
	# linting
	@ruff check $(RUFF_FIX_FLAG)
	# formatting
	@ruff format $(RUFF_CHECK_FLAG)


.PHONY: test-unit
test-unit:
	@make test PYTEST_PACKAGES="test_unit/" $(PYTEST_ARGS)

.PHONY: test-e2e
test-e2e:
	@make test PYTEST_PACKAGES="test_e2e/" $(PYTEST_ARGS)

.PHONY: test
test:
	@PYTHONPATH=$(PYTHONPATH) op run --env-file=test_e2e/.env -- $(PYTEST_CMD) $(PYTEST_PACKAGES) $(PYTEST_ARGS)

.PHONY: cov
cov:
	@coverage erase
	@make test
	@coverage report
	@coverage html

.PHONY: pkg-build
pkg-build: 
	@rm -rf build
	@rm -rf dist
	@$(PYTHON_CMD) setup.py sdist bdist_wheel

# publishes the currently built package to https://test.pypi.org/project/superblocks-agent/
# we should always publish here first
.PHONY: pkg-test
pkg-test:
	@TWINE_USERNAME="__token__" TWINE_PASSWORD=$(PYPI_TEST_TOKEN) $(PYTHON_CMD) -m twine upload --repository testpypi dist/*

# publishes the currently built package to https://pypi.org/project/superblocks-agent/
# this is the actual package
.PHONY: pkg-prod
pkg-prod:
	@TWINE_USERNAME="__token__" TWINE_PASSWORD=$(PYPI_TOKEN) $(PYTHON_CMD) -m twine upload dist/*

# generate docs with pydoc: https://pdoc3.github.io/pdoc/doc/pdoc/index.html#header-submodules&gsc.tab=0
.PHONY: gen-docs
gen-docs:
	@pdoc --html superblocks_agent_sdk --force --output-dir docs --template-dir docs

.PHONY: docs
docs:
	@open docs/superblocks_agent_sdk/index.html

