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
Redis password secret name
*/}}
{{- define "superblocks-agent.redis-password-name" -}}
{{ printf "%s-redis-password" (include "superblocks-agent.fullname" .) | trunc 63 | trimSuffix "-" }}
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

{{/*
Agent's internal redis password
*/}}
{{- define "superblocks-agent.redis-password" -}}
{{- if not .Values.superblocks.agentRedisPasswordExistingSecret }}
- secretRef:
    name: {{ include "superblocks-agent.redis-password-name" . }}
{{- else }}
- secretRef:
    name: {{ .Values.superblocks.agentRedisPasswordExistingSecret }}
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

{{/*
Secrets encryption key secret name
*/}}
{{- define "superblocks-agent.secrets-encryption-key-name" -}}
{{ printf "%s-secrets-encryption-key" (include "superblocks-agent.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{/*
Render the existing database lifecycle worker CONFIG JSON from structured Helm
values. Each named group owns its routing, pool policy, and native Terraform
input maps while backend, credential resolver, and module sources stay shared.
*/}}
{{- define "superblocks-agent.databaseLifecycleConfigJSON" -}}
{{- $dl := .Values.databaseLifecycle -}}
{{- $backendRegion := $dl.backend.region -}}
{{- $credentialResolver := dict
  "runtime" ($dl.credentialResolver.runtime | default "aws_secrets_manager")
  "region" ($dl.credentialResolver.region | default $backendRegion)
-}}
{{- $entries := list -}}
{{- range $groupName, $group := $dl.groups -}}
{{- $logicalBackend := dict
  "stateBackend" ($dl.backend.stateBackend | default "s3")
  "bucket" $dl.backend.bucket
  "key" (printf "%s/{{environment}}/{{profile}}/{{resource_key}}.tfstate" ($dl.backend.keyPrefix | default "native-db/helm"))
  "region" $backendRegion
  "use_lockfile" $dl.backend.useLockfile
-}}
{{- $logicalModule := dict
  "source" $dl.modules.logical.source
  "inputs" (deepCopy ($group.logicalModuleInputs | default dict))
-}}
{{- if $dl.modules.logical.version }}
{{- $_ := set $logicalModule "version" $dl.modules.logical.version }}
{{- end }}
{{- $logicalTerraform := dict
  "backend" $logicalBackend
  "credentialResolver" $credentialResolver
  "moduleSelectors" (dict "postgres" $logicalModule)
-}}
{{- $ensureDatabase := dict "backend" "terraform" "terraform" $logicalTerraform -}}
{{- /* retire_database reuses the logical Terraform root so tofu destroy targets the same state as ensure. It omits physicalDatabase: attach for retire is metadata-driven, not a new pool reservation. */ -}}
{{- $retireDatabase := dict "backend" "terraform" "terraform" $logicalTerraform -}}
{{- $operations := dict
  "ensure_database" $ensureDatabase
  "migrate_schema" (dict "backend" "native_runner")
  "retire_database" $retireDatabase
-}}
{{- if $dl.physicalProvisioning.enabled }}
{{- $physicalBackend := dict
  "stateBackend" ($dl.backend.stateBackend | default "s3")
  "bucket" $dl.backend.bucket
  "key" (printf "%s/physical/{{environment}}/{{profile}}/{{resource_key}}.tfstate" ($dl.backend.keyPrefix | default "native-db/helm"))
  "region" $backendRegion
  "use_lockfile" $dl.backend.useLockfile
-}}
{{- $physicalInputs := deepCopy ($group.physicalModuleInputs | default dict) -}}
{{- $physicalTags := deepCopy (get $physicalInputs "tags" | default dict) -}}
{{- range $tagKey, $tagValue := ($dl.physicalModuleTags | default dict) }}
{{- $_ := set $physicalTags $tagKey $tagValue }}
{{- end }}
{{- if $physicalTags }}
{{- $_ := set $physicalInputs "tags" $physicalTags }}
{{- end }}
{{- $physicalModule := dict
  "source" $dl.modules.physical.source
  "inputs" $physicalInputs
-}}
{{- if $dl.modules.physical.version }}
{{- $_ := set $physicalModule "version" $dl.modules.physical.version }}
{{- end }}
{{- $physicalTerraform := dict
  "backend" $physicalBackend
  "credentialResolver" $credentialResolver
  "moduleSelectors" (dict "postgres" $physicalModule)
-}}
{{- $_ := set $ensureDatabase "physicalDatabase" (dict
  "mode" "shared_pool"
  "provisionOperation" "ensure_physical_database_instance"
  "onExhausted" "provision"
  "capacityMax" $group.pool.maxDatabases
  "securityClass" "standard")
-}}
{{- $_ := set $operations "ensure_physical_database_instance" (dict
  "backend" "terraform"
  "terraform" $physicalTerraform)
-}}
{{- end }}
{{- range $environment := $group.environments }}
{{- $entries = append $entries (dict
  "environment" $environment
  "profiles" $group.profiles
  "engines" (list "postgres")
  "operations" $operations)
-}}
{{- end }}
{{- end }}
{{- dict "entries" $entries | toJson }}
{{- end }}
