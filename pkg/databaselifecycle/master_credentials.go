package databaselifecycle

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
)

type MasterCredentials struct {
	Username string
	Password string
}

type MasterCredentialResolver interface {
	Resolve(context.Context, refresolver.Ref) (MasterCredentials, error)
}

type MasterCredentialResolverFunc func(context.Context, refresolver.Ref) (MasterCredentials, error)

func (f MasterCredentialResolverFunc) Resolve(ctx context.Context, ref refresolver.Ref) (MasterCredentials, error) {
	return f(ctx, ref)
}

type RefMasterCredentialResolver struct {
	allowedRefPrefixes []string
	resolverFactory    func(context.Context) (refresolver.Resolver, error)
}

func NewRefMasterCredentialResolver(
	resolverFactory func(context.Context) (refresolver.Resolver, error),
	allowedRefPrefixes []string,
) *RefMasterCredentialResolver {
	return &RefMasterCredentialResolver{
		allowedRefPrefixes: append([]string(nil), allowedRefPrefixes...),
		resolverFactory:    resolverFactory,
	}
}

func (r *RefMasterCredentialResolver) Resolve(ctx context.Context, ref refresolver.Ref) (MasterCredentials, error) {
	if r == nil || r.resolverFactory == nil {
		return MasterCredentials{}, errors.New("database lifecycle master credential resolver is required")
	}
	if ref.Resolver != refresolver.ResolverAWSSecretsManager {
		return MasterCredentials{}, fmt.Errorf("database lifecycle master credential resolver %q is not supported", ref.Resolver)
	}

	resolver, err := r.resolverFactory(ctx)
	if err != nil {
		return MasterCredentials{}, fmt.Errorf("create database lifecycle master credential resolver: %w", err)
	}
	dispatcher := refresolver.NewDispatcher(map[refresolver.ResolverType]refresolver.Resolver{
		refresolver.ResolverAWSSecretsManager: resolver,
	}, r.allowedRefPrefixes)
	secretJSON, err := dispatcher.Resolve(ctx, refresolver.Ref{
		Resolver: ref.Resolver,
		Ref:      ref.Ref,
	})
	if err != nil {
		return MasterCredentials{}, fmt.Errorf("resolve database lifecycle master credential: %w", err)
	}

	var secret struct {
		Password string `json:"password"`
		Username string `json:"username"`
	}
	if err := json.Unmarshal([]byte(secretJSON), &secret); err != nil {
		return MasterCredentials{}, fmt.Errorf("decode database lifecycle master credential: %w", err)
	}
	if secret.Username == "" {
		return MasterCredentials{}, errors.New("database lifecycle master credential username is required")
	}
	if secret.Password == "" {
		return MasterCredentials{}, errors.New("database lifecycle master credential password is required")
	}
	return MasterCredentials{Username: secret.Username, Password: secret.Password}, nil
}
