#!/usr/bin/env bash
set -euo pipefail

# Install amazon-ecr-credential-helper (docker-credential-ecr-login) for OpenTofu
# OCI pulls from Amazon ECR. Version and per-arch SHA-256 digests are pinned;
# bumping the helper requires a deliberate source edit of both.

: "${ECR_LOGIN_VERSION:=0.12.0}"
: "${ECR_LOGIN_INSTALL_DIR:=/usr/local/bin}"

arch="${TARGETARCH:-}"
if [[ -z "${arch}" ]]; then
	case "$(uname -m)" in
	x86_64 | amd64) arch="amd64" ;;
	aarch64 | arm64) arch="arm64" ;;
	*)
		echo "unsupported architecture: $(uname -m)" >&2
		exit 1
		;;
	esac
fi

case "${arch}" in
amd64)
	expected_sha256="a22ab6d59dbac777b8fb31984709461da00a4c778b6ae14c8d3729e8d5ded1a6"
	;;
arm64)
	expected_sha256="5bdd30fb6c7a92462f5b454cce1aa906ca7926a6c2e39efad9613a7bf7661fac"
	;;
*)
	echo "unsupported TARGETARCH: ${arch}" >&2
	exit 1
	;;
esac

url="https://amazon-ecr-credential-helper-releases.s3.us-east-2.amazonaws.com/${ECR_LOGIN_VERSION}/linux-${arch}/docker-credential-ecr-login"

tmpd="$(mktemp -d)"
trap 'rm -rf "${tmpd}"' EXIT INT TERM

binary_path="${tmpd}/docker-credential-ecr-login"
curl -fsSL --proto '=https' --tlsv1.2 "${url}" -o "${binary_path}"

actual_sha256="$(sha256sum "${binary_path}" | awk '{print $1}')"
if [[ "${actual_sha256}" != "${expected_sha256}" ]]; then
	echo "checksum mismatch for ${url}: expected ${expected_sha256}, got ${actual_sha256}" >&2
	exit 1
fi

install -d "${ECR_LOGIN_INSTALL_DIR}"
install -m 0755 "${binary_path}" "${ECR_LOGIN_INSTALL_DIR}/docker-credential-ecr-login"
"${ECR_LOGIN_INSTALL_DIR}/docker-credential-ecr-login" -v
