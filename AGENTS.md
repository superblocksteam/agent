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

## Changelog

The [`CHANGELOG.md`](CHANGELOG.md) documents customer-facing changes for the On-Premise Agent (OPA). When a PR changes behavior that ships in the OPA image (bug fixes, new features, configuration changes, dependency upgrades), add a line under `## vNext` describing the change at a high level. Skip the changelog for CI-only, test-only, or internal tooling changes that do not affect the OPA.

### Release bump skill (files to update)

Use this checklist based on merged PR patterns:

- **Feature/bugfix PRs that ship in OPA**: update `CHANGELOG.md` under `## vNext` only.
- **OPA release prep PRs** (e.g. "update helm chart and changelog for OPA vX.Y.Z"): update:
  1. `CHANGELOG.md` (cut a new version section from `vNext`)
  2. `helm/agent/Chart.yaml` (`appVersion` for OPA image version and `version` for chart version)

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

## Local Development

### `make ephemeral-up` (native dev stack)

Runs the orchestrator + task-managers + JS sandboxes natively (no Docker for the Go/Node services). See `Makefile.ephemeral` header for the full env-var matrix. Required env vars:

- `SUPERBLOCKS_AGENT_SERVER_URL`: where the agent registers (e.g. `https://staging.superblocks.com`, `https://pr-1234.superblocks.dev`, or `http://localhost:3000` for a locally-running monorepo). Must be reachable; orchestrator exits with `connection refused` on `/api/v1/agents/register` if it isn't.
- `SUPERBLOCKS_AGENT_HOST_URL`: URL the agent advertises. For local dev with a remote server (staging or PR env), use `http://localhost:18080`.
- `SUPERBLOCKS_AGENT_KEY`: registered agent key from the target environment.

Run `make ephemeral-status` to check process state and `make ephemeral-down` to stop.

### Node.js version requirement

`Makefile.ephemeral` runs the JS sandbox via `node`. The repo pins `.nvmrc` (currently Node 22) because `deasync@0.1.29` only ships prebuilt darwin-arm64 bindings up to `node-22` (`workers/javascript/node_modules/.pnpm/deasync@0.1.29/node_modules/deasync/bin/darwin-arm64-node-22/deasync.node`). Running on a newer Node fails the sandbox at module load with "Could not locate the bindings file".

`Makefile.ephemeral` resolves the right Node automatically (`NODE_BIN` from `~/.nvm` / `~/.fnm` matching `.nvmrc`); `make ephemeral-check-node` runs the resolution and warns on mismatch. Other Makefiles (top-level `Makefile`, `workers/javascript/Makefile`) use whatever `node` is on `PATH` — `nvm use` (or `fnm use`) before running JS-related targets.

## Gotchas

- **JS sandbox env var is `SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_PORT`** (default 50051), declared in `workers/ephemeral/javascript-plugins-sandbox/src/env.ts`. There is no `EXECUTOR_TRANSPORT_GRPC_PORT` variant; that name is silently ignored and the sandbox falls back to its default.
- **Native modules in the JS workspace require Node 22**; see Local Development above.

## Evolving This File

Each line should represent non-discoverable information. If you get something right without being told, the line is noise; propose removing it. If you encounter a non-obvious trap, propose adding it.
