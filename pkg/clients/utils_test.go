package clients

import (
	"encoding/json"
	builtInErrors "errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/superblocksteam/agent/pkg/errors"
)

func TestCheck(t *testing.T) {
	testCases := []struct {
		name             string
		err              error
		statusCode       int
		responseBody     interface{}
		expectedInternal error
		expectedExternal error
	}{
		{
			name:             "Error is not nil",
			err:              builtInErrors.New("some error"),
			statusCode:       http.StatusOK,
			responseBody:     nil,
			expectedInternal: builtInErrors.New("some error"),
			expectedExternal: new(errors.InternalError),
		},
		{
			name:             "Status Unauthorized",
			err:              nil,
			statusCode:       http.StatusUnauthorized,
			responseBody:     nil,
			expectedInternal: nil,
			expectedExternal: errors.AuthorizationError(),
		},
		{
			name:             "Status Forbidden",
			err:              nil,
			statusCode:       http.StatusForbidden,
			responseBody:     nil,
			expectedInternal: nil,
			expectedExternal: errors.AuthorizationError(),
		},
		{
			name:             "Status NotFound",
			err:              nil,
			statusCode:       http.StatusNotFound,
			responseBody:     nil,
			expectedInternal: new(errors.NotFoundError),
			expectedExternal: new(errors.NotFoundError),
		},
		{
			name:       "Status BadRequest with valid response body",
			err:        nil,
			statusCode: http.StatusBadRequest,
			responseBody: map[string]interface{}{
				"responseMeta": map[string]interface{}{
					"message": "bad request",
				},
			},
			expectedInternal: nil,
			expectedExternal: errors.BadRequestError(builtInErrors.New("bad request")),
		},
		{
			name:             "Status BadRequest with invalid response body",
			err:              nil,
			statusCode:       http.StatusBadRequest,
			responseBody:     "invalid JSON",
			expectedInternal: fmt.Errorf("fetch downstream returned a %d status code: \"invalid JSON\"", http.StatusBadRequest),
			expectedExternal: new(errors.InternalError),
		},
		{
			name:             "Status not OK with valid response body",
			err:              nil,
			statusCode:       http.StatusServiceUnavailable,
			responseBody:     "some error message",
			expectedInternal: fmt.Errorf("fetch downstream returned a %d status code: \"some error message\"", http.StatusServiceUnavailable),
			expectedExternal: new(errors.InternalError),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {

			resp := httptest.NewRecorder()
			resp.WriteHeader(tc.statusCode)

			if tc.responseBody != nil {
				bodyBytes, _ := json.Marshal(tc.responseBody)
				resp.Body.Write(bodyBytes)
			}

			internal, external := Check(tc.err, resp.Result())

			if internal != nil && tc.expectedInternal == nil {
				t.Errorf("Expected no internal error, got %v", internal)
			} else if internal == nil && tc.expectedInternal != nil {
				t.Errorf("Expected internal error %v, got nil", tc.expectedInternal)
			} else if internal != nil && tc.expectedInternal != nil && internal.Error() != tc.expectedInternal.Error() {
				t.Errorf("Expected internal error %v, got %v", tc.expectedInternal, internal)
			}

			if external != nil && tc.expectedExternal == nil {
				t.Errorf("Expected no external error, got %v", external)
			} else if external == nil && tc.expectedExternal != nil {
				t.Errorf("Expected external error %v, got nil", tc.expectedExternal)
			} else if external != nil && tc.expectedExternal != nil && external.Error() != tc.expectedExternal.Error() {
				t.Errorf("Expected external error %v, got %v", tc.expectedExternal, external)
			}
		})
	}
}
