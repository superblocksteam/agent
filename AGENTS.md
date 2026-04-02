# Agent Instructions

## Organization Standards

Load Superblocks engineering-wide standards (communication policy, security, observability, architecture) from the `workspace` repository. Repo-specific instructions below override org-wide when in conflict.

Use the GitHub MCP server's `get_file_contents` tool:
- owner: `superblocksteam`
- repo: `workspace`
- path: `repos/AGENTS.md`

If MCP is unavailable, fetch via CLI:

```bash
gh api repos/superblocksteam/workspace/contents/repos/AGENTS.md -H "Accept: application/vnd.github.raw"
```

---

## Project Overview

Go service (Orchestrator) that connects Superblocks platform to customer data. Execution engine for Application APIs, Workflows, and Scheduled Jobs.

## Build & Test Commands

```bash
# Build
make build-go                                    # Build binary
docker build -t superblocks .                    # Build Docker image

# Run locally
make up                                          # Hot reload with dependencies
make up-deps && air                              # Manual start

# Test - ALL
make test-unit                                   # All unit tests
make test-integration                            # Integration tests (needs Kafka)

# Test - SINGLE (most useful for development)
go test -v -count=1 -race ./pkg/store/...                        # Single package
go test -v -count=1 -race ./pkg/store/... -run TestPairWithID    # Single test function

# Lint & Format
make fmt                                         # Format all (Go, YAML, proto)
make fmt-go                                      # Format Go only
make vet-go                                      # Run go vet
pre-commit run --all                             # All pre-commit hooks

# Code generation
go generate ./...                                # Generate mocks
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `cmd/` | Application entry points |
| `pkg/` | Public packages |
| `internal/` | Private packages |
| `workers/` | Worker implementations (Go, Python, JS) |
| `types/gen/go/` | Generated protobuf types |

---

## Code Style

### Error Handling

Use custom error types from `pkg/errors`. Wrap with `fmt.Errorf("context: %w", err)`. Check with `errors.Is()`/`errors.As()`. Never swallow errors.

### Testing

Table-driven tests with `testify/assert`. Generate mocks: `//go:generate mockery`. Run: `make test-unit`.

### Naming Conventions

- Interfaces: Noun or verb-er (`Store`, `Fetcher`, `Client`)
- Implementations: Descriptive lowercase (`redisStore`, `httpFetcher`)
- Mocks: `*_mock.go` or `mock/` subdirectory
- Tests: `*_test.go` same package

### Protobuf

- Types in `types/gen/go/`
- Use `protojson` for JSON marshaling
- Format with `buf format -w`

---

## Pre-commit Hooks

```bash
pre-commit install
pre-commit run --all
```

Hooks: `go-fmt`, `go-mod-tidy`, `go-generate`, `go-imports`, `shellcheck`, `yamlfmt`

## Environment Variables

Prefix: `SUPERBLOCKS_ORCHESTRATOR_`

| Variable | Purpose |
|----------|---------|
| `SUPERBLOCKS_AGENT_KEY` | Agent auth key |
| `LOG_LEVEL` | debug/info/warn/error |
| `STORE_REDIS_HOST` | Redis for KV store |
| `TRANSPORT_REDIS_HOST` | Redis for worker transport |

## Evolving This File

Each line should represent non-discoverable information. If you get something right without being told, the line is noise; propose removing it. If you encounter a non-obvious trap, propose adding it.
