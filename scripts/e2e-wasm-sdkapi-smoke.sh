#!/usr/bin/env bash
# Smoke test for WASM SDK API worker execution via v3/execute.
#
# Validates that the orchestrator can dispatch SDK API code-mode requests
# to the javascriptsdkapiwasm worker plugin and receive correct output.
#
# Uses the same auth JWT and test fixtures as the Postman-based e2e tests.
#
# Usage: ./scripts/e2e-wasm-sdkapi-smoke.sh [orchestrator_url]

set -euo pipefail

ORCH_URL="${1:-http://127.0.0.1:8080}"

# Read JWT from the CI Postman environment (same token the other e2e tests use).
POSTMAN_ENV="${POSTMAN_ENV:-ci-ephemeral}"
ENV_FILE="postman/environments/${POSTMAN_ENV}.json"
if [ -f "$ENV_FILE" ]; then
  JWT=$(python3 -c "import json; d=json.load(open('$ENV_FILE')); print(next(v['value'] for v in d['values'] if v['key']=='superblocks_jwt'))" 2>/dev/null || echo "")
else
  JWT="${SUPERBLOCKS_JWT:-}"
fi

if [ -z "$JWT" ]; then
  echo "SKIP: No JWT available (set SUPERBLOCKS_JWT or provide postman env)"
  exit 0
fi

echo "=== WASM SDK API Smoke Test ==="
echo "Orchestrator: ${ORCH_URL}"

echo ""
echo "--- Test: v3/execute basic execution ---"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ORCH_URL}/v3/execute" \
  -H "Content-Type: application/json" \
  -H "X-Superblocks-Authorization: Bearer ${JWT}" \
  -d '{
    "applicationId": "00000000-0000-0000-0000-000000000003",
    "inputs": {"orderId": "30000"},
    "viewMode": "editor",
    "entryPoint": "server/apis/GetOrderById/api.ts",
    "profile": {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "default",
      "key": "default"
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: Expected HTTP 200, got ${HTTP_CODE}"
  echo "Body: ${BODY}"
  exit 1
fi

echo "OK: HTTP ${HTTP_CODE}"

# Verify response has output.result
if echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); assert d.get('output',{}).get('result') is not None" 2>/dev/null; then
  echo "OK: Response has output.result"
else
  echo "FAIL: Response missing output.result"
  echo "Body: ${BODY}"
  exit 1
fi

# Verify no execution errors
if echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); errors=d.get('errors',[]); assert len(errors)==0, f'Got {len(errors)} errors: {errors}'" 2>/dev/null; then
  echo "OK: No execution errors"
else
  echo "FAIL: Execution errors present"
  echo "Body: ${BODY}"
  exit 1
fi

echo ""
echo "=== All WASM SDK API smoke tests passed ==="
