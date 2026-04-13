# syntax=docker/dockerfile:1.9.0
# JavaScript plugins sandbox for ephemeral worker
# Executes JavaScript plugin steps in a sandboxed gRPC server

ARG NODE_VERSION=20.19.5
ARG TRANSPORT_GRPC_PORT=50051
ARG EMSDK_VERSION=3.1.65


# Builder stage
FROM ghcr.io/superblocksteam/node:${NODE_VERSION} AS builder

ARG EMSDK_VERSION

WORKDIR /app

ENV CI=true

# Install build dependencies (including Java for closure compiler)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ git xz-utils default-jre-headless

# Install emscripten for WASM compilation
RUN git clone https://github.com/emscripten-core/emsdk.git /emsdk && \
    cd /emsdk && \
    ./emsdk install ${EMSDK_VERSION} && \
    ./emsdk activate ${EMSDK_VERSION}

ENV PATH="/emsdk:/emsdk/upstream/emscripten:${PATH}"
ENV EMSDK=/emsdk

# Install pnpm and node-gyp (needed by native packages: lz4, cpu-features, node-expat)
ARG PNPM_VERSION=10.29.2
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    wget -qO- https://get.pnpm.io/install.sh | PNPM_VERSION=${PNPM_VERSION} ENV="$HOME/.bashrc" SHELL="$(which bash)" bash - && \
    . $HOME/.bashrc && \
    pnpm add -g node-gyp

# Copy lockfile + root config for pnpm fetch cache layer
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Fetch all dependencies into the pnpm store (cached on lockfile change)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    . $HOME/.bashrc && pnpm fetch

# Copy source files (layer invalidated on source change, but deps are cached above)
COPY workers/javascript/ ./workers/javascript/
COPY workers/ephemeral/javascript-plugins-sandbox/ ./workers/ephemeral/javascript-plugins-sandbox/
COPY types/gen/js/ ./types/gen/js/
COPY mocks/ ./mocks/
COPY clients/typescript/package.json ./clients/typescript/package.json

# Install dependencies from the cached store
RUN . $HOME/.bashrc && pnpm install --offline --frozen-lockfile

# Build in two phases for injectWorkspacePackages: workspace deps are copied
# (not symlinked) at install time, so build outputs need a re-install to
# propagate to consumers' node_modules.
# Phase 1: Build all transitive deps of the sandbox (plugins, worker.js, etc.)
# Phase 2: Re-install to inject build outputs, then build the sandbox itself
RUN . $HOME/.bashrc && \
    pnpm --filter 'javascript-plugins-sandbox^...' run build && \
    pnpm install --offline --frozen-lockfile && \
    pnpm --filter javascript-plugins-sandbox run build && \
    pnpm install --offline --frozen-lockfile

# Deploy javascript-plugins-sandbox with all its dependencies to a self-contained directory
RUN . $HOME/.bashrc && pnpm --filter javascript-plugins-sandbox deploy --prod /deploy && \
    npx clean-modules --directory /deploy/node_modules -y '!**/googleapis/**/docs/' '!**/@superblocks/**/datasource/' && \
    mkdir -p /deploy/node_modules/@superblocksteam/javascript-sdk-api-wasm/dist/src/bundles && \
    if [ ! -f /deploy/node_modules/@superblocksteam/javascript-sdk-api-wasm/dist/src/bundles/sdk-api.iife.js ]; then \
      cp /app/workers/javascript/packages/plugins/javascript-sdk-api-wasm/dist/src/bundles/sdk-api.iife.js \
        /deploy/node_modules/@superblocksteam/javascript-sdk-api-wasm/dist/src/bundles/sdk-api.iife.js; \
    fi

# Copy generated protobuf types to the deployed dist
RUN cp -r /app/workers/ephemeral/javascript-plugins-sandbox/src/types /deploy/dist/

# The sdk-api IIFE bundle must be present in the deployed sdk-api-wasm plugin.
# Fail the build if it's missing — a silent absence causes runtime crashes.
RUN test -f /deploy/node_modules/@superblocksteam/javascript-sdk-api-wasm/dist/src/bundles/sdk-api.iife.js \
    || (echo "ERROR: sdk-api.iife.js bundle missing from javascript-sdk-api-wasm dist" && exit 1)

# Production stage
FROM ghcr.io/superblocksteam/node:${NODE_VERSION}-bookworm-slim

ARG TRANSPORT_GRPC_PORT

WORKDIR /app

ENV NODE_ENV=production
ENV SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT=${TRANSPORT_GRPC_PORT}

# Env vars required by @superblocks/worker.js at import time.
# SUPERBLOCKS_AGENT_KEY is never used at runtime.
# Tunnel keys default to empty; for integration fleets the task-manager
# injects real values via executionEnvInclusionList, overriding these defaults.
ENV SUPERBLOCKS_AGENT_KEY=""
ENV SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA=""
ENV SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519=""

# Copy the self-contained deployment
COPY --from=builder /deploy /app

EXPOSE ${TRANSPORT_GRPC_PORT}

CMD ["node", "dist/index.js"]
