package http

import (
	"crypto/tls"
	"crypto/x509"
	"errors"
	"os"

	"github.com/superblocksteam/agent/pkg/utils"
)

func GetTlsConfig(options ...func(*transportConfig) error) (*tls.Config, error) {
	return getTlsConfig(os.ReadFile, options...)
}

func getTlsConfig(readFileFunc func(string) ([]byte, error), options ...func(*transportConfig) error) (*tls.Config, error) {

	optionalConfig, err := utils.ApplyOptions(options...)
	if err != nil {
		return nil, err
	}

	var caCertPool *x509.CertPool
	{
		if optionalConfig.caPath != "" {
			caCert, err := readFileFunc(optionalConfig.caPath)
			if err != nil {
				return nil, err
			}
			caCertPool = x509.NewCertPool()
			caCertPool.AppendCertsFromPEM(caCert)
		} else {
			// use the root CA pool
			caCertPool, err = x509.SystemCertPool()
			if err != nil {
				return nil, errors.New("failed to load system cert pool")
			}
		}
	}

	tlsConfig := &tls.Config{
		RootCAs: caCertPool,
	}

	if optionalConfig.certPath != "" && optionalConfig.keyPath != "" {
		cert, err := readFileFunc(optionalConfig.certPath)
		if err != nil {
			return nil, err
		}
		key, err := readFileFunc(optionalConfig.keyPath)
		if err != nil {
			return nil, err
		}
		keyPair, err := tls.X509KeyPair(cert, key)
		if err != nil {
			return nil, err
		}
		tlsConfig.Certificates = []tls.Certificate{keyPair}
	}

	return tlsConfig, nil

}
