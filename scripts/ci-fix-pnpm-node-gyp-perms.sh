#!/usr/bin/env bash
# Namespace.so's bundled pnpm cache can intermittently restore node-gyp's
# gyp_main.py without its execute bit, which breaks native module installs
# (deasync, node-expat) with:
#   /bin/sh: .../node-gyp/gyp/gyp_main.py: Permission denied
#
# This is a CI-cache-restore concern, not a build concern: run it once per job
# immediately after the pnpm cache is restored and before any `pnpm install`.
# The fixed-up node-gyp ships inside the pnpm CLI (not the project node_modules
# or the content-addressable store), so a single fixup persists for the job.
#
# Safe to run anywhere (incl. locally): it only ever adds an execute bit to a
# node-gyp entrypoint that is missing one, and is a no-op when nothing matches.
# Uses fast globs (no full-tree find) and avoids bash 4+ features so it also
# runs under macOS's bash 3.2.
set -euo pipefail
shopt -s nullglob

pnpm_home="${PNPM_HOME:-}"

# Known locations of pnpm's bundled node-gyp. Patterns cover pnpm/action-setup
# and standalone installs; single-level `*` wildcards keep this bash 3.2-safe.
# With nullglob, non-matching patterns expand to nothing, so `candidates` ends
# up holding only paths that actually exist.
candidates=()
if [[ -n "${pnpm_home}" ]]; then
	candidates+=(
		"${pnpm_home}"/../.pnpm/pnpm@*/node_modules/pnpm/dist/node_modules/node-gyp/gyp/gyp_main.py
		"${pnpm_home}"/.pnpm/pnpm@*/node_modules/pnpm/dist/node_modules/node-gyp/gyp/gyp_main.py
	)
fi
candidates+=(
	"${HOME}"/setup-pnpm/node_modules/.pnpm/pnpm@*/node_modules/pnpm/dist/node_modules/node-gyp/gyp/gyp_main.py
)

fixed=0
if [[ ${#candidates[@]} -gt 0 ]]; then
	for gyp in "${candidates[@]}"; do
		if [[ ! -x "${gyp}" ]]; then
			chmod +x "${gyp}"
			echo "ci-fix-pnpm-node-gyp-perms: restored execute bit on ${gyp}"
			fixed=$((fixed + 1))
		fi
	done
fi

if [[ "${fixed}" -eq 0 ]]; then
	echo "ci-fix-pnpm-node-gyp-perms: nothing to fix (PNPM_HOME=${pnpm_home:-unset})"
else
	echo "ci-fix-pnpm-node-gyp-perms: restored execute bit on ${fixed} file(s)"
fi
