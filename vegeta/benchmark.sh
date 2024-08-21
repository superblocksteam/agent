#!/bin/bash

# Define variables for command line arguments
request_file="$1"
javascript_config_file="$2"
report_file="$3"
duration_seconds="$4"
qps="$5"
mean_latency_threshold="$6"

# Execute the load test
vegeta attack -targets="$request_file" -body="$javascript_config_file" -rate="$qps" -duration="$duration_seconds" \
| vegeta report -type=json -output="$report_file"

cat "$report_file"

# Check for errors in the report
if [[ $(jq -r '.errors | length' "$report_file") -ne 0 ]]; then
  exit 1
fi

# Check for latency threshold
latency_90th_percentile=$(jq -r '.latencies."90th"' "$report_file")
latency_90th_percentile_ms=$(echo "$latency_90th_percentile / 1000 / 1000" | bc -l)

if (( $(echo "$latency_90th_percentile_ms > $mean_latency_threshold" | bc -l) )); then
    exit 1
fi