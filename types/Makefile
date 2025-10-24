# https://github.com/bufbuild/buf/releases
BUF_VERSION = "1.57.0"
.ONESHELL:

PYTHON_CMD = python
# ":" delimited string of paths
PYTHONPATH=.:superblocks_types

PYPI_TEST_TOKEN=
PYPI_TOKEN=


.PHONY: deps
deps:

.PHONY: deps-buf
deps-buf:
	@if [[ $(shell buf --version) != $(BUF_VERSION) ]]; then echo "wrong buf version:\ncurrent: $(shell buf --version)\nexpected: $(BUF_VERSION)\nyou may need to modify this version check if a newer version is available"; exit 1; fi

.PHONY: deps-local
deps-local: deps-buf
	# For generating d.ts files
	@npm install grpc_tools_node_protoc_ts@5.3.3 --global
	# For generating js files
	@npm install grpc-tools@1.12.4 --global

.PHONY: clean
clean:
	@find . -type f -name '*_pb.*s' -exec rm {} +
	@find . -type f -name '*pb*go' -exec rm {} +

.PHONY: proto-base
proto-base: deps
	@cd proto
	@buf dep update
	@buf lint --error-format=json

.PHONY: proto
proto: deps-buf proto-go proto-js proto-py

.PHONY: proto-go
proto-go: proto-base
	@cd proto
	@buf generate --template buf.go.gen.yaml
	@buf build

.PHONY: proto-js
proto-js: proto-base
	@cd proto
	# Generate files for non-standard imports that get injected into the buf generate process
	@buf generate --include-imports --template buf.js.gen.yaml
	@buf build
	@grep -rl '\.js' ../../workers/javascript/packages/types ../gen/js | grep -v node_modules | grep -E '.*(js|ts)$$' | xargs sed -i'.bak' -e 's/\.js//g'
	@find ../gen/js -name "*.bak" -delete
	@find ../../workers/javascript/packages/types -name "*.bak" -delete

.PHONY: proto-py
proto-py: proto-base
	@cd proto
	# Generate files for non-standard imports that get injected into the buf generate process
	@buf generate --include-imports --template buf.py.gen.yaml
	@buf build
	# Rewrite python imports to be part of the `superblocks_types` package. This changes imports from this `from api.v1` to this `from superblocks_types.api.v1`
	@find ../gen/py -iname "*.py" | xargs sed -i'.bak' -E '/^from superblocks_types/!s/^from ([^ ]*.v1|validate|google\.api|protoc_gen_openapiv2|superblocks_types|buf)/from superblocks_types.\1/g'
	@find ../gen -name "*.bak" -delete
	# Prepare generated Python folder to be packaged for pypi
	@$(PYTHON_CMD) ../scripts/setup_pypi.py

.PHONY: test
test:
	@cd gen/go
	@go test ./...

.PHONY: pypi-pkg-build
pypi-pkg-build:
	@rm -rf build
	@rm -rf dist
	@PYTHONPATH=$(PYTHONPATH) $(PYTHON_CMD) superblocks_types/setup.py sdist bdist_wheel

# publishes the currently built package to https://test.pypi.org/project/superblocks-agent/
# we should always publish here first
.PHONY: pypi-pkg-test
pypi-pkg-test:
	@TWINE_USERNAME="__token__" TWINE_PASSWORD=$(PYPI_TEST_TOKEN) $(PYTHON_CMD) -m twine upload --repository testpypi dist/*

# publishes the currently built package to https://pypi.org/project/superblocks-agent/
# this is the actual package
.PHONY: pypi-pkg-prod
pypi-pkg-prod:
	@TWINE_USERNAME="__token__" TWINE_PASSWORD=$(PYPI_TOKEN) $(PYTHON_CMD) -m twine upload dist/*
