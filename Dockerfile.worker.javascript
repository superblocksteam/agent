# syntax=docker/dockerfile:1.9.0

ARG NODE_VERSION=20.19.5
ARG EMSDK_VERSION=3.1.65
FROM ghcr.io/superblocksteam/node:${NODE_VERSION} AS builder

ARG DEASYNC_VERSION=0.1.29
ARG EMSDK_VERSION

WORKDIR /app

# Install build dependencies
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ git xz-utils

# Copy root workspace files for cache-friendly pnpm fetch
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# native packages (lz4, cpu-features, node-expat) call node-gyp during fetch
ARG PNPM_VERSION=10.29.2
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    wget -qO- https://get.pnpm.io/install.sh | PNPM_VERSION=${PNPM_VERSION} ENV="$HOME/.bashrc" SHELL="$(which bash)" bash - && \
    . $HOME/.bashrc && \
    pnpm add -g node-gyp && \
    pnpm fetch
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Copy workspace sources (clients/typescript/package.json needed for workspace graph consistency)
COPY ./workers/javascript/ ./workers/javascript/
COPY ./workers/ephemeral/javascript-plugins-sandbox/ ./workers/ephemeral/javascript-plugins-sandbox/
COPY ./types/gen/js/ ./types/gen/js/
COPY ./mocks/ ./mocks/
COPY ./clients/typescript/package.json ./clients/typescript/package.json

# Install Java (for closure compiler) and emscripten after pnpm fetch
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends default-jre-headless

RUN git clone https://github.com/emscripten-core/emsdk.git /emsdk && \
  cd /emsdk && \
  ./emsdk install ${EMSDK_VERSION} && \
  ./emsdk activate ${EMSDK_VERSION}

ENV PATH="/emsdk:/emsdk/upstream/emscripten:${PATH}"
ENV EMSDK=/emsdk

# Install, build, and deploy fleet.all (superset of all fleets)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    . $HOME/.bashrc && \
  pnpm install -r --offline --frozen-lockfile && \
  pnpm --filter @superblocks/fleet.all... --filter @superblocks/fleet.javascript --filter @superblocks/fleet.javascriptsdkapi --filter @superblocks/fleet.non-lang build && \
  pnpm install -r --offline --frozen-lockfile && \
  pnpm --filter @superblocks/fleet.all deploy --prod /deploy && \
  npx clean-modules --directory /deploy/node_modules -y '!**/googleapis/**/docs/' '!**/@superblocks/**/datasource/'

# Arrange fleet entry points: fleet.all's dist + other fleets' dists side by side,
# sharing a single node_modules (fleet.all is a superset of all fleet dependencies)
RUN mkdir -p /deploy/fleets/all /deploy/fleets/javascript /deploy/fleets/javascriptsdkapi /deploy/fleets/non-lang && \
  mv /deploy/dist /deploy/fleets/all/dist && \
  cp -r /app/workers/javascript/packages/fleets/javascript/dist /deploy/fleets/javascript/dist && \
  cp -r /app/workers/javascript/packages/fleets/javascriptsdkapi/dist /deploy/fleets/javascriptsdkapi/dist && \
  cp -r /app/workers/javascript/packages/fleets/non-lang/dist /deploy/fleets/non-lang/dist

# Build the deasync binding for this architecture (node-gyp installed globally above)
RUN --mount=type=cache,target=/root/.npm \
    git clone --depth 1 --branch v${DEASYNC_VERSION} https://github.com/superblocksteam/deasync.git                      && \
  cd deasync                                                                                                             && \
  npm install                                                                                                            && \
  node-gyp configure                                                                                                     && \
  node-gyp build                                                                                                         && \
  mkdir -p /deploy/node_modules/.pnpm/deasync@${DEASYNC_VERSION}/node_modules/deasync/build                              && \
  cp build/Release/deasync.node /deploy/node_modules/.pnpm/deasync@${DEASYNC_VERSION}/node_modules/deasync/build/deasync.node

FROM ghcr.io/superblocksteam/node:${NODE_VERSION}-bookworm-slim

WORKDIR /workers/javascript

COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /deploy/fleets       ./fleets
COPY --from=builder /deploy/package.json ./package.json

RUN id -u node &>/dev/null || useradd node                                           && \
  groupadd --force --gid 1000 node                                                   && \
  usermod --uid 1000 --gid node --shell /bin/bash --move-home --home /home/node node

ENV SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA=dev-private-rsa
ENV SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519=dev-private-ed25519
ENV FLEET=all

CMD node /workers/javascript/fleets/$FLEET/dist/src/index.js
