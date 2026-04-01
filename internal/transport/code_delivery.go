package transport

import (
	"context"
	"encoding/json"
	"fmt"

	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	authv1 "github.com/superblocksteam/agent/types/gen/go/auth/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

// userContext holds the user identity extracted from JWT claims for code-mode wrapper generation.
type userContext struct {
	UserID       string                 `json:"userId"`
	Email        string                 `json:"email,omitempty"`
	Name         string                 `json:"name,omitempty"`
	Groups       []string               `json:"groups"`
	CustomClaims map[string]interface{} `json:"customClaims"`
}

// extractUserContext extracts user identity from JWT claims in the request context.
func extractUserContext(ctx context.Context) (*userContext, error) {
	email, hasEmail := jwt_validator.GetUserEmail(ctx)
	userID, hasUserID := jwt_validator.GetUserId(ctx)
	if (!hasUserID || userID == "") && hasEmail && email != "" {
		// Backward-compatible fallback when user_id is absent in claims.
		userID = email
	}
	if userID == "" {
		return nil, fmt.Errorf("could not get user id from JWT claims")
	}

	uc := &userContext{
		UserID:       userID,
		Groups:       []string{},
		CustomClaims: map[string]interface{}{},
	}
	if hasEmail && email != "" {
		uc.Email = email
	}

	if name, ok := jwt_validator.GetUserDisplayName(ctx); ok {
		uc.Name = name
	}

	if groups, ok := jwt_validator.GetRbacGroupObjects(ctx); ok {
		uc.Groups = toUserGroups(groups)
	}
	if metadata, ok := jwt_validator.GetMetadata(ctx); ok && metadata != nil {
		customClaims := metadata.AsMap()
		if customClaims == nil {
			customClaims = map[string]interface{}{}
		}
		uc.CustomClaims = customClaims
	}

	return uc, nil
}

func toUserGroups(groups []*authv1.Claims_RbacGroupObject) []string {
	out := make([]string, 0, len(groups))
	for _, group := range groups {
		if group == nil {
			continue
		}
		if name := group.GetName(); name != "" {
			out = append(out, name)
			continue
		}
		if id := group.GetId(); id != "" {
			out = append(out, id)
		}
	}
	if len(out) == 0 {
		return []string{}
	}
	return out
}

// generateWrapperScript generates a JavaScript wrapper that executes an SDK API bundle
// via the sdk-api's executeApi() function. The wrapper:
//  1. Evaluates the esbuild CommonJS bundle to extract the CompiledApi object
//  2. Bridges executeQuery calls through __sb_integrationExecutor (injected by the plugin)
//  3. Calls __sb_execute(api, request) (injected by the plugin) for validated execution
//  4. Returns the validated output on success, throws on failure
//
// The executionID is forwarded so the sdk-api can include it in logs and traces.
// User context is embedded in the wrapper as __sb_user so the API's run() function
// can access user identity (e.g., for authorization checks or audit logging).
func generateWrapperScript(user *userContext, inputs map[string]*structpb.Value, bundle string, executionID string, exportName string) (string, error) {
	userJSON, err := json.Marshal(user)
	if err != nil {
		return "", fmt.Errorf("could not marshal user context: %w", err)
	}

	inputsJSON, err := marshalInputs(inputs)
	if err != nil {
		return "", fmt.Errorf("could not marshal inputs: %w", err)
	}

	executionIDJSON, err := json.Marshal(executionID)
	if err != nil {
		return "", fmt.Errorf("could not marshal executionID: %w", err)
	}

	// When the caller specifies an exportName (e.g. a file with multiple named
	// api() exports), we alias that named export as module.exports.default so
	// the wrapper picks the correct API instead of scanning for the first match.
	exportNameAlias := ""
	if exportName != "" {
		exportNameJSON, jsonErr := json.Marshal(exportName)
		if jsonErr != nil {
			return "", fmt.Errorf("could not marshal exportName: %w", jsonErr)
		}
		exportNameAlias = fmt.Sprintf("\nmodule.exports.default = module.exports[%s];\nif (!module.exports.default || typeof module.exports.default.run !== \"function\") {\n  throw new Error(\"code-mode bundle does not export a valid CompiledApi named \" + %s);\n}\n", string(exportNameJSON), string(exportNameJSON))
	}

	// The wrapper sets up the execution context and concatenates the bundle.
	// The bundle is an esbuild CommonJS output that populates module.exports.
	// After the bundle executes, module.exports.default is a CompiledApi object
	// (with inputSchema, outputSchema, run). We pass it to __sb_execute (sdk-api's
	// executeApi function, injected by the plugin via context.globals).
	//
	// When exportName is provided, the alias above ensures module.exports.default
	// points to the requested API. Otherwise, when the bundle uses named exports
	// instead of a default export (e.g. `export const MyApi = api({...})`),
	// module.exports.default is undefined and we scan module.exports for the
	// first value whose .run is a function (a CompiledApi-shaped object).
	//
	// __sb_integrationExecutor is also injected by the plugin; it bridges
	// integration operations back through GrpcIntegrationExecutor → task-manager.
	// The executeQuery callback adapts sdk-api's (integrationId, request) signature
	// to the __sb_integrationExecutor's {integrationId, pluginId, actionConfiguration}.
	// The pluginId comes from sdk-api's optional third argument (metadata.pluginId).
	script := fmt.Sprintf(`"use strict";
var module = { exports: {} };
var exports = module.exports;

var __sb_context = {
  user: %s,
  inputs: %s,
};
if (typeof $prepareGlobalObjectForFiles === "function") {
  $prepareGlobalObjectForFiles(__sb_context.inputs);
} else if (typeof $superblocksFiles === "object" && $superblocksFiles !== null) {
  // WASM sandbox: file methods are on globals (set by host-side prepareGlobalsWithFileMethods).
  // Copy them to __sb_context.inputs so the SDK API run(ctx, input) sees them.
  (function copyFileMethods(target, globals, paths) {
    for (var tp in paths) {
      var parts = tp.split(".");
      var gObj = globals, tObj = target;
      for (var i = 0; i < parts.length - 1; i++) {
        gObj = gObj && gObj[parts[i]];
        tObj = tObj && tObj[parts[i]];
      }
      var last = parts[parts.length - 1];
      if (gObj && gObj[last] && tObj && tObj[last]) {
        if (typeof gObj[last].readContentsAsync === "function") tObj[last].readContentsAsync = gObj[last].readContentsAsync;
        if (typeof gObj[last].readContents === "function") tObj[last].readContents = gObj[last].readContents;
      }
    }
  })(__sb_context.inputs, globalThis, $superblocksFiles);
}
var __sb_executionId = %s;

// --- begin bundle ---
%s
// --- end bundle ---
%s
var __sb_api = module.exports.default;
if (!__sb_api || typeof __sb_api.run !== "function") {
  // No valid default export — scan named exports for a CompiledApi (has .run).
  var __sb_keys = Object.keys(module.exports);
  for (var __sb_ki = 0; __sb_ki < __sb_keys.length; __sb_ki++) {
    var __sb_candidate = module.exports[__sb_keys[__sb_ki]];
    if (__sb_candidate && typeof __sb_candidate.run === "function") {
      __sb_api = __sb_candidate;
      break;
    }
  }
}
if (!__sb_api || typeof __sb_api.run !== "function") {
  throw new Error("code-mode bundle does not export a valid CompiledApi (missing run function)");
}

if (typeof __sb_execute !== "function") {
  throw new Error("__sb_execute (sdk-api executeApi) not injected into sandbox");
}

var __sb_pluginIdMap = {};
if (__sb_api.integrations) {
  for (var __sb_i = 0; __sb_i < __sb_api.integrations.length; __sb_i++) {
    var __sb_decl = __sb_api.integrations[__sb_i];
    if (__sb_decl && __sb_decl.id && __sb_decl.pluginId) {
      __sb_pluginIdMap[__sb_decl.id] = __sb_decl.pluginId;
    }
  }
}

// Signature: (integrationId, request, bindings, metadata)
// bindings is used by language plugins (e.g. Python) for variable injection;
// it must remain as a positional parameter so metadata lands in the correct slot.
async function __sb_executeQuery(integrationId, request, bindings, metadata) {
  if (typeof __sb_integrationExecutor !== "function") {
    throw new Error("Integration operations require an integration executor (not available in this execution context)");
  }
  var pluginId = __sb_pluginIdMap[integrationId] || "";
  return __sb_integrationExecutor({
    integrationId: integrationId,
    pluginId: pluginId,
    actionConfiguration: request,
    metadata: metadata
  });
}

var __sb_result = await __sb_execute(__sb_api, {
  input: __sb_context.inputs,
  integrations: [],
  executionId: __sb_executionId,
  env: {},
  user: __sb_context.user,
  executeQuery: __sb_executeQuery,
});

if (!__sb_result.success) {
  var __sb_err = __sb_result.error || {};
  var __sb_msg = __sb_err.message || "SDK API execution failed";
  if (__sb_err.details) {
    var __sb_cause = __sb_err.details.cause;
    if (__sb_cause) {
      __sb_msg += ": " + (typeof __sb_cause === "string" ? __sb_cause : (__sb_cause.message || JSON.stringify(__sb_cause)));
    }
    if (__sb_err.details.issues) {
      __sb_msg += ": " + JSON.stringify(__sb_err.details.issues);
    }
  }
  throw new Error(__sb_msg);
}
return __sb_result.output;
`, string(userJSON), string(inputsJSON), string(executionIDJSON), bundle, exportNameAlias)

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
