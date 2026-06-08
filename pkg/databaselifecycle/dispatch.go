package databaselifecycle

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/databaselifecycle/migrations"
)

type DispatchPayload struct {
	AgentID                 string                 `json:"-"`
	BindingKey              string                 `json:"bindingKey"`
	ConnectionMetadata      map[string]any         `json:"connectionMetadata,omitempty"`
	RuntimeCredentialRefs   map[string]any         `json:"runtimeCredentialRefs,omitempty"`
	MigrationCredentialRefs map[string]any         `json:"migrationCredentialRefs,omitempty"`
	DesiredSpec             map[string]any         `json:"desiredSpec,omitempty"`
	DesiredSpecHash         string                 `json:"desiredSpecHash"`
	Engine                  string                 `json:"engine,omitempty"`
	Environment             string                 `json:"environment,omitempty"`
	Migrations              []migrations.Migration `json:"migrations,omitempty"`
	Operation               string                 `json:"operation"`
	Profile                 string                 `json:"profile,omitempty"`
	ProfileID               string                 `json:"-"`
	RequestID               string                 `json:"requestId"`
	ResourceKey             string                 `json:"resourceKey"`
	TerraformBackend        map[string]any         `json:"-"`
	TerraformModule         TerraformModule        `json:"-"`
}

type TerraformModule struct {
	Source  string         `json:"source"`
	Version string         `json:"version"`
	Inputs  map[string]any `json:"inputs"`
}

func ClaimDispatches(ctx context.Context, client clients.ServerClient, agentID string) ([]DispatchPayload, error) {
	resp, err := client.PostClaimDatabaseLifecycleDispatches(
		ctx,
		nil,
		http.Header{},
		clients.DatabaseLifecycleDispatchClaimRequest{AgentID: agentID},
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if internal, external := clients.Check(nil, resp); internal != nil {
		return nil, internal
	} else if external != nil {
		return nil, external
	}

	var decoded struct {
		Data []DispatchPayload `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil {
		return nil, fmt.Errorf("decode database lifecycle dispatch claim response: %w", err)
	}
	return decoded.Data, nil
}
