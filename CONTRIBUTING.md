# Contributing

## Getting started

This repository uses [pre-commit](https://pre-commit.com/) to help you ensure that everything looks good prior to committing.

```sh
$ pre-commit install
$ pre-commit run --all
[go] format..............................................................Passed
[go] tidy................................................................Passed
[go] generate............................................................Passed
[go] imports.............................................................Passed
[shell] check............................................................Passed
[mocks] lint.............................................................Passed
[codecov] validate.......................................................Passed
[yaml] format............................................................Passed
```

## Profiling

The golang components can be profiled.

```sh
$ curl -s http://localhost:7777/debug/pprof/heap > heap.0.pprof
$ go tool pprof heap.0.pprof
Type: inuse_space
Time: Sep 14, 2023 at 11:47am (EDT)
Entering interactive mode (type "help" for commands, "o" for options)
(pprof)
```
