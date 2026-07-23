#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

mkdir -p "${tmp}/bin"

cat >"${tmp}/bin/go" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >"${TEST_GO_LOG}"
printf 'run=%s\nvalues=%s\nrepository=%s\nref=%s\nroot=%s\n' \
	"${NATIVE_DB_RUN_TERRAFORM_CONTRACT_PROOF:-}" \
	"${NATIVE_DB_HELM_VALUES_FILE:-}" \
	"${NATIVE_DB_TERRAFORM_MODULE_REPOSITORY:-}" \
	"${NATIVE_DB_TERRAFORM_MODULE_REF:-}" \
	"${NATIVE_DB_TERRAFORM_MODULE_ROOT:-}" \
	>"${TEST_GO_ENV_LOG}"
EOF

cat >"${tmp}/bin/tofu" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

cat >"${tmp}/bin/helm" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

chmod +x "${tmp}/bin/go" "${tmp}/bin/helm" "${tmp}/bin/tofu"

export PATH="${tmp}/bin:${PATH}"
export TEST_GO_ENV_LOG="${tmp}/go-env.log"
export TEST_GO_LOG="${tmp}/go.log"

"${root}/scripts/run-database-lifecycle-contract-proof.sh"

grep -Fq "test ./pkg/databaselifecycle/..." "${TEST_GO_LOG}"
# Prefer the TestPinned prefix so every pinned lifecycle contract proof is selected,
# including TestPinnedIAMModuleAcceptsV1DescriptorRetirement.
grep -Fq -- "-run TestPinned|" "${TEST_GO_LOG}"
grep -Fq "TestWorkerIAMReadyContractFromRealOpenTofu" "${TEST_GO_LOG}"
grep -Fq "run=1" "${TEST_GO_ENV_LOG}"
grep -Fq "values=${root}/helm/agent/values.yaml" "${TEST_GO_ENV_LOG}"

custom_values="${tmp}/custom-values.yaml"
custom_root="${tmp}/user-checkout"
export NATIVE_DB_HELM_VALUES_FILE="${custom_values}"
export NATIVE_DB_TERRAFORM_MODULE_REPOSITORY="git@github.com:example/custom.git"
export NATIVE_DB_TERRAFORM_MODULE_REF="v9.9.9-test"
export NATIVE_DB_TERRAFORM_MODULE_ROOT="${custom_root}"

"${root}/scripts/run-database-lifecycle-contract-proof.sh"

grep -Fq "values=${custom_values}" "${TEST_GO_ENV_LOG}"
grep -Fq "repository=git@github.com:example/custom.git" "${TEST_GO_ENV_LOG}"
grep -Fq "ref=v9.9.9-test" "${TEST_GO_ENV_LOG}"
grep -Fq "root=${custom_root}" "${TEST_GO_ENV_LOG}"
