package databaselifecycle

import (
	"context"
	"errors"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
)

// Minimal in-memory AWS Secrets Manager fake usable through the
// refresolver.Resolver interface. Avoids importing the full SDK
// surface into the test file.
type fakeAWSResolver struct {
	docs  map[string]map[string]string
	calls int
}

func (f *fakeAWSResolver) Resolve(_ context.Context, ref, field string) (string, error) {
	f.calls++
	if doc, ok := f.docs[ref]; ok {
		return doc[field], nil
	}
	return "", &refresolverNotFoundErr{ref: ref, field: field}
}

type refresolverNotFoundErr struct{ ref, field string }

func (e *refresolverNotFoundErr) Error() string { return "secret not found: " + e.ref + "/" + e.field }

// withFakeResolver swaps the package-level dispatcher factory so the
// rest of the test runs against an in-memory secrets backend. Restores
// on cleanup.
func withFakeResolver(t *testing.T, docs map[string]map[string]string) *fakeAWSResolver {
	t.Helper()
	fake := &fakeAWSResolver{docs: docs}
	prev := newRefDispatcher
	newRefDispatcher = func(_ context.Context, allowedPrefixes []string) (*refresolver.Dispatcher, error) {
		return refresolver.NewDispatcher(map[refresolver.ResolverType]refresolver.Resolver{
			refresolver.ResolverAWSSecretsManager: fake,
		}, allowedPrefixes), nil
	}
	t.Cleanup(func() { newRefDispatcher = prev })
	return fake
}

func sampleCallback(secretARN string) TerminalCallback {
	return TerminalCallback{
		ConnectionMetadata: map[string]any{
			"host":     "db.example.com",
			"port":     5432,
			"database": "app_dev",
		},
		RuntimeCredentialRefs: map[string]any{
			"username": map[string]any{
				"resolver": "aws_secrets_manager",
				"ref":      secretARN,
				"field":    "username",
			},
			"password": map[string]any{
				"resolver": "aws_secrets_manager",
				"ref":      secretARN,
				"field":    "password",
			},
		},
	}
}

func TestNewDSNBuilder_ExplicitRequireMode(t *testing.T) {
	// SSLMode has no implicit default — operators choose. "require"
	// is the explicit opt-in for intra-VPC sandbox deployments.
	const arn = "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/binding-1"
	withFakeResolver(t, map[string]map[string]string{
		arn: {"username": "alice", "password": "p@ss"},
	})

	build := NewDSNBuilder(DSNOptions{
		SSLMode:            sslModeRequire,
		AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/"},
	})

	dsn, err := build(context.Background(), sampleCallback(arn))
	require.NoError(t, err)
	u, perr := url.Parse(dsn)
	require.NoError(t, perr)
	assert.Equal(t, "require", u.Query().Get("sslmode"))
	assert.Empty(t, u.Query().Get("sslrootcert"))
	// Sanity: creds + database came through.
	assert.Equal(t, "alice", u.User.Username())
	pwd, _ := u.User.Password()
	assert.Equal(t, "p@ss", pwd)
	assert.Equal(t, "/app_dev", u.Path)
}

func TestNewDSNBuilder_EmptySSLModeIsExplicitFail(t *testing.T) {
	// Cursor 2026-05-20 HIGH: shipping require-by-default leaves the
	// migration runner MITM-vulnerable until operators override. Fix:
	// no implicit default; empty SSLMode fails loud at dispatch time
	// with a message pointing at the right env var.
	build := NewDSNBuilder(DSNOptions{})
	_, err := build(context.Background(), sampleCallback("arn:aws:secretsmanager:x"))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "SUPERBLOCKS_DATABASE_LIFECYCLE_SSL_MODE")
	assert.Contains(t, err.Error(), "verify-full")
}

func TestNewDSNBuilder_VerifyFullEmitsSslrootcert(t *testing.T) {
	const arn = "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/binding-2"
	withFakeResolver(t, map[string]map[string]string{
		arn: {"username": "alice", "password": "p"},
	})

	build := NewDSNBuilder(DSNOptions{
		SSLMode:            "verify-full",
		SSLRootCert:        "/etc/rds/global-bundle.pem",
		AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/"},
	})

	dsn, err := build(context.Background(), sampleCallback(arn))
	require.NoError(t, err)
	u, perr := url.Parse(dsn)
	require.NoError(t, perr)
	assert.Equal(t, "verify-full", u.Query().Get("sslmode"))
	assert.Equal(t, "/etc/rds/global-bundle.pem", u.Query().Get("sslrootcert"))
}

func TestNewDSNBuilder_VerifyFullWithoutRootCertFails(t *testing.T) {
	build := NewDSNBuilder(DSNOptions{SSLMode: "verify-full"})

	_, err := build(context.Background(), sampleCallback("arn:aws:secretsmanager:x"))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "requires SSLRootCert")
}

func TestNewDSNBuilder_VerifyCAWithoutRootCertFails(t *testing.T) {
	build := NewDSNBuilder(DSNOptions{SSLMode: "verify-ca"})

	_, err := build(context.Background(), sampleCallback("arn:aws:secretsmanager:x"))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "requires SSLRootCert")
}

func TestNewDSNBuilder_RejectsInsecureSSLModes(t *testing.T) {
	for _, mode := range []string{"disable", "allow", "prefer"} {
		t.Run(mode, func(t *testing.T) {
			build := NewDSNBuilder(DSNOptions{SSLMode: mode})

			_, err := build(context.Background(), sampleCallback("arn:aws:secretsmanager:x"))
			require.Error(t, err)
			assert.Contains(t, err.Error(), "not permitted")
		})
	}
}

func TestNewDSNBuilder_EmptyAllowlistRejectsRefs(t *testing.T) {
	// The migration runner must default-deny: a worker booted without
	// SUPERBLOCKS_SECRETS_REFRESOLVER_ALLOWED_REF_PREFIXES set
	// will reject any incoming dispatch that carries runtime_credential_refs.
	fake := withFakeResolver(t, map[string]map[string]string{
		"arn:aws:secretsmanager:us-east-1:111:secret:foo/x": {"username": "alice", "password": "p"},
	})

	// SSLMode set so the test exercises the allowlist gate, not the
	// (separate) SSLMode-required check.
	build := NewDSNBuilder(DSNOptions{SSLMode: sslModeRequire})

	_, err := build(context.Background(), sampleCallback("arn:aws:secretsmanager:us-east-1:111:secret:foo/x"))
	require.Error(t, err)
	assert.ErrorIs(t, err, refresolver.ErrRefNotAllowed)
	// Verifies we never even called the backend.
	assert.Equal(t, 0, fake.calls)
}

func TestNewDSNBuilder_AllowlistEnforcedOutsidePrefix(t *testing.T) {
	// Sandbox prefix matches the binding's ARN; an attacker-supplied
	// dispatch referencing a different ARN must be rejected even when
	// the resolver type is otherwise wired up.
	const sandboxARN = "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/binding-A"
	const foreignARN = "arn:aws:secretsmanager:us-east-1:111:secret:not-managed/x"
	fake := withFakeResolver(t, map[string]map[string]string{
		sandboxARN: {"username": "alice", "password": "p"},
		foreignARN: {"username": "evil", "password": "evil"},
	})

	build := NewDSNBuilder(DSNOptions{
		SSLMode:            sslModeRequire,
		AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/"},
	})

	_, err := build(context.Background(), sampleCallback(foreignARN))
	require.Error(t, err)
	assert.ErrorIs(t, err, refresolver.ErrRefNotAllowed)
	assert.Equal(t, 0, fake.calls)

	_, err = build(context.Background(), sampleCallback(sandboxARN))
	require.NoError(t, err)
}

func TestNewDSNBuilder_RejectsMissingConnectionMetadata(t *testing.T) {
	withFakeResolver(t, nil)
	build := NewDSNBuilder(DSNOptions{SSLMode: sslModeRequire, AllowedRefPrefixes: []string{"any"}})

	_, err := build(context.Background(), TerminalCallback{})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "connection_metadata missing")
}

func TestNewDSNBuilder_RejectsMissingMetadataFields(t *testing.T) {
	withFakeResolver(t, nil)
	build := NewDSNBuilder(DSNOptions{SSLMode: sslModeRequire, AllowedRefPrefixes: []string{"any"}})

	t.Run("missing host", func(t *testing.T) {
		cb := TerminalCallback{ConnectionMetadata: map[string]any{"port": 5432, "database": "app"}}
		_, err := build(context.Background(), cb)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "host missing")
	})
	t.Run("missing port", func(t *testing.T) {
		cb := TerminalCallback{ConnectionMetadata: map[string]any{"host": "db", "database": "app"}}
		_, err := build(context.Background(), cb)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "port missing")
	})
	t.Run("missing database", func(t *testing.T) {
		cb := TerminalCallback{ConnectionMetadata: map[string]any{"host": "db", "port": 5432}}
		_, err := build(context.Background(), cb)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "database missing")
	})
}

func TestNewDSNBuilder_RejectsMissingRuntimeCredentialRefs(t *testing.T) {
	withFakeResolver(t, nil)
	build := NewDSNBuilder(DSNOptions{SSLMode: sslModeRequire, AllowedRefPrefixes: []string{"any"}})

	baseMeta := map[string]any{"host": "db", "port": 5432, "database": "app"}

	t.Run("runtime_credential_refs nil", func(t *testing.T) {
		_, err := build(context.Background(), TerminalCallback{ConnectionMetadata: baseMeta})
		require.Error(t, err)
		assert.Contains(t, err.Error(), "runtime_credential_refs missing")
	})
	t.Run("username missing", func(t *testing.T) {
		cb := TerminalCallback{
			ConnectionMetadata: baseMeta,
			RuntimeCredentialRefs: map[string]any{
				"password": map[string]any{"resolver": "aws_secrets_manager", "ref": "x"},
			},
		}
		_, err := build(context.Background(), cb)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "runtime_credential_refs.username missing")
	})
	t.Run("password missing", func(t *testing.T) {
		cb := TerminalCallback{
			ConnectionMetadata: baseMeta,
			RuntimeCredentialRefs: map[string]any{
				"username": map[string]any{"resolver": "aws_secrets_manager", "ref": "x"},
			},
		}
		_, err := build(context.Background(), cb)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "runtime_credential_refs.password missing")
	})
	t.Run("username not a typed ref", func(t *testing.T) {
		cb := TerminalCallback{
			ConnectionMetadata: baseMeta,
			RuntimeCredentialRefs: map[string]any{
				"username": map[string]any{"not-a-resolver": "x"},
				"password": map[string]any{"resolver": "aws_secrets_manager", "ref": "x"},
			},
		}
		_, err := build(context.Background(), cb)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "username is not a typed ref")
	})
	// Symmetric: username is a valid ref but password is not — the
	// builder must surface the password-side failure separately so
	// operators see exactly which credential field is malformed.
	t.Run("password not a typed ref", func(t *testing.T) {
		cb := TerminalCallback{
			ConnectionMetadata: baseMeta,
			RuntimeCredentialRefs: map[string]any{
				"username": map[string]any{"resolver": "aws_secrets_manager", "ref": "x"},
				"password": map[string]any{"not-a-resolver": "x"},
			},
		}
		_, err := build(context.Background(), cb)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "password is not a typed ref")
	})
}

func TestNewDSNBuilder_RefDispatcherInitFailureBubblesUp(t *testing.T) {
	// Production builds the AWS Secrets Manager resolver from the
	// default config chain at first dispatch; loading the chain can
	// fail (no IAM role available, malformed credentials, etc.). The
	// builder must surface that error to the caller verbatim so
	// operators see the underlying SDK failure rather than a generic
	// "resolve failed" message.
	prev := newRefDispatcher
	newRefDispatcher = func(_ context.Context, _ []string) (*refresolver.Dispatcher, error) {
		return nil, errors.New("load aws config: ec2 metadata unreachable")
	}
	t.Cleanup(func() { newRefDispatcher = prev })

	build := NewDSNBuilder(DSNOptions{SSLMode: sslModeRequire, AllowedRefPrefixes: []string{"any"}})
	cb := TerminalCallback{
		ConnectionMetadata: map[string]any{"host": "db", "port": 5432, "database": "app"},
		RuntimeCredentialRefs: map[string]any{
			"username": map[string]any{"resolver": "aws_secrets_manager", "ref": "any-arn"},
			"password": map[string]any{"resolver": "aws_secrets_manager", "ref": "any-arn"},
		},
	}
	_, err := build(context.Background(), cb)
	require.Error(t, err)
	assert.ErrorContains(t, err, "ec2 metadata unreachable")
}

func TestNewDSNBuilder_PasswordResolveFailureSurfacesField(t *testing.T) {
	// Sibling to the "username resolve" path. The builder must label
	// which credential field's resolve failed so operators looking at
	// logs can pinpoint whether the username- or password-ARN broke.
	// Use a missing password-ARN (not in docs map) so the fake returns
	// its notFoundErr from the dispatch.
	const userARN = "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/user"
	const passARN = "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/unknown"
	withFakeResolver(t, map[string]map[string]string{
		userARN: {"username": "alice"},
		// passARN intentionally absent so Resolve returns the
		// "secret not found" error path.
	})

	build := NewDSNBuilder(DSNOptions{
		SSLMode:            sslModeRequire,
		AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/"},
	})
	cb := TerminalCallback{
		ConnectionMetadata: map[string]any{"host": "db", "port": 5432, "database": "app"},
		RuntimeCredentialRefs: map[string]any{
			"username": map[string]any{"resolver": "aws_secrets_manager", "ref": userARN, "field": "username"},
			"password": map[string]any{"resolver": "aws_secrets_manager", "ref": passARN, "field": "password"},
		},
	}
	_, err := build(context.Background(), cb)
	require.Error(t, err)
	// The error must label the field whose resolve failed, not just
	// "resolve failed" — otherwise the operator has to guess which ARN
	// to investigate.
	assert.ErrorContains(t, err, "resolve password")
}

func TestNewDSNBuilder_DefaultsCredentialFieldNames(t *testing.T) {
	// When runtime_credential_refs.{username,password} are typed refs without
	// explicit Field values, the builder substitutes the RDS-managed-
	// password JSON key names. Validates the tolerant default path.
	const arn = "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/binding-defaults"
	withFakeResolver(t, map[string]map[string]string{
		arn: {"username": "alice", "password": "p@ss"},
	})

	cb := TerminalCallback{
		ConnectionMetadata: map[string]any{"host": "db", "port": 5432, "database": "app"},
		RuntimeCredentialRefs: map[string]any{
			"username": map[string]any{"resolver": "aws_secrets_manager", "ref": arn},
			"password": map[string]any{"resolver": "aws_secrets_manager", "ref": arn},
		},
	}
	build := NewDSNBuilder(DSNOptions{
		SSLMode:            sslModeRequire,
		AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/"},
	})
	dsn, err := build(context.Background(), cb)
	require.NoError(t, err)
	u, perr := url.Parse(dsn)
	require.NoError(t, perr)
	assert.Equal(t, "alice", u.User.Username())
	pwd, _ := u.User.Password()
	assert.Equal(t, "p@ss", pwd)
}

func TestNewDSNBuilder_EmptyMigrationCredentialRefsFallsBackToRuntimeRefs(t *testing.T) {
	const arn = "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/runtime-fallback"
	withFakeResolver(t, map[string]map[string]string{
		arn: {"username": "runtime_user", "password": "runtime_pass"},
	})

	cb := sampleCallback(arn)
	cb.MigrationCredentialRefs = map[string]any{}

	build := NewDSNBuilder(DSNOptions{
		SSLMode:            sslModeRequire,
		AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/"},
	})
	dsn, err := build(context.Background(), cb)
	require.NoError(t, err)
	u, perr := url.Parse(dsn)
	require.NoError(t, perr)
	assert.Equal(t, "runtime_user", u.User.Username())
	pwd, _ := u.User.Password()
	assert.Equal(t, "runtime_pass", pwd)
}

func TestNewDSNBuilder_PortNumericConversions(t *testing.T) {
	// connection_metadata.port arrives from JSON as float64 in the
	// typical path, but Go callers (tests, in-process producers) may
	// hand int/int64. asFloat must handle all three. The DSN builder
	// formats the port as an integer regardless.
	const arn = "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/port-cov"
	withFakeResolver(t, map[string]map[string]string{
		arn: {"username": "u", "password": "p"},
	})
	allowed := []string{"arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/"}
	build := NewDSNBuilder(DSNOptions{SSLMode: sslModeRequire, AllowedRefPrefixes: allowed})

	for name, port := range map[string]any{"float64": float64(5433), "int": int(5434), "int64": int64(5435)} {
		t.Run(name, func(t *testing.T) {
			cb := TerminalCallback{
				ConnectionMetadata: map[string]any{"host": "db", "port": port, "database": "app"},
				RuntimeCredentialRefs: map[string]any{
					"username": map[string]any{"resolver": "aws_secrets_manager", "ref": arn, "field": "username"},
					"password": map[string]any{"resolver": "aws_secrets_manager", "ref": arn, "field": "password"},
				},
			}
			dsn, err := build(context.Background(), cb)
			require.NoError(t, err)
			assert.Contains(t, dsn, "@db:54")
		})
	}
}

func TestValidateSSLOptions_RejectsUnknownMode(t *testing.T) {
	// validateSSLOptions has a default-case branch for sslmode values
	// outside the known supported / explicitly-rejected sets. Exercise
	// it so the migration runner can't silently emit a garbage sslmode.
	err := validateSSLOptions(DSNOptions{SSLMode: "totally-not-a-mode"})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported sslmode")
}

func TestNewDSNBuilder_PropagatesResolverBackendError(t *testing.T) {
	// When the AWS Secrets Manager backend errors out (e.g. AccessDenied
	// or NotFound), the builder should surface a wrapped error naming
	// which credential failed to resolve. Tests both the username and
	// password failure paths.
	const arn = "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/missing"
	// fakeAWSResolver returns refresolverNotFoundErr for any (ref, field)
	// not in its docs map, so an empty docs map exercises both branches.
	withFakeResolver(t, map[string]map[string]string{})

	build := NewDSNBuilder(DSNOptions{
		SSLMode:            sslModeRequire,
		AllowedRefPrefixes: []string{"arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/"},
	})

	cb := TerminalCallback{
		ConnectionMetadata: map[string]any{"host": "db", "port": 5432, "database": "app"},
		RuntimeCredentialRefs: map[string]any{
			"username": map[string]any{"resolver": "aws_secrets_manager", "ref": arn, "field": "username"},
			"password": map[string]any{"resolver": "aws_secrets_manager", "ref": arn, "field": "password"},
		},
	}
	_, err := build(context.Background(), cb)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "resolve username")
}
