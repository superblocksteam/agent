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
{{- if hasPrefix .Release.Name $name }}
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
Parse multiple extraEnvs
*/}}
{{- define "extra-env" -}}
{{- range $key, $val := . }}
{{- if kindIs "map" $val }}
- name: {{ $key }}
  {{- toYaml $val | nindent 2 }}
{{- else }}
- name: {{ $key }}
  value: {{ default "" $val | quote }}
{{- end}}
{{- end }}
{{- end }}

{{/*
Agent key
*/}}
{{- define "superblocks-agent.key" -}}
{{- if not .Values.superblocks.agentKeyExistingSecret }}
- secretRef:
    name: {{ include "superblocks-agent.fullname" . }}
{{- else }}
- secretRef:
    name: {{ .Values.superblocks.agentKeyExistingSecret }}
{{- end }}
{{- end -}}

{{/*
Check data domain
*/}}
{{- define "verify.datadomain" -}}
{{- if not (or (eq .Values.superblocks.agentDataDomain "app.superblocks.com") (eq .Values.superblocks.agentDataDomain "eu.superblocks.com")) }}
{{- fail "superblocks.agentDataDomain must be set to app.superblocks.com or eu.superblocks.com" }}}
{{- end }}
{{- end -}}
