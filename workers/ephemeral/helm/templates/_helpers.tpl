{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "sandbox_workers.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Kubernetes Service name for the in-chart OTLP metrics collector (keda.prometheusServerAddress "auto").
Used by prometheus.yaml and task-manager OTLP when "auto".
*/}}
{{- define "sandbox_workers.metricsCollectorK8sName" -}}
{{- $fullname := include "sandbox_workers.fullname" . }}
{{- printf "%s-metrics-collector" $fullname | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Kubernetes Service name for the in-chart Prometheus queried by KEDA when prometheusServerAddress is "auto".
*/}}
{{- define "sandbox_workers.kedaPrometheusK8sName" -}}
{{- $fullname := include "sandbox_workers.fullname" . }}
{{- printf "%s-prometheus" $fullname | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Cluster-local DNS + HTTP base (internal). Use autoOtelMetricsCollectorHttpUrl / autoPromQueryUrl for auto mode.
Pass dict keys: svc, namespace, port.
*/}}
{{- define "sandbox_workers.clusterLocalFQDN" -}}
{{- printf "%s.%s.svc.cluster.local" .svc .namespace }}
{{- end }}

{{- define "sandbox_workers.clusterLocalHTTPBaseURL" -}}
{{- printf "http://%s:%s" (include "sandbox_workers.clusterLocalFQDN" (dict "svc" .svc "namespace" .namespace)) .port }}
{{- end }}

{{/*
Public: full OTLP HTTP URL for task-managers when keda.prometheusServerAddress is "auto" (:4318).
Empty when not "auto".
*/}}
{{- define "sandbox_workers.autoOtelMetricsCollectorHttpUrl" -}}
{{- if eq (.Values.keda.prometheusServerAddress | default "") "auto" }}
{{- $svc := include "sandbox_workers.metricsCollectorK8sName" . }}
{{- include "sandbox_workers.clusterLocalHTTPBaseURL" (dict "svc" $svc "namespace" .Release.Namespace "port" "4318") }}
{{- end }}
{{- end }}

{{/*
Public: Prometheus HTTP API base (scheme + host + port) for in-chart KEDA/Prom when prometheusServerAddress is "auto" (:9090).
Empty when not "auto". Append /api/v1/write for remote-write, use as KEDA serverAddress as-is.
*/}}
{{- define "sandbox_workers.autoPromQueryUrl" -}}
{{- if eq (.Values.keda.prometheusServerAddress | default "") "auto" }}
{{- $svc := include "sandbox_workers.kedaPrometheusK8sName" . }}
{{- include "sandbox_workers.clusterLocalHTTPBaseURL" (dict "svc" $svc "namespace" .Release.Namespace "port" "9090") }}
{{- end }}
{{- end }}

{{- define "imagePullSecret" }}
{{- with .Values.image.credentials }}
{{- printf "{\"auths\":{\"%s\":{\"username\":\"%s\",\"password\":\"%s\",\"auth\":\"%s\"}}}" .registry .username .password (printf "%s:%s" .username .password | b64enc) | b64enc }}
{{- end }}
{{- end }}

{{/*
Common labels for all ephemeral worker resources
*/}}
{{- define "sandbox_workers.labels" -}}
app.kubernetes.io/name: sandbox-worker
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Worker labels for fleet-specific resources
*/}}
{{- define "sandbox.worker.labels" -}}
component: worker.sandbox
language: {{ .language }}
bucket: {{ .bucket }}
{{- end -}}

{{/*
Task manager pod labels
*/}}
{{- define "task-manager.labels" -}}
role: task-manager
{{- end -}}

{{/*
Sandbox pod labels
*/}}
{{- define "sandbox.labels" -}}
role: sandbox
{{- end -}}

{{/*
Sandbox container name based on language
*/}}
{{- define "sandbox.name" -}}
{{ .language }}-sandbox
{{- end -}}

{{/*
Convert a map to key=value,key2=value2 format for StringToString flags
*/}}
{{- define "mapToStringFlag" -}}
{{- $pairs := list -}}
{{- range $key, $value := . -}}
{{- $pairs = append $pairs (printf "%s=%s" $key $value) -}}
{{- end -}}
{{- join "," $pairs -}}
{{- end -}}
