package template

import (
	"context"
	"testing"

	"github.com/superblocksteam/agent/internal/metrics"
	"go.uber.org/zap"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	"github.com/superblocksteam/agent/pkg/template/plugins"
	"github.com/superblocksteam/agent/pkg/template/plugins/mustache"
)

func TestRender(t *testing.T) {
	metrics.RegisterMetrics()
	mustache := func(input *plugins.Input) plugins.Plugin {
		return mustache.Plugin(input)
	}

	s := javascript.Sandbox(context.Background(), &javascript.Options{
		Logger: zap.NewNop(),
	})
	defer s.Close()

	for _, test := range []struct {
		name     string
		scanner  func(*plugins.Input) plugins.Plugin
		template string
		expected string
	}{
		{
			name:     "basic",
			template: "Hello {{ 'Wor' + 'ld' }}",
			expected: "Hello World",
			scanner:  mustache,
		},
		{
			name:     "whitespace variations",
			template: "Hello {{ 'Wor' + 'ld'}}",
			expected: "Hello World",
			scanner:  mustache,
		},
		{
			name:     "other types",
			template: "2 + 2 = {{ 2 + 2 }}",
			expected: "2 + 2 = 4",
			scanner:  mustache,
		},
		{
			name:     "basic object",
			template: `[Object] {{ (() => ({hello: "world"}))() }}`,
			expected: `[Object] {"hello":"world"}`,
			scanner:  mustache,
		},
		{
			name:     "no template",
			template: "Hello World",
			expected: "Hello World",
			scanner:  mustache,
		},
		{
			name:     "ends without a template",
			template: "{{ 'Hello' }} World",
			expected: "Hello World",
			scanner:  mustache,
		},
		{
			name:     "multiple templates",
			template: "{{ 'Hello' }} {{ 'World' }}",
			expected: "Hello World",
			scanner:  mustache,
		},
		{
			name:     "json encoded string",
			template: `{{ "{\"hello\":\"world\"}" }}`,
			expected: "{\"hello\":\"world\"}",
			scanner:  mustache,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			result, err := New(test.scanner, func(ctx context.Context, template string) engine.Value {
				e, err := s.Engine(context.Background())
				assert.NoError(t, err, test.name)

				return e.Resolve(ctx, template, nil)
			}, zap.NewExample()).Render(context.Background(), &plugins.Input{Data: test.template})

			assert.NoError(t, err, test.name)
			assert.Equal(t, test.expected, *result, test.template)
		})
	}
}
