# Observability

## Disabling Telemetry

By default, the agent sends telemetry (traces, logs, and events) to Superblocks intake endpoints. You can disable this for compliance, air-gapped environments, or local development.

### Disable All Remote Telemetry

Set a single environment variable to turn off all outbound telemetry:

```bash
SUPERBLOCKS_ORCHESTRATOR_TELEMETRY_REMOTE_ENABLED=false
```

This disables:
- **OTEL traces and logs** (falls back to stdout via `stdouttrace`)
- **Remote logs** (emitter to `logs.intake.superblocks.com`)
- **Audit logs** (emitter to metadata intake)
- **Events** (emitter to `events.intake.superblocks.com`)
- **Cloud events** (inbound gRPC event listener)

Local console logging and Prometheus metrics (`/metrics` on port `9090`) remain available.

### Disable Individual Components

For finer-grained control, disable specific telemetry components independently:

| Environment Variable | Default | Description |
|---|---|---|
| `SUPERBLOCKS_ORCHESTRATOR_OTEL_COLLECTOR_HTTP_URL` | `https://traces.intake.superblocks.com/v1/traces` | OTLP HTTP endpoint for traces, logs, and metrics. Set to `""` to disable (traces fall back to stdout). |
| `SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_ENABLED` | `true` | Remote log emission to `logs.intake.superblocks.com`. |
| `SUPERBLOCKS_ORCHESTRATOR_EMITTER_AUDIT_ENABLED` | `true` | Audit log emission. |
| `SUPERBLOCKS_ORCHESTRATOR_EMITTER_EVENT_ENABLED` | `true` | Event emission. |
| `SUPERBLOCKS_ORCHESTRATOR_EVENTS_CLOUD_ENABLED` | `false` | Cloud event listener (gRPC). |

Example -- disable only OTEL traces while keeping logs and events:

```bash
SUPERBLOCKS_ORCHESTRATOR_OTEL_COLLECTOR_HTTP_URL=""
```

### Redirecting Telemetry

To send telemetry to your own collector instead of Superblocks, point the OTLP URL to your endpoint:

```bash
SUPERBLOCKS_ORCHESTRATOR_OTEL_COLLECTOR_HTTP_URL="https://your-otel-collector:4318/v1/traces"
```

The agent derives the logs endpoint (`/v1/logs`) and metrics endpoint (`/v1/metrics`) from this base URL automatically.

### What Remains Active

Even with all remote telemetry disabled:
- **Prometheus metrics** are served at `/metrics` on the metrics port (default `9090`). These are pull-based and do not send data externally.
- **Local console logs** continue to write to stdout/stderr.

---

## Traces

The agent flushes OpenTelemetry traces from four **services** that can be set in DataDog with the `service` label 👇

```unset
orchestrator    the orchestrator component
   worker.go    the worker executing plugins written in Golang
   worker.py    the worker executing plugins written in Python
   worker.js    the worker executing plugins written in JavaScript
```

Most spans contain the following sets of attributes, which DataDog calls tags, which can aid in filtering while in DataDog 👇

```unset
           api-id    the identifier of the api
         api-name    the name of the api
         api-type    the type of the api
organization-name    the name of the organization
  organization-id    the identifier of the organization 
organization-tier    the tier of the organization 
   correlation-id    the unique id that persists for all logs and spans for an execution
          profile    the profile selected for the execution
    resource-name    the name of the resource the span is observing
    resource-type    the type of the resource the span is observing
          version    the version of the agent
```

Each span has one of the following names, which DataDog calls **resources**, that can also be filtered upon with the `resource_name` label. Here is a non-exhaustive list 👇

```unset
        execute.api.await    the root span name for synchronous api executions
       execute.api.stream    the root span name for asynchronous api executions
           engine.resolve    the complete resolution of a script by the engine
     execute.block.<type>    observes the resolution of a block
    execute.step.<plugin>    observes the execution of a step block from the orchestrator
  execute.plugin.<plugin>    observes the execution of a plugin from the workers
                   v8.run    observes the execution of a new v8 script
               v8.context    observes the creation of a new v8 context
               v8.isolate    observes the creation of a new v8 isolate
        esbuild.transform    observes the transpilation of bindings prior to execution
              store.write    observes any writes to the underlying agent store (redis, grpc, etc)
               store.read    observes any reads from the underlying agent store (redis, grpc, etc)
                fetch.api    observes the retrieval of the api definition hydrated with configurations
                fetch.job    observes the retrieval of job definitions hydrated with configurations
            fetch.secrets    observes the retrieval of secret values
        fetch.integration    observes the retrieval of an integration configuration
       fetch.integrations    observes the retrieval of an integration configurations
           fetch.bindings    observes the retrieval of bindings values by language plugins
```
