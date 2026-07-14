#!/usr/bin/env bash
# Emit Helm arguments for EE native DB lifecycle correlation tags.
# Consumed by superblocks deploy-job.yml for ephemeral OPA deployments.

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
	echo "ephemeral-database-lifecycle-helm-args: jq is required but not found in PATH" >&2
	exit 1
fi

usage() {
	cat <<'EOF'
Usage: ephemeral-database-lifecycle-helm-args.sh <ee-namespace>

Arguments:
  ee-namespace   Superblocks namespace for the EE (for example, pr-1234)

Output (one token per line; consume with mapfile):
  --set-json
  databaseLifecycle.physicalModuleTags=<JSON>
EOF
}

ephemeral_database_lifecycle_helm_args() {
	local ee_namespace="${1:-}"
	if [[ -z "${ee_namespace}" ]]; then
		echo "ephemeral-database-lifecycle-helm-args: no ee_namespace provided; skipping lifecycle Helm args" >&2
		return 0
	fi
	if [[ ! "${ee_namespace}" =~ ^pr-[0-9]+$ ]]; then
		echo "ephemeral-database-lifecycle-helm-args: invalid ee_namespace: ${ee_namespace}" >&2
		return 1
	fi

	local tags_json
	tags_json="$(jq -nc --arg ee "${ee_namespace}" \
		'{"superblocks.com/component":"native-database","superblocks.com/ephemeral-environment":$ee}')"

	printf '%s\n' \
		"--set-json" \
		"databaseLifecycle.physicalModuleTags=${tags_json}"
}

main() {
	case "${1:-}" in
	-h | --help)
		usage
		;;
	*)
		# Empty/missing namespaces skip with stderr only so mapfile consumers
		# never pass usage text to Helm.
		ephemeral_database_lifecycle_helm_args "${1:-}"
		;;
	esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
	main "$@"
fi
