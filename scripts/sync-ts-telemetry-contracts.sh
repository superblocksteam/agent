#!/usr/bin/env bash
#
# Regenerates golden JSON contract files from the TypeScript telemetry source.
# Usage: ./scripts/sync-ts-telemetry-contracts.sh [path-to-monorepo]
#
# Default monorepo path: ../superblocks (sibling directory)
# The script extracts shared constants (forbidden attributes, secret fields, etc.)
# and writes them to pkg/telemetry/contracts/*.json for Go tests to embed.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS_DIR="$REPO_ROOT/pkg/telemetry/contracts"

MONOREPO="${1:-$(cd "$REPO_ROOT/.." && pwd)/superblocks}"
TS_TELEMETRY="$MONOREPO/packages/telemetry/src"

if [[ ! -d "$TS_TELEMETRY" ]]; then
  echo "error: TypeScript telemetry package not found at $TS_TELEMETRY"
  echo "usage: $0 [path-to-monorepo]"
  exit 1
fi

TIER2="$TS_TELEMETRY/common/contracts/tier2-traces.ts"
SANITIZER="$TS_TELEMETRY/common/log-sanitizer.ts"

for f in "$TIER2" "$SANITIZER"; do
  if [[ ! -f "$f" ]]; then
    echo "error: expected file not found: $f"
    exit 1
  fi
done

mkdir -p "$CONTRACTS_DIR"

# --- tier2-traces.json ---
# Extract FORBIDDEN_TIER_2_SPAN_ATTRIBUTES array
forbidden=$(sed -n '/FORBIDDEN_TIER_2_SPAN_ATTRIBUTES.*\[/,/\]/p' "$TIER2" \
  | grep -o '"[^"]*"' \
  | tr -d '"' \
  | sort)

# Extract DROPPED_HIGH_CARDINALITY_ATTRIBUTES array (single-line declaration)
dropped=$(grep 'DROPPED_HIGH_CARDINALITY_ATTRIBUTES.*\[' "$TIER2" \
  | head -1 \
  | grep -o '"[^"]*"' \
  | tr -d '"' \
  | sort)

# Build JSON
{
  echo '{'
  echo '  "_source": "packages/telemetry/src/common/contracts/tier2-traces.ts",'
  echo '  "_sync": "Run scripts/sync-ts-telemetry-contracts.sh to regenerate from TS source.",'
  echo '  "forbidden_span_attributes": ['
  first=true
  while IFS= read -r attr; do
    [[ -z "$attr" ]] && continue
    $first || echo ','
    printf '    "%s"' "$attr"
    first=false
  done <<< "$forbidden"
  echo ''
  echo '  ],'
  echo '  "dropped_high_cardinality_attributes": ['
  first=true
  while IFS= read -r attr; do
    [[ -z "$attr" ]] && continue
    $first || echo ','
    printf '    "%s"' "$attr"
    first=false
  done <<< "$dropped"
  echo ''
  echo '  ]'
  echo '}'
} > "$CONTRACTS_DIR/tier2-traces.json"

# --- secret-fields.json ---
# Extract SECRET_FIELDS set members
fields=$(sed -n '/SECRET_FIELDS.*=.*new Set/,/\]/p' "$SANITIZER" \
  | grep -o '"[^"]*"' \
  | tr -d '"' \
  | sort)

# Extract SECRET_FIELD_PATTERNS regexes (convert JS regex to Go-compatible)
patterns=$(sed -n '/SECRET_FIELD_PATTERNS.*RegExp\[\].*=/,/\];/p' "$SANITIZER" \
  | grep -oE '/[^/]+/i?' \
  | sed 's|^/||; s|/i$||; s|/$$||' \
  | sed 's|^|(?i)|')

{
  echo '{'
  echo '  "_source": "packages/telemetry/src/common/log-sanitizer.ts",'
  echo '  "_sync": "Run scripts/sync-ts-telemetry-contracts.sh to regenerate from TS source.",'
  echo '  "exact": ['
  first=true
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    $first || echo ','
    printf '    "%s"' "$f"
    first=false
  done <<< "$fields"
  echo ''
  echo '  ],'
  echo '  "patterns": ['
  first=true
  while IFS= read -r p; do
    [[ -z "$p" ]] && continue
    $first || echo ','
    printf '    "%s"' "$p"
    first=false
  done <<< "$patterns"
  echo ''
  echo '  ]'
  echo '}'
} > "$CONTRACTS_DIR/secret-fields.json"

echo "Contracts updated:"
echo "  $CONTRACTS_DIR/tier2-traces.json ($(echo "$forbidden" | grep -c .) forbidden, $(echo "$dropped" | grep -c .) dropped)"
echo "  $CONTRACTS_DIR/secret-fields.json ($(echo "$fields" | grep -c .) fields, $(echo "$patterns" | grep -c .) patterns)"
echo ""
echo "NOTE: sanitizer-vectors.json is maintained manually -- update test vectors when patterns change."
