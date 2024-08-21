#!/bin/sh

set -e

# single step JS, 50 QPS for 30s, expect e2e p90 < 100ms with no errors
./vegeta/benchmark.sh vegeta/execution-request.txt vegeta/single-step-javascript.json vegeta/test1.report.json 30s 50 100