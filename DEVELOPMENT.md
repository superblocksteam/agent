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
