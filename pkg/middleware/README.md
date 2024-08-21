# middleware

## About

This package provides common gRPC middleware for internal services. The structure of this repository mimics [`grpc-ecosystem/go-grpc-middleware`](https://github.com/grpc-ecosystem/go-grpc-middleware).

## Usage

```go
package main

import (
    grpc_conditional "github.com/superblocksteam/go-grpc-middleware/interceptors/conditional"
    grpc_jwt "github.com/superblocksteam/go-grpc-middleware/interceptors/jwt"
)

func main() {
    streamInterceptors := []grpc.StreamServerInterceptor{
        grpc_conditional.StreamServerInterceptor(
            grpc_jwt.StreamServerInterceptor(
                grpc_jwt.WithSigningKey([]byte(viper.GetString("auth.jwt.signingkey"))),
                grpc_jwt.WithMetadataKey("X-Superblocks-Authorization"),
            ),
            func(any, grpc.ServerStream, *grpc.StreamServerInfo) bool { return true },
        )
    }

    unaryInterceptors := []grpc.UnaryServerInterceptor{
        grpc_conditional.UnaryServerInterceptor(
            grpc_jwt.UnaryServerInterceptor(
                grpc_jwt.WithSigningKey([]byte(viper.GetString("auth.jwt.signingkey"))),
                grpc_jwt.WithMetadataKey("X-Superblocks-Authorization"),
            ),
            func(context.Context, any, *grpc.UnaryServerInfo) bool { return true },
        )
    }

    grpc.NewServer(
        grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(streamInterceptors...)),
        grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(unaryInterceptors...)),
    )
}
```

## Interceptors

**conditional**

This interceptor conditionally runs another interceptors based on the request.

**jwt**

This interceptor validates a JWT.

**cancellation**

**correlation**

**errors**
