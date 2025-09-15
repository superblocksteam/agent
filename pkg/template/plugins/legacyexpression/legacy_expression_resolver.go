package legacyexpression

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/utils"
)

type legacyExpressionValue struct {
	value []string
}

func (l *legacyExpressionValue) Result(options ...engine.ResultOption) (any, error) {
	return l.value, nil
}

func (l *legacyExpressionValue) JSON() (string, error) {
	json, err := json.Marshal(l.value)
	if err != nil {
		return "", err
	}

	return string(json), nil
}

func (l *legacyExpressionValue) Err() error {
	return nil
}

func (l *legacyExpressionValue) Console() *engine.Console {
	return nil
}

func Resolver(ctx context.Context, tokenJoiner *utils.TokenJoiner, input string) engine.Value {
	trimmed := strings.TrimSpace(input)
	if strings.HasPrefix(trimmed, "{{") && strings.HasSuffix(trimmed, "}}") {
		trimmed = trimmed[2 : len(trimmed)-2]
	}

	trimmed = strings.TrimSpace(trimmed)
	if strings.HasPrefix(trimmed, "[") && strings.HasSuffix(trimmed, "]") {
		trimmed = trimmed[1 : len(trimmed)-1]
	}

	content := splitOrEmpty(tokenJoiner, strings.TrimSpace(trimmed))
	processed := make([]string, 0, len(content))

	for _, c := range content {
		// If the content is wrapped in ${}, we need to remove the ${ and } before wrapping the enclosed expression
		if strings.HasPrefix(c, "${") && strings.HasSuffix(c, "}") {
			c = c[2 : len(c)-1]
		}

		wrapped := fmt.Sprintf("{{%s}}", c)
		processed = append(processed, wrapped)
	}

	return &legacyExpressionValue{
		value: processed,
	}
}

func splitOrEmpty(tokenJoiner *utils.TokenJoiner, input string) []string {
	if input == "" {
		return nil
	}

	return tokenJoiner.Split(input)
}
