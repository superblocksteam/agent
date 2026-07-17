package databaselifecycle

import (
	"context"
	"errors"
	"time"

	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/databaselifecycle/migrations"
	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
)

func BootstrapWorker(config Config, client clients.ServerClient, executor CommandExecutor, locker ResourceLocker) (*Worker, time.Duration, error) {
	if config.AgentID == "" {
		return nil, 0, errors.New("database lifecycle agent id is required")
	}
	if len(config.AllowedResourceTypes) == 0 {
		return nil, 0, errors.New("database lifecycle allowed resource types are required")
	}
	if len(config.AllowedModuleSources) == 0 {
		return nil, 0, errors.New("database lifecycle allowed module sources are required")
	}
	policy := NewResourceTypePolicy(config.AllowedResourceTypes)
	dsnOptions := dsnOptionsFromConfig(config)
	worker, err := NewWorkerFromDependencies(WorkerDependencies{
		AgentID:                  config.AgentID,
		Client:                   client,
		Executor:                 executor,
		Locker:                   locker,
		MasterCredentialResolver: NewRefMasterCredentialResolver(dsnOptions.ResolverFactory, dsnOptions.AllowedRefPrefixes),
		MigrationRunner:          migrations.NewRunner(),
		Policy:                   policy,
		RootDir:                  config.RootDir,
		AllowedModuleSources:     config.AllowedModuleSources,
		LifecycleConfig:          config.LifecycleConfig,
		DSNOptions:               dsnOptions,
	})
	if err != nil {
		return nil, 0, err
	}
	return worker, config.PollInterval, nil
}

func dsnOptionsFromConfig(config Config) DSNOptions {
	return DSNOptions{
		ExpectedConnectorRoleARN: config.ExpectedConnectorRoleARN,
		SSLMode:                  config.SSLMode,
		SSLRootCert:              config.SSLRootCert,
		ResolverFactory: func(ctx context.Context) (refresolver.Resolver, error) {
			return refresolver.NewAWSSecretsManagerResolverFromDefaultConfig(ctx)
		},
		// Allowlist comes from the shared, cross-mode env var so the
		// worker and API server share one source of truth for which
		// secret-ARN prefixes the orchestrator may dereference.
		AllowedRefPrefixes: refresolver.AllowedRefPrefixesFromEnv(),
	}
}
