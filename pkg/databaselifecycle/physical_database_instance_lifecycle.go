package databaselifecycle

import (
	"context"
	"errors"
)

var ErrPhysicalDatabaseInstanceCapacityExhausted = errors.New("database lifecycle physical database instance capacity exhausted")

type PhysicalDatabaseInstanceSelector struct {
	Region      string
	Environment string
	Profile     string
	Engine      string
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
}

func NewPhysicalDatabaseInstanceLifecycle(client PhysicalDatabaseInstanceLifecycleClient, provisioner PhysicalDatabaseInstanceProvisioner) *PhysicalDatabaseInstanceLifecycle {
	return &PhysicalDatabaseInstanceLifecycle{client: client, provisioner: provisioner}
}

func (l *PhysicalDatabaseInstanceLifecycle) ReserveForEnsure(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
	instances, err := l.client.ListPhysicalDatabaseInstances(ctx, selector)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	var reserveErrs []error
	for _, instance := range instances {
		if err := l.client.ReservePhysicalDatabaseInstance(ctx, instance.ID); err == nil {
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
	instance, err := l.provisioner.ProvisionPhysicalDatabaseInstance(ctx, selector)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	instance.Region = selector.Region
	instance.Environment = selector.Environment
	instance.Engine = selector.Engine
	registered, err := l.client.RegisterPhysicalDatabaseInstance(ctx, instance)
	if err != nil {
		if deprovisioner, ok := l.provisioner.(PhysicalDatabaseInstanceDeprovisioner); ok {
			if deprovisionErr := deprovisioner.DeprovisionPhysicalDatabaseInstance(ctx, instance); deprovisionErr != nil {
				return PhysicalDatabaseInstance{}, errors.Join(err, deprovisionErr)
			}
		}
		return PhysicalDatabaseInstance{}, err
	}
	if err := l.client.ReservePhysicalDatabaseInstance(ctx, registered.ID); err != nil {
		if releaseErr := l.client.ReleasePhysicalDatabaseInstance(ctx, registered.ID); releaseErr != nil {
			return PhysicalDatabaseInstance{}, errors.Join(err, releaseErr)
		}
		return PhysicalDatabaseInstance{}, err
	}
	return registered, nil
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
