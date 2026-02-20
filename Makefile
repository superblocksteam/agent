include ./make/Makefile.base
include ./make/Makefile.golang
include ./make/Makefile.docker

# service args
SERVICE_NAME     = orchestrator
SERVICE_VERSION  = $(shell git rev-parse HEAD)

# docker args
IMAGE_REGISTRY       = ghcr.io/superblocksteam
IMAGE_REPOSITORY     = $(IMAGE_REGISTRY)/$(SERVICE_NAME)
IMAGE_TAG            = $(SERVICE_VERSION)
ROOT_DIRECTORY       = $(shell pwd)
COMPOSE_FILE         ?= compose.full.yaml:compose.extra.yaml
DOCKER_TEST_TAG      = latest
# DOCKERFILE           = Dockerfile
# DOCKER_LABELS        = --label org.opencontainers.image.version=$(SERVICE_VERSION) --label org.opencontainers.image.revision=$(shell git rev-parse HEAD) --label org.opencontainers.image.created=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

export COMPOSE_FILE

# opa orgs
INTERNAL_VERSION = "v0.0.0"
EXTERNAL_VERSION = "v0.0.0"

# k8s
K8S_NAMESPACE = orchestrator
HELM_EXTRA_ARGS =

# go args
GO_TEST_ARGS              = -cover -covermode atomic -race
UNIT_TEST_PACKAGES        = $(shell go list ./... | grep -v types | grep -v ./integration)
INTEGRATION_TEST_PACKAGES = ./integration/...
GOPRIVATE                 = github.com/superblocksteam

# gotestsum
GOTESTSUM_OPTIONS =

ifneq ($(CI),)
  include ./make/Makefile.ci
endif

POSTMAN_ENV = local
GRPC_HOST=host.docker.internal
GRPC_PORT=8081
QUOTAS_ENABLED = true

.PHONY: deps
deps: deps-go

# use FORCE_DEPS=true to force install all deps again
include ./make/Makefile.deps

.PHONY: up
up: deps-go
	@make up-deps
	@mkdir -p coverage
	@GOCOVERDIR=coverage air -c .air.toml

.PHONY: down
down:
	docker compose down -v

.PHONY: up-server-local
up-server-local: export COMPOSE_FILE=compose.full.yaml
up-server-local: up

.PHONY: up-deps
up-deps:
	docker compose up --remove-orphans -d

.PHONY: mock
mock:
	docker compose up mock --build -d

.PHONY: up-docker
up-docker: up-deps run-docker

.PHONY: run-docker
run-docker:
	@docker run \
		-e SUPERBLOCKS_AGENT_APP_ENV_TEST=ok \
		--name orchestrator \
		--network orchestrator_default \
		-d \
		-p 8080:8080 \
		-p 8070:8070 \
		-p 8081:8081 \
		$(DOCKER_OPTIONS) \
		$(IMAGE_REPOSITORY):$(DOCKER_TEST_TAG) \
		--transport.redis.host=redis \
		--store.redis.host=redis \
		--superblocks.url="http://mock:3100" \
		--quotas.enabled=$(QUOTAS_ENABLED) \
		--registration.enabled=false \
		--auth.jwt.enabled=true \
		--worker.go.enabled=true \
		$(EXTRA_ORCHESTRATOR_ARGS)

.PHONY: run-opa
run-opa:
	docker run \
		-e SUPERBLOCKS_AGENT_KEY=dev-agent-key \
		-e SUPERBLOCKS_AGENT_APP_ENV_TEST=ok \
		-e SUPERBLOCKS_ORCHESTRATOR_SUPERBLOCKS_URL="http://mock:3100" \
		--name orchestrator \
		--network orchestrator_default \
		-d \
		-p 8080:8080 \
		-p 8070:8070 \
		-p 8081:8081 \
		$(DOCKER_OPTIONS) \
		$(IMAGE_REPOSITORY):$(DOCKER_TEST_TAG)

# .PHONY: build-docker
# build-docker:
# 	docker buildx build \
# 		--ssh default \
# 		--platform linux/x86_64 \
# 		$(DOCKER_LABELS) \
# 		$(DOCKER_OPTIONS) \
# 		--build-arg EXTRA_GO_OPTIONS=$(EXTRA_GO_OPTIONS) \
# 		--build-arg GO_VERSION=$$(cat .go-version) \
# 		--build-arg SB_GIT_COMMIT_SHA=$(shell git rev-parse HEAD) \
# 		--build-arg SERVICE_VERSION=$(SERVICE_VERSION) \
# 		--build-arg SERVICE_NAME=$(SERVICE_NAME) \
# 		-t $(IMAGE_REPOSITORY):$(IMAGE_TAG) \
# 		-f $(DOCKERFILE) \
# 		$(ROOT_DIRECTORY) \
# 		--load

.PHONY: tag-docker
tag-docker:
	@docker tag $(IMAGE_REPOSITORY):$(IMAGE_TAG) $(IMAGE_REPOSITORY):$(NEW_TAG)

.PHONY: push-docker
push-docker:
	@docker push $(IMAGE_REPOSITORY) --all-tags

.PHONY: cat-docker
cat-docker:
	@docker images --format "{{.Repository}}:{{.Tag}}" | grep $(IMAGE_REPOSITORY)

.PHONY: fmt
fmt: fmt-go
	@yamlfmt .
	@buf format -w

.PHONY: generate
generate:
	go generate ./...

.PHONY: test-unit
test-unit: deps
	@mkdir -p coverage
	@gotestsum $(GOTESTSUM_OPTIONS) -- $(GO_TEST_ARGS) $(UNIT_TEST_PACKAGES) -args -test.gocoverdir $(shell pwd)/coverage
	@go tool covdata textfmt -i=$(shell pwd)/coverage -o coverage.out
	@rm -r coverage

.PHONY: test-e2e
test-e2e:
	postman collection run --color on --verbose ./postman/collection.json -e ./postman/environments/$(POSTMAN_ENV).json

.PHONY: test-ts-client
test-ts-client:
	cd clients/typescript \
	  && pnpm install \
	  && pnpm jest

.PHONY: checkout
checkout:
	# NOTE: (joey) ideally, we would just use GRPC postman tests, but postman currently does not support exporting them to json
	# NOTE: (joey) for now, this will suffice
	@docker run fullstorydev/grpcurl $(GRPC_HOST):$(GRPC_PORT) api.v1.MetadataService.Health | jq -e '.message == "OK"' >/dev/null || exit 1
	@postman collection run --color on --verbose ./postman/collection.json -e ./postman/environments/$(POSTMAN_ENV).json -i validation
	@postman collection run --color on --verbose ./postman/checkout.json -i $(POSTMAN_ENV) -e ./postman/environments/$(POSTMAN_ENV).json $(POSTMAN_EXTRA_ARGS)
	# TODO(frank): This is where we'd add more checkout stuff.

.PHONY: test-e2e-quotas
test-e2e-quotas:
	postman collection run --color on --verbose ./postman/quota_collection.json -e ./postman/environments/$(POSTMAN_ENV).json

.PHONY: test-e2e-ephemeral-network
test-e2e-ephemeral-network:
	postman collection run --color on --verbose ./postman/ephemeral_network_isolation.json -e ./postman/environments/$(POSTMAN_ENV).json

.PHONY: test-e2e-javascriptsdkapi
test-e2e-javascriptsdkapi:
	postman collection run --color on --verbose ./postman/javascriptsdkapi_collection.json -e ./postman/environments/$(POSTMAN_ENV).json

.PHONY: test-e2e-fetchcode
test-e2e-fetchcode:
	postman collection run --color on --verbose ./postman/fetchcode_collection.json -e ./postman/environments/$(POSTMAN_ENV).json

.PHONY: test-integration
test-integration: deps kafka
	@gotestsum $(GOTESTSUM_OPTIONS) -- -count=1 -timeout 30s -covermode=atomic -coverprofile=coverage-integration.out -coverpkg=./... $(INTEGRATION_TEST_PACKAGES)

.PHONY: kafka
kafka:
	docker compose up -d kafka

.PHONY: version
version:
	@echo $(SERVICE_VERSION)

.PHONY: bump-gen
bump-gen:
	go get github.com/superblocksteam/types/gen/go
	go mod tidy

.PHONY: clean
clean:
	@find . -type f -name '*.pb.*.go' -exec rm {} +

.PHONY: deploy-helm
deploy-helm:

	helm dependency build ./helm/orchestrator

	helm upgrade -i --wait --timeout $(HELM_TIMEOUT) -n $(K8S_NAMESPACE) orchestrator helm/orchestrator \
		--debug \
		--create-namespace \
		--values helm/orchestrator/$(ENVIRONMENT).yaml \
		--set worker_go.image.tag=$(IMAGE_TAG) \
		--set worker_go.queue.host=$(HELM_QUEUE_HOST) \
		--set worker_go.queue.servername=$(HELM_QUEUE_HOST) \
		--set worker_go.kvstore.host=$(HELM_KVSTORE_HOST) \
		--set worker_go.kvstore.servername=$(HELM_KVSTORE_HOST) \
		--set worker_go.superblocks.key="$(HELM_SUPERBLOCKS_KEY)" \
		--set worker_py.image.tag=$(IMAGE_TAG) \
		--set worker_py.queue.host=$(HELM_QUEUE_HOST) \
		--set worker_py.queue.token="${HELM_QUEUE_TOKEN}" \
		--set worker_py.kvstore.host=$(HELM_KVSTORE_HOST) \
		--set worker_py.kvstore.token="${HELM_KVSTORE_TOKEN}" \
		--set worker_py.superblocks.key="$(HELM_SUPERBLOCKS_KEY)" \
		--set worker_js.queue.host="${HELM_QUEUE_HOST}" \
		--set worker_js.queue.token="${HELM_QUEUE_TOKEN}" \
		--set worker_js.kvstore.host="${HELM_KVSTORE_HOST}" \
		--set worker_js.kvstore.token="${HELM_KVSTORE_TOKEN}" \
		--set worker_js.image.credentials.username="${HELM_IMAGE_CREDENTIALS_USERNAME}" \
		--set worker_js.image.credentials.password="${HELM_IMAGE_CREDENTIALS_PASSWORD}" \
		--set worker_js.image.tag="$(IMAGE_TAG)" \
		--set worker_js.superblocks.key="$(HELM_SUPERBLOCKS_KEY)" \
		--set worker_js.superblocks.privateKeyRSA="$(HELM_WORKER_KEY_RSA)" \
		--set worker_js.superblocks.privateKeyEd25519="$(HELM_WORKER_KEY_ED25519)" \
		--set sandbox_workers.fullnameOverride=orchestrator \
		--set sandbox_workers.superblocks.key="$(HELM_SUPERBLOCKS_KEY)" \
		--set sandbox_workers.queue.host="$(HELM_QUEUE_HOST)" \
		--set sandbox_workers.queue.servername="$(HELM_QUEUE_HOST)" \
		--set sandbox_workers.queue.password="$(HELM_QUEUE_TOKEN)" \
		--set sandbox_workers.kvstore.host="$(HELM_KVSTORE_HOST)" \
		--set sandbox_workers.kvstore.servername="$(HELM_KVSTORE_HOST)" \
		--set sandbox_workers.kvstore.password="$(HELM_KVSTORE_TOKEN)" \
		--set sandbox_workers.image.credentials.username="${HELM_IMAGE_CREDENTIALS_USERNAME}" \
		--set sandbox_workers.image.credentials.password="${HELM_IMAGE_CREDENTIALS_PASSWORD}" \
		--set sandbox_workers.taskManager.image.tag="$(IMAGE_TAG)" \
		--set sandbox_workers.sandbox.javascript.image.tag="$(IMAGE_TAG)" \
		--set sandbox_workers.sandbox.python.image.tag="$(IMAGE_TAG)" \
		--set queue.host="${HELM_QUEUE_HOST}" \
		--set queue.token="${HELM_QUEUE_TOKEN}" \
		--set kvstore.host="${HELM_KVSTORE_HOST}" \
		--set kvstore.token="${HELM_KVSTORE_TOKEN}" \
		--set image.credentials.username="${HELM_IMAGE_CREDENTIALS_USERNAME}" \
		--set image.credentials.password="${HELM_IMAGE_CREDENTIALS_PASSWORD}" \
		--set image.tag="$(IMAGE_TAG)" \
		--set superblocks.key="$(HELM_SUPERBLOCKS_KEY)" \
		--set launchdarkly.apikey="$(HELM_LAUNCHDARKLY_APIKEY)" \
		--set secrets.encryptionKey="$(HELM_SECRETS_ENCRYPTION_KEY)" $(HELM_EXTRA_ARGS)

	helm upgrade -i --wait --timeout $(HELM_TIMEOUT) -n $(K8S_NAMESPACE) orchestrator-workers helm/orchestrator \
		--debug \
		--create-namespace \
		--force \
		--values helm/orchestrator/$(ENVIRONMENT).yaml \
		--set server.deploy=false \
		--set queue.deploy=false \
		--set worker_go.deploy=false \
		--set worker_py.deploy=false \
		--set worker_js.deploy=false \
		--set sandbox_workers.fullnameOverride=orchestrator-workers \
		--set sandbox_workers.superblocks.key="$(HELM_SUPERBLOCKS_KEY)" \
		--set sandbox_workers.queue.host="$(HELM_QUEUE_HOST)" \
		--set sandbox_workers.queue.servername="$(HELM_QUEUE_HOST)" \
		--set sandbox_workers.queue.password="$(HELM_QUEUE_TOKEN)" \
		--set sandbox_workers.kvstore.host="$(HELM_KVSTORE_HOST)" \
		--set sandbox_workers.kvstore.servername="$(HELM_KVSTORE_HOST)" \
		--set sandbox_workers.kvstore.password="$(HELM_KVSTORE_TOKEN)" \
		--set sandbox_workers.image.credentials.username="${HELM_IMAGE_CREDENTIALS_USERNAME}" \
		--set sandbox_workers.image.credentials.password="${HELM_IMAGE_CREDENTIALS_PASSWORD}" \
		--set sandbox_workers.taskManager.image.tag="$(IMAGE_TAG)" \
		--set sandbox_workers.sandbox.javascript.image.tag="$(IMAGE_TAG)" \
		--set sandbox_workers.sandbox.python.image.tag="$(IMAGE_TAG)" \
		--set queue.host="${HELM_QUEUE_HOST}" \
		--set queue.token="${HELM_QUEUE_TOKEN}" \
		--set kvstore.host="${HELM_KVSTORE_HOST}" \
		--set kvstore.token="${HELM_KVSTORE_TOKEN}" \
		--set image.credentials.username="${HELM_IMAGE_CREDENTIALS_USERNAME}" \
		--set image.credentials.password="${HELM_IMAGE_CREDENTIALS_PASSWORD}" \
		--set image.tag="$(IMAGE_TAG)" \
		--set superblocks.key="$(HELM_SUPERBLOCKS_KEY)" \
		--set launchdarkly.apikey="$(HELM_LAUNCHDARKLY_APIKEY)" \
		--set secrets.encryptionKey="$(HELM_SECRETS_ENCRYPTION_KEY)" $(HELM_EXTRA_ARGS)

HELM_TIMEOUT := "20m"
.PHONY: deploy-helm-opa
deploy-helm-opa:

	helm repo add superblocks https://charts.superblocks.com/superblocks
	helm repo update
	helm dependency build ./helm/cloud-opa

	helm upgrade -i --wait --timeout $(HELM_TIMEOUT) -n $(K8S_NAMESPACE) cloud-opa helm/cloud-opa \
		--debug \
		--force \
		--set superblocks-agent.image.tag="$(IMAGE_TAG)" \
		--values helm/cloud-opa/values.yaml \
		--values helm/cloud-opa/values-$(ENVIRONMENT).yaml $(HELM_EXTRA_ARGS)

	helm upgrade -i --wait --timeout $(HELM_TIMEOUT) -n $(K8S_NAMESPACE) cloud-opa-new helm/cloud-opa \
		--debug \
		--force \
		--set superblocks-agent.image.tag="$(IMAGE_TAG)" \
		--values helm/cloud-opa/values.yaml \
		--values helm/cloud-opa/values-$(ENVIRONMENT)-new.yaml $(HELM_EXTRA_ARGS)

.PHONY: helm-template
helm-template:
	# curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
	# chmod 700 get_helm.sh
	# ./get_helm.sh
	cd helm/orchestrator \
		&& helm dependency build \
		&& helm template .
