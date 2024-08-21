# worker.go

## Quick Start

Start the worker

```bash
$ make up

running...
{"level":"info","ts":1704320498086.0789,"caller":"run/monitor.go:34","msg":"starting process monitor runnable","worker-id":"018cd16a-f98d-71ad-979e-f8a3dedbf8c8","who":"monitor"}
{"level":"info","ts":1704320498086.092,"caller":"remote/emitter.go:183","msg":"starting remote emitter runnable","worker-id":"018cd16a-f98d-71ad-979e-f8a3dedbf8c8","who":"emitter.remote"}
```

## Unit Tests

We use [mockery](https://github.com/vektra/mockery) to generate all mocks.

### Run all unit tests

```bash
$ make test-unit
--- PASS: TestClosingProperlyDrainsRequests (0.50s)
=== RUN   TestStreamKeys
=== RUN   TestStreamKeys/happy_path
=== RUN   TestStreamKeys/with_multiple_events
=== RUN   TestStreamKeys/with_multiple_plugins
=== RUN   TestStreamKeys/without_events
=== RUN   TestStreamKeys/without_plugins
--- PASS: TestStreamKeys (0.00s)
    --- PASS: TestStreamKeys/happy_path (0.00s)
    --- PASS: TestStreamKeys/with_multiple_events (0.00s)
    --- PASS: TestStreamKeys/with_multiple_plugins (0.00s)
    --- PASS: TestStreamKeys/without_events (0.00s)
    --- PASS: TestStreamKeys/without_plugins (0.00s)
PASS
ok      github.com/superblocksteam/worker.go/internal/transport/redis   3.267s
```

## Integration (e2e) Tests

1. Start docker container

```bash
$ make run-docker
```

2. Run tests

```bash
$ make test-integration
```

Sometimes it's nice to run the worker locally to run integration tests.\
This allows you to read output logs easily.

1. Update `air.toml` with flags that indicate the mode you'd like to run in

2. Start worker

```bash
$ make up
```

3. Run tests

```bash
# update INTEGRATION_TEST_MODE for however you're running it
$ make test-integration
```

## FAQ:

**Question:**\
Seeing this error on `make deps`:

```bash
fatal: could not read Username for 'https://github.com': terminal prompts disabled
```

**Answer:**\
Create a `.netrc` file (if you haven't already) and add this line:

```bash
machine github.com login <github-user> password <githubtoken-with-repo-read>
```
