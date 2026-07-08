package databaselifecycle

import (
	"context"
	"errors"
	"fmt"

	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"go.opentelemetry.io/otel/trace"
)

var ErrPhysicalDatabaseInstanceCapacityExhausted = errors.New("database lifecycle physical database instance capacity exhausted")

type PhysicalDatabaseInstanceSelector struct {
	BindingKey                   string
	RequestID                    string
	Region                       string
	Environment                  string
	Profile                      string
	Engine                       string
	Mode                         PhysicalDatabaseMode
	ProvisionOperation           string
	ParentResourceKey            string
	CurrentState                 string
	PhysicalDatabaseInstanceID   string
	PhysicalTerraformResourceKey string
}

type PhysicalDatabaseInstance struct {
	ID                   string
	Region               string
	Environment          string
	Engine               string
	ProvisionResourceKey string
	Endpoint             string
	MasterCredentialRef  map[string]any
	CapacityMax          int
	CapacityUsed         int
	Status               string
	SecurityClass        string
}

type PhysicalDatabaseInstanceLifecycleClient interface {
	ListPhysicalDatabaseInstances(context.Context, PhysicalDatabaseInstanceSelector) ([]PhysicalDatabaseInstance, error)
	ReservePhysicalDatabaseInstance(context.Context, string) error
	RegisterPhysicalDatabaseInstance(context.Context, PhysicalDatabaseInstance) (PhysicalDatabaseInstance, error)
	ReleasePhysicalDatabaseInstance(context.Context, string) error
}

type PhysicalDatabaseInstanceProvisioner interface {
	ProvisionPhysicalDatabaseInstance(context.Context, PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error)
}

// PhysicalDatabaseInstanceDeprovisioner can undo infrastructure created before server registration succeeds.
type PhysicalDatabaseInstanceDeprovisioner interface {
	DeprovisionPhysicalDatabaseInstance(context.Context, PhysicalDatabaseInstance) error
}

type PhysicalDatabaseInstanceProvisionerFunc func(context.Context, PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error)

func (f PhysicalDatabaseInstanceProvisionerFunc) ProvisionPhysicalDatabaseInstance(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
	return f(ctx, selector)
}

type PhysicalDatabaseInstanceLifecycle struct {
	client      PhysicalDatabaseInstanceLifecycleClient
	provisioner PhysicalDatabaseInstanceProvisioner
	reporter    ProgressReporter
}

func NewPhysicalDatabaseInstanceLifecycle(client PhysicalDatabaseInstanceLifecycleClient, provisioner PhysicalDatabaseInstanceProvisioner) *PhysicalDatabaseInstanceLifecycle {
	return &PhysicalDatabaseInstanceLifecycle{client: client, provisioner: provisioner}
}

func (l *PhysicalDatabaseInstanceLifecycle) ReportProgressWith(reporter ProgressReporter) {
	l.reporter = reporter
}

func (l *PhysicalDatabaseInstanceLifecycle) ReserveForEnsure(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
	return tracer.Observe(ctx, "database_lifecycle.physical_instance.reserve_for_ensure", physicalDatabaseInstanceLifecycleTraceTags(selector, selector.CurrentState), func(ctx context.Context, _ trace.Span) (PhysicalDatabaseInstance, error) {
		return l.reserveForEnsure(ctx, selector)
	}, nil)
}

func (l *PhysicalDatabaseInstanceLifecycle) reserveForEnsure(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
	if shouldResumeReservedPhysicalDatabaseInstance(selector) {
		return l.resumeReservedPhysicalDatabaseInstance(ctx, selector)
	}
	if shouldResumeRegisteredPhysicalDatabaseInstance(selector) {
		return l.reserveRegisteredPhysicalDatabaseInstance(ctx, selector)
	}
	if shouldResumePhysicalDatabaseInstanceProvision(selector) {
		return l.provisionRegisterAndReserve(ctx, selector, true)
	}
	if selector.Mode == PhysicalDatabaseModeDedicated {
		return l.provisionRegisterAndReserve(ctx, selector, false)
	}
	instances, err := l.client.ListPhysicalDatabaseInstances(ctx, selector)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	var reserveErrs []error
	for _, instance := range instances {
		if err := l.client.ReservePhysicalDatabaseInstance(ctx, instance.ID); err == nil {
			if progressErr := l.reportPhysicalDatabaseInstanceProgress(ctx, selector, instance, "physical_db_reserved"); progressErr != nil {
				if releaseErr := l.client.ReleasePhysicalDatabaseInstance(ctx, instance.ID); releaseErr != nil {
					return PhysicalDatabaseInstance{}, errors.Join(progressErr, releaseErr)
				}
				return PhysicalDatabaseInstance{}, progressErr
			}
			return instance, nil
		} else {
			reserveErrs = append(reserveErrs, err)
		}
	}
	if len(reserveErrs) > 0 && !allPhysicalDatabaseInstanceCapacityExhausted(reserveErrs) {
		return PhysicalDatabaseInstance{}, errors.Join(reserveErrs...)
	}
	if l.provisioner == nil {
		if len(reserveErrs) > 0 {
			return PhysicalDatabaseInstance{}, errors.Join(reserveErrs...)
		}
		return PhysicalDatabaseInstance{}, errors.New("database lifecycle physical database instance provisioner is required")
	}
	return l.provisionRegisterAndReserve(ctx, selector, false)
}

func shouldResumePhysicalDatabaseInstanceProvision(selector PhysicalDatabaseInstanceSelector) bool {
	return selector.CurrentState == "physical_db_provisioning" && selector.PhysicalTerraformResourceKey != ""
}

func shouldResumeRegisteredPhysicalDatabaseInstance(selector PhysicalDatabaseInstanceSelector) bool {
	return selector.CurrentState == "physical_db_registered" && selector.PhysicalDatabaseInstanceID != ""
}

func shouldResumeReservedPhysicalDatabaseInstance(selector PhysicalDatabaseInstanceSelector) bool {
	return selector.CurrentState == "physical_db_reserved" && selector.PhysicalDatabaseInstanceID != ""
}

func (l *PhysicalDatabaseInstanceLifecycle) resumeReservedPhysicalDatabaseInstance(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
	return l.getRegisteredPhysicalDatabaseInstance(ctx, selector)
}

func (l *PhysicalDatabaseInstanceLifecycle) reserveRegisteredPhysicalDatabaseInstance(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
	instance, err := l.getRegisteredPhysicalDatabaseInstance(ctx, selector)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	if err := l.client.ReservePhysicalDatabaseInstance(ctx, instance.ID); err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	if progressErr := l.reportPhysicalDatabaseInstanceProgress(ctx, selector, instance, "physical_db_reserved"); progressErr != nil {
		if releaseErr := l.client.ReleasePhysicalDatabaseInstance(ctx, instance.ID); releaseErr != nil {
			return PhysicalDatabaseInstance{}, errors.Join(progressErr, releaseErr)
		}
		return PhysicalDatabaseInstance{}, progressErr
	}
	return instance, nil
}

func (l *PhysicalDatabaseInstanceLifecycle) getRegisteredPhysicalDatabaseInstance(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
	instances, err := l.client.ListPhysicalDatabaseInstances(ctx, selector)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	var instance PhysicalDatabaseInstance
	for _, candidate := range instances {
		if candidate.ID == selector.PhysicalDatabaseInstanceID {
			instance = candidate
			break
		}
	}
	if instance.ID == "" {
		return PhysicalDatabaseInstance{}, fmt.Errorf("registered physical database instance %s not found", selector.PhysicalDatabaseInstanceID)
	}
	if instance.ProvisionResourceKey == "" {
		instance.ProvisionResourceKey = selector.PhysicalTerraformResourceKey
	}
	return instance, nil
}

func (l *PhysicalDatabaseInstanceLifecycle) provisionRegisterAndReserve(ctx context.Context, selector PhysicalDatabaseInstanceSelector, resumed bool) (PhysicalDatabaseInstance, error) {
	if l.provisioner == nil {
		return PhysicalDatabaseInstance{}, errors.New("database lifecycle physical database instance provisioner is required")
	}
	instance, err := l.provisioner.ProvisionPhysicalDatabaseInstance(ctx, selector)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	instance.Region = selector.Region
	instance.Environment = selector.Environment
	instance.Engine = selector.Engine
	if progressErr := l.reportPhysicalDatabaseInstanceProgress(ctx, selector, instance, "physical_db_provisioning"); progressErr != nil {
		if !resumed {
			if deprovisionErr := l.deprovisionPhysicalDatabaseInstance(ctx, instance); deprovisionErr != nil {
				return PhysicalDatabaseInstance{}, errors.Join(progressErr, deprovisionErr)
			}
		}
		return PhysicalDatabaseInstance{}, progressErr
	}
	registered, err := l.client.RegisterPhysicalDatabaseInstance(ctx, instance)
	if err != nil {
		if deprovisionErr := l.deprovisionPhysicalDatabaseInstance(ctx, instance); deprovisionErr != nil {
			return PhysicalDatabaseInstance{}, errors.Join(err, deprovisionErr)
		}
		return PhysicalDatabaseInstance{}, err
	}
	if registered.ProvisionResourceKey == "" {
		registered.ProvisionResourceKey = instance.ProvisionResourceKey
	}
	if progressErr := l.reportPhysicalDatabaseInstanceProgress(ctx, selector, registered, "physical_db_registered"); progressErr != nil {
		// The control plane registration is keyed by the physical instance ID
		// and must be idempotent for retry after this checkpoint fails.
		return PhysicalDatabaseInstance{}, progressErr
	}
	if err := l.client.ReservePhysicalDatabaseInstance(ctx, registered.ID); err != nil {
		if releaseErr := l.client.ReleasePhysicalDatabaseInstance(ctx, registered.ID); releaseErr != nil {
			return PhysicalDatabaseInstance{}, errors.Join(err, releaseErr)
		}
		return PhysicalDatabaseInstance{}, err
	}
	if progressErr := l.reportPhysicalDatabaseInstanceProgress(ctx, selector, registered, "physical_db_reserved"); progressErr != nil {
		if releaseErr := l.client.ReleasePhysicalDatabaseInstance(ctx, registered.ID); releaseErr != nil {
			return PhysicalDatabaseInstance{}, errors.Join(progressErr, releaseErr)
		}
		return PhysicalDatabaseInstance{}, progressErr
	}
	return registered, nil
}

func (l *PhysicalDatabaseInstanceLifecycle) deprovisionPhysicalDatabaseInstance(ctx context.Context, instance PhysicalDatabaseInstance) error {
	deprovisioner, ok := l.provisioner.(PhysicalDatabaseInstanceDeprovisioner)
	if !ok {
		return nil
	}
	return deprovisioner.DeprovisionPhysicalDatabaseInstance(ctx, instance)
}

func (l *PhysicalDatabaseInstanceLifecycle) reportPhysicalDatabaseInstanceProgress(ctx context.Context, selector PhysicalDatabaseInstanceSelector, instance PhysicalDatabaseInstance, currentState string) error {
	if l.reporter == nil || selector.RequestID == "" {
		return nil
	}
	callback := ProgressCallback{
		BindingKey: selector.BindingKey,
		Continuation: DispatchContinuation{
			CurrentState:                 currentState,
			PhysicalDatabaseInstanceID:   instance.ID,
			PhysicalTerraformResourceKey: instance.ProvisionResourceKey,
		},
		RequestID: selector.RequestID,
	}
	_, err := tracer.Observe(ctx, "database_lifecycle.physical_instance.progress_callback", physicalDatabaseInstanceLifecycleTraceTags(selector, currentState), func(ctx context.Context, _ trace.Span) (ProgressCallbackResult, error) {
		return l.reporter.ReportProgress(ctx, callback)
	}, nil)
	if err != nil {
		return &LifecycleError{Code: ErrorCodeCallbackFailed, Retryable: true, Err: err}
	}
	return nil
}

func physicalDatabaseInstanceLifecycleTraceTags(selector PhysicalDatabaseInstanceSelector, currentState string) map[string]any {
	tags := map[string]any{}
	if selector.Mode != "" {
		tags["database.lifecycle.mode"] = string(selector.Mode)
	}
	if currentState != "" {
		tags["database.lifecycle.current_state"] = currentState
	}
	if selector.Engine != "" {
		tags["database.system"] = selector.Engine
	}
	if selector.Environment != "" {
		tags["deployment.environment.name"] = selector.Environment
	}
	if selector.Profile != "" {
		tags["deployment.environment.profile"] = selector.Profile
	}
	if selector.Region != "" {
		tags["cloud.region"] = selector.Region
	}
	return tags
}

func allPhysicalDatabaseInstanceCapacityExhausted(errs []error) bool {
	if len(errs) == 0 {
		return false
	}
	for _, err := range errs {
		if !errors.Is(err, ErrPhysicalDatabaseInstanceCapacityExhausted) {
			return false
		}
	}
	return true
}
