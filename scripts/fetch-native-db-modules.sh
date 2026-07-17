#!/usr/bin/env bash
# Fetch the Native DB Terraform module package into a build directory for Docker
# COPY. Resolves the floating `latest` channel at fetch time — nothing is pinned
# in orchestrator source. Package modules/ from a local terraform-superblocks-databases
# checkout (CI clones the git `latest` tag first via ci-prepare-native-db-modules.sh).
#
# Examples:
#   ./scripts/fetch-native-db-modules.sh --from-git ../terraform-superblocks-databases
#   ./scripts/fetch-native-db-modules.sh --from-git ../terraform-superblocks-databases --ref latest --output build/native-db-modules

set -euo pipefail

default_channel="latest"

usage() {
  cat <<'EOF'
Usage:
  fetch-native-db-modules.sh --from-git <checkout> [--ref REF] [--output DIR]

Fetch the Native DB module package into DIR (default: <repo>/build/native-db-modules)
for image builds. The default channel is the floating `latest` git tag — no version
pin is checked into orchestrator.

--from-git  Package modules/ from a local checkout at REF (default: latest)

Environment:
  NATIVE_DB_MODULES_TAG  Default git ref (default: latest)
EOF
}

repo_root="${REPO_ROOT:-}"
if [[ -z "${repo_root}" ]]; then
  repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi
output_dir="${repo_root}/build/native-db-modules"
source_repo=""
channel="${NATIVE_DB_MODULES_TAG:-${default_channel}}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help | -h)
      usage
      exit 0
      ;;
    --from-git)
      source_repo="${2:?--from-git requires a checkout path}"
      shift 2
      ;;
    --tag | --ref)
      channel="${2:?$1 requires a value}"
      shift 2
      ;;
    --output)
      output_dir="${2:?--output requires a directory}"
      shift 2
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "${source_repo}" ]]; then
  usage >&2
  exit 2
fi

if [[ -z "${channel}" ]]; then
  echo "Native DB module channel/tag must not be empty" >&2
  exit 2
fi

# Modules required for default logical + physical lifecycle sources (and the
# logical module's sibling core dependency). Keep alphabetically sorted.
required_modules=(
  aws-aurora-managed-cluster
  aws-rds-managed-instance
  postgres-managed-database
  postgres-managed-database-core
)

write_sidecars() {
  local target="$1"
  local version="$2"
  local commit="$3"
  printf '%s\n' "${version}" >"${target}/VERSION"
  printf '%s\n' "${commit}" >"${target}/COMMIT"
}

reset_output() {
  rm -rf "${output_dir}"
  mkdir -p "${output_dir}"
}

require_unpacked_modules() {
  local module
  for module in "${required_modules[@]}"; do
    if [[ ! -d "${output_dir}/modules/${module}" ]]; then
      echo "Native DB module package is missing modules/${module}" >&2
      exit 1
    fi
  done
}

require_git_modules() {
  local module
  for module in "${required_modules[@]}"; do
    if ! git -C "${source_repo}" cat-file -e "${channel}:modules/${module}/main.tf" 2>/dev/null; then
      echo "git ref ${channel} is missing modules/${module}/main.tf" >&2
      exit 1
    fi
  done
}

if [[ ! -d "${source_repo}/.git" && ! -f "${source_repo}/.git" ]]; then
  echo "Native DB module checkout is not a git repository: ${source_repo}" >&2
  exit 1
fi
if ! git -C "${source_repo}" cat-file -e "${channel}^{commit}" 2>/dev/null; then
  echo "Native DB module ref ${channel} is unavailable in ${source_repo}" >&2
  exit 1
fi
actual_commit="$(git -C "${source_repo}" rev-parse "${channel}^{commit}")"
require_git_modules

work_dir="$(mktemp -d)"
trap 'rm -rf "${work_dir}"' EXIT
package="${work_dir}/native-db-modules.zip"
git -C "${source_repo}" archive --format=zip --output="${package}" "${channel}" modules

reset_output
unzip -q "${package}" -d "${output_dir}"
require_unpacked_modules
write_sidecars "${output_dir}" "${channel}" "${actual_commit}"
