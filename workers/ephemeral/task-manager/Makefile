.PHONY: all deps test test-coverage test-integration gen-mocks build build-docker clean fmt vet

# Service info
SERVICE_NAME     = worker.ephemeral
SERVICE_VERSION  = $(shell git rev-parse HEAD 2>/dev/null || echo "dev")

# Go settings
GO_BINARY_NAME   = worker
PACKAGES         = $(shell go list ./... | grep -v /mocks | grep -v /gen | grep -v /integration_test)

# Docker settings
GIT_REPO_DIR     = $(shell git rev-parse --show-toplevel)
IMAGE_NAME       ?= ghcr.io/superblocksteam/task-manager
IMAGE_TAG        ?= latest

# Colors for output
PASS             = $(shell printf "\033[32mPASS\033[0m")
FAIL             = $(shell printf "\033[31mFAIL\033[0m")
COLORIZE         = sed ''/PASS/s//$(PASS)/'' | sed ''/FAIL/s//$(FAIL)/''

# Default target
all: deps test

# ============================================================================
# Dependencies
# ============================================================================

deps:
	@echo "==> Installing dependencies..."
	@go mod download
	@go mod tidy

deps-tools:
	@echo "==> Installing tools..."
	@go install github.com/vektra/mockery/v2@latest

# ============================================================================
# Testing
# ============================================================================

test:
	@echo "==> Running tests..."
	@bash -c "set -e; set -o pipefail; go test -v -count=1 -race $(PACKAGES) | $(COLORIZE)"

test-coverage:
	@echo "==> Running tests with coverage..."
	@bash -c "set -e; set -o pipefail; go test -v -count=1 -race -covermode=atomic -coverprofile=coverage.out $(PACKAGES) | $(COLORIZE)"

test-short:
	@echo "==> Running short tests..."
	@go test -v -short $(PACKAGES)

test-integration:
	@echo "==> Running integration tests..."
	@bash -c "set -e; set -o pipefail; go test -v -count=1 -race ./internal/integration_test/... | $(COLORIZE)"

# ============================================================================
# Code Generation
# ============================================================================

gen-mocks: deps-tools
	@echo "==> Generating mocks..."
	@mockery

# ============================================================================
# Build
# ============================================================================

build: deps
	@echo "==> Building $(GO_BINARY_NAME)..."
	CGO_ENABLED=1 go build -ldflags="-s -w -X main.version=$(SERVICE_VERSION)" -o $(GO_BINARY_NAME) ./cmd/worker

build-docker:
	@echo "==> Building task-manager Docker image..."
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) \
		-f Dockerfile \
		$(GIT_REPO_DIR)

# ============================================================================
# Code Quality
# ============================================================================

fmt:
	@echo "==> Formatting code..."
	@gofmt -e -s -l -w $(shell find . -name "*.go" -not -path "./mocks/*" -not -path "./gen/*")

vet:
	@echo "==> Running go vet..."
	@go vet $(PACKAGES)

lint: fmt vet

# ============================================================================
# Cleanup
# ============================================================================

clean:
	@echo "==> Cleaning..."
	@rm -f $(GO_BINARY_NAME)
	@rm -f coverage.out
	@rm -rf mocks/

# ============================================================================
# Help
# ============================================================================

help:
	@echo "Task Manager Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make deps             Install Go dependencies"
	@echo "  make deps-tools       Install development tools (mockery)"
	@echo "  make test             Run unit tests (excludes integration tests)"
	@echo "  make test-coverage    Run unit tests with coverage report"
	@echo "  make test-short       Run short tests only"
	@echo "  make test-integration Run integration tests (requires Redis)"
	@echo "  make gen-mocks        Generate mocks using mockery"
	@echo "  make build            Build the worker binary"
	@echo "  make build-docker     Build Docker image (IMAGE_TAG=latest)"
	@echo "  make fmt              Format code"
	@echo "  make vet              Run go vet"
	@echo "  make lint             Run fmt and vet"
	@echo "  make clean            Clean build artifacts and mocks"
	@echo "  make help             Show this help message"
