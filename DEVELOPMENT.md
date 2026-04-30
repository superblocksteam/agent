# Development

This guide illustrates how to bootstrap the agent locally.

## Install dependencies

You need to have gmake 4.4.1+ installed:

```
$ brew install make
```

This will install gnu make, but with the binary name of `gmake`, so alias `make` to be `gmake`:

```
$ echo 'alias make=gmake' >> ~/.zshrc
```

As well as some other tools:

```
$ npm install -g protoc-gen-ts grpc-tools
```

## Running the agent locally

The agent is comprised of 5 components. Run each of them separately. Each of the following instructions sets assumes that you are in the root of the repository. Here are some tips as you get started 👇

- If you aren't actively developing against this repository and just want to run the agent, you can build and run with Docker using the instructions in the [quick start](./README.md#quick-start).
- You only need to run the workers that you want to. For example, if you never plan on running any Python blocks, then you don't need to run the Python worker.

```sh
# redis
$ docker run --rm -d -p 6379:6379 --name redis redis:6.2.14 redis-server --requirepass koala
```

```sh
# golang worker
$ cd workers/golang
$ make up
```

```sh
# python worker
$ cd workers/python
$ make up
```

```sh
# javascript worker
$ cd workers/javascript
$ make up
```

```sh
# orchestrator
$ air
```

## Ephemeral worker stack (native, multi-process)

`Makefile.ephemeral` builds and runs the orchestrator, task-managers, JavaScript sandboxes, and go-worker as native processes with Redis and the Python sandbox in Docker. The topology mirrors cloud staging (dedicated task-managers per plugin class, plus an auxiliary TM for `postgres`/`restapi`/`s3`/etc.), so it is a closer reproduction of production behavior than the one-worker-each setup above.

Use this when:

- Testing orchestrator features end-to-end against a remote Superblocks server (staging or a PR env) without also running the monorepo locally.
- Reproducing staging routing that depends on the dedicated SDK API task-manager + sandbox (`javascriptsdkapi` / Code Mode API 2.0).

### All-in-one

```sh
# OPA mode against a PR env. Agent registers against the remote server's
# /api/v1/organizations/<org-id>/agent-keys endpoint.
$ SUPERBLOCKS_AGENT_SERVER_URL=https://pr-1234.superblocks.dev \
  SUPERBLOCKS_AGENT_KEY=<registered-agent-key> \
  SUPERBLOCKS_AGENT_HOST_URL=http://localhost:18080 \
  make ephemeral-up

$ make ephemeral-status
$ make ephemeral-logs
$ make ephemeral-down
```

`ephemeral-up` starts: `orchestrator`, `js-sandbox`, `js-sandbox-sdkapi`, `task-manager-js`, `task-manager-js-aux`, `task-manager-sdkapi`, `task-manager-py`, `go-worker`, plus Redis and the Python sandbox in Docker.

### Per-service targets

Each service has a foreground target (run in a dedicated terminal). Build targets are dependencies and are incremental.

```sh
$ make ephemeral-deps                      # Redis + python-sandbox (Docker)
$ make ephemeral-orchestrator              # HTTP :18080, gRPC :8081
$ make ephemeral-task-manager-js           # plugins=javascript
$ make ephemeral-task-manager-js-aux       # plugins=*,-javascript,-javascriptsdkapi,-python
$ make ephemeral-task-manager-sdkapi       # plugins=javascriptsdkapi
$ make ephemeral-task-manager-py           # plugins=python
$ make ephemeral-js-sandbox                # Shared JS sandbox (JS + aux TMs)
$ make ephemeral-js-sandbox-sdkapi         # Dedicated JS sandbox for SDK API
$ make ephemeral-go-worker                 # v8 bucket BA
```

Use `make ephemeral-restart-<service>` to rebuild and restart a single component after a code change.

### Configuration

The orchestrator accepts the same OPA-equivalent env vars as the public Docker Compose agent:

| Env var | Flag | Default |
| --- | --- | --- |
| `SUPERBLOCKS_AGENT_SERVER_URL` | `--superblocks.url` | `http://127.0.0.1:8080` |
| `SUPERBLOCKS_AGENT_KEY` | `--superblocks.key` | `dev-agent-key` |
| `SUPERBLOCKS_AGENT_HOST_URL` | `--agent.host.url` + sets `--http.port` | `http://localhost:18080` |
| `SUPERBLOCKS_AGENT_DATA_DOMAIN` | `--data.domain` | `app.superblocks.com` |
| `SUPERBLOCKS_ORCHESTRATOR_REGISTRATION_ENABLED` | `--registration.enabled` | `true` |
| `SUPERBLOCKS_ORCHESTRATOR_AUTH_JWT_JWKS_URL` | `--auth.jwt.jwks_url` | `https://staging-cdn.superblocks.com/.well-known/jwks.json` |
| `SUPERBLOCKS_ORCHESTRATOR_WORKER_GO_ENABLED` | `--worker.go.enabled` | `true` (in `ephemeral-up`) |

The staging CDN JWKS works for `staging.superblocks.com` and `pr-*.superblocks.dev`. For production or self-hosted servers, override `SUPERBLOCKS_ORCHESTRATOR_AUTH_JWT_JWKS_URL`.

### Plugin routing

Plugin-to-task-manager routing is controlled by `SUPERBLOCKS_WORKER_SANDBOX_WORKER_PLUGINS`. Defaults match staging:

| Task manager | Plugins |
| --- | --- |
| `task-manager-js` | `javascript` |
| `task-manager-js-aux` | `*,-javascript,-javascriptsdkapi,-python` |
| `task-manager-sdkapi` | `javascriptsdkapi` |
| `task-manager-py` | `python` |

No two task-managers should claim the same plugin; overlapping claims produce race errors. Override with `SUPERBLOCKS_WORKER_SANDBOX_{JS,AUX,SDKAPI,PY}_PLUGINS` if you need to deviate.

### Port conflicts with the workspace `local-orch` Tilt profile

`Makefile.ephemeral` reuses the same base ports as the workspace `just up local-orch` Tilt profile (6379, 8081, 50050-50083, 8075-8086, 8090, 50061, 50071). Run `just down` before `make ephemeral-up` — they cannot coexist on the same slot.

## Using the agent locally

The agent uses the [grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway) framework to generate the HTTP layer. Hence, every RPC has an equivalent HTTP endpoint with generated [OpenAPI](./types/api/api/v1/service.swagger.json) documentation. Here are some examples.

```sh
$ curl -s -X POST http://127.0.0.1:18080/v2/execute -d @- << EOF | jq
{
  "definition": {
    "api": {
      "metadata": {
        "id": "00000000-0000-0000-0000-000000000001",
        "name": "MyTestApi",
        "organization": "00000000-0000-0000-0000-000000000001"
      },
      "blocks": [
          {
            "name": "worker_go",
            "step": {
              "javascript": {
                "body": "return 'hello';"
              }
            }
          },
          {
            "name": "worker_py",
            "step": {
              "python": {
                "body": "return 'world';"
              }
            }
          },
          {
            "name": "worker_js",
            "step": {
              "javascript": {
                "body": "return require('lodash').join([worker_go.output, worker_py.output], ' ');"
              }
            }
          }
        ]
    }
  }
}
EOF

{
  "execution": "0191959c-26c1-7f9c-a1f4-089fc5a20b0e",
  "output": {
    "result": "hello world"
  },
  "status": "STATUS_COMPLETED"
}
```
