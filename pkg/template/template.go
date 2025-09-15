package template

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/template/plugins"
	"github.com/superblocksteam/agent/pkg/utils"
)

type RenderFunc func(string) (*string, error)

type Template[T string] interface {
	Render(context.Context, *plugins.Input) (*T, error)
}

type template[T string] struct {
	plugin      func(*plugins.Input) plugins.Plugin
	resolver    func(context.Context, *utils.TokenJoiner, string) engine.Value
	tokenJoiner *utils.TokenJoiner
	logger      *zap.Logger
}

func New[T string](
	plugin func(*plugins.Input) plugins.Plugin,
	resolver func(context.Context, *utils.TokenJoiner, string) engine.Value,
	tokenJoiner *utils.TokenJoiner,
	logger *zap.Logger,
) Template[T] {
	return &template[T]{
		plugin:      plugin,
		resolver:    resolver,
		tokenJoiner: tokenJoiner,
		logger:      logger,
	}
}

func (t *template[T]) Render(ctx context.Context, template *plugins.Input) (*T, error) {
	// We start with a template `This should be 4 -> {{ 2 + 2 }}`.

	// First, we create a scanner for the input.
	plugin := t.plugin(template)

	// Second, we tokenize the template.
	var tokens []string
	{
		for plugin.Scan() {
			tokens = append(tokens, plugin.Value())
		}
	}

	// Third, if we found tokens, we pass them `[]string{" 2 + 2 "}` to our processing engine.
	var processed []string
	if len(tokens) > 0 {
		in := fmt.Sprintf("{{ [ %s ] }}", t.tokenJoiner.Join(tokens))

		resolved, err := t.resolver(ctx, t.tokenJoiner, in).Result()
		if err != nil {
			errors.Logger(t.logger, err)("could not resolve tokens", zap.Error(err), zap.String("input", in))
			return nil, err
		}

		typed, ok := resolved.([]string)
		if !ok {
			t.logger.Error("we did not get a string array back from the resolver")
			return nil, &errors.InternalError{}
		}

		processed = typed
	}

	// Fourth, we take our processed values (if any) `[]string{" 4 "}` and render the template.
	rendered, err := plugin.Render(processed)
	if err != nil {
		t.logger.Error("could not render template", zap.Error(err))
		return nil, &errors.InternalError{}
	}

	// Sixth, return our final value.
	return utils.Pointer(T(rendered)), nil
}
