# service args
SERVICE_NAME 	= worker-python
SERVICE_VERSION = $(shell git describe --always --dirty)

# docker args
IMAGE_REGISTRY       = ghcr.io/superblocksteam
IMAGE_REPOSITORY     = $(IMAGE_REGISTRY)/$(SERVICE_NAME)
IMAGE_REGISTRY_ECR   = 873097255122.dkr.ecr.us-west-2.amazonaws.com/superblocksteam
IMAGE_REPOSITORY_ECR = $(IMAGE_REGISTRY_ECR)/$(SERVICE_NAME)
IMAGE_TAG            = $(SERVICE_VERSION)
ROOT_DIRECTORY       = $(shell pwd)
HELM_TIMEOUT         = 10m

SPEED_TEST_ITERATIONS            = 100
SPEED_TEST_MAX_MEDIAN_RUNTIME_MS = 0.4
SPEED_TEST_MAX_MEAN_RUNTIME_MS   = 0.4

CHECK_ONLY = false
RUFF_FIX_FLAG=--fix
RUFF_CHECK_FLAG=

TOX_EXTRA_ARGS=

PYTHON = python

.PHONY: deps
deps:
	@$(PYTHON) -m pip install python-dotenv[cli]
	@$(PYTHON) -m pip install -r requirements-slim.txt

.PHONY: deps-dev
deps-dev:
	@$(PYTHON) -m pip install -r requirements.dev.txt

.PHONY: up
up: deps
	@dotenv -f .env.local run -- $(PYTHON) ./src/entry.py

.PHONY: up-docker
up-docker:
	@docker compose up $(DOCKER_COMPOSE_OPTIONS) -d

.PHONY: tag-docker
tag-docker:
	@docker tag $(IMAGE_REPOSITORY):$(IMAGE_TAG) $(IMAGE_REPOSITORY):$(NEW_TAG)
	@docker tag $(IMAGE_REPOSITORY_ECR):$(IMAGE_TAG) $(IMAGE_REPOSITORY_ECR):$(NEW_TAG)

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

.PHONY: fmt
fmt:
ifeq ($(CHECK_ONLY),true)
	$(eval RUFF_FIX_FLAG=)
	$(eval RUFF_CHECK_FLAG=--check)
endif
	# linting
	@ruff check $(RUFF_FIX_FLAG)
	# formatting
	@ruff format $(RUFF_CHECK_FLAG)

.PHONY: test
test:
	@tox -- $(TOX_EXTRA_ARGS)

.PHONY: deploy-helm
deploy-helm:
	helm repo add bitnami https://charts.bitnami.com/bitnami
	helm dependency build ./helm
	helm upgrade -i --wait --timeout $(HELM_TIMEOUT) -n $(K8S_NAMESPACE) worker-python helm \
		--create-namespace \
		--values helm-values/$(ENVIRONMENT).yaml \
		--set queue.host="${HELM_QUEUE_HOST}" \
		--set kvstore.host="${HELM_KVSTORE_HOST}" \
		--set image.tag="$(IMAGE_TAG)" \
		--debug \
		$(HELM_EXTRA_ARGS)

# make freeze dep=foo==1.2.3
.PHONY: freeze
freeze:
	-docker stop freeze_py && docker rm freeze_py
	docker build -t freeze_py . -f Dockerfile.freeze --build-arg ADDITIONAL_DEP=$(dep)
	docker run -d --name freeze_py freeze_py
	docker cp freeze_py:/app/requirements.txt .
	sed 's/-/_/g' requirements.txt > tmpfile && mv tmpfile requirements.txt



.PHONY: redis
redis:
	docker compose up redis -d

.PHONY: deploy-kind
deploy-kind:
	make -C ../javascript deploy-kind

.PHONY: add-package
add-package:
	@PWD=$(shell pwd)
	@$(eval TAG := $(if $(tag),$(tag),main))

	@# Run container
	docker run -d \
		-e PKG_NAME=$(name) -e PKG_VERSION=$(version) -e IMPORT_NAME=$(import_name) \
		--mount type=bind,source='$(PWD)',target=/repo \
		--pull always --rm --name worker-py-pkg-adder \
		ghcr.io/superblocksteam/worker.py:$(TAG) bash -c '/repo/scripts/add-package.sh'

	@# Wait for add-package.sh to finish
	@docker logs -f worker-py-pkg-adder

	@# Format
	@make fmt >/dev/null

.PHONY: speed-test
speed-test:
	@python3.10 -m pip install -r scripts/requirements.txt
	@python3.10 scripts/speed_test.py $(SPEED_TEST_ENV) $(SPEED_TEST_ITERATIONS) $(SPEED_TEST_MAX_MEDIAN_RUNTIME_MS) $(SPEED_TEST_MAX_MEAN_RUNTIME_MS)
