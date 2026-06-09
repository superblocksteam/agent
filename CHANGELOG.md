# Changelog

All notable changes for the Superblocks' On-Premise Agent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## vNext
- Restrict inline DSL `sb_secrets` bindings to legacy application tokens.
- Fail fast on stalled Databricks connections: set a 120s socket timeout on every Databricks connection path so an expired/revoked OAuth (on-behalf-of) token no longer leaves the worker hanging for the library's 15-minute default (which could pin workers and cascade into 503s). Overridable via the `SUPERBLOCKS_DATABRICKS_SOCKET_TIMEOUT_MS` env var. Databricks auth failures (HTTP 401/403) now surface as a clear "Authorization failed — reconnect the OAuth token" error instead of a generic timeout.
- Upgrade `vm2` from 3.10.5 to 3.11.5 in the JavaScript workers, resolving the known sandbox-escape CVEs (CVE-2026-24118, CVE-2026-24781, CVE-2026-26332, CVE-2026-43997 through CVE-2026-44009, CVE-2026-45411, CVE-2026-47131, CVE-2026-47137, CVE-2026-47140, CVE-2026-47208, CVE-2026-47210; all patched by 3.11.0–3.11.4 per GHSA), and enforce the version floor via a pnpm workspace override
- Upgrade Python worker dependencies to resolve Trivy CVE alerts: `h11` 0.14.0 → 0.16.0 with `httpcore` 1.0.5 → 1.0.9 (CVE-2025-43859) and `nltk` 3.8.1 → 3.9.4 (CVE-2025-14009). **Action required for Python steps using nltk tokenizers:** nltk 3.9 replaced the `punkt` tokenizer data package with `punkt_tab` — steps using `word_tokenize`/`sent_tokenize` must call `nltk.download('punkt_tab')` instead of `nltk.download('punkt')`, otherwise they will raise `LookupError: Resource punkt_tab not found` at runtime
- JavaScript step error messages: with the vm2 upgrade, the `Error on line N` number for blocked-module errors (e.g. `require('child_process')`) now points at the user's actual `require` call instead of an internal offset, and `err.stack` observed inside a step no longer includes sandbox-internal frames. Step execution behavior is unchanged
- Publish Native Database lifecycle capability tags from local lifecycle config during orchestrator registration.
- Add Native Database lifecycle worker support for local `(environment, profile)` configuration resolution using the platform `edit`/`preview`/`deployed` taxonomy.
- Make the Native Database lifecycle materializer cloud-agnostic: the generated root module is now a thin wrapper (backend, typed variables, `module "database"`, outputs) and no longer emits worker-side `provider "aws"`, AWS Secrets Manager data sources, `provider "postgresql"`, or shared-mode `required_providers`. Provider configuration, secret reads, and cloud-specific input validation now belong to the selected Terraform module. Credential-ref allowlist and SSL posture remain enforced at migration time during DSN construction.
- Slim the Native Database lifecycle dispatch payload and collapse ensure operations to `ensure_database`.
- Keep generated Native Database Terraform module calls compatible with existing lifecycle modules while the worker dispatch payload uses the new `(environment, profile)` taxonomy.
- Add Native Database lifecycle worker-side pool client endpoints and allocation coordinator for existing-or-new shared pools.
- Fail fast with structured Native Database lifecycle unsupported-shape errors and add module-shape drift validation.
- Tighten `qs` override and add pnpm security overrides for 12 transitive Node.js dependencies (basic-ftp, fast-uri, path-to-regexp, form-data, js-yaml, glob, ws, minimatch, jws, brace-expansion, bn.js, axios floor guard) to resolve Trivy CVE alerts
- Disable otelgrpc metrics by default. The `rpc_*` metrics (e.g. `rpc_server_call_duration_seconds`, `rpc_client_response_size_bytes`) added significant cardinality overhead from histogram buckets and endpoint labels. Set `SUPERBLOCKS_ORCHESTRATOR_GRPC_OTEL_METRICS_ENABLED=true` to re-enable if needed for debugging.
- Restore `console.log` observability for JavaScript steps: re-enable the legacy remote log emitter in the Go worker and task-manager so that `console.log`/`console.warn`/`console.error` output appears in the Observability logs UI. This restores pre-v1.37 behavior for on-premise (OPA) deployments.
- Only load the `javascriptsdkapi` plugin (instead of all plugins) in the JavaScript SDK sandbox. Loading all plugins increased OPA memory usage by ~1GiB and caused some OPAs to OOM (the JavaScript SDK sandbox only executes `javascriptsdkapi` plugins).
- Fix a case where payload size truncation rendered Clark api traces as "empty object"
- Update `@superblocksteam/sdk-api` version (to `v0.0.7`) to add support for `javascriptsdkapi` plugins to call GraphQL integrations with dynamic headers
- Drain Apps 3.0 API requests when the agent receives a SIGTERM/SIGINT (rather than existing behavior of immediately stopping execution of in-flight requests)
- Improve the error message for Apps 3.0 SDK integration callbacks that are missing orchestrator-signed capability tokens
- Upgrade Go toolchain from 1.26.1 to 1.26.3 and update Docker Go builder images to use the published 1.26.3 trixie image
- Add Native Database lifecycle worker support for Terraform-backed database provisioning: runs in-process alongside the orchestrator servers (off by default), claims dispatches as the agent's own id, with operator-configurable resource-type and module-source allowlisting and optional IRSA via a chart-managed ServiceAccount.
- Allow Terraform `data` sources (e.g. AWS Secrets Manager lookups) for shared PostgreSQL database modules in the lifecycle worker's plan policy.
- Fix Apps 3.0 SDK integration callbacks for embedded external users using short-lived orchestrator-signed capabilities.
- Include `x-superblocks-agent-key` in OTLP metrics upload headers for orchestrator and task-manager exporters
- Disable OTLP log exporting to the collector and rely on the legacy remote logging pipeline instead
- Upgrade axios from 1.13.5 to 1.16.0 across all JavaScript worker packages, addressing CVE-2026-40175, CVE-2025-62718, and 10 additional axios CVEs (SSRF, prototype pollution, DoS)
- Upgrade protobufjs to 7.5.8, node-forge to 1.4.0, and fast-xml-parser to 4.5.6 via pnpm overrides, resolving CVE-2026-41242 (critical protobufjs RCE), CVE-2026-25896 (critical fast-xml-parser XSS), and 11 additional high/medium CVEs
- Upgrade JavaScript worker Node.js runtime from 20.19.5 to 22.22.2 (LTS). All customer-facing dependencies remain at their current versions.
- Upgrade Python worker dependencies: Authlib 1.3.2 to 1.6.12 (CVE-2026-27962 JWT forgery), gevent 21.12.0 to 24.11.1 (CVE-2023-41419), geventhttpclient 2.0.12 to 2.3.9, greenlet 1.1.3 to 3.1.1

## v1.40.0
- Ship OpenTofu in the OPA (agent) image so lifecycle worker mode can run outside the standalone orchestrator image.

## v1.39.0
- Fix OTLP export errors when remote telemetry is disabled: worker processes (Go worker, task-manager) no longer default to `http://127.0.0.1:4318` and the task-manager s6 script now honors an explicitly empty collector URL
- Remove GitHub Packages authentication requirement from OPA Docker build, allowing customers to build the OPA image without an `NPM_TOKEN`

## v1.38.0
- Upgrade Go toolchain pins from 1.25.5 to 1.26.1 and update Docker Go builders to use the published 1.26.1 trixie image
- Add support for inheriting environment variables in the Apps 3.0 API execution environment (via the `SB_EXECUTION_ENV_INCLUSION_LIST`/`SUPERBLOCKS_EXECUTION_ENV_INCLUSION_LIST` environment variable)
- Fix JavaScript worker error messages being truncated to just `Error on line N:` with an empty body when the error stack contains only frame lines (no message prefix)
- Enrich top-level `execute.api.await` tracing spans with `organization-id`, `organization-tier`, `application-id`, and `superblocks.request-id`, and forward W3C baggage propagation across service boundaries

## v1.37.1
- Set `SERVICE_VERSION` build argument in on-premise agent build

## v1.37.0
- Add support for executing Apps 3.0 APIs (`javascriptsdkapi` plugins). These are "code-mode" APIs i.e. backend APIs written entirely in JavaScript (no API DSL), with support for (internally) calling the agent to execute integrations.
- Set Snowflake application connection identifier to "Superblocks" for Snowflake integrations
- Fix Snowflake integration to not perform wildcard matches on schema name when performing metadata lookup
- Inject oauth token into `Authorization` header (if not present) when rendering datasource configs using oauth-code auth type
- Fix parsing of CORS headers, when set via `SUPERBLOCKS_ORCHESTRATOR_CORS_HEADERS` env var, and provided as comma separated list
- Re-expose `crypto` as a global so JavaScript code can use APIs like `crypto.randomUUID()` without explicitly requiring the module
- Expose batch processor settings (`SUPERBLOCKS_TELEMETRY_MAX_QUEUE_SIZE`, `SUPERBLOCKS_TELEMETRY_MAX_EXPORT_BATCH_SIZE`, `SUPERBLOCKS_TELEMETRY_BATCH_TIMEOUT`, `SUPERBLOCKS_TELEMETRY_EXPORT_TIMEOUT`) as operator-tunable env vars

## v1.36.1
- Fix available plugins in on-premise agent (removed `javascriptsdkapi`)

## v1.36.0
- Fix `check-auth` failures for `oauth-token-exchange` integrations
- Upgrade `vm2` to latest version (`v3.10.5`)
- Add Snowflake Postgres support
- Add plugin support for `snowflakecortex` integration

## v1.35.0
- Security patches

## v1.34.0
- Add `atob` and `btoa` polyfills to the WASM sandbox
- Added option to route all control flow related resolution of bindings to the WASM sandbox
- Python worker bug fixes

## v1.33.1
- Add `superblocks.auditLogs.enabled` helm value to allow disabling audit log ingestion (defaults to enabled)
- Add Workforce Identity Federation support for BigQuery
- Add Databricks Lakebase integration
- Upgrade vm2 to latest version (`3.10.4`) with fix for [CVE-2026-22709](https://www.cve.org/CVERecord?id=CVE-2026-22709)

## v1.32.0
- Add support for `parameters` array in SQL plugins for parameterized queries
- Add support for file uploads in 2.0 apps
- Require authorization header for inline definitions in `/v2/execute`, `/v2/execute/stream`, and `/v2/execute/twoway` endpoints to prevent anonymous code execution while still allowing public apps (fetch by ID) to work
- Upgrade Go 1.25.1 → 1.25.5, golang.org/x/crypto v0.41.0 → v0.45.0, golang.org/x/sync v0.17.0 → v0.18.0, golang.org/x/text v0.28.0 → v0.31.0 and run `apt-get upgrade -y` in Dockerfiles to resolve CVEs.
- Do not fail when primitive values are used as inputs to Python APIs, similar to JavaScript APIs
- Validate view mode against profiles for API execution with provided definition
- Restrict access to blocked packages in JavaScript steps via: dynamic import, `eval`, and Function constructors
- Update JavaScript worker to execute language steps within `vm2`
- Support generating presigned PUT URLs for s3
- Add support for Kubernetes Gateway API as an alternative to Ingress for routing traffic to the agent
- Update FilePicker download endpoint to ensure requested download paths are under the temp directory
- Add WASM-based sandbox using QuickJS for more secure JavaScript binding resolution
- Require authorization header for `/v2/test` endpoint to prevent unauthenticated environment variable access
- Enforce WASM sandbox memory limit for host-side allocations
- Pass a memory limit to the WASM sandbox
- Control the WASM bindings sandbox rollout via LaunchDarkly
- Add `Date` object marshalling support in WASM sandbox (`Date` objects are now preserved when passing between host and VM in both directions).
- Add `JavaScriptWASM` plugin type for executing pure JS steps within the WASM sandbox.

## v1.31.0
- Add support for restricting imports and built in functions in Python language execution steps
- Properly clear the environment of Python execution step sandboxes

## v1.30.0
- Add retry logic to Databricks metadata requests in case of rate-limiting
- Update VM2 to patch vulnerability
- Upgraded Python OTel libraries to v1.16.0
- Add (plugin) support for `openai_v2` based integrations

## v1.29.1
- Set a default password for the agent's internal redis instance

## v1.29.0
- Use Databricks Unity Catalog to fetch metadata via REST
- Disable script and function execution in the agent's redis server
- Add support for setting a password for the default user in the agent's redis server

## v1.28.1
- Upgraded Redis to ^v8.2.2, with patch for [CVE-2025-49844](https://github.com/redis/redis/security/advisories/GHSA-4789-qfc9-5f9q)

## v1.28.0
- Updated Databricks integration `test` to timeout after 5000ms

## v1.27.0
- Added support for header value prefix in auth injection flow
- Added support of Oauth Token Federation auth for Databricks
- Fixed new bindings syntax support for bindings that require legacy resolution and an expression in the template literal contains the token separator string (i.e. `", "`)
   - e.g. `${JSON.stringify({ name: "test", enabled: true })}`
- Added support for "oauth on behalf of token exchange" in Salesforce integration

## v1.26.0
- Added support for the `metadata` endpoint in the GraphQL integration
- Added support for custom SubjectTokenType on "oauth on behalf of token exchange" flows
- Updated types for Salesforce integration to support "oauth on behalf of token exchange"
- Added types support for new Confluence integration
- Added support for custom object schemas in Salesforce
- Added flag `agent.plugins.auth.validate_subject_token_during_obo_flow.enabled` to determine whether we should validate the subject token during "oauth on behalf of token exchange" flows

## v1.25.0

- Fixed workflow steps in path based apis to execute the desired workflow as expected (previously failed with `NotFoundError`)
- Added support for new JavaScript template literals bindings syntax in arguments for workflows
- Fixed `return`, `send` and `wait` blocks functionality when using new bindings syntax (JavaScript template literal or IIFE)
- Added preview scoped token type
- Updated scoped token claims to match the claims provided by the server (where the JWTs are generated)

## v1.24.0

- Updated binding resolution to treat entire fields in APIs as bindings for APIs fetched by path
- Fix binding resolution of template literals for plugins requiring legacy binding resolution (i.e. JavaScript worker performs binding resolution)
- Fix an issue where workflow parameters could be referenced unsafely causing a panic

## v1.23.0

- Fail silently when trying to delete a GSheets integration that has already been revoked
- Switch to using pointers for custom JWT claims in JWT middleware and scoped token permissions JWTs
- Add raw JWT to Go context when using the scoped permissions JWT validators
- Updated the flow for detecting if JWT middleware should be used
- Updated execution inputs to use `Global.user` derived from Superblocks JWT
- Updated claims required to be present in a JWT for agent authorization
- Updated the "oauth on behalf of token exchange" flow to use the identity provider access token from the Superblocks JWT instead of from the Auth0 JWT
- Changed token scopes to match existing RBAC permissions
- Added support for scoped (JWT) tokens with multiple scopes
- Added support for API-level authorization
- Added support for resolving integration configurations using the new (JavaScript template literals) bindings syntax

## v1.22.0

- Included azure blob storage and azure identities libraries to python worker
- Generalized JWT middleware to allow for better reusability across repositories (moved agent specific validation to internal package)
- Overwrite the default `requirements.txt` file with the contents of the desired requirements file (only affects `slim` variant and custom image builds)
- Added scoped permission JWT types and validators to orchestrator
- Updated Auth Code/Password Grant flows to enable bindings in certain fields

## v1.21.0

- Updated `slim` image builds to support `package-slim.json` files in any `worker.js` subdirectory
- Added `slim` variant to `packages/plugins/javascript` package (i.e. `package-slim.json`) which keeps only dependencies required for binding resolution
- Added `SUPERBLOCKS_AGENT_REDIS_SOCKET_TIMEOUT_SECONDS` to configure socket timeout for Redis client in Python worker
- Update OPA Dockerfile's `WORKER_JS_PREPARE_FS_ARGS` argument's default value to match value for building `slim` variant
- Update OPA variants doc with new arguments for building `standard`/`slim` variants
- Fix the agent Helm Chart to support gRPC routes
- Fix OOM from reusing Javascript context within an API's binding resolutions

## v1.20.0

- Added support for fetching (and executing) APIs referenced by application ID and path, rather than by api ID
- Fixed bug in building query parameters list for DB plugins leveraging '?' placeholder syntax (repeated bindings fix)
- Bump golang version to 1.23.7
- Added support for referencing dynamic workflow response as {{credentials.response}}

## v1.19.0

- Updated Snowflake integration to not include `INFORMATION_SCHEMA` data in metadata
- Updated Snowflake integration to pipe through database, schema, warehouse, and role for key-pair and sso auth types
- Updated `slim` image to only include JavaScript packages required to run the JavaScript worker
- Added support for performing new "oauth on behalf of token exchange" auth type
- Added support for static subject token sources in "oauth2 on-behalf-of token exchange" auth type
- Updated token forwarding auth type with IDP subject tokens to explicitly fail for workflows and scheduled jobs
- Added support for "authTypeField" in integration OAuth flow
- Updated Snowflake integration to support "oauth2 on-behalf-of token exchange" auth type
- Explicitly shutdown prometheus metrics server when Python worker terminates
- Update `CheckAuth` to support integration configurations using the OAuth on-behalf-of token exchange auth type
- Updated Snowflake node sdk to `v1.15.0` and disabled OCSP checking when connecting to Snowflake

## v1.18.0

- Added support for creating a worksheet in GSheets integration
- Refactor `launchdarkly` client to separate wrapper around LaunchDarkly SDK into its own package separate from the interface for agent specific flags
- Fixed bug in Redis integration that caused some raw Redis queries to error unexpectedly
- Added support for exposing claims as part of Oauth payloads in the Oauth Code authorization flows

## v1.17.0

- Upgrade Google Cloud Secret Manager Go package to `v1.14.2` (fixes "certificate_config.json: permission denied" error connecting to GCP secret manager)
- Added support for key-pair authentication in Snowflake Plugin
- Add support for machine-to-machine (M2M) authentication for Databricks plugin
- Update `WaitGroup` runnable to block `Close` method on the `WaitGroup` completing (addresses `redis: client is closed` errors)
- Allow branch name to be given in workflow HTTP requests as a header: `X-Superblocks-Branch`
- Add `last_updated` field to the `Resource` proto, and set last updated time in update signature requests to server
- Fixed projection for findOne action in MongoDB integration

## v1.16.0

- Update signing rotation endpoint for APIs
- 403 status codes from the server now return as 403 instead of 500
- Added Superblocks partner ID to the Databricks integration
- Fix scheduled job execution for signed jobs (when signature verification is enabled)
- Now return Kinesis Plugin Metadata
- Add signing key's corresponding public key and algorithm to the `Signature` proto message
- Fixes to Couchbase Plugin
- Add "signature rotation errors" field to `UpdateApiSignature` and `UpdateApplicationSignature` proto messages (move existing `Signature` into `result` oneof field)
- Added `prefix` and `delimeter` support to S3 Plugin
- Added [`moment-timezone`](https://www.npmjs.com/package/moment-timezone) package to JavaScript worker
- Bump superblocksteam/run dep to v0.0.6
- Include signing algorithms with verification keys when registering agent
- Include signing algorithm and public key in response from Sign endpoint (`/v1/signature/sign`)
- Set errors on responses for all resources that fail to get re-signed during a signature rotation job
- Improved error messages in Email Plugin

## v1.15.1

- Updated debian packages to address a few vulnerabilities

## v1.15.0

- Added support for Okta SSO in the Snowflake plugin
- Fix connection string support for RedShift, MySQL, MariaDB, Postgres, CockroachDB
- Added connection string support for RedShift, MySQL, MariaDB, Postgres, CockroachDB
- Fix Snowflake template version
- Fix connection for Snowflake integration so we do not hang for 90 seconds on an invalid configuration
- Added AWS Kinesis plugin
- Fix worker/js helm limits.memory
- Update shutdown ordering so critical processes are not terminated prior to the webserver
- Update dependencies to remove critical vulnerabilities in wget and libexpat1
- Added support for enabling `restapi`, `restapiintegration`, `openapi`, `graphql` and `graphqlintegration` plugins to return more verbose HTTP response data in result (e.g. response status text, status code, etc.)
- Added support for configuring whether or not a step using a `restapi`, `restapiintegration` or `openapi` plugin fails if the underlying web request fails
- Added support for configuring whether or not a step using a `graphql` or `graphqlintegration` plugin fails if the GraphQL query returns with errors

## v1.14.1

- Change `v1.security.Resource.config.api` type from `v1.Api` to `google.protobuf.Value` well known type

## v1.14.0

- Added support of action config to test method

## v1.13.0

- Added ViewMode to API start/end logs
- Added ViewMode to Block start/end logs
- Add comprehensive logger fields to oauth code
- Change: Support signing and verifying APIs at different versions than the agent

## v1.12.0

- Added support for new Akeyless Secrets Manager

## v1.11.0

- Set component field for remote logs from worker.go and worker.js
- Update worker request baggage to include additional metadata to be included in remote logs
  - e.g. `agent-id`, `agent-version`, `application-id`, etc.
- Update python worker idle milliseconds metric to be active seconds metric
- Change: `signature.enabled` is renamed `signature.verification.enabled` to more accurately
  represent what it does (disable/enable verification only; `signature.signing_key_id` controls
  signing)
- Change: all `signature.keys` are sent during agent registration to server regardless of the
  value of `signature.verification.enabled` (v1.10.2 introduced an awkward state where verification
  keys were not advertised during registration)
- Change: when `signature.signing_key_id` is enabled, start watching superblocks server for rotation
  events
- Add: new `signature.batch.size` which configures the batch size of resources to claim from server
- Add 8 new LLM integrations.
- Support streaming for the REST integration.

## v1.10.2

- Change: default `example` signing key and verification keys are removed.
- OPAs now skip ratelimiting logic as it's extra network calls for no benefit
- Fix: python file descripter leak resulting in `Too many open files`
- Couchbase integration now accepts connection strings

## v1.10.1

- Switch to using W3C trace propagator
- Fix: Include verification key IDs in agent registration request

## v1.10.0

- Fix: Integrations with Dynamic Workflow Configuration now pass Profile during "Test Connection"
- Change: Bumped Microsoft SQL integration to support URI connection strings
- Switch to using asymmetric keys (ED25519) for resource signing/verification

## v1.9.3

- OPAs now skip ratelimiting logic as it's extra network calls for no benefit

## v1.9.2

- ?

## v1.9.1

- Support `web3` module in Javascript steps.

## v1.9.0

- **Breaking** Defaults for `events.cloud.enabled` set to false, as this was producing large amounts of error logs for EU customers. This flag is only used for signing and signing has not be enabled for EU customers yet.
  - For customers that have signing enabled, we must ask them to enable `SUPERBLOCKS_ORCHESTRATOR_EVENTS_CLOUD_ENABLED=true`
- Fix bug that prevented observability events to be authenticated correctly.

## v1.8.1

- Ensure redis is shutdown after all executions have been drained.
- Fix bug preventing OpenAPI integrations from honoring delegated binding resolution.
- Auto refresh renewable access tokens for HashiCorp Vault secret integrations.

## v1.8.0

- Fix the os environment bindings for plugin tests and metadata calls.

## v1.7.4

- Propagating `X-Superblocks-Authorization` header when talking to the new Global Edge Network.
- Add more descriptive `User-Agent` header when talking to Superblocks.
- When an API is cancelled, show "context cancelled" instead of `Internal Error` in the audit logs.
- Add `application-id` and `page-id` to observability logs.

## v1.7.3

- Fixed plugin ID in OpenAPI integration step execution logs
- Enable the process pool worker
- Fixed issue in the python worker that resulted synchronous executions of steps
- Fixed issue in the python worker where steps would potentially block against concurrently running steps
- Fixed issue in the python worker where setting log level in non-uppercase would crash the worker

## v1.7.2

- Fixed observability logging of worker.go to propagate to downstream systems
- Added support for the `Elasticsearch` integration
- Expose `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` environment variable in Python sandbox (for use in Python language steps)

## v1.7.1

- Release slim OPA
- Fixed missing `deasync` dependency in arm OPA image. Moved to building `deasync` from source since maintainer does not build the module for all node versions and architectures.

## v1.7.0

- Deprecated internal gRPC transport and all configuration parameters in favor of adding redis to the all-in-one container
- Fixed memory leak with the v8 plugin
- Fixed hanging apis when running with high parallelism
- Fixed agent panics when running with high parallelism
- Fixed loops timing out when running the REST plugin with basic auth
- Exposed configuration for API timeout
- Enable new integrations for OPA: Confluent, Redpanda, Couchbase, Databricks, Oracle Database
- Reduced baseline memory by 100Mb

## v1.6.1

- Introduce a shorter version for some of our agent environment variables. For example, you can use `SB_AGENT_KEY` instead of specifying both `SUPERBLOCKS_AGENT_KEY` and `SUPERBLOCKS_ORCHESTRATOR_SUPERBLOCKS_KEY`.
- Bump a lot of dependencies.
- Start sending traffic JavaScript code that can be run in V8 to the new Go worker.

## v1.6.0

- Added the `EXPOSE` directive to the OPA's Dockerfile so that it can be inspected by vendors like Aptible.
- Introduced support for an RSA JWT to be utilized later.
- Bump a lot of dependencies.
- Utilized the new superblocksteam/run project.
- Fix a few flacky tests.
- Fix a few graceful shutdown issues.

- Introduced [s6](https://github.com/just-containers/s6-overlay) as our process manager for the container. This will ensure that all processes within the container received the proper signals and are given the opportunity to shut down gracefully.
- Bump a lot of dependencies.

## v1.4.4

- Introduced [s6](https://github.com/just-containers/s6-overlay) as our process manager for the container. This will ensure that all processes within the container received the proper signals and are given the opportunity to shut down gracefully.
- Bump a lot of dependencies.

## v1.4.3

- Added `date-fns==3.3.1` to the list of JavaScript dependencies

## v1.3.3

- Fixes an issue where OAuth tokens used in the Authentication Code flow would be too aggressively cached

## v1.3.2

- Fixes an issue where non-lang plugins could not access the Filepicker

## v1.3.1

- Log a warning if invalid mode is used in Filepicker
- Separate Kafka Consumer and Producer
- Update multiple Go dependencies
- Pass duration in seconds to quota error
- Use Kafka transactions for 2 and more messages
- Do not default access token's expiration to 1 day if expires_in = 0 or missing in exchange code response

## v1.2.1

- Fixes an issue with Google Sheets where sheet names dropdown is not loading

## v1.2.0

- Update multiple Go dependencies.
- Ensure that all operations executed against a v8 isolate occurr in the same go routine it was created in.
- Add gRPC middleware to catch client cancellations to provide a better error message.
- Fixes segfault when logging error detail
- Logs internal error, returned by clients.Check
- Updates orchestrator to parse imports for javascript steps
- Adds support for id_token in OAuth Code flow
- Ensure a step can run for as long as the API has left.
- Add JavaScript polyfile for "console".
- Stops passing the test workflow body values to deployed runs

## v1.1.2

- Fixes an issue with the observability pipeline where plugin errors and logging were not piped to customer telemetry sinks

## v1.1.1

- Fixes an issue regarding large nested objects causing Python performance issues

## v1.1.0

## v1.0.15

- Allows users to configure size limits in their OPAs, this currently defaults to 30MB. For the OPA these will need to be raised in tandem.
- SUPERBLOCKS_ORCHESTRATOR_GRPC_MSG_REQ_MAX
- SUPERBLOCKS_ORCHESTRATOR_GRPC_MSG_RES_MAX

## v1.0.14

- Removes the logging of the request values in the orchestrator

## v1.0.13

- Fixes an issue with the OPA where the healthchecks will return 500 after 30 minutes of the agent being idle

## v1.0.12

- Fixes an issue with Google Sheets integration metadata call
- Gracefully handle nil pointer dereference when an workflow returns an unexpected nil output

## v1.0.11

- [SECURITY] Prevents logs from printing out API action configs in the worker logs

## v1.0.10

- Disables the signing feature in the OPA by default as it's currently still unreleased.

## v1.0.9

- Fixes issue with subject not being correctly set in emails sent via Email plugin steps

## v1.0.8

- Adds use of Superblocks-controlled template for emails sent using the Email plugin

## v1.0.7

- Fixes issues with reading the 2nd file from the Filepicker
- Fixes issues with plugin metadata responses being rejected due to validation error
- Fix panic when a workflow response is null and adds debug logging to surface those issues

## v1.0.6

- Fixes issue with Python steps being unable to read files due to BlockingIO
- Fixes issue with MongoDB steps failing due to "Unexpected struct type" error

## v1.0.5

- Adds support for fetching branch-specific API definitions

## v1.0.4

- Fixes visibility of new REST authentication methods (API tokens forms for integrations like Datadog, CircleCI, etc.)
- Adds support for SMPT integration

## v1.0.3

- Fixes issue with executing API steps that use OpenAPI integrations

## v1.0.2

- Introduce ARM image for local testing and deployment

## v1.0.1

- Addresses python plugin bugs:
- Issue where python plugin is no longer able to use attribute notation to access dictionary keys
- Issue where python was unable to read file contents via the FilePicker component

## v1.0.0

- Orchestrator based OPA released
- Supports control-flow execution
