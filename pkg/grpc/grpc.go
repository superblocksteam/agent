package grpc

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

type Options struct {
	Server     *grpc.Server
	Network    string
	Address    string
	Reflection bool
	Logger     *zap.Logger
	Name       string
}

type grpcServer struct {
	options  *Options
	listener net.Listener
	err      error
	alive    bool

	run.ForwardCompatibility
}

func Prepare(options *Options) run.Runnable {
	s := &grpcServer{
		options: options,
	}

	if s.options.Server == nil {
		s.err = errors.New("server must be defined")
	}

	if s.options.Reflection {
		reflection.Register(s.options.Server)
	}

	return s
}

func (s *grpcServer) Run(context.Context) error {
	if s.err != nil {
		return s.err
	}

	s.listener, s.err = net.Listen(s.options.Network, s.options.Address)
	if s.err != nil {
		return s.err
	}

	s.alive = true

	return s.options.Server.Serve(s.listener)
}

func (s *grpcServer) Fields() []slog.Attr {
	return []slog.Attr{
		slog.String("address", s.options.Address),
	}
}

func (s *grpcServer) Name() string {
	return s.options.Name + " grpc server"
}

func (s *grpcServer) Alive() bool {
	if s.listener == nil {
		return false
	}

	return s.alive
}

func (s *grpcServer) Close(context.Context) error {
	if s.options.Server != nil {
		s.options.Server.GracefulStop()
	}
	if s.listener != nil {
		// https://golang.org/src/net/error_test.go#L501
		if err := s.listener.Close(); err != nil && !strings.Contains(err.Error(), "use of closed network connection") {
			s.options.Logger.Error(fmt.Sprintf("error closing gRPC listener: %s", err.Error()))
			return err
		}
	}

	return nil
}
