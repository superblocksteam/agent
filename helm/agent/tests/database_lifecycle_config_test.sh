#!/usr/bin/env bash
# Wrapper for CI: run the OPA Helm lifecycle config contract test.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "${ROOT}"
go test ./helm/agent/tests/... -count=1 -v
