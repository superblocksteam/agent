.PHONY: all deps test lint clean help

# Default target
all: deps

# ============================================================================
# Dependencies
# ============================================================================

deps:
	@echo "==> Installing Python sandbox dependencies..."
	pip install -r python-sandbox/requirements.txt -r python-sandbox/requirements.dev.txt

# ============================================================================
# Testing
# ============================================================================

test:
	@echo "==> Running Python sandbox tests..."
	cd python-sandbox && make test

test-cov:
	@echo "==> Running Python sandbox tests with coverage..."
	cd python-sandbox && make test-cov

# ============================================================================
# Linting
# ============================================================================

lint:
	@echo "==> Linting Python sandbox..."
	cd python-sandbox && make lint

# ============================================================================
# Cleanup
# ============================================================================

clean:
	@echo "==> Cleaning generated files..."
	rm -rf python-sandbox/__pycache__
	rm -rf python-sandbox/.pytest_cache
	rm -rf python-sandbox/.coverage
	rm -rf python-sandbox/htmlcov

# ============================================================================
# Help
# ============================================================================

help:
	@echo "Ephemeral Workers - Python Sandbox"
	@echo ""
	@echo "Usage:"
	@echo "  make deps       Install Python dependencies"
	@echo "  make test       Run tests"
	@echo "  make test-cov   Run tests with coverage"
	@echo "  make lint       Run linter"
	@echo "  make clean      Remove generated files"
