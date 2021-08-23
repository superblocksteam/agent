# On-Premise Agent (OPA)

This document contains configuration and deployment details for running the Superblocks agent independently.

## Configuration

The agent application can be configured via the use of several environment variables.

| Name                                            | Description                                                                      | Required | Default                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------- | -------- | ----------------------------- |
| SUPERBLOCKS_AGENT_ID                            | UUID used by Superblocks Cloud to identify the agent                             | Yes      | n/a                           |
| SUPERBLOCKS_AGENT_PORT                          | HTTP port that the agent listens on                                              | No       | 8020                          |
| SUPERBLOCKS_AGENT_EXECUTION_JS_TIMEOUT_MS       | Timeout (in ms) for a given Javascript API Step execution                        | No       | 30000                         |
| SUPERBLOCKS_AGENT_EXECUTION_PYTHON_TIMEOUT_MS   | Timeout (in ms) for a given Python API Step execution                            | No       | 30000                         |
| SUPERBLOCKS_AGENT_LOG_LEVEL                     | Log level; one of 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent' | No       | info                          |
| SUPERBLOCKS_AGENT_LOG_DISABLE_PRETTY            | Flag to toggle pretty printing of logs                                           | No       | true                          |
| SUPERBLOCKS_AGENT_LOG_DISABLE_EXPRESS           | Flag to toggle printing of Express request/response logs                         | No       | true                          |
| SUPERBLOCKS_AGENT_DATADOG_DISABLE_TRACER        | Flag to disable/enable Datadog tracing                                           | No       | true                          |
| SUPERBLOCKS_AGENT_DATADOG_CONNECT_TAGS          | Array (comma-separated) of tags to be added to Datadog histograms                | No       | app:superblocks               |
| SUPERBLOCKS_AGENT_DATADOG_DISABLE_LOG_INJECTION | Flag to disable/enable the injection of Datadog trace ID in log records          | No       | true                          |
| SUPERBLOCKS_SERVER_URL                          | Superblocks Cloud host that the agent will make fetch calls to                   | No       | https://app.superblockshq.com |
| SUPERBLOCKS_AGENT_JSON_PARSE_LIMIT              | Express request body limit (in mb)                                               | No       | 50mb                          |

## Deployment

### docker

To deploy the Superblocks agent using docker, run the following command:

```sh
docker run --name superblocks-agent --env SUPERBLOCKS_AGENT_ID=<agent-id> --publish <agent-port>:<agent-port> --cpus="0.5" --memory="128m" --rm ghcr.io/superblocksteam/agent:v0.1.0
```

### docker-compose

The Superblocks agent can also be deployed using docker-compose.

To do so, first create a `docker-compose.yml` file and save the following content in it.

```yaml
version: '3.7'

services:
  agent:
    container_name: superblocks-agent
    image: ghcr.io/superblocksteam/agent:v0.1.0
    environment:
      - SUPERBLOCKS_AGENT_ID=<agent-id>
    ports:
      - '<agent-port>:<agent-port>'
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: '128m'
```

Then, run the following command:

```sh
docker-compose --compatibility -f ./docker-compose.yml -p superblocks up -d
```

**Note**: The agent ID (`<agent-id>`) is a placeholder and should be different for each organization for which the agent is being deployed. The agent port is configurable; `<agent-port>` should be replaced with either the custom port or 8020 (if the default is being used).
