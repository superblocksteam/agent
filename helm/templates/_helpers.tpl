{{/*
Expand the name of the chart.
*/}}
{{- define "superblocks-agent.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Define the name of the controller.
*/}}
{{- define "superblocks-agent.controller.name" -}}
{{- printf "%s-controller" (default .Chart.Name .Values.nameOverride) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Define the name of the worker.
*/}}
{{- define "superblocks-agent.worker.name" -}}
{{- printf "%s-worker" (default .Chart.Name .Values.nameOverride) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Define the name of a worker fleet.
*/}}
{{- define "superblocks-agent.worker.fleet.name" -}}
{{- printf "%s-%s" (include "superblocks-agent.worker.name" .Global) .fleet | trunc 63 | trimSuffix "-" }}
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
Worker labels
*/}}
{{- define "superblocks-agent.worker.labels" -}}
component: worker
fleet: {{ . }}
{{- end -}}

{{/*
Controller labels
*/}}
{{- define "superblocks-agent.controller.labels" -}}
component: controller
{{- end -}}

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

{{/*
Generate certificates for controller <-> worker communication
*/}}
{{- define "superblocks-agent.worker.tls" -}}
{{- $ca := genCA "root" 365 -}}
{{- $cert := genSignedCert "client" nil nil 365 $ca -}}
tls.crt: {{ $cert.Cert | b64enc }}
tls.key: {{ $cert.Key | b64enc }}
tls.ca: {{ $ca.Cert | b64enc }}
{{- end -}}

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
