# JavaScript sandbox for ephemeral worker
# Executes JavaScript scripts in a sandboxed gRPC server

ARG NODE_VERSION=20.19.5
ARG TRANSPORT_GRPC_PORT=50051

FROM ghcr.io/superblocksteam/node:${NODE_VERSION} AS builder

WORKDIR /app

# Install pnpm and build dependencies for native modules
RUN npm install -g pnpm@9
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy the javascript worker packages (pnpm workspace)
COPY workers/javascript/ ./workers/javascript/

# Install and build workspace packages
WORKDIR /app/workers/javascript
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @superblocksteam/types run build
RUN pnpm --filter @superblocks/shared run build

# Copy built packages to their final paths
WORKDIR /app
RUN mkdir -p packages/types packages/shared
RUN cp -r workers/javascript/packages/types/package.json workers/javascript/packages/types/src packages/types/
RUN cp -r workers/javascript/packages/shared/package.json workers/javascript/packages/shared/dist packages/shared/

# Fix shared's workspace:* reference to point to local types
RUN sed -i 's|"@superblocksteam/types": "workspace:\*"|"@superblocksteam/types": "file:/app/packages/types"|' ./packages/shared/package.json

# Copy sandbox package.json and fix the shared reference
WORKDIR /app/sandbox
COPY workers/ephemeral/javascript-sandbox/package.json ./
RUN sed -i 's|file:../../javascript/packages/shared|file:/app/packages/shared|' package.json

# Install ALL dependencies (including dev for build)
RUN npm install --package-lock=false

# Copy sandbox source and build
COPY workers/ephemeral/javascript-sandbox/src ./src
COPY workers/ephemeral/javascript-sandbox/tsconfig.json ./

RUN npx tsc

# Prune dev dependencies after build
RUN npm prune --omit=dev

# Production stage (only built artifacts)
FROM ghcr.io/superblocksteam/node:${NODE_VERSION}-bookworm-slim

ARG TRANSPORT_GRPC_PORT

WORKDIR /app

COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/packages/shared ./packages/shared

COPY --from=builder /app/sandbox/package.json ./
COPY --from=builder /app/sandbox/node_modules ./node_modules

COPY --from=builder /app/sandbox/dist ./dist
COPY workers/ephemeral/javascript-sandbox/src/bootstrap.js ./dist/

ENV SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT=${TRANSPORT_GRPC_PORT}

EXPOSE ${TRANSPORT_GRPC_PORT}

CMD ["node", "dist/index.js"]
