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
		      "operations": {
		        "ensure_database": {
		          "backend": "terraform",
		          "terraform": {
		            "backend": {"stateBackend": "s3", "bucket": "state-bucket", "key": "{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-west-2"},
		            "credentialResolver": {"runtime": "aws_secrets_manager"},
		            "moduleSelectors": {
		              "postgres": {
		                "source": "app.terraform.io/superblocks/postgres-managed-database/aws",
		                "version": "1.2.3",
		                "inputs": {"storage_gb": 20}
		              }
		            }
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

func TestConfigFromEnvParsesOperationBackendsAndResolvesTerraformOperation(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG": `{
		  "entries": [
		    {
		      "environment": "deployed",
		      "profiles": ["production"],
		      "engines": ["postgres"],
		      "operations": {
		        "ensure_database": {
		          "backend": "terraform",
		          "terraform": {
		            "backend": {"stateBackend": "s3", "bucket": "state-bucket"},
		            "credentialResolver": {"runtime": "aws_secrets_manager"},
		            "moduleSelectors": {
		              "postgres": {
		                "source": "app.terraform.io/superblocks/postgres-managed-database/aws",
		                "version": "1.2.3",
		                "inputs": {"storage_gb": 20}
		              }
		            }
		          }
		        },
		        "migrate_schema": {
		          "backend": "native_runner"
		        }
		      }
		    }
		  ]
		}`,
	}

	config, err := ConfigFromEnv(func(key string) string { return env[key] })
	require.NoError(t, err)

	require.Equal(t, map[string][]string{
		"databaseLifecycle:operations":          {"ensure_database", "migrate_schema"},
		"databaseLifecycle:engines":             {"postgres"},
		"databaseLifecycle:environmentProfiles": {"deployed:production"},
	}, config.LifecycleConfig.CapabilityTags())

	resolved, err := config.LifecycleConfig.Resolve("deployed", "production", "ensure_database", "postgres")
	require.NoError(t, err)
	require.Equal(t, TerraformModule{
		Source:  "app.terraform.io/superblocks/postgres-managed-database/aws",
		Version: "1.2.3",
		Inputs: map[string]any{
			"storage_gb": float64(20),
		},
	}, resolved.Module)
	require.Equal(t, map[string]any{"stateBackend": "s3", "bucket": "state-bucket"}, resolved.Backend)
	require.Equal(t, map[string]any{"runtime": "aws_secrets_manager"}, resolved.CredentialResolver)
}

func TestConfigFromEnvParsesExplicitPhysicalDatabasePolicy(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG": `{
		  "entries": [
		    {
		      "environment": "deployed",
		      "profiles": ["production"],
		      "engines": ["postgres"],
		      "operations": {
		        "ensure_database": {
		          "backend": "terraform",
		          "physicalDatabase": {
		            "mode": "shared_pool",
		            "provisionOperation": "ensure_physical_database_instance",
		            "onExhausted": "provision",
		            "capacityMax": 100,
		            "securityClass": "standard"
		          },
		          "terraform": {
		            "backend": {"stateBackend": "s3", "bucket": "logical-state"},
		            "credentialResolver": {"runtime": "aws_secrets_manager"},
		            "moduleSelectors": {
		              "postgres": {
		                "source": "app.terraform.io/superblocks/postgres-managed-database/aws",
		                "version": "1.2.3",
		                "inputs": {"credential_secret_prefix": "superblocks/native-db/prod"}
		              }
		            }
		          }
		        },
		        "ensure_physical_database_instance": {
		          "backend": "terraform",
		          "terraform": {
		            "backend": {"stateBackend": "s3", "bucket": "physical-state"},
		            "credentialResolver": {"runtime": "aws_secrets_manager"},
		            "moduleSelectors": {
		              "postgres": {
		                "source": "github.com/superblocksteam/terraform//modules/native-database/aws-rds-managed-instance",
		                "inputs": {"capacity_max": 4}
		              }
		            }
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
	require.Equal(t, &PhysicalDatabasePolicy{
		Mode:               "shared_pool",
		ProvisionOperation: "ensure_physical_database_instance",
		OnExhausted:        "provision",
		CapacityMax:        100,
		SecurityClass:      "standard",
	}, resolved.PhysicalDatabase)
}

func TestConfigFromEnvIgnoresLegacyModuleShapes(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG":        minimalLifecycleConfig(),
		"SUPERBLOCKS_DATABASE_LIFECYCLE_MODULE_SHAPES": `{invalid legacy json`,
	}

	config, err := ConfigFromEnv(func(key string) string { return env[key] })

	require.NoError(t, err)
	require.Len(t, config.LifecycleConfig.Entries, 1)
}

func TestConfigFromEnvRejectsInvalidLifecycleConfig(t *testing.T) {
	tests := []struct {
		name      string
		config    string
		wantError string
	}{
		{
			name:      "legacy module selectors without operations",
			config:    legacyLifecycleConfig(),
			wantError: "uses legacy entry-level backend/credentialResolver/moduleSelectors fields",
		},
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
			name:      "missing operations",
			config:    lifecycleConfigWithoutOperations(),
			wantError: "entries[0].operations is required",
		},
		{
			name:      "empty operation key",
			config:    lifecycleConfigWithOperations(`"": {"backend": "native_runner"}`),
			wantError: "entries[0].operations operation key is required",
		},
		{
			name:      "missing operation backend",
			config:    lifecycleConfigWithOperations(`"ensure_database": {}`),
			wantError: "entries[0].operations.ensure_database.backend is required",
		},
		{
			name:      "unsupported operation backend",
			config:    lifecycleConfigWithOperations(`"ensure_database": {"backend": "queue"}`),
			wantError: "entries[0].operations.ensure_database.backend must be one of native_runner, terraform",
		},
		{
			name:      "physical database policy on unsupported operation",
			config:    lifecycleConfigWithOperations(`"migrate_schema": {"backend": "native_runner", "physicalDatabase": {"mode": "none"}}`),
			wantError: "entries[0].operations.migrate_schema.physicalDatabase is only supported for ensure_database",
		},
		{
			name:      "physical database policy missing mode",
			config:    lifecycleConfigWithPhysicalDatabasePolicy(`{}`),
			wantError: "entries[0].operations.ensure_database.physicalDatabase.mode is required",
		},
		{
			name:      "physical database policy unsupported mode",
			config:    lifecycleConfigWithPhysicalDatabasePolicy(`{"mode": "pooled"}`),
			wantError: "entries[0].operations.ensure_database.physicalDatabase.mode must be one of none, shared_pool, dedicated",
		},
		{
			name:      "physical database none mode rejects provision operation",
			config:    lifecycleConfigWithPhysicalDatabasePolicy(`{"mode": "none", "provisionOperation": "ensure_physical_database_instance"}`),
			wantError: "entries[0].operations.ensure_database.physicalDatabase.provisionOperation must be omitted when mode is none",
		},
		{
			name:      "physical database none mode rejects on exhausted",
			config:    lifecycleConfigWithPhysicalDatabasePolicy(`{"mode": "none", "onExhausted": "provision"}`),
			wantError: "entries[0].operations.ensure_database.physicalDatabase.onExhausted must be omitted when mode is none",
		},
		{
			name:      "physical database shared pool requires provision operation",
			config:    lifecycleConfigWithPhysicalDatabasePolicy(`{"mode": "shared_pool", "onExhausted": "provision"}`),
			wantError: "entries[0].operations.ensure_database.physicalDatabase.provisionOperation is required when mode is shared_pool",
		},
		{
			name:      "physical database shared pool requires provision on exhausted",
			config:    lifecycleConfigWithPhysicalDatabasePolicy(`{"mode": "shared_pool", "provisionOperation": "ensure_physical_database_instance", "onExhausted": "fail"}`),
			wantError: "entries[0].operations.ensure_database.physicalDatabase.onExhausted must be provision when mode is shared_pool",
		},
		{
			name:      "physical database provision operation must exist in entry",
			config:    lifecycleConfigWithPhysicalDatabasePolicy(`{"mode": "shared_pool", "provisionOperation": "missing_physical_database_instance", "onExhausted": "provision"}`),
			wantError: "entries[0].operations.ensure_database.physicalDatabase.provisionOperation missing_physical_database_instance is not configured in this entry",
		},
		{
			name:      "physical database capacity must not be negative",
			config:    lifecycleConfigWithPhysicalDatabasePolicy(`{"mode": "shared_pool", "provisionOperation": "ensure_physical_database_instance", "onExhausted": "provision", "capacityMax": -1}`),
			wantError: "entries[0].operations.ensure_database.physicalDatabase.capacityMax must be a non-negative integer",
		},
		{
			name:      "native runner backend for unsupported operation",
			config:    lifecycleConfigWithOperations(`"ensure_database": {"backend": "native_runner"}`),
			wantError: "entries[0].operations.ensure_database.backend native_runner is only supported for migrate_schema",
		},
		{
			name:      "terraform operation missing terraform config",
			config:    lifecycleConfigWithOperations(`"ensure_database": {"backend": "terraform"}`),
			wantError: "entries[0].operations.ensure_database.terraform is required",
		},
		{
			name:      "terraform operation missing backend",
			config:    lifecycleConfigWithTerraformOperation(`"credentialResolver": {"runtime": "aws_secrets_manager"}, "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}`),
			wantError: "entries[0].operations.ensure_database.terraform.backend is required",
		},
		{
			name:      "terraform operation missing credential resolver",
			config:    lifecycleConfigWithTerraformOperation(`"backend": {"stateBackend": "s3"}, "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}`),
			wantError: "entries[0].operations.ensure_database.terraform.credentialResolver is required",
		},
		{
			name:      "terraform operation missing module selectors",
			config:    lifecycleConfigWithTerraformOperation(`"backend": {"stateBackend": "s3"}, "credentialResolver": {"runtime": "aws_secrets_manager"}, "moduleSelectors": {}`),
			wantError: "entries[0].operations.ensure_database.terraform.moduleSelectors engines are required",
		},
		{
			name:      "empty module engine key",
			config:    lifecycleConfigWithTerraformOperation(`"backend": {"stateBackend": "s3"}, "credentialResolver": {"runtime": "aws_secrets_manager"}, "moduleSelectors": {"": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}`),
			wantError: "entries[0].operations.ensure_database.terraform.moduleSelectors engine key is required",
		},
		{
			name:      "missing module source",
			config:    lifecycleConfigWithTerraformOperation(`"backend": {"stateBackend": "s3"}, "credentialResolver": {"runtime": "aws_secrets_manager"}, "moduleSelectors": {"postgres": {"version": "1.2.3"}}`),
			wantError: "entries[0].operations.ensure_database.terraform.moduleSelectors.postgres.source is required",
		},
		{
			name:      "operation missing declared engine module",
			config:    lifecycleConfigWithEntry(`"engines": ["postgres", "mysql"]`),
			wantError: "entries[0].operations.ensure_database.terraform.moduleSelectors.mysql is required for declared engine",
		},
		{
			name: "entry missing globally advertised operation",
			config: `{
			  "entries": [
			    {
			      "environment": "deployed",
			      "profiles": ["production"],
			      "engines": ["postgres"],
			      "operations": {
			        "ensure_database": {
			          "backend": "terraform",
			          "terraform": {
			            "backend": {"stateBackend": "s3"},
			            "credentialResolver": {"runtime": "aws_secrets_manager"},
			            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
			          }
			        }
			      }
			    },
			    {
			      "environment": "edit",
			      "profiles": ["production"],
			      "engines": ["postgres"],
			      "operations": {
			        "ensure_database": {
			          "backend": "terraform",
			          "terraform": {
			            "backend": {"stateBackend": "s3"},
			            "credentialResolver": {"runtime": "aws_secrets_manager"},
			            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
			          }
			        },
			        "migrate_schema": {
			          "backend": "native_runner"
			        }
			      }
			    }
			  ]
			}`,
			wantError: "entries[0].operations must match configured operations [ensure_database, migrate_schema]",
		},
		{
			name: "entry missing globally advertised engine",
			config: `{
			  "entries": [
			    {
			      "environment": "deployed",
			      "profiles": ["production"],
			      "engines": ["postgres"],
			      "operations": {
			        "ensure_database": {
			          "backend": "terraform",
			          "terraform": {
			            "backend": {"stateBackend": "s3"},
			            "credentialResolver": {"runtime": "aws_secrets_manager"},
			            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
			          }
			        }
			      }
			    },
			    {
			      "environment": "edit",
			      "profiles": ["production"],
			      "engines": ["mysql", "postgres"],
			      "operations": {
			        "ensure_database": {
			          "backend": "terraform",
			          "terraform": {
			            "backend": {"stateBackend": "s3"},
			            "credentialResolver": {"runtime": "aws_secrets_manager"},
			            "moduleSelectors": {
			              "mysql": {"source": "app.terraform.io/superblocks/mysql-managed-database/aws"},
			              "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
			            }
			          }
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
				      "operations": {
				        "ensure_database": {
				          "backend": "terraform",
				          "terraform": {
				            "backend": {"stateBackend": "s3"},
				            "credentialResolver": {"runtime": "aws_secrets_manager"},
				            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
				          }
				        }
				      }
				    },
			    {
			      "environment": "deployed",
			      "profiles": ["production"],
			      "engines": ["postgres"],
				      "operations": {
				        "ensure_database": {
				          "backend": "terraform",
				          "terraform": {
				            "backend": {"stateBackend": "s3"},
				            "credentialResolver": {"runtime": "aws_secrets_manager"},
				            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
				          }
				        }
				      }
				    }
			  ]
			}`,
			wantError: `duplicates environment "deployed" profile "production"`,
		},
		{
			name:      "conflicting physical pooling policy for same environment",
			config:    lifecycleConfigWithConflictingPhysicalPooling(),
			wantError: `environment "deployed" has conflicting physical database pooling configuration across entries`,
		},
		{
			name:      "mixed physical pooling entries for same environment",
			config:    lifecycleConfigWithMixedPhysicalPooling(),
			wantError: `environment "deployed" mixes physical database pooling and non-pooling entries`,
		},
		{
			name:      "conflicting physical pooling terraform backend for same environment",
			config:    lifecycleConfigWithConflictingPhysicalPoolingBackend(),
			wantError: `environment "deployed" has conflicting physical database pooling configuration across entries`,
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
		"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG": minimalLifecycleConfig(),
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
			Operations: map[string]LifecycleOperation{
				"ensure_database": terraformOperation(map[string]TerraformModule{
					"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws"},
				}),
			},
		}},
	}

	_, err := config.Resolve("deployed", "production", "ensure_database", "mysql")

	require.ErrorContains(t, err, `operation "ensure_database" does not support environment "deployed" profile "production" operation "ensure_database" engine "mysql"`)
	require.ErrorContains(t, err, "supported engines: [postgres]")
}

func TestLifecycleConfigResolveRejectsMalformedTerraformOperation(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{{
			Environment: "deployed",
			Profiles:    []string{"production"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				"ensure_database": {
					Backend: "terraform",
				},
			},
		}},
	}

	_, err := config.Resolve("deployed", "production", "ensure_database", "postgres")

	require.ErrorContains(t, err, `operation "ensure_database" has incomplete Terraform backend config`)
}

func TestConfigFromEnvAllowsNonRectangularEnvironmentProfileCoverage(t *testing.T) {
	env := map[string]string{
		"SUPERBLOCKS_DATABASE_LIFECYCLE_CONFIG": `{
		  "entries": [
		    {
		      "environment": "deployed",
		      "profiles": ["production"],
		      "engines": ["postgres"],
			      "operations": {
			        "migrate_schema": {
			          "backend": "native_runner"
			        }
			      }
		    },
		    {
		      "environment": "edit",
		      "profiles": ["staging-us", "staging-eu"],
		      "engines": ["postgres"],
			      "operations": {
			        "migrate_schema": {
			          "backend": "native_runner"
			        }
			      }
		    }
		  ]
		}`,
	}

	config, err := ConfigFromEnv(func(key string) string { return env[key] })
	require.NoError(t, err)

	_, err = config.LifecycleConfig.Resolve("edit", "production", "migrate_schema", "postgres")
	require.ErrorContains(t, err, `environment "edit" profile "production" operation "migrate_schema" engine "postgres"`)
}

func TestLifecycleConfigResolveSupportsExplicitWildcardProfile(t *testing.T) {
	config := LifecycleConfig{
		Entries: []LifecycleConfigEntry{{
			Environment: "edit",
			Profiles:    []string{"*"},
			Engines:     []string{"postgres"},
			Operations: map[string]LifecycleOperation{
				"ensure_database": terraformOperation(map[string]TerraformModule{
					"postgres": {Source: "app.terraform.io/superblocks/postgres-managed-database/aws"},
				}),
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
	      "operations": {
	        "ensure_database": {
	          "backend": "terraform",
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {
	              "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
	            }
	          }
	        }
	      }
	    }
	  ]
	}`
}

func legacyLifecycleConfig() string {
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
	      "operations": {
	        "ensure_database": {
	          "backend": "terraform",
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {
	              "postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}
	            }
	          }
	        }
	      },
	      ` + replacement + `
	    }
	  ]
	}`
}

func lifecycleConfigWithoutOperations() string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profiles": ["production"],
	      "engines": ["postgres"]
	    }
	  ]
	}`
}

func lifecycleConfigWithOperations(operations string) string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profiles": ["production"],
	      "engines": ["postgres"],
	      "operations": {` + operations + `}
	    }
	  ]
	}`
}

func lifecycleConfigWithTerraformOperation(terraformConfig string) string {
	return lifecycleConfigWithOperations(`"ensure_database": {"backend": "terraform", "terraform": {` + terraformConfig + `}}`)
}

func lifecycleConfigWithPhysicalDatabasePolicy(policy string) string {
	return lifecycleConfigWithOperations(`"ensure_database": {
	  "backend": "terraform",
	  "physicalDatabase": ` + policy + `,
	  "terraform": {
	    "backend": {"stateBackend": "s3"},
	    "credentialResolver": {"runtime": "aws_secrets_manager"},
	    "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
	  }
	}`)
}

func terraformOperation(moduleSelectors map[string]TerraformModule) LifecycleOperation {
	return terraformOperationWithBackend(map[string]any{"stateBackend": "s3"}, moduleSelectors)
}

func terraformOperationWithBackend(backend map[string]any, moduleSelectors map[string]TerraformModule) LifecycleOperation {
	return LifecycleOperation{
		Backend: "terraform",
		Terraform: &TerraformOperationBackend{
			Backend:            backend,
			CredentialResolver: map[string]any{"runtime": "aws_secrets_manager"},
			ModuleSelectors:    moduleSelectors,
		},
	}
}

func lifecycleConfigWithConflictingPhysicalPooling() string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profiles": ["production"],
	      "engines": ["postgres"],
	      "operations": {
	        "ensure_database": {
	          "backend": "terraform",
	          "physicalDatabase": {
	            "mode": "shared_pool",
	            "provisionOperation": "ensure_physical_database_instance",
	            "onExhausted": "provision",
	            "capacityMax": 1,
	            "securityClass": "standard"
	          },
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
	          }
	        },
	        "ensure_physical_database_instance": {
	          "backend": "terraform",
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/rds-postgres/aws", "inputs": {"instance_class": "db.m6g.large"}}}
	          }
	        },
	        "migrate_schema": {"backend": "native_runner"}
	      }
	    },
	    {
	      "environment": "deployed",
	      "profiles": ["staging"],
	      "engines": ["postgres"],
	      "operations": {
	        "ensure_database": {
	          "backend": "terraform",
	          "physicalDatabase": {
	            "mode": "shared_pool",
	            "provisionOperation": "ensure_physical_database_instance",
	            "onExhausted": "provision",
	            "capacityMax": 100,
	            "securityClass": "standard"
	          },
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
	          }
	        },
	        "ensure_physical_database_instance": {
	          "backend": "terraform",
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/rds-postgres/aws", "inputs": {"instance_class": "db.t4g.micro"}}}
	          }
	        },
	        "migrate_schema": {"backend": "native_runner"}
	      }
	    }
	  ]
	}`
}

func lifecycleConfigWithConflictingPhysicalPoolingBackend() string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profiles": ["production"],
	      "engines": ["postgres"],
	      "operations": {
	        "ensure_database": {
	          "backend": "terraform",
	          "physicalDatabase": {
	            "mode": "shared_pool",
	            "provisionOperation": "ensure_physical_database_instance",
	            "onExhausted": "provision",
	            "capacityMax": 100,
	            "securityClass": "standard"
	          },
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
	          }
	        },
	        "ensure_physical_database_instance": {
	          "backend": "terraform",
	          "terraform": {
	            "backend": {"stateBackend": "s3", "bucket": "physical-state-prod", "key": "native-db/physical/{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1", "use_lockfile": true},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/rds-postgres/aws", "inputs": {"instance_class": "db.m6g.large"}}}
	          }
	        },
	        "migrate_schema": {"backend": "native_runner"}
	      }
	    },
	    {
	      "environment": "deployed",
	      "profiles": ["staging"],
	      "engines": ["postgres"],
	      "operations": {
	        "ensure_database": {
	          "backend": "terraform",
	          "physicalDatabase": {
	            "mode": "shared_pool",
	            "provisionOperation": "ensure_physical_database_instance",
	            "onExhausted": "provision",
	            "capacityMax": 100,
	            "securityClass": "standard"
	          },
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
	          }
	        },
	        "ensure_physical_database_instance": {
	          "backend": "terraform",
	          "terraform": {
	            "backend": {"stateBackend": "s3", "bucket": "physical-state-staging", "key": "native-db/physical/{{environment}}/{{profile}}/{{resource_key}}.tfstate", "region": "us-east-1", "use_lockfile": true},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/rds-postgres/aws", "inputs": {"instance_class": "db.m6g.large"}}}
	          }
	        },
	        "migrate_schema": {"backend": "native_runner"}
	      }
	    }
	  ]
	}`
}

func lifecycleConfigWithMixedPhysicalPooling() string {
	return `{
	  "entries": [
	    {
	      "environment": "deployed",
	      "profiles": ["production"],
	      "engines": ["postgres"],
	      "operations": {
	        "ensure_database": {
	          "backend": "terraform",
	          "physicalDatabase": {
	            "mode": "shared_pool",
	            "provisionOperation": "ensure_physical_database_instance",
	            "onExhausted": "provision",
	            "capacityMax": 1,
	            "securityClass": "standard"
	          },
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
	          }
	        },
	        "ensure_physical_database_instance": {
	          "backend": "terraform",
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/rds-postgres/aws"}}
	          }
	        },
	        "migrate_schema": {"backend": "native_runner"}
	      }
	    },
	    {
	      "environment": "deployed",
	      "profiles": ["staging"],
	      "engines": ["postgres"],
	      "operations": {
	        "ensure_database": {
	          "backend": "terraform",
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/postgres-managed-database/aws"}}
	          }
	        },
	        "ensure_physical_database_instance": {
	          "backend": "terraform",
	          "terraform": {
	            "backend": {"stateBackend": "s3"},
	            "credentialResolver": {"runtime": "aws_secrets_manager"},
	            "moduleSelectors": {"postgres": {"source": "app.terraform.io/superblocks/rds-postgres/aws"}}
	          }
	        },
	        "migrate_schema": {"backend": "native_runner"}
	      }
	    }
	  ]
	}`
}
