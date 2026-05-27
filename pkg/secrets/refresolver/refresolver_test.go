package refresolver

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type fakeSecretsManager struct {
	values      map[string]string
	err         error
	calls       int
	callRegions []string
}

func (f *fakeSecretsManager) GetSecretValue(_ context.Context, in *secretsmanager.GetSecretValueInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.GetSecretValueOutput, error) {
	f.calls++
	var options secretsmanager.Options
	for _, opt := range opts {
		opt(&options)
	}
	f.callRegions = append(f.callRegions, options.Region)
	if f.err != nil {
		return nil, f.err
	}
	v, ok := f.values[aws.ToString(in.SecretId)]
	if !ok {
		return &secretsmanager.GetSecretValueOutput{}, nil
	}
	return &secretsmanager.GetSecretValueOutput{SecretString: aws.String(v)}, nil
}

func TestAWSSecretsManagerResolver_JSONField(t *testing.T) {
	client := &fakeSecretsManager{values: map[string]string{
		"arn:aws:secretsmanager:us-west-2:111:secret:rds!cluster-spike": `{"username":"superblocks","password":"hunter2"}`,
	}}
	r := NewAWSSecretsManagerResolver(client)

	user, err := r.Resolve(context.Background(), "arn:aws:secretsmanager:us-west-2:111:secret:rds!cluster-spike", "username")
	require.NoError(t, err)
	assert.Equal(t, "superblocks", user)

	pass, err := r.Resolve(context.Background(), "arn:aws:secretsmanager:us-west-2:111:secret:rds!cluster-spike", "password")
	require.NoError(t, err)
	assert.Equal(t, "hunter2", pass)
}

func TestAWSSecretsManagerResolver_EmptyFieldReturnsWholeString(t *testing.T) {
	client := &fakeSecretsManager{values: map[string]string{"plain-text-secret": "just-a-string"}}
	r := NewAWSSecretsManagerResolver(client)

	got, err := r.Resolve(context.Background(), "plain-text-secret", "")
	require.NoError(t, err)
	assert.Equal(t, "just-a-string", got)
}

func TestAWSSecretsManagerResolver_MissingFieldErrors(t *testing.T) {
	client := &fakeSecretsManager{values: map[string]string{"s": `{"username":"u"}`}}
	r := NewAWSSecretsManagerResolver(client)

	_, err := r.Resolve(context.Background(), "s", "password")
	require.Error(t, err)
	assert.Contains(t, err.Error(), `field "password"`)
}

func TestAWSSecretsManagerResolver_NonStringFieldErrors(t *testing.T) {
	client := &fakeSecretsManager{values: map[string]string{"s": `{"port":5432}`}}
	r := NewAWSSecretsManagerResolver(client)

	_, err := r.Resolve(context.Background(), "s", "port")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not a string")
}

func TestAWSSecretsManagerResolver_MalformedJSONErrors(t *testing.T) {
	client := &fakeSecretsManager{values: map[string]string{"s": `not-json`}}
	r := NewAWSSecretsManagerResolver(client)

	_, err := r.Resolve(context.Background(), "s", "username")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "decode secret")
}

func TestAWSSecretsManagerResolver_BackendError(t *testing.T) {
	client := &fakeSecretsManager{err: errors.New("aws unavailable")}
	r := NewAWSSecretsManagerResolver(client)

	_, err := r.Resolve(context.Background(), "any", "field")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "aws unavailable")
}

func TestAWSSecretsManagerResolver_UsesARNRegion(t *testing.T) {
	const arn = "arn:aws:secretsmanager:eu-central-1:111:secret:rds!cluster-spike"
	client := &fakeSecretsManager{values: map[string]string{
		arn: `{"username":"superblocks"}`,
	}}
	r := NewAWSSecretsManagerResolver(client)

	_, err := r.Resolve(context.Background(), arn, "username")

	require.NoError(t, err)
	assert.Equal(t, []string{"eu-central-1"}, client.callRegions)
}

func TestDispatcher_DispatchesByResolverType(t *testing.T) {
	client := &fakeSecretsManager{values: map[string]string{"a": `{"k":"v"}`}}
	d := NewDispatcher(map[ResolverType]Resolver{
		ResolverAWSSecretsManager: NewAWSSecretsManagerResolver(client),
	}, []string{"a"})

	got, err := d.Resolve(context.Background(), Ref{Resolver: ResolverAWSSecretsManager, Ref: "a", Field: "k"})
	require.NoError(t, err)
	assert.Equal(t, "v", got)
}

func TestDispatcher_UnregisteredResolverErrors(t *testing.T) {
	d := NewDispatcher(nil, []string{"x"})

	_, err := d.Resolve(context.Background(), Ref{Resolver: "vault", Ref: "x"})
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrUnsupportedResolver)
}

func TestDispatcher_EmptyRefErrors(t *testing.T) {
	d := NewDispatcher(map[ResolverType]Resolver{
		ResolverAWSSecretsManager: NewAWSSecretsManagerResolver(&fakeSecretsManager{}),
	}, []string{"any"})

	_, err := d.Resolve(context.Background(), Ref{Resolver: ResolverAWSSecretsManager})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "ref is empty")
}

func TestDispatcher_EmptyAllowlistRejectsAllRefs(t *testing.T) {
	// Default-deny: a dispatcher constructed with no AllowedRefPrefixes
	// rejects every ref, even when a backend is registered for the
	// resolver type. This is the secure default — operators must
	// explicitly opt in to a prefix before the orchestrator will
	// dereference customer- or caller-provided ref-shaped maps.
	client := &fakeSecretsManager{values: map[string]string{"arn:aws:secretsmanager:us-east-1:1:secret:x": `{"k":"v"}`}}
	d := NewDispatcher(map[ResolverType]Resolver{
		ResolverAWSSecretsManager: NewAWSSecretsManagerResolver(client),
	}, nil)

	_, err := d.Resolve(context.Background(), Ref{
		Resolver: ResolverAWSSecretsManager,
		Ref:      "arn:aws:secretsmanager:us-east-1:1:secret:x",
		Field:    "k",
	})
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrRefNotAllowed)
	// Backend must not have been called.
	assert.Equal(t, 0, client.calls)
}

func TestDispatcher_AllowlistMatchesPrefix(t *testing.T) {
	allowed := "arn:aws:secretsmanager:us-east-1:1:secret:superblocks/native-db/"
	blocked := "arn:aws:secretsmanager:us-east-1:1:secret:something-else/x"
	allowedRef := allowed + "binding-abc"

	client := &fakeSecretsManager{values: map[string]string{
		allowedRef: `{"k":"v"}`,
		blocked:    `{"k":"v"}`,
	}}
	d := NewDispatcher(map[ResolverType]Resolver{
		ResolverAWSSecretsManager: NewAWSSecretsManagerResolver(client),
	}, []string{allowed})

	got, err := d.Resolve(context.Background(), Ref{Resolver: ResolverAWSSecretsManager, Ref: allowedRef, Field: "k"})
	require.NoError(t, err)
	assert.Equal(t, "v", got)

	_, err = d.Resolve(context.Background(), Ref{Resolver: ResolverAWSSecretsManager, Ref: blocked, Field: "k"})
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrRefNotAllowed)
	// Only the allowed ref hit the backend.
	assert.Equal(t, 1, client.calls)
}

func TestDispatcher_EmptyPrefixEntriesAreIgnored(t *testing.T) {
	// An empty string in the allowlist would match every ref via
	// strings.HasPrefix(_, ""); filter it out so an accidental empty
	// env-var value doesn't silently re-enable resolve-everything.
	client := &fakeSecretsManager{values: map[string]string{"arn:x": `{"k":"v"}`}}
	d := NewDispatcher(map[ResolverType]Resolver{
		ResolverAWSSecretsManager: NewAWSSecretsManagerResolver(client),
	}, []string{"", ""})

	_, err := d.Resolve(context.Background(), Ref{Resolver: ResolverAWSSecretsManager, Ref: "arn:x", Field: "k"})
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrRefNotAllowed)
}

func TestRefFromMap_TypedRef(t *testing.T) {
	ref, ok := RefFromMap(map[string]any{
		"resolver": "aws_secrets_manager",
		"ref":      "arn:secret:x",
		"field":    "password",
	})
	require.True(t, ok)
	assert.Equal(t, Ref{Resolver: ResolverAWSSecretsManager, Ref: "arn:secret:x", Field: "password"}, ref)
}

func TestRefFromMap_LiteralValuesAreNotRefs(t *testing.T) {
	// A typical literal credential map (no `resolver` marker) must NOT be misread as a ref.
	_, ok := RefFromMap(map[string]any{"username": "alice", "password": "p"})
	assert.False(t, ok)
}

func TestRefFromMap_MissingFieldAllowed(t *testing.T) {
	// `field` is allowed to be empty (e.g. for plain-text secrets).
	ref, ok := RefFromMap(map[string]any{
		"resolver": "aws_secrets_manager",
		"ref":      "name",
	})
	require.True(t, ok)
	assert.Equal(t, "", ref.Field)
}

func TestRefFromMap_MissingRefIsNotTypedRef(t *testing.T) {
	_, ok := RefFromMap(map[string]any{"resolver": "aws_secrets_manager"})
	assert.False(t, ok)
}

func TestSplitAndTrimCSV(t *testing.T) {
	// Empty string short-circuits to nil so the dispatcher's
	// "deny-all on empty allowlist" path stays distinguishable from the
	// "operator-set explicit empty prefix" path (the latter would be a
	// misconfiguration we want to reject downstream).
	assert.Nil(t, splitAndTrimCSV(""))
	// Trims whitespace and drops empty entries — accidental trailing
	// commas in env-var values must not silently re-enable resolve-all.
	assert.Equal(t,
		[]string{"arn:aws:secretsmanager:us-east-1:1:secret:rds!", "arn:aws:secretsmanager:us-west-2:2:secret:rds!"},
		splitAndTrimCSV("  arn:aws:secretsmanager:us-east-1:1:secret:rds! , arn:aws:secretsmanager:us-west-2:2:secret:rds! ,, "),
	)
	// Single non-empty entry, no commas.
	assert.Equal(t, []string{"prefix"}, splitAndTrimCSV("prefix"))
}

func TestAllowedRefPrefixesFromEnv(t *testing.T) {
	// Tests that swap `allowedRefPrefixesFromEnvFunc` MUST NOT call
	// t.Parallel() — the var is a documented unsync test seam.
	saved := allowedRefPrefixesFromEnvFunc
	t.Cleanup(func() { allowedRefPrefixesFromEnvFunc = saved })

	allowedRefPrefixesFromEnvFunc = func() []string { return []string{"a", "b"} }
	assert.Equal(t, []string{"a", "b"}, AllowedRefPrefixesFromEnv())

	allowedRefPrefixesFromEnvFunc = func() []string { return nil }
	assert.Nil(t, AllowedRefPrefixesFromEnv())
}

func TestDispatcher_RegisterAddsBackendAfterConstruction(t *testing.T) {
	// Register lets callers add backends after NewDispatcher returns —
	// e.g. wiring up resolvers conditionally based on operator config
	// without forcing the call site to assemble the whole map up front.
	client := &fakeSecretsManager{values: map[string]string{
		"arn:aws:secretsmanager:us-east-1:1:secret:rds!x": `{"k":"v"}`,
	}}
	d := NewDispatcher(nil, []string{"arn:"})
	d.Register(ResolverAWSSecretsManager, NewAWSSecretsManagerResolver(client))

	got, err := d.Resolve(context.Background(), Ref{
		Resolver: ResolverAWSSecretsManager,
		Ref:      "arn:aws:secretsmanager:us-east-1:1:secret:rds!x",
		Field:    "k",
	})
	require.NoError(t, err)
	assert.Equal(t, "v", got)
}

func TestDispatcher_NilResolversMapStillRegisterable(t *testing.T) {
	// NewDispatcher with a nil `resolvers` arg should not panic on a
	// later Register — the constructor must allocate an empty map.
	d := NewDispatcher(nil, []string{"arn:"})
	d.Register(ResolverAWSSecretsManager, NewAWSSecretsManagerResolver(&fakeSecretsManager{}))
	_, err := d.Resolve(context.Background(), Ref{
		Resolver: ResolverAWSSecretsManager,
		Ref:      "arn:does-not-exist",
		Field:    "k",
	})
	// Backend returns empty output for an unknown id; the dispatcher
	// surfaces the missing-string-value error, which is enough to prove
	// Register hooked the resolver up correctly.
	require.Error(t, err)
	assert.ErrorContains(t, err, "has no string value")
}
