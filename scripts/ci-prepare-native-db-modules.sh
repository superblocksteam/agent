#!/usr/bin/env bash
# Prepare build/native-db-modules for Docker COPY in CI and local image builds.
# Resolves the floating `latest` git channel at build time (no checked-in pin).
# Clones over SSH (NATIVE_DB_MODULES_DEPLOY_KEY) and packages modules/.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fetch_script="${repo_root}/scripts/fetch-native-db-modules.sh"
output_dir="${repo_root}/build/native-db-modules"
channel="${NATIVE_DB_MODULES_TAG:-latest}"

clone_dir="$(mktemp -d)"
cleanup() {
  rm -rf "${clone_dir}"
}
trap cleanup EXIT

repository_url="${NATIVE_DB_TERRAFORM_MODULE_REPOSITORY:-ssh://git@github.com/superblocksteam/terraform-superblocks-databases.git}"
if [[ "${repository_url}" == git@github.com:* || "${repository_url}" == ssh://git@github.com/* ]]; then
  mkdir -p "${HOME}/.ssh"
  chmod 0700 "${HOME}/.ssh"
  # Pin GitHub host keys instead of ssh-keyscan TOFU.
  # Source: https://api.github.com/meta (ssh_keys) / GitHub SSH key fingerprints docs.
  cat >>"${HOME}/.ssh/known_hosts" <<'EOF'
github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl
github.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=
EOF
fi
git clone --filter=blob:none --no-checkout "${repository_url}" "${clone_dir}"
git -C "${clone_dir}" fetch --depth 1 origin "refs/tags/${channel}:refs/tags/${channel}"
git -C "${clone_dir}" checkout --force "tags/${channel}"

bash "${fetch_script}" --from-git "${clone_dir}" --ref "${channel}" --output "${output_dir}"
