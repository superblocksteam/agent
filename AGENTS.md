# Agent Instructions

## Organization Standards

Fetch Superblocks engineering standards:

```bash
gh api repos/superblocksteam/engineering/contents/AGENTS.md --jq '.content' | base64 -d
```

### When to Fetch

| Trigger | Action |
|---------|--------|
| **Adding observability** (logs, metrics, traces) | Fetch for detailed guidelines |
| **Cross-repo work** | Fetch for architecture overview |
| **Security-sensitive changes** (secrets, auth, input validation) | Fetch for security practices |
| **Fetch fails** (offline, no auth) | Continue with summary below |
| **Conflict** | Repo-specific rules override org-wide |

### Key Org-Wide Rules (summary)

**Language**:
- ❌ Never use "whitelist" or "blacklist"
- ✅ Use "allowlist" and "denylist"

**Ordering**: Lists/arrays SHOULD be sorted alphabetically unless order is semantically meaningful.

**Communication** (CRITICAL):
- ❌ NEVER post public comments (`gh pr comment`, `gh issue comment`, Slack, Linear)
- ✅ Provide draft responses for user to post themselves

**Observability** (metrics > spans > logs for cost):
- Use METRICS for high-frequency operations
- Use SPANS for request tracing
- Use LOGS for errors/unexpected states only (WARN/ERROR level in prod)

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

### Import Order

Group with blank lines: stdlib → external → internal (`github.com/superblocksteam/agent/...`)

```go
import (
    "context"
    "fmt"

    "github.com/stretchr/testify/assert"
    "go.uber.org/zap"

    "github.com/superblocksteam/agent/pkg/store"
)
```

### Error Handling

Use custom error types from `pkg/errors`. Pattern:

```go
type customError struct {
    err error
}

func CustomError(err ...error) error {
    return &customError{errors.Join(err...)}
}

func (e *customError) Error() string {
    if e.err == nil {
        return "CustomError"
    }
    return "CustomError: " + e.err.Error()
}

func IsCustomError(err error) bool {
    var typed *customError
    return errors.As(err, &typed)
}
```

- Wrap with context: `fmt.Errorf("context: %w", err)`
- Check with: `errors.Is()`, `errors.As()`
- Log with: `logger.Error("msg", zap.Error(err))`

### Testing

Table-driven tests with `testify/assert`:

```go
func TestSomething(t *testing.T) {
    for _, test := range []struct {
        name     string
        input    string
        expected string
        wantErr  bool
    }{
        {name: "happy path", input: "test", expected: "result"},
        {name: "error case", input: "bad", wantErr: true},
    } {
        t.Run(test.name, func(t *testing.T) {
            result, err := FunctionUnderTest(test.input)
            if test.wantErr {
                assert.Error(t, err)
                return
            }
            assert.NoError(t, err)
            assert.Equal(t, test.expected, result)
        })
    }
}
```

Generate mocks: `//go:generate mockery --name=Interface --output ./mock`

### Functional Options Pattern

```go
type Option func(*options)

func WithLogger(logger *zap.Logger) Option {
    return func(o *options) { o.logger = logger }
}

func New(opts ...Option) *Component {
    o := &options{/* defaults */}
    for _, opt := range opts { opt(o) }
    return &Component{options: o}
}
```

### Naming Conventions

- Interfaces: Noun or verb-er (`Store`, `Fetcher`, `Client`)
- Implementations: Descriptive lowercase (`redisStore`, `httpFetcher`)
- Mocks: `*_mock.go` or `mock/` subdirectory
- Tests: `*_test.go` same package

### Context

Always first parameter. Use for cancellation, timeouts, request-scoped values.

### Logging

Structured logging with zap:

```go
logger.Info("message", zap.String("key", value), zap.Error(err))
```

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
