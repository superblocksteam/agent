package databaselifecycle

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
)

type recordingPhysicalDatabaseInstanceLifecycleClient struct {
	instances   []PhysicalDatabaseInstance
	reserved    []string
	released    []string
	registered  []PhysicalDatabaseInstance
	listErr     error
	reserveErr  map[string]error
	releaseErr  map[string]error
	registerErr error
}

func (c *recordingPhysicalDatabaseInstanceLifecycleClient) ListPhysicalDatabaseInstances(ctx context.Context, selector PhysicalDatabaseInstanceSelector) ([]PhysicalDatabaseInstance, error) {
	if c.listErr != nil {
		return nil, c.listErr
	}
	return c.instances, nil
}

func (c *recordingPhysicalDatabaseInstanceLifecycleClient) ReservePhysicalDatabaseInstance(ctx context.Context, instanceID string) error {
	c.reserved = append(c.reserved, instanceID)
	if c.reserveErr != nil && c.reserveErr[instanceID] != nil {
		return c.reserveErr[instanceID]
	}
	if instanceID == "full-instance" {
		return ErrPhysicalDatabaseInstanceCapacityExhausted
	}
	return nil
}

func (c *recordingPhysicalDatabaseInstanceLifecycleClient) RegisterPhysicalDatabaseInstance(ctx context.Context, instance PhysicalDatabaseInstance) (PhysicalDatabaseInstance, error) {
	c.registered = append(c.registered, instance)
	if c.registerErr != nil {
		return PhysicalDatabaseInstance{}, c.registerErr
	}
	instance.ID = "new-instance"
	return instance, nil
}

func (c *recordingPhysicalDatabaseInstanceLifecycleClient) ReleasePhysicalDatabaseInstance(ctx context.Context, instanceID string) error {
	c.released = append(c.released, instanceID)
	if c.releaseErr != nil && c.releaseErr[instanceID] != nil {
		return c.releaseErr[instanceID]
	}
	return nil
}

type recordingPhysicalDatabaseInstanceProvisioner struct {
	provisioned    []PhysicalDatabaseInstanceSelector
	deprovisioned  []PhysicalDatabaseInstance
	err            error
	deprovisionErr error
}

func (p *recordingPhysicalDatabaseInstanceProvisioner) ProvisionPhysicalDatabaseInstance(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
	p.provisioned = append(p.provisioned, selector)
	if p.err != nil {
		return PhysicalDatabaseInstance{}, p.err
	}
	return PhysicalDatabaseInstance{
		Endpoint:            "new-instance.example.com:5432",
		MasterCredentialRef: map[string]any{"resolver": "aws_secrets_manager", "ref": "arn:secret", "field": "password"},
		CapacityMax:         4,
	}, nil
}

func (p *recordingPhysicalDatabaseInstanceProvisioner) DeprovisionPhysicalDatabaseInstance(ctx context.Context, instance PhysicalDatabaseInstance) error {
	p.deprovisioned = append(p.deprovisioned, instance)
	if p.deprovisionErr != nil {
		return p.deprovisionErr
	}
	return nil
}

func TestPhysicalDatabaseInstanceLifecycleReservesExistingInstanceWithCapacity(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID:           "instance-1",
			Region:       "us-east-1",
			Endpoint:     "instance.example.com:5432",
			CapacityUsed: 1,
			CapacityMax:  4,
		}},
	}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, PhysicalDatabaseInstanceProvisionerFunc(func(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
		t.Fatal("provisioner must not run when an existing instance has capacity")
		return PhysicalDatabaseInstance{}, nil
	}))

	instance, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.NoError(t, err)
	require.Equal(t, "instance-1", instance.ID)
	require.Equal(t, []string{"instance-1"}, client.reserved)
	require.Empty(t, client.registered)
}

func TestPhysicalDatabaseInstanceLifecycleProvisionsNewInstanceWhenNoInstancesAreListed(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, PhysicalDatabaseInstanceProvisionerFunc(func(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
		require.Equal(t, "us-east-1", selector.Region)
		require.Equal(t, "deployed", selector.Environment)
		require.Equal(t, "postgres", selector.Engine)
		return PhysicalDatabaseInstance{
			Endpoint:            "new-instance.example.com:5432",
			MasterCredentialRef: map[string]any{"resolver": "aws_secrets_manager", "ref": "arn:secret", "field": "password"},
			CapacityMax:         4,
		}, nil
	}))

	instance, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.NoError(t, err)
	require.Equal(t, "new-instance", instance.ID)
	require.Equal(t, []string{"new-instance"}, client.reserved)
	require.Len(t, client.registered, 1)
	require.Equal(t, "us-east-1", client.registered[0].Region)
	require.Equal(t, "new-instance.example.com:5432", client.registered[0].Endpoint)
}

func TestPhysicalDatabaseInstanceLifecycleDoesNotProvisionAfterReserveFailures(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{
			{ID: "transient-error-instance", Region: "us-east-1"},
			{ID: "full-instance", Region: "us-east-1"},
		},
		reserveErr: map[string]error{"transient-error-instance": errors.New("reserve physical database instance timeout")},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.ErrorContains(t, err, "reserve physical database instance timeout")
	require.ErrorIs(t, err, ErrPhysicalDatabaseInstanceCapacityExhausted)
	require.Equal(t, []string{"transient-error-instance", "full-instance"}, client.reserved)
	require.Empty(t, provisioner.provisioned)
	require.Empty(t, client.registered)
}

func TestPhysicalDatabaseInstanceLifecycleProvisionsNewInstanceWhenAllListedInstancesAreFull(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{
			{ID: "full-instance", Region: "us-east-1"},
			{ID: "another-full-instance", Region: "us-east-1"},
		},
		reserveErr: map[string]error{
			"another-full-instance": ErrPhysicalDatabaseInstanceCapacityExhausted,
		},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)

	instance, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.NoError(t, err)
	require.Equal(t, "new-instance", instance.ID)
	require.Equal(t, []string{"full-instance", "another-full-instance", "new-instance"}, client.reserved)
	require.Len(t, provisioner.provisioned, 1)
	require.Len(t, client.registered, 1)
}

func TestPhysicalDatabaseInstanceLifecycleReturnsCapacityExhaustedWhenNoProvisionerIsConfigured(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{
			{ID: "full-instance", Region: "us-east-1"},
			{ID: "another-full-instance", Region: "us-east-1"},
		},
		reserveErr: map[string]error{
			"another-full-instance": ErrPhysicalDatabaseInstanceCapacityExhausted,
		},
	}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, nil)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.ErrorIs(t, err, ErrPhysicalDatabaseInstanceCapacityExhausted)
	require.NotContains(t, err.Error(), "provisioner is required")
	require.Equal(t, []string{"full-instance", "another-full-instance"}, client.reserved)
	require.Empty(t, client.registered)
}

func TestPhysicalDatabaseInstanceLifecycleReturnsListError(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{listErr: errors.New("list physical database instances")}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, &recordingPhysicalDatabaseInstanceProvisioner{})

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.ErrorContains(t, err, "list physical database instances")
	require.Empty(t, client.reserved)
	require.Empty(t, client.registered)
}

func TestPhysicalDatabaseInstanceLifecycleRequiresProvisionerWhenNoInstancesAreListed(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, nil)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.ErrorContains(t, err, "provisioner is required")
	require.Empty(t, client.reserved)
	require.Empty(t, client.registered)
}

func TestPhysicalDatabaseInstanceLifecycleTriesLaterInstancesAfterReserveFailure(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{
			{ID: "stale-instance", Region: "us-east-1"},
			{ID: "instance-2", Region: "us-east-1"},
		},
		reserveErr: map[string]error{"stale-instance": errors.New("stale physical database instance")},
	}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, nil)

	instance, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.NoError(t, err)
	require.Equal(t, "instance-2", instance.ID)
	require.Equal(t, []string{"stale-instance", "instance-2"}, client.reserved)
}

func TestPhysicalDatabaseInstanceLifecycleDeprovisionsWhenRegisterFails(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{registerErr: errors.New("register physical database instance")}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.ErrorContains(t, err, "register physical database instance")
	require.Len(t, provisioner.deprovisioned, 1)
	require.Equal(t, "new-instance.example.com:5432", provisioner.deprovisioned[0].Endpoint)
}

func TestPhysicalDatabaseInstanceLifecycleJoinsDeprovisionErrorWhenRegisterFails(t *testing.T) {
	registerErr := errors.New("register physical database instance")
	deprovisionErr := errors.New("deprovision physical database instance")
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{registerErr: registerErr}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{deprovisionErr: deprovisionErr}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.ErrorIs(t, err, registerErr)
	require.ErrorIs(t, err, deprovisionErr)
	require.Len(t, provisioner.deprovisioned, 1)
}

func TestPhysicalDatabaseInstanceLifecycleReleasesRegisteredInstanceWhenReserveFails(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		reserveErr: map[string]error{"new-instance": errors.New("reserve physical database instance")},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.ErrorContains(t, err, "reserve physical database instance")
	require.Equal(t, []string{"new-instance"}, client.released)
}

func TestPhysicalDatabaseInstanceLifecycleJoinsReleaseErrorWhenRegisteredInstanceReserveFails(t *testing.T) {
	reserveErr := errors.New("reserve physical database instance")
	releaseErr := errors.New("release physical database instance")
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		reserveErr: map[string]error{"new-instance": reserveErr},
		releaseErr: map[string]error{"new-instance": releaseErr},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.ErrorIs(t, err, reserveErr)
	require.ErrorIs(t, err, releaseErr)
	require.Equal(t, []string{"new-instance"}, client.released)
}

func TestPhysicalDatabaseInstanceLifecycleReturnsProvisionerErrorWhenNewInstanceCannotBeCreated(t *testing.T) {
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(&recordingPhysicalDatabaseInstanceLifecycleClient{}, PhysicalDatabaseInstanceProvisionerFunc(func(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
		return PhysicalDatabaseInstance{}, errors.New("provision physical database instance")
	}))

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.ErrorContains(t, err, "provision physical database instance")
}

func TestAllPhysicalDatabaseInstanceCapacityExhaustedReturnsFalseForEmptyInput(t *testing.T) {
	require.False(t, allPhysicalDatabaseInstanceCapacityExhausted(nil))
}
