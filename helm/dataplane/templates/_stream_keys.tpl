{{/*
Redis stream key helpers (keep in sync with workers/ephemeral/helm/templates/_stream_keys.tpl).

Mirrors workers/shared/transport/redis/utils.go StreamKeys and pkg/pluginparser/plugin_parser.go ParsePlugins.
*/}}

{{/*
Parse worker.plugins entries (*, explicit names, -exclusions). Returns JSON string array.
Expected dict keys: plugins (list), allPlugins (list)
*/}}
{{- define "sandbox_workers.parsePlugins" -}}
{{- $inputs := .plugins | default list -}}
{{- $catalog := .allPlugins | default list -}}
{{- $useAll := false -}}
{{- $additions := list -}}
{{- $removals := list -}}
{{- range $inputs -}}
{{- if eq . "*" -}}
{{- $useAll = true -}}
{{- else if hasPrefix "-" . -}}
{{- $removals = append $removals (trimPrefix "-" .) -}}
{{- else -}}
{{- $additions = append $additions . -}}
{{- end -}}
{{- end -}}
{{- $base := $additions -}}
{{- if $useAll -}}
{{- $base = $catalog -}}
{{- end -}}
{{- $result := list -}}
{{- range $base -}}
{{- if not (has . $removals) -}}
{{- $result = append $result . -}}
{{- end -}}
{{- end -}}
{{- $result | toJson -}}
{{- end -}}

{{/*
Build one Redis stream key (agent.<group>.bucket.<bucket>[.<variant>].plugin.<plugin>.event.<event>).
Expected dict keys: group, bucket, variant (optional), plugin, eventName
*/}}
{{- define "sandbox_workers.redisStreamKey" -}}
{{- if .variant -}}
agent.{{ .group }}.bucket.{{ .bucket }}.{{ .variant }}.plugin.{{ .plugin }}.event.{{ .eventName }}
{{- else -}}
agent.{{ .group }}.bucket.{{ .bucket }}.plugin.{{ .plugin }}.event.{{ .eventName }}
{{- end -}}
{{- end -}}

{{/*
Redis stream keys for a fleet: explicit streams list, else generated from plugins/events/buckets.
Used for task-manager --worker.stream.keys (deployment) and KEDA redis-streams triggers (ScaledObject).
Expected dict keys: fleet, workerValues
Returns JSON object with numeric string keys ("0", "1", ...) because Sprig fromJson only unmarshals objects, not arrays.
*/}}
{{- define "sandbox_workers.fleetTriggerStreams" -}}
{{- $fleet := .fleet -}}
{{- $worker := .workerValues | default dict -}}
{{- $keys := list -}}
{{- if $fleet.streams -}}
{{- $keys = $fleet.streams -}}
{{- else if $worker.streams -}}
{{- $keys = $worker.streams -}}
{{- else -}}
{{- $pluginsRaw := $fleet.plugins | default $worker.plugins | default list -}}
{{- $catalog := $worker.allPlugins | default list -}}
{{- $useAll := false -}}
{{- $additions := list -}}
{{- $removals := list -}}
{{- range $pluginsRaw -}}
{{- if eq . "*" -}}
{{- $useAll = true -}}
{{- else if hasPrefix "-" . -}}
{{- $removals = append $removals (trimPrefix "-" .) -}}
{{- else -}}
{{- $additions = append $additions . -}}
{{- end -}}
{{- end -}}
{{- $plugins := $additions -}}
{{- if $useAll -}}
{{- $plugins = $catalog -}}
{{- end -}}
{{- $pluginsFiltered := list -}}
{{- range $plugins -}}
{{- if not (has . $removals) -}}
{{- $pluginsFiltered = append $pluginsFiltered . -}}
{{- end -}}
{{- end -}}
{{- $events := $fleet.events | default $worker.events | default list -}}
{{- $buckets := $fleet.buckets | default $worker.buckets | default (list "BA") -}}
{{- $group := $worker.group | default "main" -}}
{{- $variants := $fleet.streamVariants | default $worker.streamVariants | default list -}}
{{- $includeStandard := true -}}
{{- if hasKey $fleet "includeStandardStreams" -}}
{{- $includeStandard = $fleet.includeStandardStreams -}}
{{- else if hasKey $worker "includeStandardStreams" -}}
{{- $includeStandard = $worker.includeStandardStreams -}}
{{- end -}}
{{- $variantList := list -}}
{{- range $variants -}}
{{- $variantList = append $variantList . -}}
{{- end -}}
{{- if $includeStandard -}}
{{- $variantList = append $variantList "" -}}
{{- end -}}
{{- range $plugin := $pluginsFiltered -}}
{{- range $variant := $variantList -}}
{{- range $event := $events -}}
{{- if eq $event "execute" -}}
{{- range $bucket := $buckets -}}
{{- $keys = append $keys (include "sandbox_workers.redisStreamKey" (dict "group" $group "bucket" $bucket "variant" $variant "plugin" $plugin "eventName" $event) | trim) -}}
{{- end -}}
{{- else -}}
{{- $keys = append $keys (include "sandbox_workers.redisStreamKey" (dict "group" $group "bucket" "BA" "variant" $variant "plugin" $plugin "eventName" $event) | trim) -}}
{{- end -}}
{{- end -}}
{{- end -}}
{{- end -}}
{{- end -}}
{{- $result := dict -}}
{{- range $i, $key := $keys -}}
{{- $_ := set $result ($i | toString) $key -}}
{{- end -}}
{{- $result | toJson -}}
{{- end -}}
