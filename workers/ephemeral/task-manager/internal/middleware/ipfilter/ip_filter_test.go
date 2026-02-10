package ipfilter

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/utils"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/peer"
	"google.golang.org/grpc/status"
)

type mockIpProvider struct {
	allowedIps *utils.Set[string]
}

func (m *mockIpProvider) GetAllowedIps() *utils.Set[string] {
	return m.allowedIps
}

func TestValidateIp(t *testing.T) {
	logger := zap.NewNop()

	for _, test := range []struct {
		name           string
		allowedIps     []string
		clientIp       string
		expectedResult IpFilterResult
	}{
		{
			name:           "allowed IP",
			allowedIps:     []string{"192.168.1.100"},
			clientIp:       "192.168.1.100",
			expectedResult: IpFilterAllowed,
		},
		{
			name:           "denied IP",
			allowedIps:     []string{"192.168.1.100"},
			clientIp:       "192.168.1.200",
			expectedResult: IpFilterDenied,
		},
		{
			name:           "empty allowlist",
			allowedIps:     []string{},
			clientIp:       "192.168.1.100",
			expectedResult: IpFilterNoConfig,
		},
		{
			name:           "multiple allowed IPs - match",
			allowedIps:     []string{"192.168.1.100", "192.168.1.200"},
			clientIp:       "192.168.1.200",
			expectedResult: IpFilterAllowed,
		},
		{
			name:           "multiple allowed IPs - no match",
			allowedIps:     []string{"192.168.1.100", "192.168.1.200"},
			clientIp:       "192.168.1.50",
			expectedResult: IpFilterDenied,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			allowedIps := utils.NewSet(test.allowedIps...)
			result := validateIp(allowedIps, test.clientIp, logger)
			assert.Equal(t, test.expectedResult, result)
		})
	}
}

func TestExtractIp(t *testing.T) {
	for _, test := range []struct {
		name     string
		input    string
		expected string
	}{
		{name: "ip with port", input: "192.168.1.1:8080", expected: "192.168.1.1"},
		{name: "ip without port", input: "192.168.1.1", expected: "192.168.1.1"},
		{name: "ipv6 with port", input: "[::1]:8080", expected: "::1"},
		{name: "ipv6 without port", input: "::1", expected: "::1"},
		{name: "localhost with port", input: "127.0.0.1:50050", expected: "127.0.0.1"},
	} {
		t.Run(test.name, func(t *testing.T) {
			result := extractIp(test.input)
			assert.Equal(t, test.expected, result)
		})
	}
}

func TestIpFilterHttpMiddleware(t *testing.T) {
	logger := zap.NewNop()

	for _, test := range []struct {
		name           string
		allowedIps     []string
		clientIp       string
		disabled       bool
		expectedStatus int
	}{
		{
			name:           "allowed IP passes",
			allowedIps:     []string{"192.168.1.100"},
			clientIp:       "192.168.1.100:12345",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "unauthorized IP blocked",
			allowedIps:     []string{"192.168.1.100"},
			clientIp:       "192.168.1.200:12345",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "empty allowlist denies all (fail-closed)",
			allowedIps:     []string{},
			clientIp:       "192.168.1.100:12345",
			expectedStatus: http.StatusServiceUnavailable,
		},
		{
			name:           "multiple allowed IPs - first matches",
			allowedIps:     []string{"192.168.1.100", "192.168.1.200"},
			clientIp:       "192.168.1.100:12345",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "multiple allowed IPs - second matches",
			allowedIps:     []string{"192.168.1.100", "192.168.1.200"},
			clientIp:       "192.168.1.200:12345",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "multiple allowed IPs - none match",
			allowedIps:     []string{"192.168.1.100", "192.168.1.200"},
			clientIp:       "192.168.1.50:12345",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "disabled allows all IPs through",
			allowedIps:     []string{"192.168.1.100"},
			clientIp:       "192.168.1.200:12345",
			disabled:       true,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "disabled allows empty allowlist through",
			allowedIps:     []string{},
			clientIp:       "192.168.1.100:12345",
			disabled:       true,
			expectedStatus: http.StatusOK,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			provider := &mockIpProvider{
				allowedIps: utils.NewSet(test.allowedIps...),
			}

			// Create a simple handler that returns OK
			handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			})

			// Wrap with the IP filter middleware
			middleware := IpFilterHttpMiddleware(provider, logger, test.disabled)
			wrappedHandler := middleware(handler)

			// Create a test request
			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			req.RemoteAddr = test.clientIp

			// Create a response recorder
			rr := httptest.NewRecorder()

			// Serve the request
			wrappedHandler.ServeHTTP(rr, req)

			assert.Equal(t, test.expectedStatus, rr.Code)
		})
	}
}

// mockAddr implements net.Addr for testing
type mockAddr struct {
	addr string
}

func (m mockAddr) Network() string { return "tcp" }
func (m mockAddr) String() string  { return m.addr }

func TestIpFilterInterceptor(t *testing.T) {
	logger := zap.NewNop()

	for _, test := range []struct {
		name         string
		allowedIps   []string
		clientIp     string
		disabled     bool
		expectError  bool
		expectedCode codes.Code
	}{
		{
			name:         "allowed IP passes",
			allowedIps:   []string{"192.168.1.100"},
			clientIp:     "192.168.1.100:12345",
			expectError:  false,
			expectedCode: codes.OK,
		},
		{
			name:         "unauthorized IP blocked",
			allowedIps:   []string{"192.168.1.100"},
			clientIp:     "192.168.1.200:12345",
			expectError:  true,
			expectedCode: codes.PermissionDenied,
		},
		{
			name:         "empty allowlist denies all (fail-closed)",
			allowedIps:   []string{},
			clientIp:     "192.168.1.100:12345",
			expectError:  true,
			expectedCode: codes.Unavailable,
		},
		{
			name:         "multiple allowed IPs - first matches",
			allowedIps:   []string{"192.168.1.100", "192.168.1.200"},
			clientIp:     "192.168.1.100:12345",
			expectError:  false,
			expectedCode: codes.OK,
		},
		{
			name:         "multiple allowed IPs - second matches",
			allowedIps:   []string{"192.168.1.100", "192.168.1.200"},
			clientIp:     "192.168.1.200:12345",
			expectError:  false,
			expectedCode: codes.OK,
		},
		{
			name:         "multiple allowed IPs - none match",
			allowedIps:   []string{"192.168.1.100", "192.168.1.200"},
			clientIp:     "192.168.1.50:12345",
			expectError:  true,
			expectedCode: codes.PermissionDenied,
		},
		{
			name:         "disabled allows all IPs through",
			allowedIps:   []string{"192.168.1.100"},
			clientIp:     "192.168.1.200:12345",
			disabled:     true,
			expectError:  false,
			expectedCode: codes.OK,
		},
		{
			name:         "disabled allows empty allowlist through",
			allowedIps:   []string{},
			clientIp:     "192.168.1.100:12345",
			disabled:     true,
			expectError:  false,
			expectedCode: codes.OK,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			provider := &mockIpProvider{
				allowedIps: utils.NewSet(test.allowedIps...),
			}

			interceptor := IpFilterInterceptor(provider, logger, test.disabled)

			// Create context with peer info
			ctx := peer.NewContext(context.Background(), &peer.Peer{
				Addr: mockAddr{addr: test.clientIp},
			})

			// Create a simple handler that returns a response
			handler := func(ctx context.Context, req interface{}) (interface{}, error) {
				return "success", nil
			}

			info := &grpc.UnaryServerInfo{
				FullMethod: "/test.Service/Method",
			}

			resp, err := interceptor(ctx, "request", info, handler)

			if test.expectError {
				assert.Error(t, err)
				st, ok := status.FromError(err)
				assert.True(t, ok)
				assert.Equal(t, test.expectedCode, st.Code())
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, "success", resp)
			}
		})
	}
}

func TestIpFilterInterceptor_NoPeerContext(t *testing.T) {
	logger := zap.NewNop()
	provider := &mockIpProvider{
		allowedIps: utils.NewSet("192.168.1.100"),
	}

	interceptor := IpFilterInterceptor(provider, logger, false)

	// Create context WITHOUT peer info
	ctx := context.Background()

	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return "success", nil
	}

	info := &grpc.UnaryServerInfo{
		FullMethod: "/test.Service/Method",
	}

	resp, err := interceptor(ctx, "request", info, handler)

	assert.Error(t, err)
	st, ok := status.FromError(err)
	assert.True(t, ok)
	assert.Equal(t, codes.PermissionDenied, st.Code())
	assert.Nil(t, resp)
}
