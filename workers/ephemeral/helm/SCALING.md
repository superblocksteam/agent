# Ephemeral Worker Scaling Guide

## Observed RPS Capacity (per fleet, staging 2026-03)

| `minReplicaCount` | Sustained RPS | Notes                                            |
| ----------------: | ------------: | ------------------------------------------------ |
|               200 |           ~55 | Current staging default for JS/Python fleets     |
|               300 |           ~75 | Linear scaling region                            |
|               400 |           ~90 | Diminishing returns begin; node pressure visible |

RPS is approximate and varies by step complexity and sandbox startup time
(P50 ~1 s, P90 ~2 s on gVisor nodes with warm images).

## Node Resource Budget

Each execution consumes one task-manager pod + one sandbox pod (2 pods, 2 IPs).

### Per-execution resource requests

| Component                 | CPU request | Memory request | Memory limit |
| ------------------------- | ----------: | -------------: | -----------: |
| Task manager              |        200m |         128 Mi |       512 Mi |
| Sandbox (JS / JS SDK API) |        300m |         700 Mi |         4 Gi |
| Sandbox (Python)          |        300m |         700 Mi |         4 Gi |
| **Total per execution**   |    **500m** |     **828 Mi** |   **4.5 Gi** |

## Current Fleet Sizing

Source: `helm/orchestrator/overrides/{staging,production,prod-eu}.yaml`

All sandbox worker fleets in these overrides use **scheduled scale-down** (see below).
`minReplicaCount` is the off-hours floor; **business-hours floor** is the cron trigger
`desiredReplicas` (the fleet’s former constant `minReplicaCount`). Ephemeral execute fleets
(javascript, javascriptsdkapi, python) and non-ephemeral fleets (auxiliary, wasm) share the
same cron + `triggersMerge` pattern.

| Environment | Fleet            | Off-hours min | Business-hours floor | `maxReplicaCount` |
| ----------- | ---------------- | ------------: | -------------------: | ----------------: |
| **Staging** | javascript       |             1 |                    5 |               125 |
| **Staging** | javascriptsdkapi |             1 |                    5 |               200 |
| **Staging** | python           |             1 |                   10 |               125 |
| **Staging** | auxiliary        |             1 |                    1 |                10 |
| **Staging** | wasm             |             1 |                    1 |                10 |
| **Prod**    | javascript       |             1 |                   10 |               150 |
| **Prod**    | javascriptsdkapi |             1 |                   15 |               200 |
| **Prod**    | python           |             1 |                   15 |               300 |
| **Prod**    | auxiliary        |             1 |                    2 |                20 |
| **Prod**    | wasm             |             1 |                    2 |                20 |
| **Prod-EU** | javascript       |             1 |                    5 |                35 |
| **Prod-EU** | javascriptsdkapi |             1 |                    5 |               200 |
| **Prod-EU** | python           |             1 |                    5 |                60 |
| **Prod-EU** | auxiliary        |             1 |                    2 |                20 |
| **Prod-EU** | wasm             |             1 |                    2 |                14 |

Business-hours windows (KEDA cron, Mon–Fri):

| Environment | Timezone           | Schedule (local)   |
| ----------- | ------------------ | ------------------ |
| Staging, Prod | `America/New_York` | 08:00–20:00      |
| Prod-EU     | `Europe/London`    | 08:00–20:00        |

CPU ceiling calculations in older runbooks assumed constant `minReplicaCount`; at max load,
use **business-hours floor** + spike headroom against `maxReplicaCount` and the 2000 vCPU
nodepool limit. All fleets share the gVisor nodepool; auxiliary and wasm reduce headroom for
ephemeral scale-up.

## Infrastructure Limits

Ephemeral workers run on the **gVisor Karpenter nodepool**
(`superblocks.com/node-type: gvisor`, `runtimeClassName: gvisor`).

Source: `k8s-resources/modules/gvisor/nodepool.yaml`

### Nodepool configuration

| Setting             | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| Instance categories | c, m                                                        |
| Instance CPUs       | 8, 16 vCPU                                                  |
| Capacity type       | on-demand                                                   |
| Nodepool CPU limit  | **2000 vCPU** (shared across all envs using the module)     |
| IP allocation       | WARM_ENI_TARGET=0, /28 prefix delegation (~112 IPs per ENI) |

### Per-node pod density

| Node size | CPU available | Max executions (at 500m each) | Max pods (2 per execution) | IP headroom (~112 IPs) |
| --------- | ------------: | ----------------------------: | -------------------------: | ---------------------: |
| 8 vCPU    |     ~7.5 vCPU |                        **15** |                         30 |           82 IPs spare |
| 16 vCPU   |    ~15.5 vCPU |                        **31** |                         62 |           50 IPs spare |

### Absolute maximums

| Resource                 | Current limit                 | Max concurrent executions | What to change                              |
| ------------------------ | ----------------------------- | ------------------------: | ------------------------------------------- |
| Nodepool CPU             | 2000 vCPU                     |                  **4000** | `nodepool.spec.limits.cpu` in k8s-resources |
| IPs per node (8 vCPU)    | ~112                          |      56 (2 per execution) | Not a bottleneck; CPU-bound first           |
| IPs per node (16 vCPU)   | ~112                          |      56 (2 per execution) | CPU-bound at 31 executions/node first       |
| Pod subnet IPs (prod)    | 32,768 (4 × /19)              |                **16,384** | `cidr_eks_pods` in terraform `.tfvars`      |
| Pod subnet IPs (prod-eu) | 24,576 (3 × /19)              |                **12,288** | `cidr_eks_pods` in terraform `.tfvars`      |
| Nodes at 2000 vCPU       | 125 (16 vCPU) to 250 (8 vCPU) |                       N/A | EC2 service quota                           |

### Scaling headroom by environment

Total `maxReplicaCount` across all ephemeral fleets vs nodepool capacity:

| Environment | Sum of all fleet max | CPU at max (× 500m) | Headroom vs 2000 vCPU | Pod subnet IPs | IP-exhaustion ceiling |
| ----------- | -------------------: | ------------------: | --------------------: | -------------: | --------------------: |
| **Staging** |                  900 |            450 vCPU |   1550 vCPU remaining | 32,768 (4×/19) |           ~8,192 vCPU |
| **Prod**    |                 1000 |            500 vCPU |   1500 vCPU remaining | 32,768 (4×/19) |           ~8,192 vCPU |
| **Prod-EU** |                  590 |            295 vCPU |   1705 vCPU remaining | 24,576 (3×/19) |           ~6,144 vCPU |

**IP-exhaustion ceiling** = theoretical nodepool CPU limit at which pod IPs
run out, assuming all subnet IPs go to ephemeral workers (total pod IPs ÷ 2
pods per execution × 500m). In practice this is lower because other workloads
share the same subnets.

Subnet CIDRs from
[terraform/aws/prod/application-stack/us-west-2/terraform.tfvars](https://github.com/superblocksteam/terraform/blob/main/aws/prod/application-stack/us-west-2/terraform.tfvars)
(`cidr_eks_pods`). Staging:
[terraform/aws/staging/application-stack/us-west-2/terraform.tfvars](https://github.com/superblocksteam/terraform/blob/main/aws/staging/application-stack/us-west-2/terraform.tfvars).
Prod-EU:
[terraform/aws/prod/application-stack/eu-west-1/terraform.tfvars](https://github.com/superblocksteam/terraform/blob/main/aws/prod/application-stack/eu-west-1/terraform.tfvars).

Non-ephemeral sandbox fleets (auxiliary, javascriptwasm) also consume from the
same nodepool and subnets. Factor those in when approaching limits.

## KEDA scaling (`templates/scaledobject.yaml`)

Each fleet gets a KEDA `ScaledObject` with up to three trigger types:

| Trigger | Source | Role |
| ------- | ------ | ---- |
| **cron** | Fleet `keda.triggers` (optional) | Business-hours replica floor via `desiredReplicas` |
| **redis-streams** | Generated from fleet `plugins`, `events`, `buckets` (and `streamVariants` / `includeStandardStreams`) | Scale on stream backlog |
| **prometheus** | Generated when `keda.prometheusServerAddress` is set | Scale on `sandbox_execution_pool_in_use` |

KEDA sets replica count to the **maximum** across all active triggers unless
`scalingModifiers` is enabled (prom/cron plus redis): then desired replicas are
`max(prom, cron) + ceil(total stream lag / lagCount)`.

### Redis stream keys for KEDA

KEDA `redis-streams` triggers use the same stream naming as the task-manager
(`workers/shared/transport/redis/utils.go` `StreamKeys`):

```text
agent.<group>.bucket.<bucket>[.<variant>].plugin.<plugin>.event.<event>
```

- `<group>` comes from `worker.group` (default `main`).
- `execute` events use all fleet `buckets`; other events use bucket `BA` only.
- `streamVariants` and `includeStandardStreams` follow the same rules as
  `--worker.stream.variants` / `--worker.stream.include.standard.keys`.
- Plugin wildcards (`*`, `-name`) expand via `worker.allPlugins` (mirrors
  `pkg/pluginparser/plugin_parser.go`).

Set optional `streams` on a fleet (or `worker.streams` globally) for an explicit
key list shared by the task-manager and KEDA. When omitted, both derive keys from
`plugins`, `events`, and `buckets`. The deprecated `triggerStreams` field is no longer read;
migrate any remaining uses to `streams`.

### Redis stream lag aggregation (multiple streams)

When a fleet has **more than one** generated stream, KEDA’s default per-stream
`redis-streams` triggers take the **max** desired count across streams. That
under-scales when lag is spread across many streams (e.g. auxiliary fleets with
dozens of plugin/bucket/event keys).

For **more than one** generated stream, or **prom/cron plus redis**, the chart enables KEDA
[`scalingModifiers`](https://keda.sh/docs/latest/reference/scaledobject-spec/#scalingmodifiers)
( cluster KEDA **2.12+**, requires **2.16+** in Superblocks k8s-resources ):

- Each stream trigger is named `rs0`, `rs1`, …
- Prometheus (when enabled) is named `prom`; cron is named `cron`
- Formula (desired replicas, `metricType: AverageValue`, `target: "1"`):

```text
max([float(prom), float(cron)]) + ceil((rs0 + rs1 + …) / lagCount)
```

When only one of prom/cron is present, that term replaces the `max(...)`. With redis
triggers only (no prom/cron), the formula is just the backlog term.

`lagCount` defaults to the fleet's `queue.executionPool` (50 for non-ephemeral
fleets, 2 for ephemeral). Override with `fleet.keda.lagCount` when needed.
Each redis-streams trigger sets per-stream `lagCount` and `activationLagCount`
so KEDA reports Redis 7 consumer-group **lag** (not XPENDING) into the formula;
the formula's `lagCount` divisor converts total lag into additional replicas.
Fleets with prom/cron plus redis use `scalingModifiers` (including single-stream fleets).

### Trigger modes

| Configuration | Behavior |
| ------------- | -------- |
| No fleet `keda.triggers` | Redis + Prometheus only (default) |
| `keda.triggers` set, `triggersMerge: false` (default) | Custom triggers **replace** redis/prometheus (local dev / CI) |
| `keda.triggers` + `triggersMerge: true` | Custom triggers **plus** generated redis/prometheus (production schedules) |

`triggersMerge` can be set per fleet (`fleet.keda.triggersMerge`) or globally
(`keda.triggersMerge`); fleet wins when `hasKey` is set (explicit `false` is respected).

### Off-hours scale-down (cron)

Configured per fleet in `helm/orchestrator/overrides/*.yaml`:

| Field | Meaning |
| ----- | ------- |
| `keda.minReplicaCount: 1` | Off-hours / weekend floor on the `ScaledObject` |
| `keda.triggers` (cron) | `desiredReplicas` = former business-hours `minReplicaCount` |
| `keda.triggersMerge: true` | Keep redis-streams and prometheus triggers |

Outside the cron window (nights, weekends), only `minReplicaCount` (typically **1**) applies
unless load or backlog pushes higher.

```yaml
# Shared schedule anchor (staging / prod)
x-worker-cron-metadata: &worker_cron_metadata
  timezone: America/New_York
  start: "0 8 * * 1-5"
  end: "0 20 * * 1-5"

main.ephemeral.javascript.execute:
  keda:
    minReplicaCount: 1
    triggersMerge: true
    triggers:
      - type: cron
        metadata:
          <<: *worker_cron_metadata
          desiredReplicas: "10"
```

Prod-EU uses `timezone: Europe/London` with the same local hours (08:00–20:00 Mon–Fri).

### Prometheus warm buffer (`extraWarm`)

Load-based desired replicas (Prometheus trigger; idle floors from cron + `minReplicaCount`):

```text
ceil(sum(in_use) / executionPool) + sum(worker_degraded_mode) + minReplicaCount
  + (in_use > extraWarm * executionPool) * extraWarm
```

Where `extraWarm = promBuffer - minReplicaCount` and `promBuffer` is cron `desiredReplicas` when
configured, else `minReplicaCount`. With **no cron**, `extraWarm = 0` and the query is the legacy
`ceil(in_use / executionPool) + sum(degraded) + minReplicas`.

`worker_degraded_mode` is 0 or 1 per task-manager pod (Redis transport degraded mode when plugins are
unavailable). Summing by fleet counts workers that cannot admit work despite low `in_use`.

The extra warm pool (`extraWarm`) applies only when load exceeds what the cron floor already
covers (`extraWarm * executionPool` concurrent executions). That avoids scaling to 10+ replicas on
a single off-hours request while preserving full warm capacity under sustained load.

| `promBuffer` source | When |
| ------------------- | ---- |
| `minReplicaCount` | No cron trigger on the fleet |
| Cron `desiredReplicas` | Fleet has a cron trigger with `desiredReplicas` set |

Example with cron `desiredReplicas: "10"`, `minReplicaCount: 1`, `executionPool: 2`
(`extraWarm=9`, threshold `in_use > 18`):

| State | Prometheus | Cron (active) | Result |
| ----- | ---------- | ------------- | ------ |
| Idle, business hours | 1 | 10 | 10 |
| Idle, off-hours | 1 | inactive | 1 |
| Off-hours, `in_use=1` | `ceil(1)+1=2` | inactive | **2** |
| 1 degraded worker, `in_use=0` | `0+1+1=2` | inactive | **2** |
| `in_use=20` | `ceil(10)+1+9=20` | 10 | 20 |

Prometheus scaler fallback uses `max(minReplicaCount, promBuffer)` so metrics outages retain the
former business-hours floor when cron is configured.

## Scaling Recommendations

1. **Increase business-hours capacity** -- raise cron `desiredReplicas` (and keep
   `minReplicaCount: 1` for off-hours). Each +100 in the former min adds ~25 sustained RPS
   (staging observations). Prometheus `promBuffer` follows `desiredReplicas` automatically.
2. **Increase `maxReplicaCount`** -- raises the ceiling for traffic spikes.
3. **Verify Karpenter nodepool limits** -- ensure the gVisor nodepool can
   provision enough total CPU/memory for the desired pod count.
4. **Use larger instance types** -- if pod density per node is a bottleneck,
   ensure 16-vCPU instances are available in the EC2NodeClass.

## Monitoring

- **Pod count**: `kubernetes_state.container.running` filtered by
  `kube_namespace:cloud-agents` and `kube_deployment` containing `ephemeral`
- **Sandbox metrics**: `sandbox_execution_pool_size`,
  `sandbox_execution_pool_in_use`, `worker_degraded_mode`, `sandbox_executions_total`
- **Node pressure**: Karpenter logs, `kubectl top nodes -l
  superblocks.com/node-type=gvisor`
- **KEDA decisions**: `kubectl logs -n keda -l app=keda-operator | grep
  <fleet-name>`

## TL;DR -- max out javascriptsdkapi in prod

The gVisor nodepool has 2000 vCPU. Other fleets at their current max
consume 400 vCPU (javascript 150 + python 150 + auxiliary 50 + wasm 50),
leaving **1600 vCPU** for javascriptsdkapi = **3,200 max replicas**.

To raise sustained RPS for javascriptsdkapi, increase cron `desiredReplicas` (business-hours
floor) and `maxReplicaCount`:

```yaml
# helm/orchestrator/overrides/production.yaml — main.ephemeral.javascriptsdkapi.execute
keda:
  minReplicaCount: 1
  maxReplicaCount: 800
  triggersMerge: true
  triggers:
    - type: cron
      metadata:
        <<: *worker_cron_metadata
        desiredReplicas: "400"  # up from 15; ~100 sustained RPS at prior staging ratios
```

Each +100 on the business-hours floor adds ~50 vCPU during that window and ~25 sustained RPS.
No infrastructure changes required -- the nodepool already supports it.
