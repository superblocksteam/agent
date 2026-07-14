#!/usr/bin/env bash
# Run the pinned Native Database Terraform module contract proof.
# CI calls this from test-go. The Go test parses the selected Helm values and
# clones or verifies the exact pinned Terraform module checkout.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALUES_FILE="${NATIVE_DB_HELM_VALUES_FILE:-${ROOT}/helm/agent/values.yaml}"

if ! command -v tofu >/dev/null; then
	if [[ "$(id -u)" -eq 0 ]]; then
		bash "${ROOT}/scripts/install-opentofu.sh"
	else
		sudo bash "${ROOT}/scripts/install-opentofu.sh"
	fi
fi

export NATIVE_DB_HELM_VALUES_FILE="${VALUES_FILE}"
export NATIVE_DB_RUN_TERRAFORM_CONTRACT_PROOF=1

cd "${ROOT}"
go test ./pkg/databaselifecycle/... \
	-run TestPinnedLifecycleConfigMaterializesValidTerraformModules \
	-count=1 -timeout 5m -v
