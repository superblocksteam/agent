# Observability

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
