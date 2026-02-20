package transport

import (
	"context"
	"encoding/json"
	"fmt"

	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	"google.golang.org/protobuf/types/known/structpb"
)

// userContext holds the user identity extracted from JWT claims for code-mode wrapper generation.
type userContext struct {
	Email string `json:"email"`
	ID    string `json:"id,omitempty"`
	Name  string `json:"name,omitempty"`
}

// extractUserContext extracts user identity from JWT claims in the request context.
func extractUserContext(ctx context.Context) (*userContext, error) {
	email, ok := jwt_validator.GetUserEmail(ctx)
	if !ok {
		return nil, fmt.Errorf("could not get user email from JWT claims")
	}

	uc := &userContext{Email: email}

	if id, ok := jwt_validator.GetUserId(ctx); ok {
		uc.ID = id
	}
	if name, ok := jwt_validator.GetUserDisplayName(ctx); ok {
		uc.Name = name
	}

	return uc, nil
}

// generateWrapperScript generates a JavaScript wrapper that makes the esbuild bundle callable
// by injecting the user context and execution inputs. The combined script is sent directly
// to the JS worker for execution.
func generateWrapperScript(user *userContext, inputs map[string]*structpb.Value, bundle string) (string, error) {
	userJSON, err := json.Marshal(user)
	if err != nil {
		return "", fmt.Errorf("could not marshal user context: %w", err)
	}

	inputsJSON, err := marshalInputs(inputs)
	if err != nil {
		return "", fmt.Errorf("could not marshal inputs: %w", err)
	}

	// The wrapper sets up the execution context and concatenates the bundle.
	// The bundle is an esbuild CommonJS output that populates module.exports.
	// After the bundle executes, we call run() with the context.
	// run() is typically async; we return await so the worker can capture the resolved value.
	script := fmt.Sprintf(`"use strict";
var module = { exports: {} };
var exports = module.exports;

const __sb_context = {
  user: %s,
  inputs: %s,
};

// --- begin bundle ---
%s
// --- end bundle ---

var __sb_run = module.exports.run || module.exports.default;
if (typeof __sb_run !== "function") {
  throw new Error("code-mode bundle does not export a run() function");
}
return await __sb_run(__sb_context);
`, string(userJSON), string(inputsJSON), bundle)

	return script, nil
}

// marshalInputs converts the structpb inputs map to a JSON string.
func marshalInputs(inputs map[string]*structpb.Value) ([]byte, error) {
	if len(inputs) == 0 {
		return []byte("{}"), nil
	}

	m := make(map[string]interface{}, len(inputs))
	for k, v := range inputs {
		if v != nil {
			m[k] = v.AsInterface()
		}
	}

	return json.Marshal(m)
}
