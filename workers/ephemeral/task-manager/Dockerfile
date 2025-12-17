# Build stage (using Debian for glibc compatibility with v8go)
FROM golang:1.25 AS builder

WORKDIR /app

# Copy root go.mod first (for replace directive)
COPY go.mod go.sum ./

# Copy the internal packages (superblocks agent)
COPY pkg/ ./pkg/
COPY types/ ./types/
COPY internal/ ./internal/

# Copy workers/shared (used by task-manager)
COPY workers/shared/ ./workers/shared/

# Copy task-manager go.mod and download dependencies
COPY workers/ephemeral/task-manager/go.mod workers/ephemeral/task-manager/go.sum* ./workers/ephemeral/task-manager/

WORKDIR /app/workers/ephemeral/task-manager
RUN go mod download

# Copy source code and pre-generated protobuf files
COPY workers/ephemeral/task-manager/internal/ ./internal/
COPY workers/ephemeral/task-manager/cmd/ ./cmd/

# Build the binary (CGO needed for v8go dependency in pkg/errors)
RUN CGO_ENABLED=1 GOOS=linux go build -o worker ./cmd/worker

# Runtime stage (using Debian trixie-slim to match builder glibc version)
FROM debian:trixie-slim

WORKDIR /app

# Install ca-certificates for HTTPS
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary
COPY --from=builder /app/workers/ephemeral/task-manager/worker .

# Default environment variables for Python worker
ENV SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_REDIS_HOST=redis \
    SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_REDIS_PORT=6379 \
    SUPERBLOCKS_WORKER_SANDBOX_WORKER_LANGUAGE=python \
    SUPERBLOCKS_WORKER_SANDBOX_WORKER_CONSUMER_GROUP=sandbox-python-workers \
    SUPERBLOCKS_WORKER_SANDBOX_SANDBOX_ADDRESS=python-sandbox:50051 \
    SUPERBLOCKS_WORKER_SANDBOX_GRPC_PORT=50050 \
    SUPERBLOCKS_WORKER_SANDBOX_OTEL_COLLECTOR_HTTP_URL=http://otel-desktop-viewer:4318

EXPOSE 50050

CMD ["./worker"]
