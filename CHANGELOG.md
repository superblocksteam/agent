# Changelog

All notable changes for the Superblocks' On-Premise Agent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## vNext

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
