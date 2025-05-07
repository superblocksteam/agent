package auth

import (
	"context"
	"testing"

	"google.golang.org/grpc/metadata"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/constants"
)

func TestContextWithRequestUsesJwtAuth(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		ctx      context.Context
		expected bool
	}{
		{
			name:     "header agent key set",
			ctx:      metadata.NewIncomingContext(context.Background(), metadata.Pairs(constants.HeaderAgentKey, "foo")),
			expected: false,
		},
		{
			name:     "header superblocks jwt set",
			ctx:      metadata.NewIncomingContext(context.Background(), metadata.Pairs(constants.HeaderSuperblocksJwt, "foo")),
			expected: true,
		},
		{
			name:     "header superblocks jwt set and header agent key set",
			ctx:      metadata.NewIncomingContext(context.Background(), metadata.Pairs(constants.HeaderSuperblocksJwt, "foo", constants.HeaderAgentKey, "bar")),
			expected: true,
		},
		{
			name:     "no headers set",
			ctx:      context.Background(),
			expected: false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			newCtx := contextWithRequestUsesJwtAuth(test.ctx)
			actual, err := constants.GetRequestUsesJwtAuth(newCtx)
			assert.NoError(t, err)
			assert.Equal(t, test.expected, actual)
		})
	}
}
