# External Secrets Migration

## Background

All Helm charts in this repo (`helm/orchestrator`, `helm/dataplane`, `helm/agent`, `workers/javascript/helm`, `workers/python/helm`, `workers/ephemeral/helm`) have been updated to support the External Secrets Operator (ESO).

When `externalSecrets.enabled: true`, each chart creates `ExternalSecret` resources instead of vanilla Kubernetes `Secret` objects. ESO then syncs the secrets from AWS Secrets Manager into the cluster.

All charts default to `enabled: false`. This is intentional — ESO should only be enabled per-environment once the AWS secrets exist and the `remoteRef.key` paths are configured (Steps 1–2 below). Enabling it with empty remote refs causes ESO sync failures and no secrets being created, which results in pod startup failures.

CI values files also explicitly set `enabled: false`. See [CI Limitations](#ci-limitations) for why ESO cannot be enabled in CI even once the remote refs are populated.

### Current state (before migration is complete)

Secrets live in **1Password** and are injected at deploy time via `--set` flags:

```
1Password → CI/CD (opEnvFile) → helm upgrade --set ... → Helm creates K8s Secret
```

### Target state (after migration)

Secrets live in **AWS Secrets Manager** and are synced by ESO:

```
AWS Secrets Manager → ESO (ExternalSecret) → K8s Secret
```

The `--set` flags and `.env.*` 1Password references for secrets are removed.

---

## Remaining Steps

### Step 1 — Create secrets in AWS Secrets Manager

For each environment, create the following secrets in AWS Secrets Manager. Follow the existing naming convention: `{cluster_name}/superblocks/{secret_name}`.

The values to populate come from 1Password:

| 1Password item                                              | AWS Secrets Manager key                                   | Secret value key |
| ----------------------------------------------------------- | --------------------------------------------------------- | ---------------- |
| `op://Staging/agent_key/password`                           | `staging/superblocks/orchestrator_superblocks_key`        | plain string     |
| `op://Staging/staging_redis_execution/password`             | `staging/superblocks/orchestrator_redis_transport_token`  | plain string     |
| `op://Staging/staging_redis_kvstore/password`               | `staging/superblocks/orchestrator_redis_store_token`      | plain string     |
| `op://Staging/launchdarkly_apikey/credential`               | `staging/superblocks/orchestrator_launchdarkly_apikey`    | plain string     |
| `op://Staging/orchestrator_secrets_encryption_key/password` | `staging/superblocks/orchestrator_secrets_encryption_key` | plain string     |
| `op://Staging/worker_rsa_private_key/notesPlain`            | `staging/superblocks/worker_tunnel_private_key_rsa`       | plain string     |
| `op://Staging/worker_ed25519_private_key/notesPlain`        | `staging/superblocks/worker_tunnel_private_key_ed25519`   | plain string     |

Repeat for prod-us (`prod-us/superblocks/...`) and prod-eu (`prod-eu/superblocks/...`) using the corresponding `op://Prod/...` values.

Ideally these are created via Terraform in `dedicated-deployment/aws-infra/tfroots/app-secrets/main.tf` following the same pattern as the existing secrets there. The IAM role for ESO already has `secretsmanager:GetSecretValue` on `{cluster_name}/*` so no IAM changes are needed.

### Step 2 — Wire remote refs in environment values files

Update each environment values file to set the `remoteRef.key` paths.

**`helm/orchestrator/staging.yaml`:**

```yaml
externalSecrets:
  superblocksKey:
    data:
      - secretKey: key
        remoteRef:
          key: staging/superblocks/orchestrator_superblocks_key
  redis:
    data:
      - secretKey: store
        remoteRef:
          key: staging/superblocks/orchestrator_redis_store_token
      - secretKey: transport
        remoteRef:
          key: staging/superblocks/orchestrator_redis_transport_token
  launchdarkly:
    data:
      - secretKey: apikey
        remoteRef:
          key: staging/superblocks/orchestrator_launchdarkly_apikey
  secretsEncryption:
    data:
      - secretKey: key
        remoteRef:
          key: staging/superblocks/orchestrator_secrets_encryption_key
```

Same shape for `production.yaml` (prefix: `prod-us/superblocks/`) and `prod-eu.yaml` (prefix: `prod-eu/superblocks/`).

The JS worker chart also needs remote refs for the tunnel keys:

```yaml
externalSecrets:
  tunnelPrivateKeyRSA:
    data:
      - secretKey: key
        remoteRef:
          key: staging/superblocks/worker_tunnel_private_key_rsa
  tunnelPrivateKeyEd25519:
    data:
      - secretKey: key
        remoteRef:
          key: staging/superblocks/worker_tunnel_private_key_ed25519
```

### Step 3 — Remove secrets from CI/CD

Once Step 1 and Step 2 are deployed and verified working, remove the secrets from the CI/CD pipeline:

1. **Remove from `.env.staging`, `.env.prod`, `.env.prod-eu`** — delete the following entries (the 1Password refs are no longer needed at deploy time):
   - `HELM_QUEUE_TOKEN`
   - `HELM_KVSTORE_TOKEN`
   - `HELM_SUPERBLOCKS_KEY`
   - `HELM_LAUNCHDARKLY_APIKEY`
   - `HELM_SECRETS_ENCRYPTION_KEY`
   - `HELM_WORKER_KEY_RSA`
   - `HELM_WORKER_KEY_ED25519`

2. **Remove from `Makefile`** (`deploy-helm` target) — remove the corresponding `--set` flags:
   - `--set queue.token=...`
   - `--set kvstore.token=...`
   - `--set superblocks.key=...`
   - `--set launchdarkly.apikey=...`
   - `--set secrets.encryptionKey=...`
   - (worker key flags if applicable)

### Step 4 — Verify

After deploying with ESO enabled, confirm:

```bash
# ExternalSecrets should be in Ready state
kubectl get externalsecret -n cloud-agents

# The synced K8s Secrets should exist
kubectl get secret orchestrator-superblocks-key orchestrator-redis orchestrator-launchdarkly orchestrator-secrets-encryption -n cloud-agents

# Pods should be Running (secrets mounted correctly)
kubectl get pods -n cloud-agents
```

---

## ESO is already installed

The `ClusterSecretStore` named `aws-secrets-manager` is already deployed in the cluster (managed in `dedicated-deployment/kubernetes/modules/external-secrets/`). No changes to ESO itself are needed.

---

## CI Limitations

CI integration tests deploy to a local kind cluster which does not have ESO installed. When `externalSecrets.enabled: true`, the chart renders `ExternalSecret` resources instead of vanilla `Secret` objects. Without ESO running, those K8s Secrets are never created, pods fail with `CreateContainerConfigError`, and `helm upgrade --wait` times out.

Installing only the ESO CRDs is not sufficient — CRDs teach Kubernetes the schema but don't sync secrets. The full operator must be running.

**Current workaround:** CI values files set `externalSecrets.enabled: false`, which causes secrets to be created the old way (from `--set` values). This means the `ExternalSecret` templates are not exercised in CI.

**Future improvement:** To properly test ESO in CI, the kind cluster setup would need to:

1. Install the ESO operator via Helm during cluster bootstrap
2. Create a `ClusterSecretStore` using ESO's built-in `Fake` provider:
   ```yaml
   apiVersion: external-secrets.io/v1
   kind: ClusterSecretStore
   metadata:
     name: aws-secrets-manager
   spec:
     provider:
       fake:
         data:
           - key: ci/superblocks/orchestrator_superblocks_key
             value: 'koala'
           - key: ci/superblocks/orchestrator_redis_store_token
             value: 'koala'
           - key: ci/superblocks/orchestrator_redis_transport_token
             value: 'koala'
           - key: ci/superblocks/orchestrator_launchdarkly_apikey
             value: 'koala'
           - key: ci/superblocks/orchestrator_secrets_encryption_key
             value: 'koala'
           - key: ci/superblocks/worker_tunnel_private_key_rsa
             value: 'dev-rsa-key'
           - key: ci/superblocks/worker_tunnel_private_key_ed25519
             value: 'dev-ed-key'
   ```
3. Update CI values files to remove `externalSecrets.enabled: false` and set the fake remote ref paths

This is tracked as a follow-up improvement and should be done as a separate PR.
