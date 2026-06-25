#!/usr/bin/env bash
set -euo pipefail

: "${TOFU_VERSION:=1.11.11}"
: "${TOFU_RELEASE_KEY_FPR:=E3E6E43D84CB852EADB0051D0C0AF313E5FD9F80}"
: "${TOFU_REPO_KEY_FPR:=F4AF70F66EAC4337EEECC97407D3DFCD4C61499F}"

apt-get update
apt-get install -y --no-install-recommends ca-certificates curl gnupg
rm -rf /var/lib/apt/lists/*

install -m 0755 -d /etc/apt/keyrings
tmpd="$(mktemp -d)"
chmod 700 "${tmpd}"
trap 'rm -rf "${tmpd}"' EXIT INT TERM

install_key() {
    url="$1"
    expected_fingerprint="$2"
    output="$3"

    gnupg_home="$(mktemp -d "${tmpd}/gpg.XXXXXX")"
    install -m 0700 -d "${gnupg_home}"

    key_file="${tmpd}/key-$(basename "${output}").asc"
    curl -fsSL --proto '=https' --tlsv1.2 "${url}" -o "${key_file}"
    gpg --no-default-keyring --homedir "${gnupg_home}" --no-tty --batch --import "${key_file}" 2>/dev/null

    fingerprint_list="$(gpg --no-default-keyring --homedir "${gnupg_home}" --list-keys --with-colons | awk -F: '/^fpr:/{print $10}')"
    echo "${fingerprint_list}" | grep -qx "${expected_fingerprint}" || \
        { echo "fingerprint ${expected_fingerprint} not present in ${url}" >&2; exit 1; }
    gpg --no-default-keyring --homedir "${gnupg_home}" --no-tty --batch --export "${expected_fingerprint}" > "${output}"

    rm -rf "${gnupg_home}"
}

install_key https://get.opentofu.org/opentofu.gpg "${TOFU_RELEASE_KEY_FPR}" /etc/apt/keyrings/opentofu.gpg
install_key https://packages.opentofu.org/opentofu/tofu/gpgkey "${TOFU_REPO_KEY_FPR}" /etc/apt/keyrings/opentofu-repo.gpg
chmod a+r /etc/apt/keyrings/opentofu.gpg /etc/apt/keyrings/opentofu-repo.gpg

echo "deb [signed-by=/etc/apt/keyrings/opentofu.gpg,/etc/apt/keyrings/opentofu-repo.gpg] https://packages.opentofu.org/opentofu/tofu/any/ any main" \
    > /etc/apt/sources.list.d/opentofu.list

apt-get update
apt-get install -y --no-install-recommends "tofu=${TOFU_VERSION}"
rm -rf /var/lib/apt/lists/*

tofu version
