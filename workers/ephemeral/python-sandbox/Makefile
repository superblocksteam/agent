.PHONY: test test-cov deps deps-dev lint clean help

TOX_EXTRA_ARGS =

# Install dependencies
deps:
	pip install -e .

# Install development dependencies
deps-dev:
	pip install -e ".[test]"

# Run tests via tox
test:
	tox -- $(TOX_EXTRA_ARGS)

# Run tests with coverage (without tox)
test-cov:
	pytest test/ -v --cov=. --cov-report=term-missing --cov-report=html

# Run linting
lint:
	python -m py_compile main.py
	python -m py_compile src/entry.py src/executor.py src/service.py src/constants.py src/restricted.py src/superblocks.py
	python -m py_compile src/variables/variable.py src/variables/variable_client.py src/variables/constants.py

# Clean up
clean:
	rm -rf __pycache__ .pytest_cache .coverage htmlcov .tox *.egg-info
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

# Help
help:
	@echo "Python Sandbox"
	@echo ""
	@echo "Usage:"
	@echo "  make deps       Install dependencies"
	@echo "  make deps-dev   Install test dependencies"
	@echo "  make test       Run tests via tox"
	@echo "  make test-cov   Run tests with coverage"
	@echo "  make lint       Run linter"
	@echo "  make clean      Remove generated files"
