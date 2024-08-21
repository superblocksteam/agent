{{/*
Worker labels
*/}}
{{- define "worker.labels" -}}
component: worker.py
bucket: {{ .bucket }}
plugins: {{ .package }}
events: {{ .events | replace "!" "not." | replace "," "_" }}
{{- end -}}
