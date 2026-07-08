package databaselifecycle

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/superblocksteam/agent/pkg/clients"
)

type TerminalCallbackError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type TerminalCallback struct {
	BindingKey              string                 `json:"bindingKey"`
	ConnectionMetadata      map[string]any         `json:"connectionMetadata,omitempty"`
	RuntimeCredentialRefs   map[string]any         `json:"runtimeCredentialRefs,omitempty"`
	MigrationCredentialRefs map[string]any         `json:"migrationCredentialRefs,omitempty"`
	Error                   *TerminalCallbackError `json:"error,omitempty"`
	LifecycleState          string                 `json:"lifecycleState"`
	MigrationState          string                 `json:"migrationState,omitempty"`
	RequestID               string                 `json:"requestId"`
}

type TerminalCallbackResult struct {
	BindingKey     string `json:"bindingKey"`
	IntegrationID  string `json:"integrationId"`
	LifecycleState string `json:"lifecycleState"`
	MigrationState string `json:"migrationState"`
	RequestID      string `json:"requestId"`
	RequestState   string `json:"requestState"`
}

type ProgressCallback struct {
	BindingKey   string               `json:"bindingKey"`
	Continuation DispatchContinuation `json:"continuation"`
	RequestID    string               `json:"requestId"`
}

type ProgressCallbackResult struct {
	BindingKey     string               `json:"bindingKey"`
	Continuation   DispatchContinuation `json:"continuation"`
	LifecycleState string               `json:"lifecycleState"`
	RequestID      string               `json:"requestId"`
	RequestState   string               `json:"requestState"`
}

func ReportTerminalCallback(ctx context.Context, client clients.ServerClient, callback TerminalCallback) (TerminalCallbackResult, error) {
	resp, err := client.PostDatabaseLifecycleTerminalCallback(
		ctx,
		nil,
		http.Header{},
		clients.DatabaseLifecycleTerminalCallbackRequest{
			BindingKey:              callback.BindingKey,
			ConnectionMetadata:      callback.ConnectionMetadata,
			RuntimeCredentialRefs:   callback.RuntimeCredentialRefs,
			MigrationCredentialRefs: callback.MigrationCredentialRefs,
			Error:                   toClientTerminalCallbackError(callback.Error),
			LifecycleState:          callback.LifecycleState,
			MigrationState:          callback.MigrationState,
			RequestID:               callback.RequestID,
		},
	)
	if err != nil {
		return TerminalCallbackResult{}, err
	}
	defer resp.Body.Close()

	if internal, external := clients.Check(nil, resp); internal != nil {
		return TerminalCallbackResult{}, internal
	} else if external != nil {
		return TerminalCallbackResult{}, external
	}

	var decoded struct {
		Data TerminalCallbackResult `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil {
		return TerminalCallbackResult{}, fmt.Errorf("decode database lifecycle terminal callback response: %w", err)
	}
	return decoded.Data, nil
}

func ReportProgressCallback(ctx context.Context, client clients.ServerClient, callback ProgressCallback) (ProgressCallbackResult, error) {
	resp, err := client.PostDatabaseLifecycleProgressCallback(
		ctx,
		nil,
		http.Header{},
		clients.DatabaseLifecycleProgressCallbackRequest{
			BindingKey:   callback.BindingKey,
			Continuation: dispatchContinuationMap(callback.Continuation),
			RequestID:    callback.RequestID,
		},
	)
	if err != nil {
		return ProgressCallbackResult{}, err
	}
	defer resp.Body.Close()

	if internal, external := clients.Check(nil, resp); internal != nil {
		return ProgressCallbackResult{}, internal
	} else if external != nil {
		return ProgressCallbackResult{}, external
	}

	var decoded struct {
		Data ProgressCallbackResult `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil {
		return ProgressCallbackResult{}, fmt.Errorf("decode database lifecycle progress callback response: %w", err)
	}
	return decoded.Data, nil
}

func dispatchContinuationMap(continuation DispatchContinuation) map[string]any {
	body := map[string]any{}
	if continuation.CurrentState != "" {
		body["currentState"] = continuation.CurrentState
	}
	if continuation.PhysicalDatabaseInstanceID != "" {
		body["physicalInstanceId"] = continuation.PhysicalDatabaseInstanceID
	}
	if continuation.PhysicalTerraformResourceKey != "" {
		body["physicalTerraformResourceKey"] = continuation.PhysicalTerraformResourceKey
	}
	if continuation.ReservationID != "" {
		body["reservationId"] = continuation.ReservationID
	}
	return body
}

func toClientTerminalCallbackError(err *TerminalCallbackError) *struct {
	Code    string `json:"code"`
	Message string `json:"message"`
} {
	if err == nil {
		return nil
	}
	return &struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	}{
		Code:    err.Code,
		Message: err.Message,
	}
}
