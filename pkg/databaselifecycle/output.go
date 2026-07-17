package databaselifecycle

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

type terraformOutputValue struct {
	Value any `json:"value"`
}

func ReadyCallbackFromTerraformOutput(dispatch DispatchPayload, result Result) (TerminalCallback, error) {
	outputs := map[string]terraformOutputValue{}
	if result.OutputJSON != "" {
		if err := json.Unmarshal([]byte(result.OutputJSON), &outputs); err != nil {
			return TerminalCallback{}, fmt.Errorf("decode terraform output: %w", err)
		}
	}

	connectionMetadata := mapOutputValue(outputs, "connection_metadata")
	if dispatch.PhysicalDatabaseInstanceID != "" {
		connectionMetadata = copyConnectionMetadata(connectionMetadata)
		connectionMetadata["physical_database_instance_ref"] = dispatch.PhysicalDatabaseInstanceID
	}
	runtimeCredentialRefs := mapOutputValue(outputs, "runtime_credential_refs")
	migrationCredentialRefs := mapOutputValue(outputs, "migration_credential_refs")
	managedIAM := false
	if connectionMetadata != nil {
		var err error
		connectionMetadata, err = bindTrustedIAMDispatchIdentity(dispatch, connectionMetadata)
		if err != nil {
			return TerminalCallback{}, err
		}
		_, managedIAM = connectionMetadata["auth_mode"]
		if managedIAM {
			runtimeCredentialRefs = nil
			migrationCredentialRefs = nil
		}
	}
	if !managedIAM && len(migrationCredentialRefs) == 0 {
		migrationCredentialRefs = copyConnectionMetadata(runtimeCredentialRefs)
	}

	return TerminalCallback{
		BindingKey:              dispatch.BindingKey,
		ConnectionMetadata:      connectionMetadata,
		RuntimeCredentialRefs:   runtimeCredentialRefs,
		MigrationCredentialRefs: migrationCredentialRefs,
		LifecycleState:          "ready",
		MigrationState:          "pending",
		RequestID:               dispatch.RequestID,
	}, nil
}

func bindTrustedIAMDispatchIdentity(dispatch DispatchPayload, connectionMetadata map[string]any) (map[string]any, error) {
	authMode, present := connectionMetadata["auth_mode"]
	if !present {
		return connectionMetadata, nil
	}
	if authMode != iamAuthMode {
		return nil, unsupportedIAMDispatchMetadata(fmt.Errorf("connection_metadata.auth_mode %q is unsupported", authMode))
	}
	if strings.TrimSpace(dispatch.ApplicationID) == "" {
		return nil, unsupportedIAMDispatchMetadata(errors.New("dispatch applicationId is required for managed IAM"))
	}
	if strings.TrimSpace(dispatch.BindingID) == "" {
		return nil, unsupportedIAMDispatchMetadata(errors.New("dispatch bindingId is required for managed IAM"))
	}

	bound := copyConnectionMetadata(connectionMetadata)
	for _, identity := range []struct {
		metadataKey string
		wireField   string
		wireValue   string
	}{
		{metadataKey: "application_id", wireField: "applicationId", wireValue: dispatch.ApplicationID},
		{metadataKey: "binding_id", wireField: "bindingId", wireValue: dispatch.BindingID},
	} {
		if value, exists := bound[identity.metadataKey]; exists && value != identity.wireValue {
			return nil, unsupportedIAMDispatchMetadata(
				fmt.Errorf("connection_metadata.%s does not match dispatch %s", identity.metadataKey, identity.wireField),
			)
		}
		bound[identity.metadataKey] = identity.wireValue
	}
	if _, err := ParseIAMAuthDescriptor(bound); err != nil {
		return nil, unsupportedIAMDispatchMetadata(fmt.Errorf("validate IAM connection metadata: %w", err))
	}
	return bound, nil
}

func unsupportedIAMDispatchMetadata(err error) error {
	return &LifecycleError{
		Code:      ErrorCodeUnsupportedShape,
		Retryable: false,
		Err:       err,
	}
}

func copyConnectionMetadata(metadata map[string]any) map[string]any {
	copied := make(map[string]any, len(metadata)+1)
	for key, value := range metadata {
		copied[key] = value
	}
	return copied
}

func mapOutputValue(outputs map[string]terraformOutputValue, key string) map[string]any {
	value, ok := outputs[key]
	if !ok {
		return nil
	}
	mapped, ok := value.Value.(map[string]any)
	if !ok {
		return nil
	}
	return mapped
}

func FailedCallbackFromError(dispatch DispatchPayload, err error) TerminalCallback {
	return FailedCallbackFromErrorWithLogs(dispatch, err, nil)
}

// FailedCallbackFromErrorWithLogs preserves the historical signature used by
// callers that have command logs, but intentionally does not forward those
// logs to the control plane. Provider stderr can contain secrets under
// arbitrary key names, and heuristic redaction is not a sufficient privacy
// boundary for callback storage.
func FailedCallbackFromErrorWithLogs(dispatch DispatchPayload, err error, logs []string) TerminalCallback {
	code := ErrorCodeTerraformFailed
	var lifecycleErr *LifecycleError
	if errors.As(err, &lifecycleErr) {
		code = lifecycleErr.Code
	}
	message := err.Error()
	return TerminalCallback{
		BindingKey:     dispatch.BindingKey,
		LifecycleState: "failed",
		MigrationState: migrationStateForFailure(code),
		RequestID:      dispatch.RequestID,
		Error: &TerminalCallbackError{
			Code:    string(code),
			Message: message,
		},
	}
}

// migrationStateForFailure picks the binding's migrationState for a failure
// callback. cursor r3236327922: previously hardcoded "failed" for every
// error, which mis-attributed terraform-stage failures (no migration was
// ever attempted under this dispatch) and would cause downstream readers
// to believe the migration ran and broke. Only an actual migration-runner
// failure should land the binding's migrationState in "failed"; everything
// else stays "pending" so the next ensure() can pick it up cleanly.
func migrationStateForFailure(code ErrorCode) string {
	if code == ErrorCodeMigrationFailed {
		return "failed"
	}
	return "pending"
}
