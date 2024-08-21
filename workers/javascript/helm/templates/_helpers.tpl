{{- define "imagePullSecret" }}
{{- with .Values.image.credentials }}
{{- printf "{\"auths\":{\"%s\":{\"username\":\"%s\",\"password\":\"%s\",\"auth\":\"%s\"}}}" .registry .username .password (printf "%s:%s" .username .password | b64enc) | b64enc }}
{{- end }}
{{- end }}

{{/*
Worker labels
*/}}
{{- define "worker.labels" -}}
component: worker.js
bucket: {{ .bucket }}
plugins: {{ .package }}
events: {{ .events | replace "!" "not." | replace "," "_" }}
{{- end -}}
