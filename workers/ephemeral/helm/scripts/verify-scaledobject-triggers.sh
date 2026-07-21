#!/usr/bin/env bash
# Verify ScaledObject trigger rendering for default / replace / merge modes.
set -euo pipefail

chart_dir="$(cd "$(dirname "$0")/.." && pwd)"
values_file="${chart_dir}/test-values/triggers-scenarios.yaml"

extract_triggers() {
  local object_name="$1"
  awk -v object="${object_name}" '
    $0 ~ "name: " object "$" { in_obj=1 }
    in_obj && /^  triggers:/ { in_trig=1; next }
    in_trig && /^  [a-z]/ && !/^    / { exit }
    in_trig { print }
    in_obj && /^---$/ { exit }
  '
}

extract_advanced() {
  local object_name="$1"
  awk -v object="${object_name}" '
    $0 ~ "name: " object "$" { in_obj=1 }
    in_obj && /^  advanced:/ { in_adv=1; next }
    in_adv && /^  [a-z]/ && !/^    / { exit }
    in_adv { print }
    in_obj && /^---$/ { exit }
  '
}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

pass() {
  echo "PASS: $*"
}

echo "Rendering ScaledObjects from ${values_file}..."
out="$(helm template verify "${chart_dir}" -f "${values_file}" -s templates/scaledobject.yaml)"

# --- default-only ---
trig="$(extract_triggers "verify-sandbox_workers-default-only" <<<"${out}")"
adv="$(extract_advanced "verify-sandbox_workers-default-only" <<<"${out}")"
echo ""
echo "=== default-only triggers ==="
echo "${trig}"
echo ""
echo "=== default-only advanced ==="
echo "${adv}"

echo "${trig}" | grep -q 'type: redis-streams' || fail "default-only: missing redis-streams"
echo "${trig}" | grep -q 'name: rs0' || fail "default-only: redis trigger should be named rs0"
echo "${trig}" | grep -q 'type: prometheus' || fail "default-only: missing prometheus"
echo "${trig}" | grep -q 'name: prom' || fail "default-only: prometheus trigger should be named prom"
echo "${trig}" | grep -q 'lagCount:' && fail "default-only: per-stream lagCount should be omitted when using scalingModifiers"
echo "${trig}" | grep -q 'custom-redis' && fail "default-only: should not contain custom trigger"
echo "${trig}" | grep -q 'type: cron' && fail "default-only: should not contain cron"
echo "${adv}" | grep -q 'scalingModifiers:' || fail "default-only: prom+redis should use scalingModifiers"
echo "${adv}" | grep -qF 'float(prom) + ceil((rs0) / 100.0)' || fail "default-only: formula should add redis backlog to prom"
pass "default-only renders additive prom + redis scalingModifiers"

# --- default-buckets (omitted buckets -> BA, matching task-manager main.go default) ---
trig="$(extract_triggers "verify-sandbox_workers-default-buckets" <<<"${out}")"
echo ""
echo "=== default-buckets triggers ==="
echo "${trig}"

echo "${trig}" | grep -q 'type: redis-streams' || fail "default-buckets: missing redis-streams when buckets omitted"
echo "${trig}" | grep -q 'stream: agent.main.bucket.BA.plugin.javascript.event.execute' || fail "default-buckets: should default execute stream to bucket BA"
pass "default-buckets defaults omitted buckets to BA for KEDA redis-streams"

# --- custom-replace ---
trig="$(extract_triggers "verify-sandbox_workers-custom-replace" <<<"${out}")"
adv="$(extract_advanced "verify-sandbox_workers-custom-replace" <<<"${out}")"
echo ""
echo "=== custom-replace triggers ==="
echo "${trig}"
echo ""
echo "=== custom-replace advanced ==="
echo "${adv}"

echo "${trig}" | grep -q 'custom-redis:6379' || fail "custom-replace: missing custom redis trigger"
echo "${trig}" | grep -q 'custom.stream' || fail "custom-replace: missing custom stream"
echo "${trig}" | grep -q 'host: redis.test.svc' && fail "custom-replace: should not contain generated redis host"
echo "${trig}" | grep -q 'type: prometheus' && fail "custom-replace: should not contain prometheus"
echo "${adv}" | grep -q 'scalingModifiers:' && fail "custom-replace: must not use scalingModifiers without generated rs triggers"
pass "custom-replace renders custom triggers only"

# --- custom-replace-multi-stream ---
trig="$(extract_triggers "verify-sandbox_workers-custom-replace-multi-stream" <<<"${out}")"
adv="$(extract_advanced "verify-sandbox_workers-custom-replace-multi-stream" <<<"${out}")"
echo ""
echo "=== custom-replace-multi-stream triggers ==="
echo "${trig}"
echo ""
echo "=== custom-replace-multi-stream advanced ==="
echo "${adv}"

echo "${trig}" | grep -q 'custom-redis:6379' || fail "custom-replace-multi-stream: missing custom redis trigger"
echo "${trig}" | grep -q 'name: rs' && fail "custom-replace-multi-stream: must not emit rs trigger names"
echo "${adv}" | grep -q 'scalingModifiers:' && fail "custom-replace-multi-stream: must not use scalingModifiers when triggers replace generated redis"
pass "custom-replace-multi-stream omits scalingModifiers despite multiple generated stream keys"

# --- custom-merge ---
trig="$(extract_triggers "verify-sandbox_workers-custom-merge" <<<"${out}")"
adv="$(extract_advanced "verify-sandbox_workers-custom-merge" <<<"${out}")"
echo ""
echo "=== custom-merge triggers ==="
echo "${trig}"
echo ""
echo "=== custom-merge advanced ==="
echo "${adv}"

echo "${trig}" | grep -q 'type: cron' || fail "custom-merge: missing cron trigger"
echo "${trig}" | grep -q 'name: cron' || fail "custom-merge: cron trigger should be named cron"
echo "${trig}" | grep -q 'desiredReplicas: "10"' || fail "custom-merge: missing desiredReplicas"
echo "${trig}" | grep -q 'type: redis-streams' || fail "custom-merge: missing generated redis-streams"
echo "${trig}" | grep -q 'name: rs0' || fail "custom-merge: redis trigger should be named rs0"
echo "${trig}" | grep -q 'host: redis.test.svc' || fail "custom-merge: missing generated redis host"
echo "${trig}" | grep -q 'lagCount:' && fail "custom-merge: per-stream lagCount should be omitted when using scalingModifiers"
echo "${trig}" | grep -q 'type: prometheus' || fail "custom-merge: missing prometheus"
echo "${trig}" | grep -qF '>bool 18) * 9' || fail "custom-merge: extraWarm should gate on in_use > extraWarm*executionPool"
echo "${trig}" | grep -qF ') + 1 +' || fail "custom-merge: prometheus query should include minReplicaCount base"
echo "${trig}" | grep -qF 'worker_degraded_mode{fleet=' || fail "custom-merge: prometheus query should include worker_degraded_mode"
grep -E '\) \+ 10$' <<<"${trig}" && fail "custom-merge: prometheus must not add warm buffer unconditionally"
echo "${adv}" | grep -qF 'max([float(prom), float(cron)]) + ceil((rs0) / 2.0)' || fail "custom-merge: formula should add redis backlog to max(prom, cron)"
pass "custom-merge renders additive cron + prom + redis scalingModifiers"

# --- multi-stream-sum ---
trig="$(extract_triggers "verify-sandbox_workers-multi-stream-sum" <<<"${out}")"
adv="$(extract_advanced "verify-sandbox_workers-multi-stream-sum" <<<"${out}")"
echo ""
echo "=== multi-stream-sum triggers ==="
echo "${trig}"
echo ""
echo "=== multi-stream-sum advanced ==="
echo "${adv}"

echo "${adv}" | grep -q 'scalingModifiers:' || fail "multi-stream-sum: missing scalingModifiers"
echo "${adv}" | grep -qF 'rs0 + rs1 + rs2' || fail "multi-stream-sum: formula must sum stream triggers"
echo "${adv}" | grep -qF 'max([float(prom), float(cron)]) + ceil((rs0 + rs1 + rs2) / 2.0)' || fail "multi-stream-sum: formula should add redis backlog to max(prom, cron)"
echo "${adv}" | grep -q 'activationTarget: "2"' || fail "multi-stream-sum: missing activationTarget"
echo "${trig}" | grep -q 'stream: agent.main.bucket.BE.plugin.javascriptwasm.event.execute' || fail "multi-stream-sum: missing BE execute stream"
echo "${trig}" | grep -q 'stream: agent.main.bucket.BA.plugin.javascriptwasm.event.metadata' || fail "multi-stream-sum: missing BA metadata stream"
echo "${trig}" | grep -q 'name: rs1' || fail "multi-stream-sum: missing rs1 trigger name"
echo "${trig}" | grep -q 'name: rs2' || fail "multi-stream-sum: missing rs2 trigger name"
echo "${trig}" | grep -q 'name: prom' || fail "multi-stream-sum: missing prom trigger name"
echo "${trig}" | grep -q 'name: cron' || fail "multi-stream-sum: missing cron trigger name"
echo "${trig}" | grep -q 'lagCount:' && fail "multi-stream-sum: per-stream lagCount should be omitted when using scalingModifiers"
pass "multi-stream-sum aggregates stream lags additively via scalingModifiers"

# --- streams-override ---
trig="$(extract_triggers "verify-sandbox_workers-streams-override" <<<"${out}")"
echo ""
echo "=== streams-override triggers ==="
echo "${trig}"

echo "${trig}" | grep -q 'stream: agent.main.bucket.BA.ephemeral.plugin.python.event.execute' || fail "streams-override: missing BA stream"
echo "${trig}" | grep -q 'stream: agent.main.bucket.BE.ephemeral.plugin.python.event.execute' || fail "streams-override: missing BE stream"
echo "${trig}" | grep -q 'name: rs0' || fail "streams-override: missing rs0 trigger name"
echo "${trig}" | grep -q 'name: rs1' || fail "streams-override: missing rs1 trigger name"
echo "${trig}" | grep -q 'plugin.javascript' && fail "streams-override: should not contain generated javascript streams"
pass "streams-override uses explicit fleet.streams for KEDA redis-streams"

echo ""
echo "All ScaledObject trigger scenarios passed."
