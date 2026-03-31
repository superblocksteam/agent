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

| Component    | CPU request | Memory request | Memory limit |
| ------------ | ----------: | -------------: | -----------: |
| Task manager |        200m |         128 Mi |       512 Mi |
| Sandbox (JS) |        300m |         700 Mi |         4 Gi |
| Sandbox (Py) |        300m |         700 Mi |         4 Gi |
| **Total**    |    **500m** |     **828 Mi** |   **4.5 Gi** |

## Current Fleet Sizing

Source: `helm/orchestrator/overrides/{staging,production,prod-eu}.yaml`

| Environment | Fleet            | `minReplicaCount` | `maxReplicaCount` |
| ----------- | ---------------- | ----------------: | ----------------: |
| **Staging** | javascript       |               100 |               250 |
| **Staging** | javascriptsdkapi |               200 |               400 |
| **Staging** | python           |               100 |               250 |
| **Prod**    | javascript       |               150 |               300 |
| **Prod**    | javascriptsdkapi |               200 |               400 |
| **Prod**    | python           |               150 |               300 |
| **Prod-EU** | javascript       |                35 |                70 |
| **Prod-EU** | javascriptsdkapi |               200 |               400 |
| **Prod-EU** | python           |                60 |               120 |

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

| Resource | Current limit | Max concurrent executions | What to change |
| -------- | ------------- | ------------------------: | -------------- |
| Nodepool CPU | 2000 vCPU | **4000** | `nodepool.spec.limits.cpu` in k8s-resources |
| IPs per node (8 vCPU) | ~112 | 56 (2 per execution) | Not a bottleneck; CPU-bound first |
| IPs per node (16 vCPU) | ~112 | 56 (2 per execution) | CPU-bound at 31 executions/node first |
| Pod subnet IPs (prod) | 32,768 (4 × /19) | **16,384** | `cidr_eks_pods` in terraform `.tfvars` |
| Pod subnet IPs (prod-eu) | 24,576 (3 × /19) | **12,288** | `cidr_eks_pods` in terraform `.tfvars` |
| Nodes at 2000 vCPU | 125 (16 vCPU) to 250 (8 vCPU) | N/A | EC2 service quota |

### Scaling headroom by environment

Total `maxReplicaCount` across all ephemeral fleets vs nodepool capacity:

| Environment | Sum of all fleet max | CPU at max (× 500m) | Headroom vs 2000 vCPU | Pod subnet IPs | IP-exhaustion ceiling |
| ----------- | -------------------: | ------------------: | --------------------: | -------------: | -------------------: |
| **Staging** |                  900 |            450 vCPU |   1550 vCPU remaining |   32,768 (4×/19) |          ~8,192 vCPU |
| **Prod**    |                 1000 |            500 vCPU |   1500 vCPU remaining |   32,768 (4×/19) |          ~8,192 vCPU |
| **Prod-EU** |                  590 |            295 vCPU |   1705 vCPU remaining |   24,576 (3×/19) |          ~6,144 vCPU |

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

## Scaling Recommendations

1. **Increase `minReplicaCount`** -- most direct lever. Each +100 adds ~25
   RPS capacity (based on staging observations).
2. **Increase `maxReplicaCount`** -- raises the ceiling for traffic spikes.
3. **Verify Karpenter nodepool limits** -- ensure the gVisor nodepool can
   provision enough total CPU/memory for the desired pod count.
4. **Use larger instance types** -- if pod density per node is a bottleneck,
   ensure 16-vCPU instances are available in the EC2NodeClass.

## Monitoring

- **Pod count**: `kubernetes_state.container.running` filtered by
  `kube_namespace:cloud-agents` and `kube_deployment` containing `ephemeral`
- **Sandbox metrics**: `sandbox_execution_pool_size`,
  `sandbox_execution_pool_in_use`, `sandbox_executions_total`
- **Node pressure**: Karpenter logs, `kubectl top nodes -l
  superblocks.com/node-type=gvisor`
- **KEDA decisions**: `kubectl logs -n keda -l app=keda-operator | grep
  <fleet-name>`

## TL;DR -- max out javascriptsdkapi in prod

The gVisor nodepool has 2000 vCPU. Other fleets at their current max
consume 400 vCPU (javascript 150 + python 150 + auxiliary 50 + wasm 50),
leaving **1600 vCPU** for javascriptsdkapi = **3,200 max replicas**.

To raise sustained RPS, increase `minReplicaCount`:

```yaml
# helm/orchestrator/overrides/production.yaml
keda:
  minReplicaCount: 400  # up from 200; ~50 vCPU baseline, ~100 sustained RPS
  maxReplicaCount: 800  # raise ceiling proportionally
```

Each +100 min adds ~50 vCPU of baseline cost and ~25 sustained RPS.
No infrastructure changes required -- the nodepool already supports it.
