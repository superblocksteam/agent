package databaselifecycle

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/superblocksteam/agent/pkg/clients"
)

const physicalDatabaseInstanceCapacityExhaustedCode = "physical_database_instance_capacity_exhausted"

type serverPhysicalDatabaseInstanceLifecycleClient struct {
	client clients.ServerClient
}

func NewServerPhysicalDatabaseInstanceLifecycleClient(client clients.ServerClient) PhysicalDatabaseInstanceLifecycleClient {
	return &serverPhysicalDatabaseInstanceLifecycleClient{client: client}
}

func (c *serverPhysicalDatabaseInstanceLifecycleClient) ListPhysicalDatabaseInstances(ctx context.Context, selector PhysicalDatabaseInstanceSelector) ([]PhysicalDatabaseInstance, error) {
	resp, err := c.client.GetDatabaseLifecyclePhysicalDatabaseInstances(ctx, nil, http.Header{}, clients.DatabaseLifecyclePhysicalDatabaseInstanceListRequest{
		Environment: selector.Environment,
		Engine:      selector.Engine,
		Region:      selector.Region,
	})
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if err := checkPhysicalDatabaseInstanceResponse(resp); err != nil {
		return nil, err
	}

	var decoded struct {
		Data []clients.DatabaseLifecyclePhysicalDatabaseInstance `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil {
		return nil, err
	}
	instances := make([]PhysicalDatabaseInstance, 0, len(decoded.Data))
	for _, instance := range decoded.Data {
		instances = append(instances, physicalDatabaseInstanceFromClient(instance))
	}
	return instances, nil
}

func (c *serverPhysicalDatabaseInstanceLifecycleClient) GetPhysicalDatabaseInstance(ctx context.Context, instanceID string) (PhysicalDatabaseInstance, error) {
	resp, err := c.client.GetDatabaseLifecyclePhysicalDatabaseInstance(ctx, nil, http.Header{}, instanceID)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	defer resp.Body.Close()
	if err := checkPhysicalDatabaseInstanceResponse(resp); err != nil {
		return PhysicalDatabaseInstance{}, err
	}

	var decoded struct {
		Data clients.DatabaseLifecyclePhysicalDatabaseInstance `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	return physicalDatabaseInstanceFromClient(decoded.Data), nil
}

func (c *serverPhysicalDatabaseInstanceLifecycleClient) ReservePhysicalDatabaseInstance(ctx context.Context, instanceID string) error {
	resp, err := c.client.PostDatabaseLifecyclePhysicalDatabaseInstanceReserve(ctx, nil, http.Header{}, instanceID)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return checkPhysicalDatabaseInstanceResponse(resp)
}

func (c *serverPhysicalDatabaseInstanceLifecycleClient) RegisterPhysicalDatabaseInstance(ctx context.Context, instance PhysicalDatabaseInstance) (PhysicalDatabaseInstance, error) {
	resp, err := c.client.PostDatabaseLifecyclePhysicalDatabaseInstance(ctx, nil, http.Header{}, physicalDatabaseInstanceToClient(instance))
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	defer resp.Body.Close()
	if err := checkPhysicalDatabaseInstanceResponse(resp); err != nil {
		return PhysicalDatabaseInstance{}, err
	}

	var decoded struct {
		Data clients.DatabaseLifecyclePhysicalDatabaseInstance `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	return physicalDatabaseInstanceFromClient(decoded.Data), nil
}

func (c *serverPhysicalDatabaseInstanceLifecycleClient) ReleasePhysicalDatabaseInstance(ctx context.Context, instanceID string) error {
	resp, err := c.client.PostDatabaseLifecyclePhysicalDatabaseInstanceRelease(ctx, nil, http.Header{}, instanceID)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return checkPhysicalDatabaseInstanceResponse(resp)
}

func checkPhysicalDatabaseInstanceResponse(resp *http.Response) error {
	if resp.StatusCode == http.StatusConflict {
		var decoded struct {
			ResponseMeta struct {
				Error struct {
					Code string `json:"code"`
				} `json:"error"`
			} `json:"responseMeta"`
		}
		if decodeErr := json.NewDecoder(resp.Body).Decode(&decoded); decodeErr == nil && decoded.ResponseMeta.Error.Code == physicalDatabaseInstanceCapacityExhaustedCode {
			return ErrPhysicalDatabaseInstanceCapacityExhausted
		}
		return errors.New("database lifecycle physical database instance conflict")
	}
	if internal, external := clients.Check(nil, resp); internal != nil {
		return internal
	} else if external != nil {
		return external
	}
	return nil
}

func physicalDatabaseInstanceFromClient(instance clients.DatabaseLifecyclePhysicalDatabaseInstance) PhysicalDatabaseInstance {
	return PhysicalDatabaseInstance{
		ID:                  instance.ID,
		Region:              instance.Region,
		Environment:         instance.Environment,
		Engine:              instance.Engine,
		Endpoint:            instance.Endpoint,
		MasterCredentialRef: instance.MasterCredentialRef,
		CapacityMax:         instance.CapacityMax,
		CapacityUsed:        instance.CapacityUsed,
		Status:              instance.Status,
		SecurityClass:       instance.SecurityClass,
	}
}

func physicalDatabaseInstanceToClient(instance PhysicalDatabaseInstance) clients.DatabaseLifecyclePhysicalDatabaseInstance {
	return clients.DatabaseLifecyclePhysicalDatabaseInstance{
		ID:                  instance.ID,
		Region:              instance.Region,
		Environment:         instance.Environment,
		Engine:              instance.Engine,
		Endpoint:            instance.Endpoint,
		MasterCredentialRef: instance.MasterCredentialRef,
		CapacityMax:         instance.CapacityMax,
		CapacityUsed:        instance.CapacityUsed,
		Status:              instance.Status,
		SecurityClass:       instance.SecurityClass,
	}
}
