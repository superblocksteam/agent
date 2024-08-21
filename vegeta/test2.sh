#!/bin/sh

set -e

# single step Postgres, 50 QPS for 30s, expect e2e p90 < 100ms with no errors
./vegeta/benchmark.sh vegeta/execution-request.txt vegeta/single-step-postgres.json vegeta/test3.report.json 30s 50 100