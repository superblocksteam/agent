{{- define "imagePullSecret" }}
{{- with .Values.image.credentials }}
{{- printf "{\"auths\":{\"%s\":{\"username\":\"%s\",\"password\":\"%s\",\"auth\":\"%s\"}}}" .registry .username .password (printf "%s:%s" .username .password | b64enc) | b64enc }}
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
