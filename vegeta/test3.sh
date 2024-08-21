#!/bin/sh

set -e

# a dummy conditional block with binding, 50 QPS for 30s, expect e2e p90 < 100ms with no errors
./vegeta/benchmark.sh vegeta/execution-request.txt vegeta/binding-block.json vegeta/test4.report.json 30s 50 100