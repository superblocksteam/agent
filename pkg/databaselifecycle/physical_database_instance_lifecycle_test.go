package databaselifecycle

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/clients"
	"go.opentelemetry.io/otel"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

type recordingPhysicalDatabaseInstanceLifecycleClient struct {
	instances        []PhysicalDatabaseInstance
	reserved         []string
	released         []string
	registered       []PhysicalDatabaseInstance
	listSelectors    []PhysicalDatabaseInstanceSelector
	listErr          error
	reserveErr       map[string]error
	releaseErr       map[string]error
	registerErr      error
	registerResponse *PhysicalDatabaseInstance
}

func (c *recordingPhysicalDatabaseInstanceLifecycleClient) ListPhysicalDatabaseInstances(ctx context.Context, selector PhysicalDatabaseInstanceSelector) ([]PhysicalDatabaseInstance, error) {
	c.listSelectors = append(c.listSelectors, selector)
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
	if c.registerResponse != nil {
		return *c.registerResponse, nil
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

type recordingProgressReporter struct {
	callbacks []ProgressCallback
	err       error
}

func (r *recordingProgressReporter) ReportProgress(ctx context.Context, callback ProgressCallback) (ProgressCallbackResult, error) {
	r.callbacks = append(r.callbacks, callback)
	if r.err != nil {
		return ProgressCallbackResult{}, r.err
	}
	return ProgressCallbackResult{RequestID: callback.RequestID, RequestState: "provisioning"}, nil
}

func (p *recordingPhysicalDatabaseInstanceProvisioner) ProvisionPhysicalDatabaseInstance(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
	p.provisioned = append(p.provisioned, selector)
	if p.err != nil {
		return PhysicalDatabaseInstance{}, p.err
	}
	return PhysicalDatabaseInstance{
		ProvisionResourceKey: selector.PhysicalTerraformResourceKey,
		Endpoint:             "new-instance.example.com:5432",
		MasterCredentialRef:  map[string]any{"resolver": "aws_secrets_manager", "ref": "arn:secret", "field": "password"},
		CapacityMax:          4,
	}, nil
}

func TestPhysicalDatabaseInstanceLifecycleTracesReserveAndProgressCallbacks(t *testing.T) {
	exporter := tracetest.NewInMemoryExporter()
	provider := sdktrace.NewTracerProvider(
		sdktrace.WithSyncer(exporter),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)
	previousProvider := otel.GetTracerProvider()
	otel.SetTracerProvider(provider)
	t.Cleanup(func() {
		otel.SetTracerProvider(previousProvider)
		require.NoError(t, provider.Shutdown(context.Background()))
	})

	client := &recordingPhysicalDatabaseInstanceLifecycleClient{}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	reporter := &recordingProgressReporter{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)
	lifecycle.ReportProgressWith(reporter)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		BindingKey:                   "binding-key-1",
		RequestID:                    "request-1",
		Region:                       "us-east-1",
		Environment:                  "deployed",
		Profile:                      "production",
		Engine:                       "postgres",
		Mode:                         PhysicalDatabaseModeDedicated,
		PhysicalTerraformResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
	})

	require.NoError(t, err)
	spans := exporter.GetSpans()
	requireSpanAttribute(t, spans, "database_lifecycle.physical_instance.reserve_for_ensure", "database.lifecycle.mode", "dedicated")
	requireSpanAttribute(t, spans, "database_lifecycle.physical_instance.reserve_for_ensure", "database.system", "postgres")
	requireSpanAttribute(t, spans, "database_lifecycle.physical_instance.progress_callback", "database.lifecycle.current_state", "physical_db_registered")
}

func TestPhysicalDatabaseInstanceLifecycleReportsProvisionAndReserveProgress(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	reporter := &recordingProgressReporter{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)
	lifecycle.ReportProgressWith(reporter)

	instance, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		BindingKey:                   "binding-key-1",
		RequestID:                    "request-1",
		Region:                       "us-east-1",
		Environment:                  "deployed",
		Engine:                       "postgres",
		PhysicalTerraformResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
	})

	require.NoError(t, err)
	require.Equal(t, "new-instance", instance.ID)
	require.Equal(t, []ProgressCallback{
		{
			BindingKey: "binding-key-1",
			Continuation: DispatchContinuation{
				CurrentState:                 "physical_db_provisioning",
				PhysicalTerraformResourceKey: client.registered[0].ProvisionResourceKey,
			},
			RequestID: "request-1",
		},
		{
			BindingKey: "binding-key-1",
			Continuation: DispatchContinuation{
				CurrentState:                 "physical_db_registered",
				PhysicalDatabaseInstanceID:   "new-instance",
				PhysicalTerraformResourceKey: client.registered[0].ProvisionResourceKey,
			},
			RequestID: "request-1",
		},
		{
			BindingKey: "binding-key-1",
			Continuation: DispatchContinuation{
				CurrentState:                 "physical_db_reserved",
				PhysicalDatabaseInstanceID:   "new-instance",
				PhysicalTerraformResourceKey: client.registered[0].ProvisionResourceKey,
			},
			RequestID: "request-1",
		},
	}, reporter.callbacks)
}

func TestPhysicalDatabaseInstanceLifecycleReleasesReservationWhenReservedProgressFails(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID:           "instance-1",
			Region:       "us-east-1",
			Endpoint:     "instance.example.com:5432",
			CapacityUsed: 1,
			CapacityMax:  4,
		}},
	}
	reporter := &recordingProgressReporter{err: errors.New("progress callback failed")}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, nil)
	lifecycle.ReportProgressWith(reporter)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		BindingKey:        "binding-key-1",
		RequestID:         "request-1",
		Region:            "us-east-1",
		Environment:       "deployed",
		Engine:            "postgres",
		ParentResourceKey: "org-1:app-1:deployed:production:orders-db~Orders%20DB:postgres",
	})

	require.ErrorContains(t, err, "progress callback failed")
	require.Equal(t, []string{"instance-1"}, client.reserved)
	require.Equal(t, []string{"instance-1"}, client.released)
}

func (p *recordingPhysicalDatabaseInstanceProvisioner) DeprovisionPhysicalDatabaseInstance(ctx context.Context, instance PhysicalDatabaseInstance) error {
	p.deprovisioned = append(p.deprovisioned, instance)
	if p.deprovisionErr != nil {
		return p.deprovisionErr
	}
	return nil
}

func TestPhysicalDatabaseInstanceLifecycleResumesProvisioningFromContinuationResourceKey(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID:           "pool-instance",
			Region:       "us-east-1",
			Endpoint:     "pool.example.com:5432",
			CapacityUsed: 0,
			CapacityMax:  4,
		}},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)

	instance, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		CurrentState:                 "physical_db_provisioning",
		PhysicalTerraformResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
		Region:                       "us-east-1",
		Environment:                  "deployed",
		Engine:                       "postgres",
	})

	require.NoError(t, err)
	require.Equal(t, "new-instance", instance.ID)
	require.Equal(t, []string{"new-instance"}, client.reserved)
	require.Len(t, provisioner.provisioned, 1)
	require.Equal(t, "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision", provisioner.provisioned[0].PhysicalTerraformResourceKey)
	require.Len(t, client.registered, 1)
}

func TestPhysicalDatabaseInstanceLifecycleResumesRegisteredInstanceFromContinuationID(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID:                  "registered-instance",
			Region:              "us-east-1",
			Environment:         "deployed",
			Engine:              "postgres",
			Endpoint:            "registered.example.com:5432",
			MasterCredentialRef: map[string]any{"resolver": "aws_secrets_manager", "ref": "arn:registered", "field": "password"},
			CapacityUsed:        0,
			CapacityMax:         4,
		}},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	reporter := &recordingProgressReporter{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)
	lifecycle.ReportProgressWith(reporter)

	instance, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		BindingKey:                   "binding-key-1",
		CurrentState:                 "physical_db_registered",
		PhysicalDatabaseInstanceID:   "registered-instance",
		PhysicalTerraformResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
		RequestID:                    "request-1",
		Region:                       "us-east-1",
		Environment:                  "deployed",
		Engine:                       "postgres",
	})

	require.NoError(t, err)
	require.Equal(t, "registered-instance", instance.ID)
	require.Equal(t, "registered.example.com:5432", instance.Endpoint)
	require.Equal(t, map[string]any{"resolver": "aws_secrets_manager", "ref": "arn:registered", "field": "password"}, instance.MasterCredentialRef)
	require.Len(t, client.listSelectors, 1)
	require.Equal(t, []string{"registered-instance"}, client.reserved)
	require.Empty(t, provisioner.provisioned)
	require.Empty(t, client.registered)
	require.Equal(t, []ProgressCallback{{
		BindingKey: "binding-key-1",
		Continuation: DispatchContinuation{
			CurrentState:                 "physical_db_reserved",
			PhysicalDatabaseInstanceID:   "registered-instance",
			PhysicalTerraformResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
		},
		RequestID: "request-1",
	}}, reporter.callbacks)
}

func TestPhysicalDatabaseInstanceLifecycleResumesReservedInstanceFromContinuationID(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID:                  "reserved-instance",
			Region:              "us-east-1",
			Environment:         "deployed",
			Engine:              "postgres",
			Endpoint:            "reserved.example.com:5432",
			MasterCredentialRef: map[string]any{"resolver": "aws_secrets_manager", "ref": "arn:reserved", "field": "password"},
			CapacityUsed:        1,
			CapacityMax:         4,
		}},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	reporter := &recordingProgressReporter{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)
	lifecycle.ReportProgressWith(reporter)

	instance, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		BindingKey:                   "binding-key-1",
		CurrentState:                 "physical_db_reserved",
		PhysicalDatabaseInstanceID:   "reserved-instance",
		PhysicalTerraformResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
		RequestID:                    "request-1",
		Region:                       "us-east-1",
		Environment:                  "deployed",
		Engine:                       "postgres",
		Mode:                         PhysicalDatabaseModeDedicated,
	})

	require.NoError(t, err)
	require.Equal(t, "reserved-instance", instance.ID)
	require.Equal(t, "reserved.example.com:5432", instance.Endpoint)
	require.Equal(t, map[string]any{"resolver": "aws_secrets_manager", "ref": "arn:reserved", "field": "password"}, instance.MasterCredentialRef)
	require.Len(t, client.listSelectors, 1)
	require.Empty(t, client.reserved)
	require.Empty(t, provisioner.provisioned)
	require.Empty(t, client.registered)
	require.Empty(t, reporter.callbacks)
}

func TestPhysicalDatabaseInstanceLifecycleReturnsReserveErrorWhenRegisteredResumeCannotReserve(t *testing.T) {
	reserveErr := errors.New("reserve registered physical database instance")
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID:       "registered-instance",
			Region:   "us-east-1",
			Engine:   "postgres",
			Status:   "active",
			Endpoint: "registered.example.com:5432",
		}},
		reserveErr: map[string]error{"registered-instance": reserveErr},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	reporter := &recordingProgressReporter{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)
	lifecycle.ReportProgressWith(reporter)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		CurrentState:               "physical_db_registered",
		PhysicalDatabaseInstanceID: "registered-instance",
	})

	require.ErrorIs(t, err, reserveErr)
	require.Equal(t, []string{"registered-instance"}, client.reserved)
	require.Empty(t, client.released)
	require.Empty(t, provisioner.provisioned)
	require.Empty(t, client.registered)
	require.Empty(t, reporter.callbacks)
}

func TestPhysicalDatabaseInstanceLifecycleReleasesRegisteredResumeWhenReservedProgressFails(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID:                   "registered-instance",
			Region:               "us-east-1",
			Engine:               "postgres",
			Status:               "active",
			Endpoint:             "registered.example.com:5432",
			ProvisionResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
		}},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	reporter := &recordingProgressReporter{err: errors.New("progress callback failed")}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)
	lifecycle.ReportProgressWith(reporter)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		BindingKey:                   "binding-key-1",
		CurrentState:                 "physical_db_registered",
		PhysicalDatabaseInstanceID:   "registered-instance",
		PhysicalTerraformResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
		RequestID:                    "request-1",
	})

	require.ErrorContains(t, err, "progress callback failed")
	require.Equal(t, []string{"registered-instance"}, client.reserved)
	require.Equal(t, []string{"registered-instance"}, client.released)
	require.Empty(t, provisioner.provisioned)
	require.Empty(t, client.registered)
}

func TestPhysicalDatabaseInstanceLifecycleReturnsErrorWhenRegisteredResumeInstanceIsMissing(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID:       "other-instance",
			Region:   "us-east-1",
			Engine:   "postgres",
			Status:   "active",
			Endpoint: "other.example.com:5432",
		}},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		CurrentState:               "physical_db_registered",
		PhysicalDatabaseInstanceID: "registered-instance",
		Region:                     "us-east-1",
		Environment:                "deployed",
		Engine:                     "postgres",
	})

	require.ErrorContains(t, err, "registered physical database instance registered-instance not found")
	require.Empty(t, client.reserved)
	require.Empty(t, provisioner.provisioned)
}

func TestPhysicalDatabaseInstanceLifecycleDedicatedModeSkipsSharedPoolReservation(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		instances: []PhysicalDatabaseInstance{{
			ID:           "shared-pool-instance",
			Region:       "us-east-1",
			Endpoint:     "pool.example.com:5432",
			CapacityUsed: 0,
			CapacityMax:  4,
		}},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)

	instance, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		Mode:        "dedicated",
		Region:      "us-east-1",
		Environment: "deployed",
		Engine:      "postgres",
	})

	require.NoError(t, err)
	require.Equal(t, "new-instance", instance.ID)
	require.Empty(t, client.listSelectors)
	require.Equal(t, []string{"new-instance"}, client.reserved)
	require.Len(t, provisioner.provisioned, 1)
	require.Len(t, client.registered, 1)
}

func TestPhysicalDatabaseInstanceLifecycleDeprovisionsWhenProvisionProgressFails(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	reporter := &recordingProgressReporter{err: errors.New("progress callback failed")}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)
	lifecycle.ReportProgressWith(reporter)

	_, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		BindingKey:                   "binding-key-1",
		RequestID:                    "request-1",
		Region:                       "us-east-1",
		Environment:                  "deployed",
		Engine:                       "postgres",
		PhysicalTerraformResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
	})

	require.ErrorContains(t, err, "progress callback failed")
	require.Len(t, provisioner.deprovisioned, 1)
	require.Empty(t, client.registered)
	require.Empty(t, client.reserved)
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

func TestPhysicalDatabaseInstanceLifecyclePreservesProvisionResourceKeyWhenRegisterResponseOmitsIt(t *testing.T) {
	client := &recordingPhysicalDatabaseInstanceLifecycleClient{
		registerResponse: &PhysicalDatabaseInstance{
			ID:                  "registered-instance",
			Region:              "us-east-1",
			Environment:         "deployed",
			Engine:              "postgres",
			Endpoint:            "new-instance.example.com:5432",
			MasterCredentialRef: map[string]any{"resolver": "aws_secrets_manager", "ref": "arn:secret", "field": "password"},
			CapacityMax:         4,
		},
	}
	provisioner := &recordingPhysicalDatabaseInstanceProvisioner{}
	reporter := &recordingProgressReporter{}
	lifecycle := NewPhysicalDatabaseInstanceLifecycle(client, provisioner)
	lifecycle.ReportProgressWith(reporter)

	instance, err := lifecycle.ReserveForEnsure(context.Background(), PhysicalDatabaseInstanceSelector{
		BindingKey:                   "binding-key-1",
		RequestID:                    "request-1",
		Region:                       "us-east-1",
		Environment:                  "deployed",
		Engine:                       "postgres",
		PhysicalTerraformResourceKey: "physical-database-instance:deployed:production:us-east-1:postgres:stable-provision",
	})

	require.NoError(t, err)
	require.Equal(t, "registered-instance", instance.ID)
	require.NotEmpty(t, client.registered[0].ProvisionResourceKey)
	require.Equal(t, client.registered[0].ProvisionResourceKey, instance.ProvisionResourceKey)
	require.Equal(t, client.registered[0].ProvisionResourceKey, reporter.callbacks[1].Continuation.PhysicalTerraformResourceKey)
	require.Equal(t, client.registered[0].ProvisionResourceKey, reporter.callbacks[2].Continuation.PhysicalTerraformResourceKey)
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

func TestServerPhysicalDatabaseInstanceLifecycleClientMapsCapacityExhaustion(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/v1/database-lifecycle/physical-database-instances/11111111-1111-4111-8111-111111111111/reserve", r.URL.Path)
		require.Equal(t, "agent-key", r.Header.Get("x-superblocks-agent-key"))
		w.WriteHeader(http.StatusConflict)
		w.Write([]byte(`{"responseMeta":{"error":{"code":"physical_database_instance_capacity_exhausted","message":"physical database instance capacity exhausted"},"message":"physical database instance capacity exhausted"}}`))
	}))
	defer server.Close()

	client := NewServerPhysicalDatabaseInstanceLifecycleClient(clients.NewServerClient(&clients.ServerClientOptions{
		URL:                 server.URL,
		SuperblocksAgentKey: "agent-key",
	}))

	err := client.ReservePhysicalDatabaseInstance(context.Background(), "11111111-1111-4111-8111-111111111111")

	require.ErrorIs(t, err, ErrPhysicalDatabaseInstanceCapacityExhausted)
}

func requireSpanAttribute(t *testing.T, spans tracetest.SpanStubs, spanName string, key string, value string) {
	t.Helper()
	for _, span := range spans {
		if span.Name != spanName {
			continue
		}
		for _, attr := range span.Attributes {
			if string(attr.Key) == key && attr.Value.AsString() == value {
				return
			}
		}
	}
	t.Fatalf("span %q with attribute %s=%q not found in %#v", spanName, key, value, spans)
}
