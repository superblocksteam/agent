package utils

import (
	"context"
	"io"
)

type GetFileFunc func(ctx context.Context, path string) (io.Reader, error)
