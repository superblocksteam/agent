package auth

import (
	"context"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	"go.uber.org/zap"
)

const (
	firebaseTestToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImE1MWJiNGJkMWQwYzYxNDc2ZWIxYjcwYzNhNDdjMzE2ZDVmODkzMmIiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiS2FyZWVtIE1vdXNzYSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQWNIVHRjT1NDd3NLNFlHaF8zMW1rYTR5a2EtX1d4NEZJSU52ejQ0blNwVD1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9rYXJlZW0tYXV0aC10ZXN0LTEiLCJhdWQiOiJrYXJlZW0tYXV0aC10ZXN0LTEiLCJhdXRoX3RpbWUiOjE2ODkwMTMxOTEsInVzZXJfaWQiOiJlcXZpVHk0azZBU01iTkxlSm1wYnV2endtRGIyIiwic3ViIjoiZXF2aVR5NGs2QVNNYk5MZUptcGJ1dnp3bURiMiIsImlhdCI6MTY4OTAyMzYwNywiZXhwIjoxNjg5MDI3MjA3LCJlbWFpbCI6ImthcmVlbS5tb3Vzc2FAc3VwZXJibG9ja3NocS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExMTQ0MjU4Mjc0Mzk5NzQ3MjY2NyJdLCJlbWFpbCI6WyJrYXJlZW0ubW91c3NhQHN1cGVyYmxvY2tzaHEuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.a8NiOgsqm3nzCiE04JJFcFJU1ehBsyQSu4YXfyq3jhJzq-1Vbk7wXtslJy0tfd3g7jkhhxCMy2Am8TRXhS71SprQWE9Aot2FIy9hAqMsivTyev1S-m3Lg7G4Yzy3kmTLOxuyUzEAWU1oZvjOTngCQaGtgPKTNSK1qDhQtKAqIx-TOwcKTQAtTVmtV1arWiLniHkkgWr2QnZqclBEMzXwtzU_mF7VwrJo-9r-ZNrevzQrb53Kwi83clNj-7a6UTyfMMnbvNQpCRETHU_VqetmlpsUHlS5JHQS0eZiVOTHdClBrKEnoVp-6gJ4RnU0hjbb6XvEFGxtl_Ni-gas95wR5A"
)

func TestLogin(t *testing.T) {
	tests := []struct {
		name         string
		authType     string
		authConfig   map[string]interface{}
		req          *apiv1.LoginRequest
		expectedAuth bool
		expected     []*http.Cookie
	}{
		{
			name:     "basic",
			authType: "basic",
			authConfig: map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"scope":        "scope",
				"audience":     "audience",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			req: &apiv1.LoginRequest{
				IntegrationId: "integration_id",
				Token:         utils.Pointer("token"),
			},
			expectedAuth: true,
			expected: []*http.Cookie{
				{
					Name:  "basic.integration_id-token",
					Value: "token",
				},
			},
		},
		{
			name:     "oauth implicit",
			authType: "oauth-implicit",
			authConfig: map[string]interface{}{
				"tokenUrl": "tokenUrl",
				"scope":    "scope",
				"audience": "audience",
				"clientId": "clientId",
			},
			req: &apiv1.LoginRequest{
				IntegrationId:   "integration_id",
				Token:           utils.Pointer("token"),
				ExpiryTimestamp: utils.Pointer(int64(1699819770000)), // time in ms.
			},
			expectedAuth: true,
			expected: []*http.Cookie{
				{
					Name:    "oauth-implicit.clientId-109264468-token",
					Value:   "token",
					Expires: time.Date(2023, 11, 12, 20, 9, 30, 0, time.UTC).Local(),
				},
			},
		},
		{
			name:     "oauth password",
			authType: "oauth-pword",
			authConfig: map[string]interface{}{
				"tokenUrl":     "tokenUrl",
				"scope":        "scope",
				"audience":     "audience",
				"clientId":     "clientId",
				"clientSecret": "clientSecret",
			},
			req: &apiv1.LoginRequest{
				IntegrationId: "integration_id",
				Token:         utils.Pointer("token"),
				RefreshToken:  utils.Pointer("refresh"),
			},
			expectedAuth: true,
			expected: []*http.Cookie{
				{
					Name:  "oauth-pword.clientId-token",
					Value: "token",
				},
				{
					Name:  "oauth-pword.clientId-refresh",
					Value: "refresh",
				},
			},
		},
		{
			name:     "firebase",
			authType: "Firebase",
			authConfig: map[string]interface{}{
				"apiKey": "{projectId: \"projectId\"}",
			},
			req: &apiv1.LoginRequest{
				IntegrationId: "integration_id",
				IdToken:       utils.Pointer(firebaseTestToken),
				RefreshToken:  utils.Pointer("refresh"),
			},
			expectedAuth: true,
			expected: []*http.Cookie{
				{
					Name:  "Firebase.projectId-token",
					Value: firebaseTestToken,
				},
				{
					Name:  "Firebase.projectId-refresh",
					Value: "refresh",
				},
				{
					Name:  "Firebase.projectId-userId",
					Value: "eqviTy4k6ASMbNLeJmpbuvzwmDb2",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tm := &tokenManager{
				logger: zap.NewNop(),
			}

			cookies, authed, err := tm.Login(context.Background(), DatasourceConfig(tt.authType, tt.authConfig), tt.req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedAuth, authed)
			assert.Equal(t, len(tt.expected), len(cookies))

			for _, expectedCookie := range tt.expected {
				found := false
				for _, cookie := range cookies {
					if cookie.Name == expectedCookie.Name {
						assert.Equal(t, expectedCookie.Value, cookie.Value)
						if tt.req.GetExpiryTimestamp() != 0 {
							assert.Equal(t, expectedCookie.Expires, cookie.Expires)
						}
						found = true
						break
					}
				}
				assert.True(t, found, fmt.Sprintf("expected cookie %s not found", expectedCookie.Name))
			}
		})
	}
}
