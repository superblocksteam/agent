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
		      "profiles": ["production", "staging"],
		      "engines": ["postgres"],
		      "backend": {"stateBackend": "s3", "bucket": "state-bucket", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-west-2"},
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
		"key":          "{{environment}}/{{profile}}/{{resource_key}}.tfstate",
		"region":       "us-west-2",
	}, resolved.Backend)
	require.Equal(t, map[string]any{"runtime": "aws_secrets_manager"}, resolved.CredentialResolver)

	staging, err := config.LifecycleConfig.Resolve("deployed", "staging", "ensure_database", "postgres")
	require.NoError(t, err)
	require.Equal(t, resolved, staging)
}

func TestConfigFromEnvParsesModuleShapes(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG": minimalLifecycleConfig(),
		"SUPERBLOCKS_DATABASE_LIFECYCLE_MODULE_SHAPES": `{
		  "app.terraform.io/superblocks/postgres-managed-database/aws": {
		    "variables": ["binding_key", "desired_spec_hash", "environment_class", "environment_name", "operation", "profile_id", "request_id", "resource_key", "credential_resolver", "storage_gb"]
		  }
		}`,
	}

	config, err := ConfigFromEnv(func(key string) string { return env[key] })

	require.NoError(t, err)
	require.Equal(t, map[string]TerraformModuleShape{
		"app.terraform.io/superblocks/postgres-managed-database/aws": {
			Variables: []string{"binding_key", "desired_spec_hash", "environment_class", "environment_name", "operation", "profile_id", "request_id", "resource_key", "credential_resolver", "storage_gb"},
		},
	}, config.ModuleShapes)
}

func TestConfigFromEnvIgnoresModuleShapesWithoutLifecycleConfig(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_MODULE_SHAPES": `{invalid json`,
	}

	config, err := ConfigFromEnv(func(key string) string { return env[key] })

	require.NoError(t, err)
	require.Nil(t, config.ModuleShapes)
}

func TestConfigFromEnvRejectsInvalidModuleShapes(t *testing.T) {
	tests := []struct {
		name      string
		shapes    string
		wantError string
	}{
		{
			name:      "invalid json",
			shapes:    `{invalid json`,
			wantError: "database lifecycle module shapes",
		},
		{
			name:      "empty map",
			shapes:    `{}`,
			wantError: "database lifecycle module shapes are required",
		},
		{
			name:      "empty source",
			shapes:    `{"": {"variables": ["binding_key"]}}`,
			wantError: "database lifecycle module shape source is required",
		},
		{
			name:      "empty variables",
			shapes:    `{"app.terraform.io/superblocks/postgres-managed-database/aws": {"variables": []}}`,
			wantError: `database lifecycle module shape "app.terraform.io/superblocks/postgres-managed-database/aws" variables are required`,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			env := map[string]string{
				"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG":        minimalLifecycleConfig(),
				"SUPERBLOCKS_DATABASE_LIFECYCLE_MODULE_SHAPES": test.shapes,
			}

			_, err := ConfigFromEnv(func(key string) string { return env[key] })

			require.ErrorContains(t, err, test.wantError)
		})
	}
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
			name:      "missing profiles",
			config:    lifecycleConfigWithEntry(`"profiles": []`),
			wantError: "entries[0].profiles is required",
		},
		{
			name:      "empty profile",
			config:    lifecycleConfigWithEntry(`"profiles": [""]`),
			wantError: "entries[0].profiles[0] is required",
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
			name:      "operation missing declared engine module",
			config:    lifecycleConfigWithEntry(`"engines": ["postgres", "mysql"], "moduleSelectors": {"ensure_database": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}}`),
			wantError: "entries[0].moduleSelectors.ensure_database.mysql is required for declared engine",
		},
		{
			name: "entry missing globally advertised operation",
			config: `{
			  "entries": [
			    {
			      "environment": "deployed",
			      "profiles": ["production"],
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
			      "environment": "edit",
			      "profiles": ["production"],
			      "engines": ["postgres"],
			      "backend": {"stateBackend": "s3"},
			      "credentialResolver": {"runtime": "aws_secrets_manager"},
			      "moduleSelectors": {
			        "ensure_database": {
			          "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
			        },
			        "migrate_schema": {
			          "postgres": {"source": "app.terraform.io/superblocks/postgres-migration-runner/native"}
			        }
			      }
			    }
			  ]
			}`,
			wantError: "entries[0].moduleSelectors operations must match configured operations [ensure_database, migrate_schema]",
		},
		{
			name: "entry missing globally advertised engine",
			config: `{
			  "entries": [
			    {
			      "environment": "deployed",
			      "profiles": ["production"],
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
			      "environment": "edit",
			      "profiles": ["production"],
			      "engines": ["mysql", "postgres"],
			      "backend": {"stateBackend": "s3"},
			      "credentialResolver": {"runtime": "aws_secrets_manager"},
			      "moduleSelectors": {
			        "ensure_database": {
			          "mysql": {"source": "app.terraform.io/superblocks/mysql-managed-database/aws"},
			          "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
			        }
			      }
			    }
			  ]
			}`,
			wantError: "entries[0].engines must match configured engines [mysql, postgres]",
		},
		{
			name:      "duplicate environment and profile within profiles array",
			config:    lifecycleConfigWithEntry(`"profiles": ["production", "production"]`),
			wantError: `duplicates environment "deployed" profile "production"`,
		},
		{
			name: "duplicate environment and profile across entries",
			config: `{
			  "entries": [
			    {
			      "environment": "deployed",
			      "profiles": ["production"],
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
			      "profiles": ["production"],
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
		      "profiles": ["production"],
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
	require.ErrorContains(t, err, `configured entries: deployed profiles=[production] engines=[postgres] operations=[ensure_database]`)
}

func TestLifecycleConfigResolveReportsSupportedModuleEngines(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"mysql", "postgres"},
			ModuleSelectors: map[string]map[string]TerraformModule{
				"ensure_database": {
					"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws"},
				},
			},
		}},
	}

	_, err := config.Resolve("deployed", "production", "ensure_database", "mysql")

	require.ErrorContains(t, err, `operation "ensure_database" does not support environment "deployed" profile "production" operation "ensure_database" engine "mysql"`)
	require.ErrorContains(t, err, "supported engines: [postgres]")
}

func TestConfigFromEnvAllowsNonRectangularEnvironmentProfileCoverage(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG": `{
		  "entries": [
		    {
		      "environment": "deployed",
		      "profiles": ["production"],
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
		      "environment": "edit",
		      "profiles": ["staging-us", "staging-eu"],
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

	_, err = config.LifecycleConfig.Resolve("edit", "production", "ensure_database", "postgres")
	require.ErrorContains(t, err, `environment "edit" profile "production" operation "ensure_database" engine "postgres"`)
}

func TestLifecycleConfigResolveSupportsExplicitWildcardProfile(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{{
			Environment: "edit",
			Profiles:    []string{"*"},
			Engines:     []string{"postgres"},
			Backend:     map[string]any{"stateBackend": "s3"},
			CredentialResolver: map[string]any{
				"runtime": "aws_secrets_manager",
			},
			ModuleSelectors: map[string]map[string]TerraformModule{
				"ensure_database": {
					"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws"},
				},
			},
		}},
	}

	_, err := config.Resolve("edit", "staging-us", "ensure_database", "postgres")

	require.NoError(t, err)
}

func minimalLifecycleConfig() string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profiles": ["production"],
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
	}`
}

func lifecycleConfigWithEntry(replacement string) string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profiles": ["production"],
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
	      "profiles": ["production"],
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
	      "profiles": ["production"],
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
	      "profiles": ["production"],
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
	      "profiles": ["production"],
	      "engines": ["postgres"],
	      "backend": {"stateBackend": "s3"},
	      "credentialResolver": {"runtime": "aws_secrets_manager"},
	      "moduleSelectors": {` + moduleSelectors + `}
	    }
	  ]
	}`
}
