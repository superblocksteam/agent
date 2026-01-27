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
Expand the name of the chart.
*/}}
{{- define "orchestrator.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "orchestrator.fullname" -}}
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
Common labels for all ephemeral worker resources
*/}}
{{- define "ephemeral_worker.labels" -}}
app.kubernetes.io/name: ephemeral-worker
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Worker labels for fleet-specific resources
*/}}
{{- define "ephemeral.worker.labels" -}}
component: worker.ephemeral
language: {{ .language }}
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

{{/*
Worker labels
*/}}
{{- define "worker.labels" -}}
component: worker.js
plugins: {{ .package }}
events: {{ .events | replace "!" "not." | replace "," "_" }}
{{- end -}}
