package http

type transportConfig struct {
	caPath   string
	certPath string
	keyPath  string
}

type TransportOption func(*transportConfig) error

func WithCaPath(caPath string) TransportOption {
	return func(c *transportConfig) error {
		c.caPath = caPath
		return nil
	}
}

func WithCertAndKeyPaths(certPath, keyPath string) TransportOption {
	return func(c *transportConfig) error {
		c.certPath = certPath
		c.keyPath = keyPath
		return nil
	}
}
