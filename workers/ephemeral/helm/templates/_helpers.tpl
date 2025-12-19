{{- define "imagePullSecret" }}
{{- with .Values.image.credentials }}
{{- printf "{\"auths\":{\"%s\":{\"username\":\"%s\",\"password\":\"%s\",\"auth\":\"%s\"}}}" .registry .username .password (printf "%s:%s" .username .password | b64enc) | b64enc }}
{{- end }}
{{- end }}

{{/*
Worker labels
*/}}
{{- define "ephemeral.worker.labels" -}}
component: worker.ephemeral
language: {{ .language }}
bucket: {{ .bucket }}
{{- end -}}

{{/*
Sandbox container name based on language
*/}}
{{- define "sandbox.name" -}}
{{ .language }}-sandbox
{{- end -}}
