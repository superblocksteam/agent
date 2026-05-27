// Package refresolver resolves the typed CredentialRef triples
// ({resolver, ref, field}) that the server's database_lifecycle
// pipeline writes onto integration_configuration.configuration into
// plain string values.
//
// The lifecycle worker's terminal callback writes credentials as refs
// instead of literals so that the orchestrator can hold no secret
// material at rest. At plugin execution time, the orchestrator dereferences
// each ref through this package and substitutes the resolved value into
// the configuration map before handing it to the plugin sandbox.
//
// V1 supports the `aws_secrets_manager` resolver only. Adding GCP / Vault /
// Akeyless is a matter of switching on Ref.Resolver and dispatching to the
// right backend. Each backend must satisfy the small Resolver interface
// below so the dispatcher can stay engine-agnostic.
package refresolver

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

// AllowedRefPrefixesEnvVar names the operator-controlled allowlist of
// secret-ARN / secret-name prefixes the orchestrator may dereference at
// runtime. The variable is read by both the API server (during plugin
// integration resolution) and the database-lifecycle worker (during
// migration DSN construction) — the policy is the same in both
// contexts, so a single env var avoids the trap of setting one and
// forgetting the other.
const AllowedRefPrefixesEnvVar = "SUPERBLOCKS_SECRETS_REFRESOLVER_ALLOWED_REF_PREFIXES"

// allowedRefPrefixesFromEnvFunc is the seam tests use to inject prefix
// allowlists without touching the process env. Defaults to reading
// AllowedRefPrefixesEnvVar via os.Getenv at call time.
//
// Mutability contract: tests overriding this var MUST NOT call
// t.Parallel(). The save/restore pattern is unsynchronized; a parallel
// override would race on the global. Race detector catches violations
// on -race CI runs.
var allowedRefPrefixesFromEnvFunc = func() []string {
	return splitAndTrimCSV(os.Getenv(AllowedRefPrefixesEnvVar))
}

// AllowedRefPrefixesFromEnv returns the operator-configured prefix
// allowlist parsed from AllowedRefPrefixesEnvVar. Empty / unset env →
// nil slice, which the Dispatcher interprets as deny-all.
func AllowedRefPrefixesFromEnv() []string {
	return allowedRefPrefixesFromEnvFunc()
}

func splitAndTrimCSV(value string) []string {
	if value == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

// ResolverType names the credential-resolver backends supported by V1.
type ResolverType string

const (
	ResolverAWSSecretsManager ResolverType = "aws_secrets_manager"
)

// Ref is the typed credential-reference shape written by the server's
// projection of database_lifecycle terminal callbacks onto
// integration_configuration.configuration.
//
// JSON shape from the server side:
//
//	{"resolver": "aws_secrets_manager", "ref": "<secret arn>", "field": "<json key>"}
type Ref struct {
	Resolver ResolverType `json:"resolver"`
	Ref      string       `json:"ref"`
	Field    string       `json:"field"`
}

// Resolver fetches a single string value identified by `ref` and `field`.
// Implementations are free to cache fetched secret documents; callers are
// not expected to dedupe identical refs.
type Resolver interface {
	Resolve(ctx context.Context, ref, field string) (string, error)
}

// Dispatcher fans incoming Refs out to the right backend Resolver based
// on Ref.Resolver. AllowedRefPrefixes scopes which ref strings the
// dispatcher will actually resolve: a ref is rejected with
// ErrRefNotAllowed unless its Ref string starts with at least one
// allowed prefix. Defaulting to deny prevents caller-supplied
// integration configs from triggering AWS Secrets Manager lookups under
// the orchestrator role for arbitrary ARNs — only refs whose targets
// the operator has explicitly allowlisted are dereferenced.
type Dispatcher struct {
	resolvers          map[ResolverType]Resolver
	allowedRefPrefixes []string
}

// NewDispatcher returns a Dispatcher pre-configured with the given
// backends and a ref-prefix allowlist.
//
// allowedRefPrefixes restricts which Ref.Ref values the dispatcher will
// resolve. A nil/empty slice means deny-all — Resolve will always
// return ErrRefNotAllowed. Operators must explicitly opt in by listing
// the ARN/secret-name prefixes that the control plane is permitted to
// issue refs against (e.g. the per-environment native-database
// lifecycle secret prefix). The check is a plain HasPrefix string match
// against ref.Ref; no globbing.
func NewDispatcher(resolvers map[ResolverType]Resolver, allowedRefPrefixes []string) *Dispatcher {
	if resolvers == nil {
		resolvers = map[ResolverType]Resolver{}
	}
	return &Dispatcher{resolvers: resolvers, allowedRefPrefixes: append([]string(nil), allowedRefPrefixes...)}
}

// Register associates a backend with a ResolverType.
func (d *Dispatcher) Register(t ResolverType, r Resolver) {
	d.resolvers[t] = r
}

// Resolve returns the credential string addressed by `ref`. It returns
// ErrRefNotAllowed when ref.Ref doesn't match any configured prefix,
// ErrUnsupportedResolver when no backend is registered for the
// requested resolver, and a wrapped error when the backend lookup
// fails or the field is missing.
func (d *Dispatcher) Resolve(ctx context.Context, ref Ref) (string, error) {
	if ref.Ref == "" {
		return "", errors.New("refresolver: ref is empty")
	}
	if !d.refAllowed(ref.Ref) {
		return "", fmt.Errorf("%w: %q", ErrRefNotAllowed, ref.Ref)
	}
	r, ok := d.resolvers[ref.Resolver]
	if !ok {
		return "", fmt.Errorf("%w: %q", ErrUnsupportedResolver, ref.Resolver)
	}
	return r.Resolve(ctx, ref.Ref, ref.Field)
}

func (d *Dispatcher) refAllowed(ref string) bool {
	for _, prefix := range d.allowedRefPrefixes {
		if prefix != "" && strings.HasPrefix(ref, prefix) {
			return true
		}
	}
	return false
}

// ErrUnsupportedResolver is returned by Dispatcher.Resolve when no
// backend is registered for the requested Ref.Resolver.
var ErrUnsupportedResolver = errors.New("refresolver: unsupported resolver")

// ErrRefNotAllowed is returned by Dispatcher.Resolve when ref.Ref does
// not match any configured AllowedRefPrefixes. Default-deny prevents
// caller-controlled ref-shaped maps from triggering arbitrary Secrets
// Manager lookups under the orchestrator role.
var ErrRefNotAllowed = errors.New("refresolver: ref not in allowed prefixes")

// AWSSecretsManagerResolver resolves Refs of type "aws_secrets_manager".
// It looks up the secret by name/ARN, JSON-decodes the value, and returns
// the requested field. If `field` is empty, the entire SecretString is
// returned verbatim (caller can pre-decode strings stored as plain text).
type AWSSecretsManagerResolver struct {
	client AWSSecretsManagerClient
}

// AWSSecretsManagerClient is the narrow subset of the v2 SDK
// SecretsManager API we actually use. Defined as an interface so
// tests can substitute fakes without spinning up the AWS SDK.
type AWSSecretsManagerClient interface {
	GetSecretValue(ctx context.Context, in *secretsmanager.GetSecretValueInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.GetSecretValueOutput, error)
}

// NewAWSSecretsManagerResolver wraps a v2 SDK SecretsManager client.
func NewAWSSecretsManagerResolver(client AWSSecretsManagerClient) *AWSSecretsManagerResolver {
	return &AWSSecretsManagerResolver{client: client}
}

// NewAWSSecretsManagerResolverFromDefaultConfig loads the standard AWS
// config chain (env vars, shared config, EC2 / EKS IAM, etc.) and returns
// a resolver bound to it. Useful for production code paths; tests should
// inject a fake client via NewAWSSecretsManagerResolver instead.
func NewAWSSecretsManagerResolverFromDefaultConfig(ctx context.Context) (*AWSSecretsManagerResolver, error) {
	cfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("refresolver: load aws config: %w", err)
	}
	return NewAWSSecretsManagerResolver(secretsmanager.NewFromConfig(cfg)), nil
}

// Resolve fetches the secret identified by `ref` (name or ARN) and returns
// either the entire SecretString (when `field` is empty) or the value of
// the named JSON field. Errors are wrapped with the secret ID for
// audit/debugging; never log the secret value itself.
func (r *AWSSecretsManagerResolver) Resolve(ctx context.Context, ref, field string) (string, error) {
	opts := []func(*secretsmanager.Options){}
	if region := secretsManagerARNRegion(ref); region != "" {
		opts = append(opts, func(o *secretsmanager.Options) {
			o.Region = region
		})
	}
	out, err := r.client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(ref),
	}, opts...)
	if err != nil {
		return "", fmt.Errorf("refresolver: get secret %q: %w", ref, err)
	}
	if out.SecretString == nil {
		return "", fmt.Errorf("refresolver: secret %q has no string value", ref)
	}
	if field == "" {
		return *out.SecretString, nil
	}
	var doc map[string]any
	if err := json.Unmarshal([]byte(*out.SecretString), &doc); err != nil {
		return "", fmt.Errorf("refresolver: decode secret %q: %w", ref, err)
	}
	v, ok := doc[field]
	if !ok {
		return "", fmt.Errorf("refresolver: secret %q missing field %q", ref, field)
	}
	s, ok := v.(string)
	if !ok {
		return "", fmt.Errorf("refresolver: secret %q field %q is not a string", ref, field)
	}
	return s, nil
}

func secretsManagerARNRegion(ref string) string {
	parts := strings.SplitN(ref, ":", 7)
	if len(parts) < 6 || parts[0] != "arn" || parts[2] != "secretsmanager" {
		return ""
	}
	return parts[3]
}

// RefFromMap decodes the {resolver, ref, field} shape that arrives on
// integration_configuration.configuration credential entries. The
// configuration is a generic JSON document, so we walk it as
// map[string]any to avoid a typed-struct dependency at every call site.
//
// Returns (ref, true) when the map has both a "resolver" string and a
// "ref" string (the canonical marker of a typed ref), and (zero, false)
// for any other shape (literal strings, nested objects, etc.) so callers
// can recognise "this isn't a credential ref, leave it alone."
func RefFromMap(m map[string]any) (Ref, bool) {
	resolver, ok := m["resolver"].(string)
	if !ok || resolver == "" {
		return Ref{}, false
	}
	ref, ok := m["ref"].(string)
	if !ok || ref == "" {
		return Ref{}, false
	}
	field, _ := m["field"].(string)
	return Ref{
		Resolver: ResolverType(resolver),
		Ref:      ref,
		Field:    field,
	}, true
}
