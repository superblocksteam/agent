# syntax=docker/dockerfile:1.9.0
# JavaScript sandbox for ephemeral worker
# Executes JavaScript scripts in a sandboxed gRPC server

ARG NODE_VERSION=20.19.5
ARG TRANSPORT_GRPC_PORT=50051
ARG EMSDK_VERSION=3.1.65
ARG PNPM_VERSION=10.19.0

# Builder stage
FROM ghcr.io/superblocksteam/node:${NODE_VERSION} AS builder

ARG PNPM_VERSION
ARG EMSDK_VERSION

WORKDIR /app

ENV CI=true

# Install build dependencies (including Java for closure compiler)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ git xz-utils default-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# Install emscripten for WASM compilation
RUN git clone https://github.com/emscripten-core/emsdk.git /emsdk && \
    cd /emsdk && \
    ./emsdk install ${EMSDK_VERSION} && \
    ./emsdk activate ${EMSDK_VERSION}

ENV PATH="/emsdk:/emsdk/upstream/emscripten:${PATH}"
ENV EMSDK=/emsdk

# Install pnpm
RUN npm install -g pnpm@${PNPM_VERSION}

# Copy the javascript workspace
COPY workers/javascript/ ./workers/javascript/
COPY workers/ephemeral/javascript-sandbox/ ./workers/ephemeral/javascript-sandbox/

# Install dependencies
WORKDIR /app/workers/javascript
RUN pnpm install --frozen-lockfile

# Build all packages in dependency order
RUN pnpm --filter javascript-sandbox... run build

# Deploy javascript-sandbox with all its dependencies to a self-contained directory
# --legacy is needed for pnpm v10+ when not using inject-workspace-packages
RUN pnpm --filter javascript-sandbox deploy --legacy --prod /deploy

# Copy bootstrap.js and generated protobuf types to the deployed dist
RUN cp /app/workers/ephemeral/javascript-sandbox/src/bootstrap.js /deploy/dist/ && \
    cp -r /app/workers/ephemeral/javascript-sandbox/src/types /deploy/dist/

# Production stage
FROM ghcr.io/superblocksteam/node:${NODE_VERSION}-bookworm-slim

ARG TRANSPORT_GRPC_PORT

WORKDIR /app

ENV NODE_ENV=production
ENV SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT=${TRANSPORT_GRPC_PORT}

# Copy the self-contained deployment
COPY --from=builder /deploy /app

EXPOSE ${TRANSPORT_GRPC_PORT}

CMD ["node", "dist/index.js"]
