package databaselifecycle

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestConfigFromEnvReadsLifecycleWorkerSettings(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ROOT_DIR":               "/var/lib/superblocks/database-lifecycle",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_TERRAFORM_BIN":          "/usr/local/bin/tofu",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_POLL_INTERVAL":          "5s",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_RESOURCE_TYPES": "aws_db_instance, aws_rds_cluster",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_ALLOWED_MODULE_SOURCES": "app.terraform.io/superblocks/rds-postgres/aws, app.terraform.io/superblocks/aurora-postgres/aws",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_MODE":               "verify-full",
		"SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_ROOT_CERT":          "/etc/rds/global-bundle.pem",
	}

	config, err := ConfigFromEnv(func(key string) string { return env[key] })

	require.NoError(t, err)
	require.Equal(t, Config{
		// AgentID is supplied by the orchestrator process, not the
		// environment (see Config.AgentID).
		AgentID:      "",
		RootDir:      "/var/lib/superblocks/database-lifecycle",
		TerraformBin: "/usr/local/bin/tofu",
		PollInterval: 5 * time.Second,
		AllowedResourceTypes: []string{
			"aws_db_instance",
			"aws_rds_cluster",
		},
		AllowedModuleSources: []string{
			"app.terraform.io/superblocks/rds-postgres/aws",
			"app.terraform.io/superblocks/aurora-postgres/aws",
		},
		SSLMode:     "verify-full",
		SSLRootCert: "/etc/rds/global-bundle.pem",
	}, config)
}

func TestConfigFromEnvHasNoImplicitSSLMode(t *testing.T) {
	config, err := ConfigFromEnv(func(string) string { return "" })

	require.NoError(t, err)
	// SSLMode has NO implicit default (cursor HIGH 2026-05-20). Shipping
	// require-by-default would silently leave migration traffic
	// MITM-vulnerable until operators noticed and overrode. Empty value
	// here flows through to the DSN builder, which fails loud at dispatch
	// time with a clear "must set X to verify-full or require" message
	// rather than silently encrypting without identity validation.
	require.Empty(t, config.SSLMode)
	require.Empty(t, config.SSLRootCert)
}

func TestConfigFromEnvDefaultsOptionalSettings(t *testing.T) {
	config, err := ConfigFromEnv(func(string) string { return "" })

	require.NoError(t, err)
	require.Equal(t, "/var/lib/superblocks/database-lifecycle", config.RootDir)
	require.Equal(t, "tofu", config.TerraformBin)
	require.Equal(t, 30*time.Second, config.PollInterval)
}

func TestConfigFromEnvRejectsInvalidPollInterval(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_POLL_INTERVAL": "nope",
	}

	_, err := ConfigFromEnv(func(key string) string { return env[key] })

	require.ErrorContains(t, err, "poll interval")
}

func TestConfigFromEnvParsesLifecycleConfigAndResolvesPlatformEntry(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG": `{
		  "entries": [
		    {
		      "environment": "deployed",
		      "profile": "production",
		      "engines": ["postgres"],
		      "backend": {"stateBackend": "s3", "bucket": "state-bucket", "key": "profiles/{{profile_id}}/{{resource_key}}.tfstate", "region": "us-west-2"},
		      "credentialResolver": {"runtime": "aws_secrets_manager"},
		      "moduleSelectors": {
		        "ensure_database": {
		          "postgres": {
		            "source": "app.terraform.io/superblocks/postgres-managed-database/aws",
		            "version": "1.2.3",
		            "inputs": {"storage_gb": 20}
		          }
		        }
		      }
		    }
		  ]
		}`,
	}

	config, err := ConfigFromEnv(func(key string) string { return env[key] })
	require.NoError(t, err)

	resolved, err := config.LifecycleConfig.Resolve("deployed", "production", "ensure_database", "postgres")
	require.NoError(t, err)
	require.Equal(t, TerraformModule{
		Source:  "app.terraform.io/superblocks/postgres-managed-database/aws",
		Version: "1.2.3",
		Inputs: map[string]any{
			"storage_gb": float64(20),
		},
	}, resolved.Module)
	require.Equal(t, map[string]any{
		"stateBackend": "s3",
		"bucket":       "state-bucket",
		"key":          "profiles/{{profile_id}}/{{resource_key}}.tfstate",
		"region":       "us-west-2",
	}, resolved.Backend)
	require.Equal(t, map[string]any{"runtime": "aws_secrets_manager"}, resolved.CredentialResolver)
}

func TestConfigFromEnvRejectsInvalidLifecycleConfig(t *testing.T) {
	tests := []struct {
		name      string
		config    string
		wantError string
	}{
		{
			name:      "unsupported environment",
			config:    lifecycleConfigWithEntry(`"environment": "staging"`),
			wantError: "entries[0].environment must be one of edit, preview, deployed",
		},
		{
			name:      "empty profile",
			config:    lifecycleConfigWithEntry(`"profile": ""`),
			wantError: "entries[0].profile is required",
		},
		{
			name:      "empty engine",
			config:    lifecycleConfigWithEntry(`"engines": [""]`),
			wantError: "entries[0].engines[0] is required",
		},
		{
			name:      "empty credential resolver",
			config:    lifecycleConfigWithEmptyCredentialResolver(),
			wantError: "entries[0].credentialResolver is required",
		},
		{
			name:      "missing module selectors",
			config:    lifecycleConfigWithEmptyModuleSelectors(),
			wantError: "entries[0].moduleSelectors is required",
		},
		{
			name:      "missing backend",
			config:    lifecycleConfigWithEmptyBackend(),
			wantError: "entries[0].backend is required",
		},
		{
			name:      "empty operation key",
			config:    lifecycleConfigWithModuleSelectors(`"": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}`),
			wantError: "entries[0].moduleSelectors operation key is required",
		},
		{
			name:      "empty operation engines",
			config:    lifecycleConfigWithModuleSelectors(`"ensure_database": {}`),
			wantError: "entries[0].moduleSelectors.ensure_database engines are required",
		},
		{
			name:      "empty module engine key",
			config:    lifecycleConfigWithModuleSelectors(`"ensure_database": {"": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}`),
			wantError: "entries[0].moduleSelectors.ensure_database engine key is required",
		},
		{
			name:      "missing module source",
			config:    lifecycleConfigWithModuleSelectors(`"ensure_database": {"postgres": {"version": "1.2.3"}}`),
			wantError: "entries[0].moduleSelectors.ensure_database.postgres.source is required",
		},
		{
			name: "duplicate environment and profile",
			config: `{
			  "entries": [
			    {
			      "environment": "deployed",
			      "profile": "production",
			      "engines": ["postgres"],
			      "backend": {"stateBackend": "s3"},
			      "credentialResolver": {"runtime": "aws_secrets_manager"},
			      "moduleSelectors": {
			        "ensure_database": {
			          "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
			        }
			      }
			    },
			    {
			      "environment": "deployed",
			      "profile": "production",
			      "engines": ["postgres"],
			      "backend": {"stateBackend": "s3"},
			      "credentialResolver": {"runtime": "aws_secrets_manager"},
			      "moduleSelectors": {
			        "ensure_database": {
			          "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
			        }
			      }
			    }
			  ]
			}`,
			wantError: `duplicates environment "deployed" profile "production"`,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			env := map[string]string{"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG": test.config}

			_, err := ConfigFromEnv(func(key string) string { return env[key] })

			require.ErrorContains(t, err, test.wantError)
		})
	}
}

func TestLifecycleConfigResolveIncludesRequestContextAndAvailableEntries(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG": `{
		  "entries": [
		    {
		      "environment": "deployed",
		      "profile": "production",
		      "engines": ["postgres"],
		      "backend": {"stateBackend": "s3"},
		      "credentialResolver": {"runtime": "aws_secrets_manager"},
		      "moduleSelectors": {
		        "ensure_database": {
		          "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
		        }
		      }
		    }
		  ]
		}`,
	}
	config, err := ConfigFromEnv(func(key string) string { return env[key] })
	require.NoError(t, err)

	_, err = config.LifecycleConfig.Resolve("preview", "sandbox", "drop_database", "mysql")

	require.ErrorContains(t, err, `environment "preview" profile "sandbox" operation "drop_database" engine "mysql"`)
	require.ErrorContains(t, err, `configured entries: deployed/production engines=[postgres] operations=[ensure_database]`)
}

func TestLifecycleConfigResolveReportsSupportedModuleEngines(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG": `{
		  "entries": [
		    {
		      "environment": "deployed",
		      "profile": "production",
		      "engines": ["mysql", "postgres"],
		      "backend": {"stateBackend": "s3"},
		      "credentialResolver": {"runtime": "aws_secrets_manager"},
		      "moduleSelectors": {
		        "ensure_database": {
		          "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
		        }
		      }
		    }
		  ]
		}`,
	}
	config, err := ConfigFromEnv(func(key string) string { return env[key] })
	require.NoError(t, err)

	_, err = config.LifecycleConfig.Resolve("deployed", "production", "ensure_database", "mysql")

	require.ErrorContains(t, err, `operation "ensure_database" does not support environment "deployed" profile "production" operation "ensure_database" engine "mysql"`)
	require.ErrorContains(t, err, "supported engines: [postgres]")
}

func lifecycleConfigWithEntry(replacement string) string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profile": "production",
	      "engines": ["postgres"],
	      "backend": {"stateBackend": "s3"},
	      "credentialResolver": {"runtime": "aws_secrets_manager"},
	      "moduleSelectors": {
	        "ensure_database": {
	          "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
	        }
	      },
	      ` + replacement + `
	    }
	  ]
	}`
}

func lifecycleConfigWithEmptyCredentialResolver() string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profile": "production",
	      "engines": ["postgres"],
	      "backend": {"stateBackend": "s3"},
	      "credentialResolver": {},
	      "moduleSelectors": {
	        "ensure_database": {
	          "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
	        }
	      }
	    }
	  ]
	}`
}

func lifecycleConfigWithEmptyBackend() string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profile": "production",
	      "engines": ["postgres"],
	      "backend": {},
	      "credentialResolver": {"runtime": "aws_secrets_manager"},
	      "moduleSelectors": {
	        "ensure_database": {
	          "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
	        }
	      }
	    }
	  ]
	}`
}

func lifecycleConfigWithEmptyModuleSelectors() string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profile": "production",
	      "engines": ["postgres"],
	      "backend": {"stateBackend": "s3"},
	      "credentialResolver": {"runtime": "aws_secrets_manager"},
	      "moduleSelectors": {}
	    }
	  ]
	}`
}

func lifecycleConfigWithModuleSelectors(moduleSelectors string) string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profile": "production",
	      "engines": ["postgres"],
	      "backend": {"stateBackend": "s3"},
	      "credentialResolver": {"runtime": "aws_secrets_manager"},
	      "moduleSelectors": {` + moduleSelectors + `}
	    }
	  ]
	}`
}
