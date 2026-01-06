# syntax=docker/dockerfile:1.9.0

ARG NODE_VERSION=20.19.5
ARG EMSDK_VERSION=3.1.65
FROM ghcr.io/superblocksteam/node:${NODE_VERSION} AS builder

ARG DEASYNC_VERSION=0.1.29
ARG EMSDK_VERSION

WORKDIR /workers/javascript/

# Install build dependencies
RUN apt-get update && \
  apt-get install -y --no-install-recommends python3 make g++ git xz-utils && \
  rm -rf /var/lib/apt/lists/*

COPY ./workers/javascript/pnpm-workspace.yaml ./
COPY ./workers/javascript/package*.json ./workers/javascript/pnpm-lock.yaml ./
COPY ./workers/ephemeral/javascript-sandbox/package.json ../ephemeral/javascript-sandbox/

RUN npm install -g clean-modules && \
  npm install                  && \
  npx pnpm fetch

COPY ./workers/javascript/ ./
COPY ./workers/ephemeral/javascript-sandbox/ ../ephemeral/javascript-sandbox/

# Install Java (for closure compiler) and emscripten after pnpm fetch
RUN apt-get update && \
  apt-get install -y --no-install-recommends default-jre-headless && \
  rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/emscripten-core/emsdk.git /emsdk && \
  cd /emsdk && \
  ./emsdk install ${EMSDK_VERSION} && \
  ./emsdk activate ${EMSDK_VERSION}

ENV PATH="/emsdk:/emsdk/upstream/emscripten:${PATH}"
ENV EMSDK=/emsdk

RUN npx pnpm install -r                             && \
  npx pnpm --filter "*" build                       && \
  rm -rf node_modules                               && \
  npm install                                       && \
  npx pnpm fetch --prod                             && \
  npx pnpm install -r --offline --prod              && \
  clean-modules -y '!**/googleapis/**/docs/'           \
  '!**/@superblocks/**/datasource/'

RUN npm install -g node-gyp                                                                                              && \
  git clone --depth 1 --branch v${DEASYNC_VERSION} https://github.com/superblocksteam/deasync.git                        && \
  cd deasync                                                                                                             && \
  npm install                                                                                                            && \
  node-gyp configure                                                                                                     && \
  node-gyp build                                                                                                         && \
  mkdir -p ../node_modules/.pnpm/deasync@${DEASYNC_VERSION}/node_modules/deasync/build                                   && \
  cp build/Release/deasync.node ../node_modules/.pnpm/deasync@${DEASYNC_VERSION}/node_modules/deasync/build/deasync.node

FROM ghcr.io/superblocksteam/node:${NODE_VERSION}-bookworm-slim

WORKDIR /workers/javascript

COPY --from=builder /workers/javascript/node_modules ./node_modules
COPY --from=builder /workers/javascript/packages     ./packages

RUN id -u node &>/dev/null || useradd node                                           && \
  groupadd --force --gid 1000 node                                                   && \
  usermod --uid 1000 --gid node --shell /bin/bash --move-home --home /home/node node

ENV SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA=dev-private-rsa
ENV SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519=dev-private-ed25519
ENV SUPERBLOCKS_USE_WASM_SANDBOX=false
ENV FLEET=all

CMD node /workers/javascript/packages/fleets/$FLEET/dist/src/index.js
