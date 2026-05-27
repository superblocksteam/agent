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
