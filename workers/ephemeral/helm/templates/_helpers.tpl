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
