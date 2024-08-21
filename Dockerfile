# syntax=docker/dockerfile:1.9.0

# List all build-time variables with their default values
# They need to be redefined in each stage to be used in that stage
ARG DEBIAN_BOOKWORM_VERSION=20240722
ARG GO_VERSION=1.22.5
ARG PYTHON_VERSION=3.10.14
ARG NODE_VERSION_MAJOR=20
ARG NODE_VERSION=20.16.0
ARG PNPM_VERSION=9.7.1
ARG S6_OVERLAY_VERSION=3.2.0.0
ARG DEASYNC_VERSION=0.1.29
ARG REQUIREMENTS_FILE=/app/worker.py/requirements-slim.txt
ARG SLIM_IMAGE=true
ARG SB_GIT_COMMIT_SHA=unset
ARG SERVICE_VERSION
ARG EXTRA_GO_OPTIONS
ARG INTERNAL_TAG
ARG VERSION
ARG EXTERNAL_TAG

##################
## ORCHESTRATOR ##
##################

FROM ghcr.io/superblocksteam/golang:${GO_VERSION}-bookworm AS orchestrator_and_golang_worker

ARG SERVICE_VERSION
ARG EXTRA_GO_OPTIONS
ARG TARGETARCH

ENV DEBIAN_FRONTEND=noninteractive
ENV GOOS=linux
ENV GOARCH=${TARGETARCH}

WORKDIR /go/src/github.com/superblocksteam/agent

COPY . .

RUN apt-get update                                                                  && \
    apt-get upgrade -y                                                              && \
    apt-get install -y build-essential gcc                                          && \
    make build-go SERVICE_NAME="orchestrator"                                          \
                  SERVICE_VERSION=${SERVICE_VERSION}                                   \
                  EXTRA_LD_FLAGS="-s -w -extldflags '-dynamic'"                        \
                  EXTRA_GO_OPTIONS=${EXTRA_GO_OPTIONS}                              && \
    make build-go SERVICE_NAME="worker.go"                                             \
                  SERVICE_VERSION=${SERVICE_VERSION}                                   \
                  GO_BUILD_ROOT_DIRECTORY=./workers/golang                             \
                  EXTRA_GO_OPTIONS=${EXTRA_GO_OPTIONS}                                 \
                  EXTRA_LD_FLAGS="-s -w -extldflags '-dynamic'"

#############
## WORKERS ##
#############

FROM ghcr.io/superblocksteam/debian:bookworm-${DEBIAN_BOOKWORM_VERSION}-slim AS workers

ARG TARGETARCH
ARG BUILDARCH
ARG NODE_VERSION
ARG NODE_VERSION_MAJOR
ARG GO_VERSION
ARG PNPM_VERSION
ARG S6_OVERLAY_VERSION
ARG DEASYNC_VERSION

ENV PATH=/usr/local/go/bin:$PATH
ENV BUILDARCH=$BUILDARCH

ADD --chmod=777 https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-noarch.tar.xz /tmp
ADD --chmod=777 https://go.dev/dl/go${GO_VERSION}.linux-${TARGETARCH}.tar.gz /tmp

COPY --chmod=777 scripts/s6.sh /tmp/s6.sh
COPY             .             .

RUN set -e; apt-get update && apt-get install -y curl                                                                                && \
    S6_ARCH=$(/tmp/s6.sh)                                                                                                            && \
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION_MAJOR}.x | bash -                                                     && \
    apt-get install -y nodejs=${NODE_VERSION}-1nodesource1 xz-utils git build-essential libssl-dev wget make ca-certificates clang   && \
    update-ca-certificates                                                                                                           && \
    mkdir /s6                                                                                                                        && \
    wget -P /tmp https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-${S6_ARCH}.tar.xz && \
    tar -C /s6 -Jxpf /tmp/s6-overlay-${S6_ARCH}.tar.xz                                                                               && \
    tar -C /s6 -Jxpf /tmp/s6-overlay-noarch.tar.xz                                                                                   && \
    tar -C /usr/local -xzf /tmp/go${GO_VERSION}.linux-${TARGETARCH}.tar.gz                                                           && \
    cd /workers/javascript                                                                                                           && \
    npm install                                                                                                                      && \
    npx pnpm fetch                                                                                                                   && \
    npx pnpm install -r --offline                                                                                                    && \
    make build                                                                                                                       && \
    rm -rf node_modules                                                                                                              && \
    npx pnpm fetch --prod                                                                                                            && \
    npx pnpm install -r --offline --prod                                                                                             && \
    npm install --global clean-modules                                                                                               && \
    clean-modules -y '!**/googleapis/**/docs/' '!**/@superblocks/**/datasource/'

# Install build the deasync binding for this architecture
RUN npm install -g node-gyp                                                                                                                   && \
    git clone --depth 1 --branch v${DEASYNC_VERSION} https://github.com/superblocksteam/deasync.git                                           && \
    cd deasync                                                                                                                                && \
    npm install                                                                                                                               && \
    node-gyp configure                                                                                                                        && \
    node-gyp build                                                                                                                            && \
    mkdir -p ../workers/javascript/node_modules/.pnpm/deasync@${DEASYNC_VERSION}/node_modules/deasync/build                                   && \
    cp build/Release/deasync.node ../workers/javascript/node_modules/.pnpm/deasync@${DEASYNC_VERSION}/node_modules/deasync/build/deasync.node

############
## PARENT ##
############

FROM ghcr.io/superblocksteam/python:${PYTHON_VERSION}-slim-bookworm

ARG NOW
ARG VERSION
ARG INTERNAL_TAG
ARG EXTERNAL_TAG=${VERSION}
ARG SLIM_IMAGE
ARG NODE_VERSION
ARG NODE_VERSION_MAJOR
ARG REQUIREMENTS_FILE
ARG SB_GIT_COMMIT_SHA
ARG IMAGE_CREATED=${NOW}

# https://github.com/opencontainers/image-spec/blob/main/annotations.md
LABEL org.opencontainers.image.source="https://github.com/superblocksteam/agent"
LABEL org.opencontainers.image.title="Superblocks Agent"
LABEL org.opencontainers.image.licenses="Superblocks Community Software License"
LABEL org.opencontainers.image.authors="Clark the Koala"
LABEL org.opencontainers.image.vendor="Superblocks"
LABEL org.opencontainers.image.url="https://docs.superblocks.com/"
LABEL org.opencontainers.image.documentation="https://docs.superblocks.com/"
LABEL org.opencontainers.image.version=${EXTERNAL_TAG}
LABEL org.opencontainers.image.created=${IMAGE_CREATED}
LABEL io.snyk.containers.image.dockerfile="/Dockerfile"

ENV SB_GIT_REPOSITORY_URL="https://github.com/superblocksteam/agent"
ENV SB_GIT_COMMIT_SHA=${SB_GIT_COMMIT_SHA}
ENV SUPERBLOCKS_AGENT_TLS_INSECURE="true"
ENV SUPERBLOCKS_AGENT_REDIS_GROUP="main"
ENV SUPERBLOCKS_AGENT_BUCKET="BA"
ENV SUPERBLOCKS_AGENT_PLUGIN_EVENTS="execute,metadata,test,pre_delete,stream"
ENV SUPERBLOCKS_ORCHESTRATOR_BUCKETS_CONFIG="/app/orchestrator/buckets.json"
ENV SUPERBLOCKS_AGENT_HEALTH_PORT=9999
ENV SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA=dev-private-rsa
ENV SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519=dev-private-ed25519
ENV SUPERBLOCKS_ORCHESTRATOR_AGENT_VERSION=$INTERNAL_TAG
ENV SUPERBLOCKS_ORCHESTRATOR_AGENT_VERSION_EXTERNAL=$EXTERNAL_TAG
ENV SUPERBLOCKS_ORCHESTRATOR_WORKER_GO_ENABLED=true
ENV SUPERBLOCKS_WORKER_EXECUTION_POOL_SIZE=8
ENV SUPERBLOCKS_WORKER_GO_OTEL_COLLECTOR_HTTP_URL="https://traces.intake.superblocks.com/v1/traces"
ENV SUPERBLOCKS_EXECUTION_ENV_INCLUSION_LIST="AWS_DEFAULT_REGION,AWS_ROLE_ARN,AWS_WEB_IDENTITY_TOKEN_FILE,AWS_REGION"
ENV AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1
ENV SLACKCLIENT_SKIP_DEPRECATION=true
ENV S6_VERBOSITY=0
ENV S6_SERVICES_GRACETIME=10000
ENV S6_KILL_GRACETIME=10000
ENV S6_CMD_WAIT_FOR_SERVICES_MAXTIME=120000
ENV SUPERBLOCKS_SLIM_IMAGE=$SLIM_IMAGE

COPY              --from=orchestrator_and_golang_worker /go/src/github.com/superblocksteam/agent/orchestrator             /app/orchestrator/bin
COPY              --from=orchestrator_and_golang_worker /go/src/github.com/superblocksteam/agent/buckets.minimal.json     /app/orchestrator/buckets.json
COPY              --from=orchestrator_and_golang_worker /go/src/github.com/superblocksteam/agent/flags.json               /app/orchestrator/flags.json
COPY              --from=orchestrator_and_golang_worker /go/src/github.com/superblocksteam/agent/workers/golang/worker.go /app/worker.go/bin
COPY              --from=workers                        /workers/javascript/node_modules                                  /app/worker.js/node_modules
COPY              --from=workers                        /workers/javascript/packages                                      /app/worker.js/packages
COPY              --from=workers                        /s6/                                                              /
COPY --chmod=755                                        /workers/python                                                   /app/worker.py
COPY                                                    s6-rc.d/                                                          /etc/s6-overlay/s6-rc.d/

RUN cd /app/worker.py                                                                                                                            && \
    pip install --no-cache-dir --upgrade pip setuptools                                                                                          && \
    apt-get update                                                                                                                               && \
    apt-get install -yqq --no-install-recommends lsb-release curl gpg                                                                            && \
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION_MAJOR}.x | bash -                                                                 && \
    curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg                                    && \
    echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" |                    \
    tee /etc/apt/sources.list.d/redis.list                                                                                                       && \
    apt-get update                                                                                                                               && \
    # Installing redis also creates a user and group called redis with id 101 and an user called redis with id 100
    apt-get install -yqq --no-install-recommends gcc gnupg libc6-dev libpq-dev wget dnsutils iputils-ping nodejs=${NODE_VERSION}-1nodesource1       \
                                                 ca-certificates curl build-essential cmake redis                                                && \
    mkdir -p /app/redis                                                                                                                          && \
    chown -R redis:redis /app/redis                                                                                                              && \
    curl https://packages.microsoft.com/keys/microsoft.asc | tee /etc/apt/trusted.gpg.d/microsoft.asc                                            && \
    curl https://packages.microsoft.com/config/debian/12/prod.list | tee /etc/apt/sources.list.d/mssql-release.list                              && \
    echo "deb [arch=amd64,arm64,armhf] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update                                                                                                                               && \
    ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18                                                                         && \
    pip3 install --no-cache-dir -r ${REQUIREMENTS_FILE}                                                                                          && \
    rm -rf /var/lib/apt/lists/*                                                                                                                  && \
    apt-get clean                                                                                                                                && \
    find /app/orchestrator/bin /etc/s6-overlay/s6-rc.d -type d -exec chmod 755 {} \;                                                             && \
    find /app/orchestrator/buckets.json /app/orchestrator/flags.json /etc/s6-overlay/s6-rc.d -type f -exec chmod g=u,o=u {} \;                   && \
    groupadd --gid 1000 superblocks                                                                                                              && \
    useradd --uid 1000 --gid superblocks --shell /bin/bash --create-home superblocks

EXPOSE 8080
EXPOSE 8081

ENTRYPOINT ["/init"]
