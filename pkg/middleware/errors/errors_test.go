package errors

import (
	"errors"
	"testing"

	"github.com/superblocksteam/agent/internal/metrics"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestParse(t *testing.T) {
	t.Parallel()
	defer metrics.SetupForTesting()()

	for _, test := range []struct {
		name        string
		err         error
		expected    error
		description string
	}{
		{
			name:        "nil error",
			err:         nil,
			expected:    nil,
			description: "nil input error should return nil",
		},
		{
			name:        "validation error",
			err:         &sberrors.ValidationError{Issues: []error{errors.New("issue 1"), errors.New("issue 2")}},
			expected:    status.New(codes.FailedPrecondition, "ValidationError").Err(),
			description: "validation error should return a gRPC status with FailedPrecondition code",
		},
		{
			name:        "authorization error",
			err:         sberrors.ErrAuthorization,
			expected:    status.New(codes.Unauthenticated, sberrors.ErrAuthorization.Error()).Err(),
			description: "authorization error should return a gRPC status with Unauthenticated code",
		},
		{
			name:        "not found error",
			err:         sberrors.ErrNotFound,
			expected:    status.New(codes.NotFound, sberrors.ErrNotFound.Error()).Err(),
			description: "not found error should return a gRPC status with NotFound code",
		},
		{
			name:        "internal error",
			err:         sberrors.ErrInternal,
			expected:    status.New(codes.Internal, sberrors.ErrInternal.Error()).Err(),
			description: "internal error should return a gRPC status with Internal code",
		},
		{
			name:        "unknown error",
			err:         errors.New("unknown error"),
			expected:    status.New(codes.Unknown, "unknown error").Err(),
			description: "unknown error should return a gRPC status with Unknown code",
		},
		{
			name:        "integration oauth error",
			err:         errors.New("IntegrationOAuthError"),
			expected:    status.New(codes.InvalidArgument, "IntegrationOAuthError").Err(),
			description: "IntegrationOAuthError should return a gRPC status with InvalidArgument code",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result := parse(test.err)
			if test.expected == nil {
				if result != nil {
					t.Errorf("%s: Expected result to be nil, but got %v", test.description, result)
				}
			} else {
				if status.Code(result) != status.Code(test.expected) {
					t.Errorf("%s: Expected status code to be %v, but got %v", test.description, status.Code(test.expected), status.Code(result))
				}

				if result.Error() != test.expected.Error() {
					t.Errorf("%s: Expected error message to be %s, but got %s", test.description, test.expected.Error(), result.Error())
				}
			}
		})
	}
}
