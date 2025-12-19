# JavaScript sandbox for ephemeral worker
# Executes JavaScript scripts in a sandboxed gRPC server

ARG NODE_VERSION=20.19.5
ARG TRANSPORT_GRPC_PORT=50051

FROM ghcr.io/superblocksteam/node:${NODE_VERSION} AS builder

WORKDIR /app

# Install pnpm and build dependencies for native modules
RUN npm install -g pnpm@9
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy the entire javascript workspace (includes tsconfig files that packages symlink to)
COPY workers/javascript/ ./workers/javascript/
COPY workers/ephemeral/javascript-sandbox/ ./workers/ephemeral/javascript-sandbox/

# Install dependencies
WORKDIR /app/workers/javascript
RUN pnpm install --frozen-lockfile

# Build sandbox and all its dependencies
WORKDIR /app/workers/javascript
RUN pnpm --filter javascript-sandbox... run build

# Prune to production dependencies only
RUN pnpm prune --prod

# Production stage
FROM ghcr.io/superblocksteam/node:${NODE_VERSION}-bookworm-slim

ARG TRANSPORT_GRPC_PORT

WORKDIR /app

# Copy the entire workspace structure with node_modules (pnpm symlinks need this)
COPY --from=builder /app/workers/javascript/node_modules ./workers/javascript/node_modules
COPY --from=builder /app/workers/javascript/packages/types ./workers/javascript/packages/types
COPY --from=builder /app/workers/javascript/packages/shared ./workers/javascript/packages/shared
COPY --from=builder /app/workers/javascript/packages/wasm-sandbox-js ./workers/javascript/packages/wasm-sandbox-js
COPY --from=builder /app/workers/ephemeral/javascript-sandbox/dist ./workers/ephemeral/javascript-sandbox/dist
COPY --from=builder /app/workers/ephemeral/javascript-sandbox/node_modules ./workers/ephemeral/javascript-sandbox/node_modules
COPY --from=builder /app/workers/ephemeral/javascript-sandbox/package.json ./workers/ephemeral/javascript-sandbox/

# Copy bootstrap.js and generated protobuf types to dist
COPY workers/ephemeral/javascript-sandbox/src/bootstrap.js ./workers/ephemeral/javascript-sandbox/dist/
COPY --from=builder /app/workers/ephemeral/javascript-sandbox/src/types ./workers/ephemeral/javascript-sandbox/dist/types

WORKDIR /app/workers/ephemeral/javascript-sandbox

ENV SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT=${TRANSPORT_GRPC_PORT}

EXPOSE ${TRANSPORT_GRPC_PORT}

CMD ["node", "dist/index.js"]
