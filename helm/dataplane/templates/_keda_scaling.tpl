{{/*
KEDA scalingModifiers helpers (keep in sync with workers/ephemeral/helm/templates/_keda_scaling.tpl).
*/}}

{{/*
KEDA redis-streams trigger name for scalingModifiers formulas (rs0, rs1, ...).
Expected dict keys: index (int)
*/}}
{{- define "sandbox_workers.kedaRedisStreamTriggerName" -}}
{{- printf "rs%d" (.index | int) -}}
{{- end -}}

{{/*
Build rs0 + rs1 + ... for scalingModifiers (sum of per-stream lag metrics).
Expected dict keys: streamCount (int, >= 1)
*/}}
{{- define "sandbox_workers.kedaRedisStreamLagSumExpr" -}}
{{- $count := .streamCount | int -}}
{{- if lt $count 1 -}}
{{- fail "sandbox_workers.kedaRedisStreamLagSumExpr: streamCount must be >= 1" -}}
{{- end -}}
{{- $parts := list -}}
{{- range $i := until $count -}}
{{- $parts = append $parts (include "sandbox_workers.kedaRedisStreamTriggerName" (dict "index" $i)) -}}
{{- end -}}
{{- join " + " $parts -}}
{{- end -}}

{{/*
True when ScaledObject should use scalingModifiers (multi-stream lag sum and/or additive prom/cron + redis).
Expected dict keys: triggerStreams (list), hasPrometheus (bool), hasCron (bool)
*/}}
{{- define "sandbox_workers.kedaUseScalingModifiers" -}}
{{- $streams := .triggerStreams | default list -}}
{{- $streamCount := len $streams -}}
{{- if lt $streamCount 1 -}}
{{- printf "false" -}}
{{- else if gt $streamCount 1 -}}
{{- printf "true" -}}
{{- else -}}
{{- if or .hasPrometheus .hasCron -}}
{{- printf "true" -}}
{{- else -}}
{{- printf "false" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Deprecated alias for sandbox_workers.kedaUseScalingModifiers.
*/}}
{{- define "sandbox_workers.kedaUseStreamLagSum" -}}
{{- include "sandbox_workers.kedaUseScalingModifiers" . -}}
{{- end -}}

{{/*
Redis lag target per replica for KEDA redis-streams scaling.
Defaults to fleet queue.executionPool; override with fleet.keda.lagCount.
Expected dict keys: fleetKeda (map), executionPool (int)
*/}}
{{- define "sandbox_workers.kedaLagCount" -}}
{{- $fleetKeda := .fleetKeda | default dict -}}
{{- if hasKey $fleetKeda "lagCount" -}}
{{- index $fleetKeda "lagCount" | toString -}}
{{- else -}}
{{- .executionPool | int | toString -}}
{{- end -}}
{{- end -}}

{{/*
True when triggers list contains a cron scaler (used for scalingModifiers formula).
Expected dict keys: triggers (list)
*/}}
{{- define "sandbox_workers.kedaHasCronTrigger" -}}
{{- $hasCron := false -}}
{{- range .triggers | default list -}}
{{- if eq .type "cron" -}}
{{- $hasCron = true -}}
{{- end -}}
{{- end -}}
{{- $hasCron -}}
{{- end -}}

{{/*
Prometheus query returning desired replica count (execution pool + degraded mode + warm buffer).
Expected dict keys: fleet, execPoolSize, minReplicas, extraWarm
*/}}
{{- define "sandbox_workers.kedaPrometheusQuery" -}}
ceil((sum(sandbox_execution_pool_in_use{fleet="{{ .fleet }}"}) or vector(0)) / {{ .execPoolSize }}) + (sum(worker_degraded_mode{fleet="{{ .fleet }}"}) or vector(0)) + {{ .minReplicas }} + ((sum(sandbox_execution_pool_in_use{fleet="{{ .fleet }}"}) or vector(0)) >bool {{ mul (.extraWarm | int) (.execPoolSize | int) }}) * {{ .extraWarm }}
{{- end -}}

{{/*
scalingModifiers.formula: max(prom, cron) + ceil(sum(stream lags) / lagCount).
Prometheus/cron set the execution-based floor; redis backlog adds on top.
Expected dict keys: streamCount, lagCount (string), hasPrometheus (bool), hasCron (bool)
Returns desired replica count; pair with metricType AverageValue and target "1".
*/}}
{{- define "sandbox_workers.kedaScalingModifiersFormula" -}}
{{- $lagSum := include "sandbox_workers.kedaRedisStreamLagSumExpr" (dict "streamCount" (.streamCount | int)) -}}
{{- $lagCount := .lagCount | default "10" -}}
{{- $backlog := printf "ceil((%s) / %s.0)" $lagSum $lagCount -}}
{{- $baseTerms := list -}}
{{- if .hasPrometheus -}}
{{- $baseTerms = append $baseTerms "float(prom)" -}}
{{- end -}}
{{- if .hasCron -}}
{{- $baseTerms = append $baseTerms "float(cron)" -}}
{{- end -}}
{{- if eq (len $baseTerms) 0 -}}
{{- $backlog -}}
{{- else if eq (len $baseTerms) 1 -}}
{{- printf "%s + %s" (index $baseTerms 0) $backlog -}}
{{- else -}}
{{- printf "max([%s]) + %s" (join ", " $baseTerms) $backlog -}}
{{- end -}}
{{- end -}}
