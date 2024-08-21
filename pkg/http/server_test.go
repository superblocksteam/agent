package http

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"math/big"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

type errorReader struct{}

func (r *errorReader) Read(p []byte) (n int, err error) {
	return 0, errors.New("foo bar car")
}

func TestGetTLSConfigFromReader(t *testing.T) {
	// mimic a cert template
	tmpl := createGenericCertificateTemplate()
	tmpl.IsCA = true
	tmpl.KeyUsage = x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign
	// create a private key
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	assert.Nil(t, err)
	// create a certificate in DER format
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key)
	assert.Nil(t, err)
	// convert certificate to PEM format
	pem := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})

	cfg, err := getTLSConfigFromReader(bytes.NewReader(pem))
	assert.Nil(t, err)
	assert.NotNil(t, cfg)
	assert.Equal(t, 1, len(cfg.ClientCAs.Subjects()))

	_, err = getTLSConfigFromReader(bytes.NewReader([]byte("foo")))
	assert.NotNil(t, err)

	_, err = getTLSConfigFromReader(nil)
	assert.NotNil(t, err)

	_, err = getTLSConfigFromReader(new(errorReader))
	assert.NotNil(t, err)
}

func TestPrepare(t *testing.T) {
	opts := &Options{
		Name:         "test",
		InsecureAddr: "1.2.3.4",
		SecureAddr:   "4.3.2.1",
		InsecurePort: 1234,
		SecurePort:   4321,
		TLSKey:       "/foo/tls.key",
		TLSCert:      "/foo/tls.crt",
		TLSCa:        "/foo/tls.ca",
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}),
		Logger: zap.NewNop(),
	}

	// mimic a cert template
	tmpl := createGenericCertificateTemplate()
	tmpl.IsCA = true
	tmpl.BasicConstraintsValid = true
	tmpl.KeyUsage = x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign
	// create a private key
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	assert.Nil(t, err)
	// create a certificate in DER format
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key)
	assert.Nil(t, err)
	// convert certificate to PEM format
	pem := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})

	params := prepare(opts, bytes.NewReader(pem))
	assert.NotNil(t, params)
	assert.Nil(t, params.err)
	assert.NotNil(t, params.secureServer)
	assert.NotNil(t, params.insecureServer)
	assert.Equal(t, params.options, opts)
	assert.Equal(t, params.secureServer.Addr, "4.3.2.1:4321")
	assert.Equal(t, params.insecureServer.Addr, "1.2.3.4:1234")

	params = prepare(opts, nil)
	assert.NotNil(t, params)
	assert.EqualError(t, params.err, "reader is nil")
	assert.NotNil(t, params.insecureServer)

	opts.TLSCa = ""
	params = prepare(opts, bytes.NewReader(pem))
	assert.NotNil(t, params)
	assert.Nil(t, params.err)
	assert.NotNil(t, params.secureServer)
	assert.NotNil(t, params.insecureServer)
}

func TestRun(t *testing.T) {
	params := serverParams{
		err: errors.New("foo"),
	}
	err := params.Run(context.Background())
	assert.EqualError(t, err, "foo")
}

func createGenericCertificateTemplate() *x509.Certificate {
	return &x509.Certificate{
		SerialNumber:          big.NewInt(1653),
		NotBefore:             time.Now().AddDate(-10, 0, 0),
		NotAfter:              time.Now().AddDate(10, 0, 0),
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}
}
