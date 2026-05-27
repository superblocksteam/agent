{{- define "imagePullSecret" }}
{{- with .Values.image.credentials }}
{{- printf "{\"auths\":{\"%s\":{\"username\":\"%s\",\"password\":\"%s\",\"auth\":\"%s\"}}}" .registry .username .password (printf "%s:%s" .username .password | b64enc) | b64enc }}
{{- end }}
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
Default suffixed name for any database-lifecycle resource (Deployment +
ServiceAccount). Truncates the chart fullname BEFORE appending the suffix
so the resulting name reliably ends in `-database-lifecycle`, even when
`orchestrator.fullname` is already close to the 63-char limit.
*/}}
{{- define "orchestrator.databaseLifecycle.name" -}}
{{- $suffix := "-database-lifecycle" -}}
{{- $maxFullname := sub 63 (len $suffix) -}}
{{- $fullname := include "orchestrator.fullname" . | trunc (int $maxFullname) | trimSuffix "-" -}}
{{- printf "%s%s" $fullname $suffix -}}
{{- end }}

{{/*
ServiceAccount name for the database-lifecycle worker. Honors
`databaseLifecycle.serviceAccount.name` when set; otherwise derives from the
chart's fullname so the SA the helm chart creates and the SA the Deployment
references can never drift apart.
*/}}
{{- define "orchestrator.databaseLifecycle.serviceAccountName" -}}
{{- $sa := .Values.databaseLifecycle.serviceAccount | default dict }}
{{- if $sa.name }}
{{- $sa.name }}
{{- else if and (hasKey $sa "create") (eq $sa.create false) }}
{{- fail "databaseLifecycle.serviceAccount.name is required when databaseLifecycle.serviceAccount.create=false" }}
{{- else }}
{{- include "orchestrator.databaseLifecycle.name" . }}
{{- end }}
{{- end }}
