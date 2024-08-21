#!/bin/sh

set -e

# a parallel block with 2 simple postgres steps, 25 QPS for 30s, expect e2e p90 < 1000ms with no errors
./vegeta/benchmark.sh vegeta/execution-request.txt vegeta/parellel-block.json vegeta/test5.report.json 30s 25 1000