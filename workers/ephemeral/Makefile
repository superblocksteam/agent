.PHONY: all deps test lint clean help deploy-kind deploy-helm deploy-redis deploy-orchestrator port-forward-orchestrator

# service args
SERVICE_NAME = ephemeral-worker
SERVICE_VERSION = $(shell git describe --always --dirty)

# docker args
IMAGE_REGISTRY = ghcr.io/superblocksteam
IMAGE_TAG = $(SERVICE_VERSION)

# k8s
K8S_NAMESPACE = superblocks
K8S_CONTEXT = kind-superblocks
HELM_TIMEOUT = 5m
HELM_EXTRA_ARGS =
ENVIRONMENT = ci

# Default target
all: deps

# ============================================================================
# Dependencies
# ============================================================================

deps:
	@echo "==> Installing Python sandbox dependencies..."
	pip install -r python-sandbox/requirements.txt -r python-sandbox/requirements.dev.txt

# ============================================================================
# Testing
# ============================================================================

test:
	@echo "==> Running Python sandbox tests..."
	cd python-sandbox && make test

test-cov:
	@echo "==> Running Python sandbox tests with coverage..."
	cd python-sandbox && make test-cov

# ============================================================================
# Linting
# ============================================================================

lint:
	@echo "==> Linting Python sandbox..."
	cd python-sandbox && make lint

# ============================================================================
# Kind (Kubernetes in Docker)
# ============================================================================

deploy-kind:
	@echo "==> Creating Kind cluster..."
	@kind get clusters | grep superblocks > /dev/null || kind create cluster --name superblocks --wait 60s
	@echo "==> Installing cert-manager..."
	@kubectl --context $(K8S_CONTEXT) apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml
	@echo "==> Waiting for cert-manager to be ready..."
	@kubectl --context $(K8S_CONTEXT) -n cert-manager wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager --timeout=120s
	@echo "==> Installing KEDA..."
	@helm repo add kedacore https://kedacore.github.io/charts || true
	@helm repo update
	@helm upgrade --install keda kedacore/keda \
		--namespace keda \
		--create-namespace \
		--kube-context $(K8S_CONTEXT) \
		--wait \
		--timeout 2m

deploy-helm:
	@echo "==> Deploying ephemeral workers to Kind..."
	helm dependency build ./helm
	helm upgrade --install $(SERVICE_NAME) ./helm \
		--namespace $(K8S_NAMESPACE) \
		--create-namespace \
		--kube-context $(K8S_CONTEXT) \
		--wait \
		--timeout $(HELM_TIMEOUT) \
		--values helm-values/$(ENVIRONMENT).yaml \
		--set taskManager.image.tag="$(IMAGE_TAG)" \
		--set sandbox.python.image.tag="$(IMAGE_TAG)" \
		--set sandbox.javascript.image.tag="$(IMAGE_TAG)" \
		--set smokescreen.image.tag="$(IMAGE_TAG)" \
		$(HELM_EXTRA_ARGS)

load-images:
	@echo "==> Loading images into Kind..."
	kind load docker-image $(IMAGE_REGISTRY)/orchestrator:$(IMAGE_TAG) --name superblocks || true
	kind load docker-image $(IMAGE_REGISTRY)/task-manager:$(IMAGE_TAG) --name superblocks || true
	kind load docker-image $(IMAGE_REGISTRY)/python-sandbox:$(IMAGE_TAG) --name superblocks || true
	kind load docker-image $(IMAGE_REGISTRY)/javascript-sandbox:$(IMAGE_TAG) --name superblocks || true
	kind load docker-image $(IMAGE_REGISTRY)/smokescreen:$(IMAGE_TAG) --name superblocks || true

# ============================================================================
# Full Kind Deployment (Orchestrator + Redis + Ephemeral Workers)
# ============================================================================

# Deploy Redis to Kind
deploy-redis:
	@echo "==> Deploying Redis to Kind..."
	helm repo add bitnami https://charts.bitnami.com/bitnami || true
	helm repo update
	helm upgrade --install redis bitnami/redis \
		--namespace $(K8S_NAMESPACE) \
		--create-namespace \
		--kube-context $(K8S_CONTEXT) \
		--wait \
		--timeout 2m \
		--set auth.password=koala \
		--set architecture=standalone

# Deploy orchestrator via kubectl run
deploy-orchestrator:
	@echo "==> Deploying Orchestrator to Kind..."
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) delete pod orchestrator --ignore-not-found
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) delete svc orchestrator --ignore-not-found
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) run orchestrator \
		--image=$(IMAGE_REGISTRY)/orchestrator:$(IMAGE_TAG) \
		--image-pull-policy=IfNotPresent \
		--restart=Never \
		--port=8080 \
		--env="SUPERBLOCKS_ORCHESTRATOR_SUPERBLOCKS_URL=http://localhost:8080" \
		--env="SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE=http://localhost:10300/api/v1/events" \
		--env="SUPERBLOCKS_ORCHESTRATOR_FILE_SERVER_URL=http://localhost:8080/v2/files" \
		--env="SUPERBLOCKS_ORCHESTRATOR_SUPERBLOCKS_KEY=dev-agent-key" \
		--env="SUPERBLOCKS_ORCHESTRATOR_TRANSPORT_REDIS_HOST=redis-master" \
		--env="SUPERBLOCKS_ORCHESTRATOR_TRANSPORT_REDIS_PASSWORD=koala" \
		--env="SUPERBLOCKS_ORCHESTRATOR_STORE_REDIS_HOST=redis-master" \
		--env="SUPERBLOCKS_ORCHESTRATOR_STORE_REDIS_PASSWORD=koala" \
		--env="SUPERBLOCKS_ORCHESTRATOR_DATA_DOMAIN=app.superblocks.com" \
		--env="SUPERBLOCKS_ORCHESTRATOR_BUCKETS_CONFIG=buckets.minimal.json" \
		--env="SUPERBLOCKS_ORCHESTRATOR_WORKER_EPHEMERAL_PLUGINS_ENABLED=python,javascript" \
		--env="SUPERBLOCKS_ORCHESTRATOR_LOG_LEVEL=debug" \
		--env="SUPERBLOCKS_ORCHESTRATOR_SIGNATURE_VERIFICATION_ENABLED=false" \
		--env="SUPERBLOCKS_ORCHESTRATOR_SECRETS_ENCRYPTION_KEY=e2e_test_encryption_key_32bytes!" \
		--env="SUPERBLOCKS_ORCHESTRATOR_REGISTRATION_ENABLED=false" \
		--env="SUPERBLOCKS_ORCHESTRATOR_EVENTS_CLOUD_ENABLED=false" \
		-- \
		--http.bind=0.0.0.0
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) expose pod orchestrator --port=8080 --target-port=8080 --name=orchestrator || true
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) wait --for=condition=ready pod/orchestrator --timeout=120s

# Port forward orchestrator for local testing
port-forward-orchestrator:
	@echo "==> Port forwarding Orchestrator..."
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) port-forward svc/orchestrator 8080:8080 &

logs:
	@echo "==> Fetching pod status..."
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) get pods -o wide || true
	@echo "==> Describing pods..."
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) describe pods || true
	@echo "==> Orchestrator logs:"
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) logs -l app.kubernetes.io/name=orchestrator --tail=100 || true
	@echo "==> Ephemeral worker logs (all containers):"
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) logs -l component=worker.ephemeral --all-containers --tail=100 || true
	@echo "==> Init container logs (iptables-init):"
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) logs -l component=worker.ephemeral -c iptables-init --tail=50 || true
	@echo "==> Smokescreen logs:"
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) logs -l component=worker.ephemeral -c smokescreen --tail=50 || true
	@echo "==> KEDA operator logs:"
	kubectl --context $(K8S_CONTEXT) -n keda logs -l app=keda-operator --tail=50 || true
	@echo "==> Redis logs:"
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) logs -l app.kubernetes.io/name=redis --tail=50 || true

port-forward-redis:
	@echo "==> Port forwarding Redis..."
	kubectl --context $(K8S_CONTEXT) -n $(K8S_NAMESPACE) port-forward svc/orchestrator-redis-master 6379:6379 &

# ============================================================================
# Cleanup
# ============================================================================

clean:
	@echo "==> Cleaning generated files..."
	rm -rf python-sandbox/__pycache__
	rm -rf python-sandbox/.pytest_cache
	rm -rf python-sandbox/.coverage
	rm -rf python-sandbox/htmlcov

clean-kind:
	@echo "==> Deleting Kind cluster..."
	kind delete cluster --name superblocks

# ============================================================================
# Help
# ============================================================================

help:
	@echo "Ephemeral Workers"
	@echo ""
	@echo "Usage:"
	@echo "  make deps             Install Python dependencies"
	@echo "  make test             Run tests"
	@echo "  make test-cov         Run tests with coverage"
	@echo "  make lint             Run linter"
	@echo "  make clean            Remove generated files"
	@echo ""
	@echo "Kind Deployment (Ephemeral Workers Only):"
	@echo "  make deploy-kind      Create Kind cluster and install KEDA"
	@echo "  make load-images      Load Docker images into Kind"
	@echo "  make deploy-helm      Deploy ephemeral workers via Helm"
	@echo "  make logs             Fetch pod logs"
	@echo "  make port-forward-redis  Port forward Redis for testing"
	@echo "  make clean-kind       Delete Kind cluster"
	@echo ""
	@echo "Full Kind Deployment:"
	@echo "  make deploy-redis         Deploy Redis to Kind"
	@echo "  make deploy-orchestrator  Deploy orchestrator to Kind via kubectl run"
	@echo "  make port-forward-orchestrator  Port forward orchestrator for testing"
