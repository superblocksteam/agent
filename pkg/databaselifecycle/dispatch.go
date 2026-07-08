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
	AgentID                    string                 `json:"-"`
	BindingKey                 string                 `json:"bindingKey"`
	ConnectionMetadata         map[string]any         `json:"connectionMetadata,omitempty"`
	Continuation               DispatchContinuation   `json:"continuation,omitempty"`
	RuntimeCredentialRefs      map[string]any         `json:"runtimeCredentialRefs,omitempty"`
	MigrationCredentialRefs    map[string]any         `json:"migrationCredentialRefs,omitempty"`
	DesiredSpec                DatabaseRequirement    `json:"desiredSpec"`
	DesiredSpecHash            string                 `json:"desiredSpecHash"`
	Environment                string                 `json:"environment,omitempty"`
	Migrations                 []migrations.Migration `json:"migrations,omitempty"`
	Operation                  string                 `json:"operation"`
	Profile                    string                 `json:"profile,omitempty"`
	ProfileID                  string                 `json:"-"`
	RequestID                  string                 `json:"requestId"`
	ResourceKey                string                 `json:"resourceKey"`
	PhysicalDatabaseInstanceID string                 `json:"-"`
	TerraformBackend           map[string]any         `json:"-"`
	TerraformModule            TerraformModule        `json:"-"`
}

type DispatchContinuation struct {
	CurrentState                 string `json:"currentState,omitempty"`
	PhysicalDatabaseInstanceID   string `json:"physicalInstanceId,omitempty"`
	PhysicalTerraformResourceKey string `json:"physicalTerraformResourceKey,omitempty"`
	// Reserved for a future server-issued reservation token. The current
	// control plane reserves by physical instance ID only.
	ReservationID string `json:"reservationId,omitempty"`
}

func (payload DispatchPayload) MarshalJSON() ([]byte, error) {
	type wirePayload struct {
		BindingKey            string                 `json:"bindingKey"`
		ConnectionMetadata    map[string]any         `json:"connectionMetadata,omitempty"`
		Continuation          *DispatchContinuation  `json:"continuation,omitempty"`
		RuntimeCredentialRefs map[string]any         `json:"runtimeCredentialRefs,omitempty"`
		DesiredSpec           DatabaseRequirement    `json:"desiredSpec"`
		DesiredSpecHash       string                 `json:"desiredSpecHash"`
		Environment           string                 `json:"environment,omitempty"`
		Migrations            []migrations.Migration `json:"migrations,omitempty"`
		Operation             string                 `json:"operation"`
		Profile               string                 `json:"profile,omitempty"`
		RequestID             string                 `json:"requestId"`
		ResourceKey           string                 `json:"resourceKey"`
	}
	return json.Marshal(wirePayload{
		BindingKey:            payload.BindingKey,
		ConnectionMetadata:    payload.ConnectionMetadata,
		Continuation:          payload.Continuation.wireValue(),
		RuntimeCredentialRefs: payload.RuntimeCredentialRefs,
		DesiredSpec:           payload.DesiredSpec,
		DesiredSpecHash:       payload.DesiredSpecHash,
		Environment:           payload.Environment,
		Migrations:            payload.Migrations,
		Operation:             payload.Operation,
		Profile:               payload.Profile,
		RequestID:             payload.RequestID,
		ResourceKey:           payload.ResourceKey,
	})
}

func (continuation DispatchContinuation) wireValue() *DispatchContinuation {
	if continuation == (DispatchContinuation{}) {
		return nil
	}
	return &continuation
}

type DatabaseRequirement struct {
	LogicalName        string         `json:"logicalName"`
	Engine             string         `json:"engine"`
	Version            string         `json:"version,omitempty"`
	Sizing             map[string]any `json:"sizing,omitempty"`
	Extensions         []string       `json:"extensions,omitempty"`
	ReplicaCount       *int           `json:"replicaCount,omitempty"`
	MigrationDirectory string         `json:"migrationDirectory,omitempty"`
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
