# Shared Worker Code

This package contains shared interfaces and utilities used by both the `golang` and `ephemeral` workers.

## Structure

```
shared/
├── transport/
│   ├── transport.go      # Transport interface (run.Runnable)
│   └── redis/
│       └── utils.go      # Redis stream key generation
├── plugin/
│   └── plugin.go         # Plugin interface for code execution
├── go.mod
└── README.md
```

## Usage

Both workers import from this shared package:

```go
import (
    "workers/shared/transport"
    "workers/shared/plugin"
    sharedredis "workers/shared/transport/redis"
)
```

The local packages in each worker re-export these for backward compatibility:

```go
// workers/golang/internal/transport/transport.go
package transport

import "workers/shared/transport"

type Transport = transport.Transport
```

## Interfaces

### Transport

```go
type Transport interface {
    run.Runnable
}
```

The Transport interface extends `run.Runnable` for lifecycle management.

### Plugin

```go
type Plugin interface {
    Execute(ctx context.Context, requestProps *transportv1.Request_Data_Data_Props) (*apiv1.Output, error)
    Stream(ctx context.Context, requestProps *transportv1.Request_Data_Data_Props, send func(message any), until func()) error
    Metadata(ctx context.Context, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct) (*transportv1.Response_Data_Data, error)
    Test(ctx context.Context, datasourceConfig *structpb.Struct) error
    PreDelete(ctx context.Context, datasourceConfig *structpb.Struct) error
}
```

The Plugin interface defines the contract for code execution plugins (JavaScript, Python, etc.).

## Utilities

### StreamKeys

```go
func StreamKeys(plugins []string, workerGroup string, bucket string, events []string) []string
```

Generates Redis stream keys in the format: `agent.<group>.bucket.<bucket>.plugin.<plugin>.event.<event>`
