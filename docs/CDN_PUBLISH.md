# Publishing OPA artifacts to the CDN

The public On-Premise Agent (OPA) deployment artifacts are served from
`https://charts.superblocks.com/agent/` (backed by the
`s3://superblocks-public-helm-repo/agent/` bucket, fronted by CloudFront). Customers
and the Superblocks cloud product read these instead of the `agent` GitHub repo,
which is private. This doc covers how they get published and how to operate it.

## Published artifacts

On every release, [`publish-agent-cdn.yml`](../.github/workflows/publish-agent-cdn.yml)
publishes to `/agent/`:

| Artifact | Source in this repo | Consumer |
| --- | --- | --- |
| `compose.yaml`, `compose.traefik.yaml`, `tls.yaml`, `traefik.yaml` | repo root | `quickstart.sh`, docs (docker compose install) |
| `quickstart.sh` | `scripts/quickstart.sh` | VM install (`curl … \| sh`) |
| `CHANGELOG.md` | repo root | upgrade docs |
| `certs/testCert.pem` | `certs/` | sample self-signed TLS cert for the Traefik path |
| `latest.json` | generated (`{"version":"<tag>"}`) | monorepo `/api/v1/agent-latest-version` (the "data plane outdated" nudge) |
| `sha256sums.txt` | generated | publish round-trip / cache check |

`values.yaml` is **not** published — the docs generate it locally via
`helm show values superblocks/superblocks-agent`. The private key `certs/testKey.pem`
is **never** published (a private key must not live on a public CDN); `tls.yaml`'s
sample TLS path expects users to supply their own key.

## How it runs

- **On release:** `opa_release.yml`'s `publish-cdn` job calls this workflow after the
  `release` job, passing the released `version`. Artifacts are sourced from the
  `agent-<version>` git tag the release job creates.
- **Manual / backfill:** dispatch `publish-agent-cdn.yml` (Actions tab) with
  `version` = an existing release (e.g. `v1.42.0`). Use this to publish a release
  whose CDN publish was missed or failed. It is idempotent. **Run manual dispatches
  one at a time** — the rollback guard reads the current `latest.json` but does not
  lock, so two concurrent dispatches could interleave and publish out of order.

The workflow validates the version, refuses to roll `latest.json` **backward**
(dispatch with `force: true` to override), publishes each file with
`Cache-Control: no-cache`, invalidates `/agent/*` and waits for the invalidation to
complete, then verifies every artifact byte-for-byte (sha256) plus `latest.json`'s
content-type and version. A mismatch fails the run.

## Auth / trust model

The workflow assumes `agent_cdn_publish_cicd_role` via GitHub OIDC. That role
(terraform `aws/prod/cloudfront/public-helm-repo/us-west-2/iam.tf`):

- trusts **only** `repo:superblocksteam/orchestrator:ref:refs/heads/main` — so the
  workflow **must run from `main`** (an "Assert running on main" step fails fast
  otherwise),
- is scoped to `s3:PutObject` on `/agent/*` only — it cannot list, delete, or write
  the `/superblocks` helm charts (those are published separately by the `agent`
  mirror's own role).

## Operating notes

- **Recovery during a release:** if `publish-cdn` fails, the OPA image and git tag are
  **already published** by the `release` job. Do **not** re-run the whole release —
  re-dispatch `publish-agent-cdn.yml` with the same `version`.
- **No pruning:** publishing never deletes (`aws s3 cp`, no `--delete`). A renamed or
  removed artifact lingers until manually cleared with `aws s3 rm`. The role cannot
  delete, so cleanup is a deliberate manual action with separate credentials.
- **Latest-only:** there is no per-version snapshot path (`/agent/<version>/…`); the
  CDN always holds the latest release's artifacts. S3 bucket versioning is enabled but
  is not reachable over HTTPS.
- **Monitoring:** a Grafana synthetic check (`opa-agent-latest-version`, terraform
  `tfroots/grafana-sm`) alerts if `latest.json` becomes unreachable, non-200, or loses
  its version field — i.e. if this pipeline silently stops working between releases.
