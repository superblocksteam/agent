# service args
SERVICE_NAME = javascript-sandbox
SERVICE_VERSION = $(shell git describe --always --dirty)

# docker args
IMAGE_REGISTRY = ghcr.io/superblocksteam
IMAGE_REPOSITORY = $(IMAGE_REGISTRY)/$(SERVICE_NAME)
IMAGE_REGISTRY_ECR = 873097255122.dkr.ecr.us-west-2.amazonaws.com/superblocksteam
IMAGE_REPOSITORY_ECR = $(IMAGE_REGISTRY_ECR)/$(SERVICE_NAME)

IMAGE_TAG = $(SERVICE_VERSION)
ROOT_DIRECTORY = $(shell pwd)


.PHONY: deps
deps:
	@cd $(ROOT_DIRECTORY)/../../javascript && make deps
	@cd $(ROOT_DIRECTORY)/../../javascript && npx pnpm --filter @superblocks/shared... run build

.PHONY: build
build: clean deps
	@npm run build

.PHONY: fmt
fmt: deps
	@npm run lint:fix

.PHONY: typecheck
typecheck:
	@npm run typecheck

.PHONY: check
check: build typecheck lint

.PHONY: lint
lint:
	@npm run lint:fix

.PHONY: up
up: deps build
	@npm run start

.PHONY: clean
clean:
	@npm run clean

.PHONY: test-unit
test-unit: build
	@npm run test:coverage

.PHONY: test
test: build test-unit

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

# Help
help:
	@echo "JavaScript Sandbox"
	@echo ""
	@echo "Usage:"
	@echo "  make deps         Install dependencies"
	@echo "  make build        Build the service"
	@echo "  make fmt          Format/lint the code"
	@echo "  make typecheck    Typecheck the code"
	@echo "  make check        Check the code"
	@echo "  make lint         Format/lint the code"
	@echo "  make up           Start the sandbox service"
	@echo "  make clean        Remove all the dependencies and build artifacts"
	@echo "  make test-unit    Run unit tests with coverage"
	@echo "  make test         Run all tests with coverage"
	@echo "  make tag-docker   Tag the docker image"
	@echo "  make push-docker  Push the docker image"
	@echo "  make cat-docker   Show the docker images"
