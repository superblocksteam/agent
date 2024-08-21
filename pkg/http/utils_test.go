package http

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"errors"
	"math/big"
	"testing"
	"testing/fstest"
	"time"

	"github.com/stretchr/testify/assert"
)

func raiseErrorWhenReadingFile(raiseForPath string) func(string) ([]byte, error) {
	return func(givenPath string) ([]byte, error) {
		if raiseForPath == givenPath {
			return nil, errors.New("")
		}
		return []byte("foo"), nil
	}
}

func TestGetTlsConfig(t *testing.T) {

	t.Parallel()

	dummyCert, dummyKey, err := generateDummyCertAndKey()
	assert.NoError(t, err, "error generating dummy cert and key")

	dummyCa, err := generateDummyCa()
	assert.NoError(t, err, "error generating dummy ca")

	TestFs := fstest.MapFS{
		"testCert.pem": &fstest.MapFile{
			Data: []byte(dummyCert),
		},
		"testKey.pem": &fstest.MapFile{
			Data: []byte(dummyKey),
		},
		"testCa.crt": &fstest.MapFile{
			Data: []byte(dummyCa),
		},
	}

	for _, tc := range []struct {
		name            string
		opts            []func(*transportConfig) error
		readFileFunc    func(string) ([]byte, error)
		rootCasSet      bool
		certificatesSet bool
		expectError     bool
	}{
		{
			name:            "no options given",
			opts:            []func(*transportConfig) error{},
			readFileFunc:    TestFs.ReadFile,
			rootCasSet:      true,
			certificatesSet: false,
		},
		{
			name:            "valid ca path given",
			opts:            []func(*transportConfig) error{WithCaPath("testCa.crt")},
			readFileFunc:    TestFs.ReadFile,
			rootCasSet:      true,
			certificatesSet: false,
		},
		{
			name:         "invalid ca path given",
			opts:         []func(*transportConfig) error{WithCaPath("foo.crt")},
			readFileFunc: TestFs.ReadFile,
			expectError:  true,
		},
		{
			name:         "readFileFunc raises error for ca",
			opts:         []func(*transportConfig) error{WithCaPath("testCa.crt")},
			readFileFunc: raiseErrorWhenReadingFile("testCa.crt"),
			expectError:  true,
		},
		{
			name:         "readFileFunc raises error for cert",
			opts:         []func(*transportConfig) error{WithCaPath("testCa.crt"), WithCertAndKeyPaths("testCert.pem", "testKey.pem")},
			readFileFunc: raiseErrorWhenReadingFile("testCert.pem"),
			expectError:  true,
		},
		{
			name:         "readFileFunc raises error for key",
			opts:         []func(*transportConfig) error{WithCaPath("testCa.crt"), WithCertAndKeyPaths("testCert.pem", "testKey.pem")},
			readFileFunc: raiseErrorWhenReadingFile("testKey.pem"),
			expectError:  true,
		},
		{
			name: "with cert and key",
			opts: []func(*transportConfig) error{
				WithCaPath("testCa.crt"),
				WithCertAndKeyPaths("testCert.pem", "testKey.pem"),
			},
			readFileFunc:    TestFs.ReadFile,
			rootCasSet:      true,
			certificatesSet: true,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var optionFuncs []func(*transportConfig) error
			for _, opt := range tc.opts {
				optionFuncs = append(optionFuncs, opt)
			}

			actualTlsConfig, err := getTlsConfig(tc.readFileFunc, optionFuncs...)
			if tc.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.rootCasSet, actualTlsConfig.RootCAs != nil)
				assert.Equal(t, tc.certificatesSet, len(actualTlsConfig.Certificates) > 0)
			}
		})
	}
}

func generateDummyCa() (caCertPEM string, err error) {
	// Generate a new private key for the CA.
	caPrivateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return "", err
	}

	// Create a template for the CA certificate.
	caTemplate := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Organization: []string{"Dummy CA Organization"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(365 * 24 * time.Hour), // 1 year
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		IsCA:                  true,
	}

	// Create the self-signed CA certificate.
	caCertBytes, err := x509.CreateCertificate(rand.Reader, &caTemplate, &caTemplate, &caPrivateKey.PublicKey, caPrivateKey)
	if err != nil {
		return "", err
	}

	// Encode the CA certificate to PEM format.
	caCertPEMBytes := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: caCertBytes})
	caCertPEM = string(caCertPEMBytes)

	return caCertPEM, nil
}

func generateDummyCertAndKey() (certPEM, keyPEM string, err error) {
	// Generate a new private key.
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return "", "", err
	}

	// Create a template for the certificate.
	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Organization: []string{"Dummy Organization"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(365 * 24 * time.Hour), // 1 year
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}

	// Create the self-signed certificate.
	certBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &privateKey.PublicKey, privateKey)
	if err != nil {
		return "", "", err
	}

	// Encode the certificate.
	certPEMBytes := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certBytes})
	certPEM = string(certPEMBytes)

	// Encode the private key.
	keyBytes, err := x509.MarshalECPrivateKey(privateKey)
	if err != nil {
		return "", "", err
	}
	keyPEMBytes := pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyBytes})
	keyPEM = string(keyPEMBytes)

	return certPEM, keyPEM, nil
}
