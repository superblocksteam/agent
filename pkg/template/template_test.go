package template

import (
	"context"
	"testing"

	"github.com/superblocksteam/agent/internal/metrics"
	"go.uber.org/zap"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	"github.com/superblocksteam/agent/pkg/template/plugins"
	"github.com/superblocksteam/agent/pkg/template/plugins/legacyexpression"
	"github.com/superblocksteam/agent/pkg/template/plugins/mustache"
	"github.com/superblocksteam/agent/pkg/utils"
)

func TestRender_Mustache(t *testing.T) {
	metrics.RegisterMetrics()
	mustache := func(input *plugins.Input) plugins.Plugin {
		return mustache.Plugin(input)
	}

	s := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
	})
	defer s.Close()

	v8Resolver := func(ctx context.Context, _ *utils.TokenJoiner, template string) engine.Value {
		e, err := s.Engine(context.Background())
		assert.NoError(t, err, t.Name())

		return e.Resolve(ctx, template, nil)
	}

	for _, test := range []struct {
		name     string
		template string
		expected string
	}{
		{
			name:     "basic",
			template: "Hello {{ 'Wor' + 'ld' }}",
			expected: "Hello World",
		},
		{
			name:     "whitespace variations",
			template: "Hello {{ 'Wor' + 'ld'}}",
			expected: "Hello World",
		},
		{
			name:     "other types",
			template: "2 + 2 = {{ 2 + 2 }}",
			expected: "2 + 2 = 4",
		},
		{
			name:     "basic object",
			template: `[Object] {{ (() => ({hello: "world"}))() }}`,
			expected: `[Object] {"hello":"world"}`,
		},
		{
			name:     "no template",
			template: "Hello World",
			expected: "Hello World",
		},
		{
			name:     "ends without a template",
			template: "{{ 'Hello' }} World",
			expected: "Hello World",
		},
		{
			name:     "multiple templates",
			template: "{{ 'Hello' }} {{ 'World' }}",
			expected: "Hello World",
		},
		{
			name:     "json encoded string",
			template: `{{ "{\"hello\":\"world\"}" }}`,
			expected: "{\"hello\":\"world\"}",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			template := New(mustache, v8Resolver, utils.NoOpTokenJoiner, zap.NewNop())
			result, err := template.Render(context.Background(), &plugins.Input{Data: test.template})

			assert.NoError(t, err, test.name)
			assert.Equal(t, test.expected, *result, test.template)
		})
	}
}

func TestRender_LegacyExpression(t *testing.T) {
	metrics.RegisterMetrics()
	legacyExpressionTemplate := func(input *plugins.Input) plugins.Plugin {
		return legacyexpression.Plugin(input)
	}

	commaEscapeTokenJoiner, err := utils.NewTokenJoiner()
	require.NoError(t, err)

	for _, test := range []struct {
		name     string
		template string
		expected string
	}{
		{
			name:     "empty template",
			template: "",
			expected: "",
		},
		{
			name:     "no template",
			template: "Hello World",
			expected: "Hello World",
		},
		{
			name:     "no expressions in string literal",
			template: "`Hello World`",
			expected: "Hello World",
		},
		{
			name:     "basic string literal with expression",
			template: "`Hello ${'Wor' + 'ld'}`",
			expected: "Hello {{'Wor' + 'ld'}}",
		},
		{
			name:     "string literal with expression and whitespace",
			template: "`Hello ${ 'Wor' + 'ld'}`",
			expected: "Hello {{ 'Wor' + 'ld'}}",
		},
		{
			name:     "string literal with multiple expressions",
			template: "`$2 + $${1 + 1} = $${ 4 * 1 } (as expected)`",
			expected: "$2 + ${{1 + 1}} = ${{ 4 * 1 }} (as expected)",
		},
		{
			name:     "string literal with comma space sequence in expression",
			template: "`${JSON.stringify({ channel: \"operations\", text: \"Monitor1.value\" })}`",
			expected: "{{JSON.stringify({ channel: \"operations\", text: \"Monitor1.value\" })}}",
		},
		{
			name:     "iife",
			template: "(() => ({hello: 'world'}))()",
			expected: "{{(() => ({hello: 'world'}))()}}",
		},
		{
			name:     "iife in string literal is not parsed",
			template: "`(() => ({hello: 'world'}))()`",
			expected: "(() => ({hello: 'world'}))()",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			template := New(legacyExpressionTemplate, legacyexpression.Resolver, commaEscapeTokenJoiner, zap.NewNop())
			result, err := template.Render(context.Background(), &plugins.Input{Data: test.template})

			assert.NoError(t, err, test.name)
			assert.Equal(t, test.expected, *result, test.template)
		})
	}
}
