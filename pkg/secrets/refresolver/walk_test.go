package refresolver

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/structpb"
)

func newConfig(t *testing.T, in map[string]any) *structpb.Struct {
	t.Helper()
	s, err := structpb.NewStruct(in)
	require.NoError(t, err)
	return s
}

func dispatcherWithSecrets(values map[string]string) *Dispatcher {
	// Tests in this file exercise the walk shape, not the allowlist —
	// keep the prefix wide so every test ref matches.
	return NewDispatcher(map[ResolverType]Resolver{
		ResolverAWSSecretsManager: NewAWSSecretsManagerResolver(&fakeSecretsManager{values: values}),
	}, []string{"arn:secret:", "missing", "some-other"})
}

func TestResolveInConfig_TopLevelRefs(t *testing.T) {
	cfg := newConfig(t, map[string]any{
		"host":     "db.example.com",
		"port":     5432,
		"database": "app",
		"username": map[string]any{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:secret:rds-cluster",
			"field":    "username",
		},
		"password": map[string]any{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:secret:rds-cluster",
			"field":    "password",
		},
	})

	d := dispatcherWithSecrets(map[string]string{
		"arn:secret:rds-cluster": `{"username":"superblocks","password":"hunter2"}`,
	})

	require.NoError(t, ResolveInConfig(context.Background(), d, cfg))

	got := cfg.AsMap()
	assert.Equal(t, "db.example.com", got["host"])
	assert.Equal(t, "superblocks", got["username"])
	assert.Equal(t, "hunter2", got["password"])
}

func TestResolveInConfig_NestedRefs(t *testing.T) {
	cfg := newConfig(t, map[string]any{
		"connection": map[string]any{
			"host": "db.example.com",
			"auth": map[string]any{
				"username": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:secret:nested",
					"field":    "username",
				},
			},
		},
	})

	d := dispatcherWithSecrets(map[string]string{
		"arn:secret:nested": `{"username":"deep-user"}`,
	})

	require.NoError(t, ResolveInConfig(context.Background(), d, cfg))

	got := cfg.AsMap()
	conn := got["connection"].(map[string]any)
	auth := conn["auth"].(map[string]any)
	assert.Equal(t, "deep-user", auth["username"])
}

func TestResolveInConfig_RefsInsideList(t *testing.T) {
	cfg := newConfig(t, map[string]any{
		"servers": []any{
			map[string]any{
				"host": "a.example.com",
				"password": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:secret:a",
					"field":    "password",
				},
			},
			map[string]any{
				"host": "b.example.com",
				"password": map[string]any{
					"resolver": "aws_secrets_manager",
					"ref":      "arn:secret:b",
					"field":    "password",
				},
			},
		},
	})

	d := dispatcherWithSecrets(map[string]string{
		"arn:secret:a": `{"password":"alpha"}`,
		"arn:secret:b": `{"password":"bravo"}`,
	})

	require.NoError(t, ResolveInConfig(context.Background(), d, cfg))

	servers := cfg.AsMap()["servers"].([]any)
	require.Len(t, servers, 2)
	assert.Equal(t, "alpha", servers[0].(map[string]any)["password"])
	assert.Equal(t, "bravo", servers[1].(map[string]any)["password"])
}

func TestResolveInConfig_LiteralCredsUntouched(t *testing.T) {
	// Regular customer integrations with literal username/password values
	// must pass through unchanged. The walk only rewrites maps whose
	// "resolver" field is a non-empty string.
	cfg := newConfig(t, map[string]any{
		"host":     "db.example.com",
		"username": "alice",
		"password": "literal-secret",
	})

	d := dispatcherWithSecrets(map[string]string{
		"should-not-be-fetched": `irrelevant`,
	})

	require.NoError(t, ResolveInConfig(context.Background(), d, cfg))

	got := cfg.AsMap()
	assert.Equal(t, "alice", got["username"])
	assert.Equal(t, "literal-secret", got["password"])
}

func TestResolveInConfig_NilCfg(t *testing.T) {
	require.NoError(t, ResolveInConfig(context.Background(), NewDispatcher(nil, nil), nil))
}

func TestResolveInConfig_ResolverErrorPropagates(t *testing.T) {
	cfg := newConfig(t, map[string]any{
		"password": map[string]any{
			"resolver": "aws_secrets_manager",
			"ref":      "missing",
			"field":    "password",
		},
	})

	d := dispatcherWithSecrets(map[string]string{
		"some-other": `{"password":"x"}`,
	})

	err := ResolveInConfig(context.Background(), d, cfg)
	require.Error(t, err)
	assert.Contains(t, err.Error(), `field "password"`)
}

func TestResolveInConfig_UnsupportedResolverErrors(t *testing.T) {
	cfg := newConfig(t, map[string]any{
		"password": map[string]any{
			"resolver": "vault",
			"ref":      "secret/path",
			"field":    "password",
		},
	})

	// "vault" resolver allowlisted by prefix so we exercise the unsupported-
	// resolver branch, not the not-allowed-ref branch.
	d := NewDispatcher(nil, []string{"secret/"})

	err := ResolveInConfig(context.Background(), d, cfg)
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrUnsupportedResolver)
}

func TestResolveInConfig_RefBlockedByAllowlist(t *testing.T) {
	// Caller-supplied integration config carries a ref-shaped map whose
	// target is not in the operator's allowlist. The walk must reject it
	// rather than dereferencing it under the orchestrator's IAM role.
	cfg := newConfig(t, map[string]any{
		"password": map[string]any{
			"resolver": "aws_secrets_manager",
			"ref":      "arn:aws:secretsmanager:us-east-1:111:secret:not-managed/x",
			"field":    "password",
		},
	})
	allowed := "arn:aws:secretsmanager:us-east-1:111:secret:superblocks/native-db/"
	client := &fakeSecretsManager{values: map[string]string{}}
	d := NewDispatcher(map[ResolverType]Resolver{
		ResolverAWSSecretsManager: NewAWSSecretsManagerResolver(client),
	}, []string{allowed})

	err := ResolveInConfig(context.Background(), d, cfg)
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrRefNotAllowed)
	assert.Equal(t, 0, client.calls)
}

func TestResolveInConfig_RejectsExcessiveDepth(t *testing.T) {
	cfg := newConfig(t, map[string]any{
		"root": deeplyNestedConfig(maxRefResolverWalkDepth + 1),
	})

	err := ResolveInConfig(context.Background(), NewDispatcher(nil, nil), cfg)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "walk limit exceeded")
	assert.Contains(t, err.Error(), "depth")
}

func TestResolveInConfig_RejectsExcessiveNodeCount(t *testing.T) {
	items := make([]any, maxRefResolverWalkNodes+1)
	for i := range items {
		items[i] = "literal"
	}
	cfg := newConfig(t, map[string]any{"items": items})

	err := ResolveInConfig(context.Background(), NewDispatcher(nil, nil), cfg)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "walk limit exceeded")
	assert.Contains(t, err.Error(), "nodes")
}

func TestHasRefs_DetectsTopLevel(t *testing.T) {
	cfgs := map[string]*structpb.Struct{
		"i1": newConfig(t, map[string]any{
			"host":     "db",
			"password": map[string]any{"resolver": "aws_secrets_manager", "ref": "x", "field": "p"},
		}),
	}
	assert.True(t, HasRefs(cfgs))
}

func TestHasRefs_DetectsNested(t *testing.T) {
	cfgs := map[string]*structpb.Struct{
		"i1": newConfig(t, map[string]any{
			"auth": map[string]any{
				"password": map[string]any{"resolver": "aws_secrets_manager", "ref": "x"},
			},
		}),
	}
	assert.True(t, HasRefs(cfgs))
}

func TestHasRefs_FalseForLiterals(t *testing.T) {
	cfgs := map[string]*structpb.Struct{
		"i1": newConfig(t, map[string]any{
			"host":     "db",
			"username": "alice",
			"password": "literal",
		}),
		"i2": newConfig(t, map[string]any{
			"servers": []any{
				map[string]any{"host": "a", "password": "p1"},
				map[string]any{"host": "b", "password": "p2"},
			},
		}),
	}
	assert.False(t, HasRefs(cfgs))
}

func TestHasRefs_EmptyMap(t *testing.T) {
	assert.False(t, HasRefs(nil))
	assert.False(t, HasRefs(map[string]*structpb.Struct{}))
}

func TestHasRefs_FailsClosedOnExcessiveDepth(t *testing.T) {
	cfgs := map[string]*structpb.Struct{
		"i1": newConfig(t, map[string]any{
			"root": deeplyNestedConfig(maxRefResolverWalkDepth + 1),
		}),
	}

	assert.True(t, HasRefs(cfgs))
}

func TestHasRefs_FailsClosedOnExcessiveNodeCount(t *testing.T) {
	items := make([]any, maxRefResolverWalkNodes+1)
	for i := range items {
		items[i] = "literal"
	}
	cfgs := map[string]*structpb.Struct{
		"i1": newConfig(t, map[string]any{"items": items}),
	}

	assert.True(t, HasRefs(cfgs))
}

func TestResolveInConfig_ErrorInsideListPropagatesIndex(t *testing.T) {
	// When a list entry's ref resolution fails, the walk surfaces the
	// index in the error path so operators can find the offending
	// element. Exercises the "index N" wrap inside resolveValue's
	// ListValue branch, which the existing tests don't hit.
	cfg := newConfig(t, map[string]any{
		"servers": []any{
			map[string]any{"host": "ok.example.com"},
			map[string]any{"password": map[string]any{"resolver": "aws_secrets_manager", "ref": "missing"}},
		},
	})

	// Wide allowlist so the failure is the missing secret, not the
	// allowlist gate.
	d := dispatcherWithSecrets(map[string]string{})

	err := ResolveInConfig(context.Background(), d, cfg)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "index 1")
}

func TestResolveInConfig_BareScalarsAreNoOp(t *testing.T) {
	// A config consisting only of literal scalars (no refs, no structs,
	// no lists) descends through resolveValue's default branch without
	// any mutation or backend touch. Verifies the walk doesn't crash
	// or rewrite values that aren't ref-shaped.
	cfg := newConfig(t, map[string]any{
		"host":     "db.example.com",
		"port":     5432.0,
		"readOnly": true,
	})
	d := NewDispatcher(nil, nil)

	require.NoError(t, ResolveInConfig(context.Background(), d, cfg))
	got := cfg.AsMap()
	assert.Equal(t, "db.example.com", got["host"])
	assert.Equal(t, 5432.0, got["port"])
	assert.Equal(t, true, got["readOnly"])
}

func TestHasRefs_DeepListDetection(t *testing.T) {
	// HasRefs descends through lists looking for refs at any depth.
	// Existing tests cover top-level and one nested level inside a
	// map; this also exercises a ref-shaped map nested inside a list
	// inside another list (proto-like deep shape).
	cfgs := map[string]*structpb.Struct{
		"i1": newConfig(t, map[string]any{
			"matrix": []any{
				[]any{
					map[string]any{"resolver": "aws_secrets_manager", "ref": "x"},
				},
			},
		}),
	}
	assert.True(t, HasRefs(cfgs))
}

func deeplyNestedConfig(depth int) map[string]any {
	out := map[string]any{"leaf": "value"}
	for i := 0; i < depth; i++ {
		out = map[string]any{"next": out}
	}
	return out
}
