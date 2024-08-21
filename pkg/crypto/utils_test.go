package crypto

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/stretchr/testify/assert"
)

var (
	pubkey = []byte(`-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEZeXNYVXlmSbSw+uZ1bYasUeolZtJ
Kx295GRrqK6Bo7Wdcj/KLRGXgtXf86+hrXkrz5sQKzcaGyONGRFdAMWyaQ==
-----END PUBLIC KEY-----
`)
)

func TestLoadEcdsaPublicKeyFromJwksUrl(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name string
		jwk  string
		err  bool
		key  []byte
	}{
		{
			name: "happy path",
			jwk:  `{"keys": [{"crv": "P-256", "x": "ZeXNYVXlmSbSw-uZ1bYasUeolZtJKx295GRrqK6Bo7U", "y": "nXI_yi0Rl4LV3_Ovoa15K8-bECs3GhsjjRkRXQDFsmk", "kty": "EC", "kid": "lraPdWzLGF0aAUmC9W5v--D8bkZEwrRMgCqBn63nimY"}, {"n": "-u5OzCz5UO2j-DOv8mDwBV5XgZAdgC1i8q62yN_U5ppRXmIvSoLqvx5Z0JFTnJW-SjbaryCIMytp7wx-AY-X7WRFFRycOFzjKbIkw2ervYXWgUtRfDxHw6zX5c7NifdMjBRtCeSlylIjHivZYtbEOI50eND3EA9tnN9pqpeh_KpGchUf8dQlTGPWqnXbPp6omwHCkZ6tjCmQc0qWvVA0kyBtLtztQwzuK12zTX6MaE4NOHEQbP9Hkl3Qj5GcSWXdmW8pND7Twsd8pC15Imbb3KI1oYyVuxj_8GF2MhEWiCeuJdI9MyvUQHMaW8iNZnQrmw3bIQFQf3BrYzlMwPHVzQ", "e": "AQAB", "kty": "RSA", "kid": "U8rRoLCZN9O8z_p9yhUYBjZwW9JLULVM1qzLWC8FBhY"}]}`,
			err:  false,
			key:  pubkey,
		},
		{
			name: "json but not jwk",
			jwk:  `{"foo":" bar"}`,
			err:  true,
		},
		{
			name: "no ecdsa keys",
			jwk:  `{"keys": [{"n": "-u5OzCz5UO2j-DOv8mDwBV5XgZAdgC1i8q62yN_U5ppRXmIvSoLqvx5Z0JFTnJW-SjbaryCIMytp7wx-AY-X7WRFFRycOFzjKbIkw2ervYXWgUtRfDxHw6zX5c7NifdMjBRtCeSlylIjHivZYtbEOI50eND3EA9tnN9pqpeh_KpGchUf8dQlTGPWqnXbPp6omwHCkZ6tjCmQc0qWvVA0kyBtLtztQwzuK12zTX6MaE4NOHEQbP9Hkl3Qj5GcSWXdmW8pND7Twsd8pC15Imbb3KI1oYyVuxj_8GF2MhEWiCeuJdI9MyvUQHMaW8iNZnQrmw3bIQFQf3BrYzlMwPHVzQ", "e": "AQAB", "kty": "RSA", "kid": "U8rRoLCZN9O8z_p9yhUYBjZwW9JLULVM1qzLWC8FBhY"}]}`,
			err:  true,
		},
		{
			name: "ecdsa key with missing crv",
			jwk:  `{"keys": [{"x": "ZeXNYVXlmSbSw-uZ1bYasUeolZtJKx295GRrqK6Bo7U", "y": "nXI_yi0Rl4LV3_Ovoa15K8-bECs3GhsjjRkRXQDFsmk", "kty": "EC", "kid": "lraPdWzLGF0aAUmC9W5v--D8bkZEwrRMgCqBn63nimY"}]}`,
			err:  true,
		},
		{
			name: "ecdsa key with bad member values",
			jwk:  `{"keys": [{"crv": "P-256", "x": "x", "y": "y", "kty": "EC", "kid": "kid"}]}`,
			err:  true,
		},
		{
			name: "ecdsa kty with rsa members",
			jwk:  `{"keys": [{"n": "-u5OzCz5UO2j-DOv8mDwBV5XgZAdgC1i8q62yN_U5ppRXmIvSoLqvx5Z0JFTnJW-SjbaryCIMytp7wx-AY-X7WRFFRycOFzjKbIkw2ervYXWgUtRfDxHw6zX5c7NifdMjBRtCeSlylIjHivZYtbEOI50eND3EA9tnN9pqpeh_KpGchUf8dQlTGPWqnXbPp6omwHCkZ6tjCmQc0qWvVA0kyBtLtztQwzuK12zTX6MaE4NOHEQbP9Hkl3Qj5GcSWXdmW8pND7Twsd8pC15Imbb3KI1oYyVuxj_8GF2MhEWiCeuJdI9MyvUQHMaW8iNZnQrmw3bIQFQf3BrYzlMwPHVzQ", "e": "AQAB", "kty": "EC", "kid": "U8rRoLCZN9O8z_p9yhUYBjZwW9JLULVM1qzLWC8FBhY"}]}`,
			err:  true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Fprint(w, test.jwk)
			}))
			defer server.Close()

			key, err := LoadEcdsaPublicKeyFromJwksUrl(context.Background(), server.URL)

			if test.err {
				assert.Error(t, err)
				return
			}

			assert.NoError(t, err)
			data, err := jwk.EncodePEM(key)
			assert.NoError(t, err)
			assert.Equal(t, test.key, data)
		})
	}
}
