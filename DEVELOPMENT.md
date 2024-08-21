## Quick Start

Want to access this service in a deployed environment?

```sh
$ curl -s https://agent.superblocks.com/health[?detailed=true] | jq
{
  "message": "OK"
}
```

Want to take it for a spin but don't want any of the setup? All you need is [Docker](https://www.docker.com/products/docker-desktop/)!

```sh
$ docker login ghcr.io # Make sure you're authenticated with GitHub Container Registry.
Authenticating with existing credentials...
Login Succeeded

$ make up-docker # It may take a few moments for the service to come up.

$ docker run bufbuild/buf:1.14.0 curl --protocol grpc --http2-prior-knowledge http://host.docker.internal:8081/api.v1.MetadataService/Health | jq
{
  "message": "OK"
}
```

Want to run it against a "real" server rather than the mock server?

```sh
# Override the runtime argument that specifies the location of the server.
$ make up-docker EXTRA_ORCHESTRATOR_ARGS="--superblocks.url=http://127.0.0.1:8080"
```

## Project Structure

We roughly follow the [Standard Go Project Layout](https://github.com/golang-standards/project-layout).

```bash
/cmd        # main applications for this project
/pkg        # library code that's okay to be used by other applications
/internal   # private application and library code
/scripts    # scripts to perform various operations
/configs    # configuration files
```

## New to Golang?

[This](https://go.dev/learn/) is the resource you're looking for.

## Development

Use [this](https://marketplace.visualstudio.com/items?itemName=golang.Go) VS Code extension!

```sh
$ brew install bufbuild/buf/buf # Ensure this is at least version 1.14.0. If you know how to pin a cask version, send a PR!
$ brew install pre-commit
$ brew install mike-engel/jwt-cli/jwt-cli

$ make deps

$ pre-commit install
$ pre-commit run --all
[go] format..........................................(no files to check)Skipped
[go] tidy............................................(no files to check)Skipped
[go] generate........................................(no files to check)Skipped
[go] imports.........................................(no files to check)Skipped
[shell] check........................................(no files to check)Skipped
[mocks] lint.............................................................Passed
[yaml] format............................................................Passed

$ go install github.com/go-delve/delve/cmd/dlv@v1.21.0 # If you're want a native VSCode experience.
```

```sh
$ make up
{"level":"info","ts":1674946466.822189,"caller":"http/server.go:94","msg":"starting","version":"1748b26-dirty","name":"http server","address":"","port":8080}
{"level":"info","ts":1674946466.8392768,"caller":"grpc/grpc.go:56","msg":"grpc server listening on [::]:8081","version":"1748b26-dirty"}
```

When passing in a literal API like we will do below, we need a Superblocks JWT.

```sh
$ X_SUPERBLOCKS_AUTHORIZATION=$(jwt encode -A HS256 -S koala '{"org_id": "org-abcd", "user_email": "user-abcd", "rbac_role": "role-abcd", "rbac_groups": ["group-abcd"], "org_type": "frank"}')
```

```sh
$ buf curl --protocol grpc --http2-prior-knowledge -H "X-Superblocks-Authorization: Bearer ${X_SUPERBLOCKS_AUTHORIZATION}" -d @- http://127.0.0.1:8081/api.v1.ExecutorService/Stream <<EOM
{
  "options": {
    "include_event_outputs": true,
    "include_events": true
  },
  "definition": {
    "api": {
      "metadata": {
        "id": "00000000-0000-0000-0000-000000000001",
        "name": "MyTestApi",
        "organization": "00000000-0000-0000-0000-000000000001"
      },
      "blocks": [
          {
            "name": "TestJavascriptBlock",
            "step": {
              "javascript": {
                "body": "return 5;"
              }
            }
          }
        ]
    }
  }
}
EOM

{
  "execution": "b3beb62f-9fa2-494f-a8cf-f087271459a0",
  "event": {
    "name": "TestJavascriptBlock",
    "type": "BLOCK_TYPE_STEP",
    "timestamp": "2023-02-21T02:28:42.432551Z",
    "start": {},
    "parent": "NONE"
  }
}
{
  "execution": "018a13d6-a757-7550-8fd4-35962055ef3c",
  "event": {
    "name": "TestJavascriptBlock",
    "type": "BLOCK_TYPE_STEP",
    "timestamp": "2023-08-20T16:45:51.583785633Z",
    "end": {
      "performance": {
        "start": "1692549949291",
        "finish": "1692549951583",
        "total": "2292",
        "execution": "2078",
        "overhead": "214"
      },
      "output": {
        "result": 5,
        "request": "return 5;"
      },
      "status": "BLOCK_STATUS_SUCCEEDED"
    }
  }
}
```

## Types

To bump types, take the latest commit off the types main branch and replace the `v0.0.0-<> <commit>` string under `github.com/superblocksteam/types/gen/go` in `go.mod` with the commit hash, then run `make deps`. `go.mod` and `go.sum` will be updated with the latest types.

## HTTP

The orchestrator uses the [grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway) framework to generate the HTTP layer. Hence, every RPC has an equivalent HTTP endpoint with generated [OpenAPI](./api/api/v1/service.swagger.json) documentation. Here are some examples.

```sh
$ curl -X POST -H "X-Superblocks-Authorization: Bearer ${X_SUPERBLOCKS_AUTHORIZATION}" -s http://127.0.0.1:8080/v2/execute -d @- << EOF
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
          "name": "TestJavascriptBlock",
          "step": {
            "javascript": {
              "body": "return 5;"
            }
          }
        }
      ]
    }
  }
}
EOF

{
  "execution": "55406a31-89e8-41fa-8e5d-c2aba4f3859e",
  "output": {
    "result": 5
  },
  "status": "STATUS_COMPLETED"
}
```

## Docker

```sh
$ eval $(ssh-agent)
Agent pid 32636

$ ssh-add ~/.ssh/<github_ssh_key>
Identity added: ~/.ssh/<github_ssh_key>

$ make build-docker
[+] Building 1.3s (12/23)
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 1.76kB
 => [internal] load .dockerignore
 => => transferring context: 64B

$ docker run ghcr.io/superblocksteam/orchestrator:$(make version)
{"level":"info","ts":1674946466.822189,"caller":"http/server.go:94","msg":"starting","version":"1748b26-dirty","name":"http server","address":"","port":8080}
{"level":"info","ts":1674946466.8392768,"caller":"grpc/grpc.go:56","msg":"grpc server listening on [::]:8081","version":"1748b26-dirty"}
```

## Tests

#### Unit Tests

```sh
$ make test-unit
```

_NOTE:_ When writing unit tests, you MUST use the following stateless paradigm.

```go
func TestMethodName(t *testing.T) {
  t.Parallel()

  for _, test := range []struct {
    name     string
    inputOne any
    inputTwo any
    expected any
  }{
    {
      name:     "stateless test one",
      inputOne: "foo",
      inputTwo: "foo",
      expected: "bar",
    },
  } {
    t.Run(test.name, func(t *testing.T) {
      result := myMethod(test.inputOne, test.inputTwo)
      assert.Equal(t, test.expected, result, test.name)
    })
  }
}
```

#### End to End Tests

```sh
# Install the Postman CLI (pick one)
$ curl -o- "https://dl-cli.pstmn.io/install/osx_arm64.sh" | sh
$ curl -o- "https://dl-cli.pstmn.io/install/osx_64.sh" | sh

# Start all of the dependencies (mock server, workers, redis)
$ make up-docker

# Run the end-to-end HTTP API tests (< 90 seconds).
$ make test-e2e

# main suite
┌─────────────────────────┬──────────────────────┬──────────────────────┐
│                         │             executed │               failed │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│              iterations │                    1 │                    0 │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│                requests │                  135 │                    0 │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│            test-scripts │                  273 │                    0 │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│      prerequest-scripts │                  151 │                    0 │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│              assertions │                  384 │                    0 │
├─────────────────────────┴──────────────────────┴──────────────────────┤
│ total run duration: 1m 9.3s                                           │
├───────────────────────────────────────────────────────────────────────┤
│ total data received: 7.04MB (approx)                                  │
├───────────────────────────────────────────────────────────────────────┤
│ average response time: 481ms [min: 2ms, max: 10.4s, s.d.: 1364ms]     │
├───────────────────────────────────────────────────────────────────────┤
│ average first byte time: 479ms [min: 806µs, max: 10.4s, s.d.: 1364ms] │
└───────────────────────────────────────────────────────────────────────┘

# quotas suite
┌─────────────────────────┬────────────────────┬────────────────────┐
│                         │           executed │             failed │
├─────────────────────────┼────────────────────┼────────────────────┤
│              iterations │                  1 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│                requests │                 21 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│            test-scripts │                 42 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│      prerequest-scripts │                 21 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│              assertions │                 59 │                  0 │
├─────────────────────────┴────────────────────┴────────────────────┤
│ total run duration: 46.4s                                         │
├───────────────────────────────────────────────────────────────────┤
│ total data received: 14.01kB (approx)                             │
├───────────────────────────────────────────────────────────────────┤
│ average response time: 2.1s [min: 26ms, max: 14.2s, s.d.: 3.2s]   │
├───────────────────────────────────────────────────────────────────┤
│ average first byte time: 2.1s [min: 23ms, max: 14.2s, s.d.: 3.2s] │
└───────────────────────────────────────────────────────────────────┘
```

## Profiling

```sh
$ curl -s http://localhost:7777/debug/pprof/heap > heap.0.pprof
$ go tool pprof heap.0.pprof
Type: inuse_space
Time: Sep 14, 2023 at 11:47am (EDT)
Entering interactive mode (type "help" for commands, "o" for options)
(pprof)
```

## Operations

Certain transports (i.e. Redis) are subject to memory leaks if certain operations are not successful. If a log has a field `{ "leak": true }`. It means that the keys `{ "keys": ["<key>"] }` were leaked and must be manually cleaned up. If the belongs to a stream, it can be found in `{ "stream": "<stream>" }`.

It is strongly advised that you connect your observability system with this.

## Troubleshooting

**Q:** The `make proto` target is failing:

```sh
{"path":"proto/superblocks/api/v1/api.proto","start_line":5,"start_column":8,"end_line":5,"end_column":8,"type":"COMPILE","message":"superblocks/plugins/javascript/v1/plugin.proto: does not exist"}
make: *** [proto] Error 100
```

**A:** Upgrade the ancient version of `make` that is shipped with your machine to at least 3.82.
Run `brew upgrade make` and update your PATH to point to the new make command.

---

**Q:** The `make build-docker` target is failing:

```sh
#0 153.3        Host key verification failed.
#0 153.3        fatal: Could not read from remote repository.
#0 153.3
#0 153.3        Please make sure you have the correct access rights
#0 153.3        and the repository exists.
```

**A:** You must add the ssh key you use for GitHub to your SSH agent.

---

**Q:** I'm having Docker authentication issues:

**A:** Follow [this runbook](https://docs.google.com/document/d/1pC34hxr3F2yRfGif8ah74gRNNGri9Lf2x8pngRYyRW4).

---

**Q:** I am having issues installing internal dependencies.

**A:** Try setting `GOPRIVATE=github.com/superblocksteam`.

## Tech Debt

- I want to statically compile the binary so that the Docker images is sub 50MB but it's tricky to get all the g++ dependencies right.

## Notes

- Work has not yet been done to take in a literal integrations map for non-fetch executions. Hence, only Javascript and Python integrations work for that option. Stay tune for further support.
- It's inevitable that we introduce [go-kit](https://github.com/go-kit/kit) as a feature rich layer between the transport and the biz logic. For now, we're trading off this flexibility for speed by leveraging [grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway) which isn't as customizable. Hence, if you find yourself wondering, "Frank, the separation of responsibilities between the transport and the service layer is not ideal" or "Frank, your query param hack is ugly", I fully support a PR adding in go-kit.

## References

[GRPC Gateway Plugin Examples](https://github.com/grpc-ecosystem/grpc-gateway/blob/main/examples/internal/proto/examplepb/a_bit_of_everything.proto)

[Buf Curl Usage](https://docs.buf.build/curl)
