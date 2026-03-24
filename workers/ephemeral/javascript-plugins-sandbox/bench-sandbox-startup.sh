#!/usr/bin/env bash
# Benchmark sandbox startup latency with different plugin configurations.
# Measures time from process start to "gRPC server running" log line.
#
# Usage:
#   ./bench-sandbox-startup.sh [iterations]   # default: 5
#
# Requires: node (via nvm), python3
set -euo pipefail

# Use nvm to get the right node version
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh" --no-use
fi

SANDBOX_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_PORT=50099
ITERATIONS=${1:-5}

# Switch to correct node version
cd "$SANDBOX_DIR"
nvm use 2>/dev/null || true
NODE_BIN="$(which node)"
echo "Using node: $NODE_BIN ($(node --version))"
cd - >/dev/null

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

benchmark_startup() {
  local label="$1"
  local plugins_env="$2"
  local times=()

  echo -e "\n${CYAN}=== $label ===${NC}"
  echo "  SUPERBLOCKS_WORKER_SANDBOX_WORKER_PLUGINS=${plugins_env:-<unset>}"
  echo "  Iterations: $ITERATIONS"
  echo ""

  for i in $(seq 1 "$ITERATIONS"); do
    # Kill anything on test port
    lsof -nP -tiTCP:"$TEST_PORT" -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 0.5

    local start_ns
    start_ns=$(python3 -c 'import time; print(int(time.time_ns()))')

    # Start sandbox in background, capture output
    local logfile
    logfile=$(mktemp)

    env -u ELECTRON_RUN_AS_NODE \
      SUPERBLOCKS_WORKER_SANDBOX_EXECUTOR_TRANSPORT_GRPC_PORT="$TEST_PORT" \
      SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_GRPC_PORT="$TEST_PORT" \
      SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_VARIABLE_STORE_ADDRESS="127.0.0.1:59999" \
      SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_VARIABLE_STORE_HTTP_ADDRESS="127.0.0.1:59998" \
      SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_STREAMING_PROXY_ADDRESS="127.0.0.1:59997" \
      SUPERBLOCKS_WORKER_SANDBOX_TRANSPORT_INTEGRATION_EXECUTOR_ADDRESS="" \
      SUPERBLOCKS_WORKER_SANDBOX_WORKER_PLUGINS="$plugins_env" \
      SUPERBLOCKS_AGENT_KEY="" \
      SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA="" \
      SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519="" \
      "$NODE_BIN" "$SANDBOX_DIR/dist/index.js" > "$logfile" 2>&1 &

    local pid=$!

    # Wait for "gRPC server running" (timeout 60s)
    local waited=0
    while ! grep -q "gRPC server running" "$logfile" 2>/dev/null; do
      sleep 0.1
      waited=$((waited + 1))
      if [ $waited -gt 600 ]; then
        echo "  Run $i: TIMEOUT (60s)"
        kill -9 "$pid" 2>/dev/null || true
        rm -f "$logfile"
        continue 2
      fi
    done

    local end_ns
    end_ns=$(python3 -c 'import time; print(int(time.time_ns()))')

    local elapsed_ms
    elapsed_ms=$(python3 -c "print(f'{($end_ns - $start_ns) / 1_000_000:.0f}')")

    times+=("$elapsed_ms")
    echo -e "  Run $i: ${GREEN}${elapsed_ms}ms${NC}"

    # Kill the sandbox
    kill -9 "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    rm -f "$logfile"
    sleep 0.5
  done

  # Compute stats
  if [ ${#times[@]} -gt 0 ]; then
    local times_csv
    times_csv=$(IFS=,; echo "${times[*]}")
    python3 -c "
import statistics
times = [$times_csv]
print(f'  ─────────────────────')
print(f'  Min:    {min(times):.0f}ms')
print(f'  Max:    {max(times):.0f}ms')
print(f'  Mean:   {statistics.mean(times):.0f}ms')
print(f'  Median: {statistics.median(times):.0f}ms')
if len(times) > 1:
    print(f'  StdDev: {statistics.stdev(times):.0f}ms')
"
  fi
}

echo -e "${YELLOW}Sandbox Startup Latency Benchmark${NC}"
echo "Sandbox dir: $SANDBOX_DIR"
echo "Test port: $TEST_PORT"
echo "Git branch: $(cd "$SANDBOX_DIR" && git branch --show-current 2>/dev/null || echo 'unknown')"
echo "Git commit: $(cd "$SANDBOX_DIR" && git log --oneline -1 2>/dev/null || echo 'unknown')"

# Test 1: All plugins (baseline - empty env means load all)
benchmark_startup "All plugins (baseline)" ""

# Test 2: JS sandbox plugins only
benchmark_startup "JS sandbox (javascript,javascriptwasm)" "javascript,javascriptwasm"

# Test 3: JS-API sandbox plugin only
benchmark_startup "JS-API sandbox (javascriptsdkapi)" "javascriptsdkapi"

# Test 4: Just language plugins (JS + WASM + SDKAPI)
benchmark_startup "Language plugins only (javascript,javascriptwasm,javascriptsdkapi)" "javascript,javascriptwasm,javascriptsdkapi"

# Cleanup
lsof -nP -tiTCP:"$TEST_PORT" -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null || true

echo -e "\n${YELLOW}Done!${NC}"
