package http

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"sync"

	"github.com/superblocksteam/run"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

var _ run.Runnable = (*serverParams)(nil)

type serverParams struct {
	secureServer   *http.Server
	insecureServer *http.Server
	secureAlive    bool
	insecureAlive  bool
	err            error
	options        *Options
	done           chan struct{}
	once           sync.Once

	run.ForwardCompatibility
}

// Options contains configuration for http(s) server(s)
type Options struct {
	Name                   string
	InsecureAddr           string
	SecureAddr             string
	InsecurePort           int
	SecurePort             int
	TLSKey, TLSCert, TLSCa string
	Handler                http.Handler
	Logger                 *zap.Logger
}

// Prepare will construct net.Listener instantiations for the requested
// server(s). If an error is encounted, it will be hidden within the returned
// type for evaluation by that type's methods.
func Prepare(opts *Options) *serverParams {
	opts.Logger = opts.Logger.With(zap.String("name", opts.Name))

	f, err := os.Open(opts.TLSCa)
	if err != nil && len(opts.TLSCa) > 0 {
		fmt.Println(err)
		return &serverParams{
			err: err,
		}
	} else if err == nil && len(opts.TLSCa) > 0 {
		defer func() {
			if err := f.Close(); err != nil {
				opts.Logger.Error(fmt.Sprintf("error closing %s: %s", opts.Name, err))
			}
		}()
	}
	return prepare(opts, f)
}

func prepare(opts *Options, r io.Reader) *serverParams {
	params := &serverParams{
		options: opts,
		done:    make(chan struct{}),
	}

	insecureAddr, secureAddr := fmt.Sprintf("%s:%d", opts.InsecureAddr, opts.InsecurePort), fmt.Sprintf("%s:%d", opts.SecureAddr, opts.SecurePort)

	if opts.SecurePort > 0 && len(opts.TLSCa) > 0 { // client has requested an HTTPS server with mutual TLS
		tlsConfig, err := getTLSConfigFromReader(r)
		if err != nil {
			params.err = errors.Join(params.err, err)
		} else {
			params.secureServer = &http.Server{Addr: secureAddr, TLSConfig: tlsConfig, Handler: opts.Handler}
		}
	} else if opts.SecurePort > 0 && len(opts.TLSCa) < 1 { // client has requested an HTTPS server with one-way TLS
		params.secureServer = &http.Server{Addr: secureAddr, Handler: opts.Handler}
	}
	if opts.InsecurePort > 0 { // client has requested an HTTP server
		params.insecureServer = &http.Server{Addr: insecureAddr, Handler: opts.Handler}
	}
	return params
}

// Run will start http(s) server(s) according to the reciever's configuration.
// If an error occurred durring the receiver's construction, that error will be
// returned immedietaly. Otherwise, run will return the non-nill error from the
// the first server that terminates.
func (params *serverParams) Run(context.Context) error {
	if params.err != nil {
		return params.err
	}

	var serve errgroup.Group
	{
		if params.secureServer != nil {
			listener, err := tls.Listen("tcp", fmt.Sprintf("%s:%d", params.options.SecureAddr, params.options.SecurePort), params.secureServer.TLSConfig)
			if err != nil {
				return fmt.Errorf("error creating tls listener: %w", err)
			}

			params.secureAlive = true

			serve.Go(func() error { return params.secureServer.Serve(listener) })
		}
		if params.insecureServer != nil {
			listener, err := net.Listen("tcp", fmt.Sprintf("%s:%d", params.options.InsecureAddr, params.options.InsecurePort))
			if err != nil {
				return fmt.Errorf("error creating net listener: %w", err)
			}

			params.insecureAlive = true

			serve.Go(func() error {
				return params.insecureServer.Serve(listener)
			})
		}
	}

	var shutdown errgroup.Group
	{
		shutdown.Go(func() error {
			<-params.done
			return closeServer(params.options.Logger, params.secureServer, params.options.Name, "HTTPS")
		})

		shutdown.Go(func() error {
			<-params.done
			return closeServer(params.options.Logger, params.insecureServer, params.options.Name, "HTTP")
		})
	}

	if err := serve.Wait(); err != nil && err != http.ErrServerClosed {
		params.options.Logger.Error("http server returned a non graceful error", zap.Error(err))
	}

	params.once.Do(func() {
		close(params.done)
	})

	return shutdown.Wait()
}

func (params *serverParams) Close(context.Context) error {
	params.once.Do(func() {
		close(params.done)
	})

	return nil
}

func (params *serverParams) Name() string {
	return params.options.Name + " http server"
}

func (params *serverParams) Fields() []slog.Attr {
	fields := []slog.Attr{}

	if params.secureServer != nil {
		fields = append(fields, slog.String("address.secure", fmt.Sprintf("%s:%d", params.options.SecureAddr, params.options.SecurePort)))
	}

	if params.insecureServer != nil {
		fields = append(fields, slog.String("address.insecure", fmt.Sprintf("%s:%d", params.options.InsecureAddr, params.options.InsecurePort)))
	}

	return fields
}

func (params *serverParams) Alive() bool {
	if params == nil {
		return false
	}

	if params.secureServer != nil && !params.secureAlive {
		return false
	}

	if params.insecureServer != nil && !params.insecureAlive {
		return false
	}

	return true
}

func closeServer(log *zap.Logger, svr *http.Server, name, scheme string) error {
	if svr == nil {
		return nil
	}
	if err := svr.Shutdown(context.Background()); err != nil {
		log.Error(fmt.Sprintf("error gracefully closing %s %s server: %v", name, scheme, err))
		return err
	}

	return nil
}

func getTLSConfigFromReader(r io.Reader) (*tls.Config, error) {
	if r == nil {
		return nil, errors.New("reader is nil")
	}
	caCert, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	caCertPool := x509.NewCertPool()
	if ok := caCertPool.AppendCertsFromPEM(caCert); !ok {
		return nil, errors.New("could not append cert to pool")
	}
	tlsConfig := &tls.Config{
		ClientCAs:  caCertPool,
		ClientAuth: tls.RequireAndVerifyClientCert,
	}
	tlsConfig.BuildNameToCertificate()
	return tlsConfig, nil
}
