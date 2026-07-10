# Helm charts

All orchestrator Helm charts live in this directory. They package the same Go codebase in different deployment topologies — not interchangeable drop-ins.

## Chart map

| Chart | Image | Who deploys it | What it runs |
| --- | --- | --- | --- |
| `agent` | `ghcr.io/superblocksteam/agent` (full OPA image) | Customers (Terraform/Helm), Superblocks EE ephemeral (`deploy-job` `opa` job) | One Deployment: orchestrator + bundled JS/Python workers |
| `orchestrator` | `ghcr.io/superblocksteam/orchestrator` (slim server image) | Superblocks SaaS / EE (`make deploy-helm`), workspace `kubernetes` profile | Server Deployment + optional `sandbox_workers` subchart (KEDA Jobs) |
| `cloud-opa` | Wraps `agent` via `file://../agent` | Internal soak tests (`make deploy-helm-opa`) | Customer OPA chart with registration/jobs disabled |
| `dataplane` | Orchestrator + inline workers in one chart | Cloud-prem (`charts.superblocks.com`, `publish-charts.yaml`) | Full dataplane without the `sandbox_workers` subchart split |

The public `superblocksteam/agent` repo is a read-only mirror of `orchestrator` source. Chart paths here are mirrored there too; `cloud-opa` is excluded from the mirror.

## `helm/agent` vs `helm/orchestrator`

Both charts deploy execution infrastructure, but they target different environments and images.

**`helm/agent`** is the customer-facing On-Premise Agent (OPA) chart (`superblocks-agent`). It ships the fat `agent` image where workers run inside the same pod. Telemetry defaults to `on-prem`. Versioned independently in `helm/agent/Chart.yaml` (`appVersion` = OPA image tag). Bump on OPA releases (see repo-root `AGENTS.md`).

**`helm/orchestrator`** is the internal Superblocks chart. It uses the slim `orchestrator` image and optionally pulls in `workers/ephemeral/helm` as the `sandbox_workers` subchart for JS/Python sandboxes as separate K8s workloads. Telemetry defaults to `cloud`. Values overrides live under `helm/orchestrator/overrides/<environment>.yaml`.

`make deploy-helm` installs **two releases** from `helm/orchestrator`:

1. `orchestrator` — `server.deploy=true`, `sandbox_workers.deploy=false` (API server only)
2. `orchestrator-workers` — `server.deploy=false`, workers enabled (must set `databaseLifecycle.enabled=false` on this release)

When `databaseLifecycle.enabled=true`, keep the lifecycle worker on the main `orchestrator` release only (`server.deploy=true`). The workers release must not run it.

## Deploy entrypoints

| Entrypoint | Chart | Notes |
| --- | --- | --- |
| `make deploy-helm` | `helm/orchestrator` | Staging/prod SaaS orchestrator + workers. Secrets via `config/.env.<env>` + `--set`. |
| `make deploy-helm-opa` | `helm/cloud-opa` | Internal cloud OPA soak (`cloud-opa` + `cloud-opa-new` releases). |
| `superblocks` `deploy-job.yml` `orchestrator` job | `helm/orchestrator` | When `deploy_agents: true`. Checks out this repo, runs `make deploy-helm`. |
| `superblocks` `deploy-job.yml` `opa` job | `helm/agent` | When `deploy_opa: true`. Deploys tagged EE OPA instances (`ee-opa`, `ee-opa-<instance>`). |
| `.github/workflows/publish-charts.yaml` | `helm/dataplane` | Publishes to `charts.superblocks.com`. |
| Workspace `profiles/kubernetes.tilt` | `helm/orchestrator` | Local k3d dev with `local.yaml` + `orchestrator-values.yaml`. |

Ephemeral environments often set **both** `deploy_agents: true` (cloud orchestrator fleet) and `deploy_opa: true` (profile-tagged EE OPAs). The workflow input names are easy to misread: `deploy_agents` does **not** deploy `helm/agent`.

## Related docs

- Image variants (standard vs slim): `docs/OPA_VARIANTS.md`
- External Secrets across all charts: `docs/EXTERNAL_SECRETS_MIGRATION.md`
- Superblocks monorepo deploy wiring: `superblocks/.github/workflows/README.md`

## Evolving this file

Each line should be non-discoverable. If an agent would get it right by reading the charts and Makefile, drop the line; if you hit a non-obvious trap (especially naming collisions between `deploy_agents`, `helm/agent`, and the public `agent` mirror), add it.
