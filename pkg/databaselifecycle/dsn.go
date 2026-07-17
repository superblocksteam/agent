package databaselifecycle

import (
	"context"
	"errors"
	"fmt"
	"net/url"

	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
)

// DSNOptions tunes the runtime behavior of the DSN builder the worker
// uses to connect for SQL migrations. The defaults are safe (sslmode
// require) but operators handling regulated customer databases should
// set SSLMode=verify-full and point SSLRootCert at the appropriate CA
// bundle (e.g. /etc/rds/global-bundle.pem) so the migration runner
// validates the server certificate identity, not just that the channel
// is encrypted.
//
// AllowedRefPrefixes is forwarded into the refresolver Dispatcher so
// the worker only dereferences credential refs whose ARN/secret name
// matches an operator-controlled prefix. Empty allowlist → deny all;
// any dispatch with runtime or migration credential refs will fail loudly, which is the
// intended behavior for misconfigured deployments.
type CredentialResolverFactory func(ctx context.Context) (refresolver.Resolver, error)

type DSNOptions struct {
	SSLMode                   string
	SSLRootCert               string
	AWSConfigLoader           AWSConfigLoader
	AllowedRefPrefixes        []string
	AssumeRoleProviderFactory AssumeRoleProviderFactory
	ExpectedConnectorRoleARN  string
	RDSAuthTokenGenerator     RDSAuthTokenGenerator
	ResolverFactory           CredentialResolverFactory
}

const (
	// sslModeRequire encrypts the connection but does not validate the
	// server certificate identity. Safe for internal-only managed
	// services but not for customer / regulated databases reachable
	// from operator networks.
	sslModeRequire = "require"
	// sslModeVerifyCA validates the server certificate against the
	// configured root CA. Does NOT validate that the hostname in the
	// cert matches what we connected to.
	sslModeVerifyCA = "verify-ca"
	// sslModeVerifyFull validates the certificate AND the hostname.
	// This is what you want for production-grade RDS connectivity.
	sslModeVerifyFull = "verify-full"
)

// NewDSNBuilder returns a DSNBuilder closure that bakes the given
// options into every callback resolution. Pulled out as a factory so
// the worker's assembly path can wire operator config into the
// otherwise-static DSN derivation without threading config through the
// processor signature.
//
// SSLMode is intentionally not defaulted here. Forcing operators to
// pick a mode explicitly avoids the trap where the worker silently
// ships an MITM-vulnerable default ("require" encrypts the channel
// but doesn't validate the server certificate identity). The DSN
// builder rejects an empty SSLMode at dispatch time.
func NewDSNBuilder(opts DSNOptions) DSNBuilder {
	opts = withDefaultIAMDependencies(opts)
	iamCredentials := newIAMCredentialCache()
	return func(ctx context.Context, callback TerminalCallback) (string, error) {
		return buildDSNFromCallback(ctx, callback, opts, iamCredentials)
	}
}

// buildDSNFromCallback resolves the migration credential refs portion of a
// terminal callback (typed as map[string]any) to a real Postgres DSN.
//
// V1 supports only the `aws_secrets_manager` resolver. The shared
// pkg/secrets/refresolver package handles dispatch and field decoding;
// this function is now responsible only for assembling the URL once
// the credential values are in hand.
func buildDSNFromCallback(ctx context.Context, callback TerminalCallback, opts DSNOptions, iamCredentials *iamCredentialCache) (string, error) {
	if callback.ConnectionMetadata != nil {
		if authMode, present := callback.ConnectionMetadata["auth_mode"]; present {
			if authMode != iamAuthMode {
				return "", fmt.Errorf("connection_metadata.auth_mode %q is unsupported", authMode)
			}
			return buildIAMDSNFromCallback(ctx, callback, opts, iamCredentials)
		}
	}

	if err := validateSSLOptions(opts); err != nil {
		return "", err
	}

	meta := callback.ConnectionMetadata
	if meta == nil {
		return "", errors.New("connection_metadata missing on callback")
	}
	host, ok := asString(meta["host"])
	if !ok || host == "" {
		return "", errors.New("connection_metadata.host missing")
	}
	port, ok := asFloat(meta["port"])
	if !ok {
		return "", errors.New("connection_metadata.port missing")
	}
	database, ok := asString(meta["database"])
	if !ok || database == "" {
		return "", errors.New("connection_metadata.database missing")
	}

	creds := callback.MigrationCredentialRefs
	credentialRefOutputName := "migration_credential_refs"
	if len(creds) == 0 {
		creds = callback.RuntimeCredentialRefs
		credentialRefOutputName = "runtime_credential_refs"
	}
	if creds == nil {
		return "", errors.New("runtime_credential_refs missing on callback")
	}
	usernameMap, ok := creds["username"].(map[string]any)
	if !ok {
		return "", fmt.Errorf("%s.username missing", credentialRefOutputName)
	}
	passwordMap, ok := creds["password"].(map[string]any)
	if !ok {
		return "", fmt.Errorf("%s.password missing", credentialRefOutputName)
	}

	userRef, ok := refresolver.RefFromMap(usernameMap)
	if !ok {
		return "", fmt.Errorf("%s.username is not a typed ref", credentialRefOutputName)
	}
	passRef, ok := refresolver.RefFromMap(passwordMap)
	if !ok {
		return "", fmt.Errorf("%s.password is not a typed ref", credentialRefOutputName)
	}

	// Default to RDS-managed-password field conventions when the callback
	// omits explicit field names. The server projection should always set
	// them, but defaulting keeps the worker tolerant of older shapes.
	if userRef.Field == "" {
		userRef.Field = "username"
	}
	if passRef.Field == "" {
		passRef.Field = "password"
	}

	dispatcher, err := newRefDispatcher(ctx, opts)
	if err != nil {
		return "", err
	}

	username, err := dispatcher.Resolve(ctx, userRef)
	if err != nil {
		return "", fmt.Errorf("resolve username: %w", err)
	}
	password, err := dispatcher.Resolve(ctx, passRef)
	if err != nil {
		return "", fmt.Errorf("resolve password: %w", err)
	}

	u := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(username, password),
		Host:   fmt.Sprintf("%s:%d", host, int(port)),
		Path:   "/" + database,
	}
	q := u.Query()
	q.Set("sslmode", opts.SSLMode)
	if opts.SSLRootCert != "" {
		q.Set("sslrootcert", opts.SSLRootCert)
	}
	u.RawQuery = q.Encode()
	return u.String(), nil
}

func newRefDispatcher(ctx context.Context, opts DSNOptions) (*refresolver.Dispatcher, error) {
	if opts.ResolverFactory == nil {
		return nil, errors.New("databaselifecycle: DSNOptions.ResolverFactory is required to resolve credential refs")
	}
	awsResolver, err := opts.ResolverFactory(ctx)
	if err != nil {
		return nil, fmt.Errorf("init credential resolver: %w", err)
	}
	if awsResolver == nil {
		return nil, errors.New("databaselifecycle: DSNOptions.ResolverFactory returned nil resolver")
	}
	return refresolver.NewDispatcher(map[refresolver.ResolverType]refresolver.Resolver{
		refresolver.ResolverAWSSecretsManager: awsResolver,
	}, opts.AllowedRefPrefixes), nil
}

func validateSSLOptions(opts DSNOptions) error {
	switch opts.SSLMode {
	case "":
		// No implicit default — operators must opt in. The error
		// message tells them what the safe production answer is so they
		// don't have to read the security docs first to unblock a CI
		// run. "require" is still accepted as an explicit choice for
		// intra-VPC sandboxes; verify-full is the production answer.
		return fmt.Errorf("databaselifecycle: %s must be set explicitly to verify-full (recommended; requires %s) or require (encrypt-only, no cert validation)",
			envSSLMode, envSSLRootCert)
	case sslModeRequire:
		// Encrypts the channel but does not validate server cert
		// identity. Acceptable for intra-VPC dispatches into a
		// Superblocks-managed RDS pool; not acceptable for any
		// migration target reachable from operator/customer networks.
		// Operators choose this explicitly via env var.
		return nil
	case sslModeVerifyCA, sslModeVerifyFull:
		if opts.SSLRootCert == "" {
			return fmt.Errorf("databaselifecycle: sslmode=%q requires SSLRootCert (e.g. an RDS global bundle path)", opts.SSLMode)
		}
		return nil
	case "disable", "allow", "prefer":
		return fmt.Errorf("databaselifecycle: sslmode=%q is not permitted for the migration runner; use require, verify-ca, or verify-full", opts.SSLMode)
	default:
		return fmt.Errorf("databaselifecycle: unsupported sslmode %q", opts.SSLMode)
	}
}

func asString(v any) (string, bool) {
	s, ok := v.(string)
	return s, ok
}

func asFloat(v any) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case int:
		return float64(n), true
	case int64:
		return float64(n), true
	}
	return 0, false
}
