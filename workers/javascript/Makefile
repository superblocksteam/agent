# service args
SERVICE_NAME = worker.js
SERVICE_VERSION = $(shell git describe --always --dirty)

# docker args
IMAGE_REGISTRY = ghcr.io/superblocksteam
IMAGE_REPOSITORY = $(IMAGE_REGISTRY)/$(SERVICE_NAME)
IMAGE_REGISTRY_ECR = 873097255122.dkr.ecr.us-west-2.amazonaws.com/superblocksteam
IMAGE_REPOSITORY_ECR = $(IMAGE_REGISTRY_ECR)/$(SERVICE_NAME)

IMAGE_TAG = $(SERVICE_VERSION)
ROOT_DIRECTORY = $(shell pwd)

# k8s
K8S_NAMESPACE = worker
K8S_CONFIG = ~/.kube/config
HELM_EXTRA_ARGS =

PACKAGE=*
PNPM_OPTIONS=--no-bail


.PHONY: build
build: deps
	@npx pnpm $(PNPM_OPTIONS) --filter "$(PACKAGE)" build

.PHONY: fmt
fmt: deps
	@npx pnpm $(PNPM_OPTIONS) --filter "$(PACKAGE)" lint:fix

.PHONY: check
check: build typecheck lint

.PHONY: typecheck
typecheck:
	@npx pnpm $(PNPM_OPTIONS) --filter "$(PACKAGE)" typecheck

.PHONY: lint
lint:
	@npx pnpm run --filter "$(PACKAGE)" --if-present lint:fix

.PHONY: redis
redis:
	@docker compose up redis -d

.PHONY: deps
deps:
	@npm install
	@npx pnpm install

.PHONY: jaeger
jaeger:
	@docker run -d --name jaeger \
		-e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
		-e COLLECTOR_OTLP_ENABLED=true \
		-p 6831:6831/udp \
		-p 6832:6832/udp \
		-p 5778:5778 \
		-p 16686:16686 \
		-p 4317:4317 \
		-p 4318:4318 \
		-p 14250:14250 \
		-p 14268:14268 \
		-p 14269:14269 \
		-p 9411:9411 \
		jaegertracing/all-in-one:1.40

.PHONY: up
up: deps build
	@pnpm --filter @superblocks/fleet.all start

.PHONY: clean
clean:
	@pnpm --filter @superblocks/worker.js clean
	@pnpm --filter @superblocks/fleet.all clean
	@pnpm --filter @superblocks/fleet.javascript clean
	@pnpm --filter @superblocks/fleet.non-lang clean

.PHONY: test-e2e
test-e2e:
	@pnpm --filter @superblocks/worker.js test:integration

.PHONY: test
test: test-unit

.PHONY: test-unit
test-unit:
	@pnpm --stream --no-bail --filter "*" test

.PHONY: test-integration
test-integration:
	@pnpm --filter @superblocks/worker.js test:integration

.PHONY: tag-docker
tag-docker:
	@docker tag $(IMAGE_REPOSITORY):$(IMAGE_TAG) $(IMAGE_REPOSITORY):$(NEW_TAG)
	@docker tag $(IMAGE_REPOSITORY):$(IMAGE_TAG) $(IMAGE_REPOSITORY):latest
	@docker tag $(IMAGE_REPOSITORY_ECR):$(IMAGE_TAG) $(IMAGE_REPOSITORY_ECR):$(NEW_TAG)
	@docker tag $(IMAGE_REPOSITORY_ECR):$(IMAGE_TAG) $(IMAGE_REPOSITORY_ECR):latest

.PHONY: push-docker
push-docker:
	@docker push $(IMAGE_REPOSITORY) --all-tags
	@docker push $(IMAGE_REPOSITORY_ECR) --all-tags

.PHONY: cat-docker
cat-docker:
	@docker images --format "{{.Repository}}:{{.Tag}}" | grep -e $(IMAGE_REPOSITORY) -e $(IMAGE_REPOSITORY_ECR)

.PHONY: version
version:
	@echo $(SERVICE_VERSION)

.PHONY: local-build
local-build:
	@make deps && make build

.PHONY: local-main
local-main:
	@make up

.PHONY: local-test
local-test:
	@SUPERBLOCKS_AGENT_PLUGIN_EVENTS=test SUPERBLOCKS_AGENT_BUCKET=BA pnpm --filter @superblocks/fleet.non-lang start

.PHONY: local-metadata
local-metadata:
	@SUPERBLOCKS_AGENT_PLUGIN_EVENTS=metadata SUPERBLOCKS_AGENT_BUCKET=BA pnpm --filter @superblocks/fleet.non-lang start

.PHONY: local-execute
local-execute:
	@SUPERBLOCKS_AGENT_PLUGIN_EVENTS=execute SUPERBLOCKS_AGENT_BUCKET=BA pnpm --filter @superblocks/fleet.non-lang start

.PHONY: local-execute-be
local-execute-be:
	@SUPERBLOCKS_AGENT_PLUGIN_EVENTS=execute SUPERBLOCKS_AGENT_BUCKET=BE pnpm --filter @superblocks/fleet.non-lang start

.PHONY: local-js
local-js:
	@SUPERBLOCKS_AGENT_PLUGIN_EVENTS=execute SUPERBLOCKS_AGENT_BUCKET=BA pnpm --filter @superblocks/fleet.javascript start

.PHONY: deploy-kind
deploy-kind:
	@kind get clusters | grep superblocks > /dev/null || kind create cluster --name superblocks

.PHONY: deploy-helm
deploy-helm:

	helm repo add bitnami https://charts.bitnami.com/bitnami
	helm dependency build ./helm

	helm upgrade -i --wait --timeout 3m -n $(K8S_NAMESPACE) worker helm \
		--create-namespace \
		--values helm/$(ENVIRONMENT).yaml \
		--set queue.host="${HELM_QUEUE_HOST}" \
		--set queue.token="${HELM_QUEUE_TOKEN}" \
		--set kvstore.host="${HELM_KVSTORE_HOST}" \
		--set kvstore.token="${HELM_KVSTORE_TOKEN}" \
		--set image.credentials.username="${HELM_IMAGE_CREDENTIALS_USERNAME}" \
		--set image.credentials.password="${HELM_IMAGE_CREDENTIALS_PASSWORD}" \
		--set image.tag="$(IMAGE_TAG)" \
		--set superblocks.key="$(HELM_SUPERBLOCKS_KEY)" \
		--set superblocks.privateKeyRSA="$(HELM_WORKER_KEY_RSA)" \
		--set superblocks.privateKeyEd25519="$(HELM_WORKER_KEY_ED25519)" \
		 $(HELM_EXTRA_ARGS)
