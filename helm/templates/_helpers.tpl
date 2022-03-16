{{/*
Expand the name of the chart.
*/}}
{{- define "superblocks-agent.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "superblocks-agent.fullname" -}}
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
Create chart name and version as used by the chart label.
*/}}
{{- define "superblocks-agent.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "superblocks-agent.labels" -}}
helm.sh/chart: {{ include "superblocks-agent.chart" . }}
{{ include "superblocks-agent.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "superblocks-agent.selectorLabels" -}}
app.kubernetes.io/name: {{ include "superblocks-agent.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Calculate heap size
*/}}
{{- define "superblocks-agent.heapSize" -}}
{{- if hasSuffix "Mi" . -}}
{{- $memoryLimit := trimSuffix "Mi" . -}}
{{ div $memoryLimit 2 }}
{{- end }}
{{- if hasSuffix "Gi" . -}}
{{- $memoryLimit := mul (trimSuffix "Gi" .) 1024 -}}
{{ div $memoryLimit 2 }}
{{- end }}
{{- end }}
