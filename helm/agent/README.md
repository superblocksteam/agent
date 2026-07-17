# Superblocks helm chart

This is a reference helm chart for deploying the Superblocks agent onto a Kubernetes cluster.

## Native Database lifecycle

Set `databaseLifecycle.enabled=true` to run the Native Database lifecycle worker
inside the OPA orchestrator process. The chart converts named
`databaseLifecycle.groups` into the worker's existing
`SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG` environment variable. A group bundles
one or more lifecycle environments that share a pool policy and native
Terraform input maps. Each environment can appear in only one group; profiles
are routing aliases that share the environment's physical pool. PostgreSQL is
the only supported engine and is not an operator input. Set a group's
`pool.maxDatabases` to `1` for one logical database per newly provisioned
physical database. Drain older larger pools before changing an existing
environment to this setting.

Physical provisioning on pool exhaustion is enabled by default. Set
`databaseLifecycle.physicalProvisioning.enabled=false` to use only physical
databases already registered with the control plane; groups can omit
`physicalModuleInputs` in this mode.

The worker requires:

- an `allowedResourceTypes` allowlist
- `backend.bucket` and `backend.region`
- an IRSA-capable ServiceAccount, configured through
  `serviceAccount.annotations`
- an explicit `sslMode` (`verify-full` with `sslRootCert` for production)

The chart derives the module-source allowlist from `modules.logical.source` and
`modules.physical.source`. Its built-in sources pin the internal
`terraform-superblocks-databases` `v0.3.3` modules. Customer installs should keep
that exact `vX.Y.Z` pin. For Superblocks EE and other internal testing, override
`databaseLifecycle.modules.*.source` to the same git module URL with
`?ref=latest` (for example
`git::https://github.com/superblocksteam/terraform-superblocks-databases.git//modules/postgres-managed-database?ref=latest`)
so workers track the mutable channel tag without changing chart defaults.
Because the module repository is not yet public, internal deployments need
GitHub access until the customer release checklist is complete.

Image builds embed the Native DB module package under
`/opt/superblocks/terraform-modules`, fetched at build time from the floating
git `latest` tag. No version pin is checked into orchestrator; the resolved
commit is written into the image as `VERSION`/`COMMIT` sidecars.
Security-conscious deployments can avoid runtime module downloads by
overriding the logical and physical sources to
`./modules/postgres-managed-database` and `./modules/aws-rds-managed-instance`.
The lifecycle materializer copies the whole package into each protected work
directory so sibling module references continue to resolve. Keep both sources
on the same embedded release.

Fields under `logicalModuleInputs` and `physicalModuleInputs` use the selected
Terraform modules' native variable names. Database sizing such as
`instance_class`, `allocated_storage`, and `multi_az` belongs there. In
contrast, `pool.maxDatabases` is worker-owned pool allocation metadata and is
not passed to Terraform. The chart rejects the reserved `capacity_max`,
`credential_resolver`, and `security_class` physical module input keys.

Use `databaseLifecycle.physicalModuleTags` for tags that must apply to every
physical database module, such as deployment correlation or cost attribution.
The chart merges these with each group's `physicalModuleInputs.tags`;
deployment-wide values win when both maps contain the same key.

The worker no longer consumes
`SUPERBLOCKS_DATABASE_LIFECYCLE_MODULE_SHAPES`. OpenTofu validates generated
module calls against the actual pinned module. Advanced deployments can still
supply a complete manual `SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG` through
`extraEnv`; when present, it replaces generated group config. Manual custom
modules use the same `modules.logical.source` and `modules.physical.source`
values as generated config. Legacy MODULE_SHAPES values are tolerated but
ignored by the worker.

See `tests/fixtures/database-lifecycle-config-values.yaml` for a complete
rendering example.

## Contributing

Please ensure that the Chart version in the `Chart.yaml` is bumped accordingly with your changes.
