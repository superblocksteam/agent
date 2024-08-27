include ../../make/Makefile.base
include ../../make/Makefile.golang
include ../../make/Makefile.docker

# service args
SERVICE_NAME     = worker.go
SERVICE_VERSION  = $(shell git rev-parse HEAD)

# docker args
IMAGE_REGISTRY       = ghcr.io/superblocksteam
IMAGE_REPOSITORY     = $(IMAGE_REGISTRY)/$(SERVICE_NAME)
IMAGE_TAG            = $(SERVICE_VERSION)
ROOT_DIRECTORY       = $(shell pwd)
DOCKER_TEST_TAG      = latest
DOCKER_INTERNAL_HOST = "host.docker.internal"
GO_ARCH = "amd64"

# k8s
K8S_NAMESPACE = orchestrator
HELM_EXTRA_ARGS =

.PHONY: up
up: deps-go
	@air -c .air.toml

.PHONY: up-deps
up-deps:
	@docker compose -f compose.$(DOCKER_COMPOSE_FILE).yaml up -d

.PHONY: run-docker
run-docker:
	@make up-deps DOCKER_COMPOSE_FILE=everything
	@docker run -d --pull always --network workergo_default -d $(IMAGE_REPOSITORY):$(DOCKER_TEST_TAG) --transport.redis.host=redis --store.redis.host=redis --transport.redis.password=dev-agent-key --store.redis.password=dev-agent-key

.PHONY: tag-docker
tag-docker:
	@docker tag $(IMAGE_REPOSITORY):$(IMAGE_TAG) $(IMAGE_REPOSITORY):$(NEW_TAG)

.PHONY: push-docker
push-docker:
	@docker push $(IMAGE_REPOSITORY) --all-tags

.PHONY: cat-docker
cat-docker:
	@docker images --format "{{.Repository}}:{{.Tag}}" | grep $(IMAGE_REPOSITORY)

.PHONY: gen-mocks
gen-mocks: deps
	@mockery

.PHONY: test-integration
test-integration:
	@go test -v -count=1 ./internal/integration_test/...

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
