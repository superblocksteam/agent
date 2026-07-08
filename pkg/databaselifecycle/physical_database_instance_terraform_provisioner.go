package databaselifecycle

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
)

const operationEnsurePhysicalDatabaseInstance = "ensure_physical_database_instance"

type terraformPhysicalDatabaseInstanceProvisioner struct {
	allowedModuleSources []string
	config               LifecycleConfig
	jobBuilder           *PathJobBuilder
	newProvisionID       func() (string, error)
	runner               LifecycleRunner
	sslOpts              ProviderSSLOptions
}

func newTerraformPhysicalDatabaseInstanceProvisioner(
	config LifecycleConfig,
	allowedModuleSources []string,
	rootDir string,
	runner LifecycleRunner,
	sslOpts ProviderSSLOptions,
) *terraformPhysicalDatabaseInstanceProvisioner {
	return &terraformPhysicalDatabaseInstanceProvisioner{
		allowedModuleSources: allowedModuleSources,
		config:               config,
		jobBuilder:           NewPathJobBuilder(rootDir),
		newProvisionID:       newPhysicalDatabaseInstanceProvisionID,
		runner:               runner,
		sslOpts:              sslOpts,
	}
}

func (p *terraformPhysicalDatabaseInstanceProvisioner) ProvisionPhysicalDatabaseInstance(ctx context.Context, selector PhysicalDatabaseInstanceSelector) (PhysicalDatabaseInstance, error) {
	if p.runner == nil {
		return PhysicalDatabaseInstance{}, errors.New("database lifecycle physical database instance runner is required")
	}
	provisionOperation := selector.ProvisionOperation
	if provisionOperation == "" {
		provisionOperation = operationEnsurePhysicalDatabaseInstance
	}
	resolved, err := p.config.Resolve(selector.Environment, selector.Profile, provisionOperation, selector.Engine)
	if err != nil {
		return PhysicalDatabaseInstance{}, unsupportedShapeError(err)
	}
	if err := ValidateTerraformModuleSource(resolved.Module, p.allowedModuleSources); err != nil {
		return PhysicalDatabaseInstance{}, unsupportedShapeError(fmt.Errorf("config entry %s/%s: %w", selector.Environment, selector.Profile, err))
	}
	dispatch, err := physicalDatabaseInstanceProvisionDispatch(selector, provisionOperation, p.newProvisionID)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	job, err := p.jobBuilder.Build(dispatch)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	if err := MaterializeResolvedJob(job, dispatch, resolved, p.sslOpts); err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	result, err := p.runner.Run(ctx, job)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	instance, err := physicalDatabaseInstanceFromTerraformOutput(result, resolved.Module.Inputs)
	if err != nil {
		if deprovisionErr := p.deprovisionJob(ctx, job); deprovisionErr != nil {
			return PhysicalDatabaseInstance{}, errors.Join(err, deprovisionErr)
		}
		return PhysicalDatabaseInstance{}, err
	}
	instance.ProvisionResourceKey = dispatch.ResourceKey
	instance.Region = selector.Region
	instance.Environment = selector.Environment
	instance.Engine = selector.Engine
	return instance, nil
}

func (p *terraformPhysicalDatabaseInstanceProvisioner) DeprovisionPhysicalDatabaseInstance(ctx context.Context, instance PhysicalDatabaseInstance) error {
	if instance.ProvisionResourceKey == "" {
		return errors.New("database lifecycle physical database instance provision resource key is required")
	}
	job, err := p.jobBuilder.Build(DispatchPayload{BindingKey: instance.ProvisionResourceKey})
	if err != nil {
		return err
	}
	return p.deprovisionJob(ctx, job)
}

func (p *terraformPhysicalDatabaseInstanceProvisioner) deprovisionJob(ctx context.Context, job Job) error {
	destroyer, ok := p.runner.(LifecycleDestroyer)
	if !ok {
		return errors.New("database lifecycle physical database instance destroyer is required")
	}
	if _, err := destroyer.Destroy(ctx, job); err != nil {
		return fmt.Errorf("deprovision physical database instance: %w", err)
	}
	return nil
}

func physicalDatabaseInstanceProvisionDispatch(selector PhysicalDatabaseInstanceSelector, operation string, newProvisionID func() (string, error)) (DispatchPayload, error) {
	resourceKey := selector.PhysicalTerraformResourceKey
	provisionID := physicalDatabaseInstanceProvisionIDFromResourceKey(resourceKey)
	if resourceKey == "" {
		if selector.ParentResourceKey != "" {
			provisionID = physicalDatabaseInstanceProvisionIDFromParentResourceKey(selector.ParentResourceKey)
		} else {
			generatedID, err := newProvisionID()
			if err != nil {
				return DispatchPayload{}, fmt.Errorf("generate physical database instance provision id: %w", err)
			}
			provisionID = generatedID
		}
		resourceKey = fmt.Sprintf("physical-database-instance:%s:%s:%s:%s:%s", selector.Environment, selector.Profile, selector.Region, selector.Engine, provisionID)
	}
	return DispatchPayload{
		BindingKey:      resourceKey,
		DesiredSpec:     DatabaseRequirement{Engine: selector.Engine},
		DesiredSpecHash: provisionID,
		Environment:     selector.Environment,
		Operation:       operation,
		Profile:         selector.Profile,
		RequestID:       provisionID,
		ResourceKey:     resourceKey,
	}, nil
}

func physicalDatabaseInstanceProvisionIDFromResourceKey(resourceKey string) string {
	parts := strings.Split(resourceKey, ":")
	if len(parts) == 0 {
		return ""
	}
	return parts[len(parts)-1]
}

func physicalDatabaseInstanceProvisionIDFromParentResourceKey(parentResourceKey string) string {
	sum := sha256.Sum256([]byte(parentResourceKey))
	return hex.EncodeToString(sum[:16])
}

func physicalDatabaseInstanceFromTerraformOutput(result Result, moduleInputs map[string]any) (PhysicalDatabaseInstance, error) {
	var outputs map[string]terraformOutputValue
	if err := json.Unmarshal([]byte(result.OutputJSON), &outputs); err != nil {
		return PhysicalDatabaseInstance{}, fmt.Errorf("decode physical database instance terraform output: %w", err)
	}
	endpoint, err := physicalDatabaseInstanceEndpoint(outputs)
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	masterCredentialRef := physicalDatabaseInstanceMasterCredentialRef(outputs)
	if len(masterCredentialRef) == 0 {
		return PhysicalDatabaseInstance{}, errors.New("physical database instance terraform output credential_refs.password or master_credential_ref is required")
	}
	capacityMax, err := intTerraformOutputOrInput(outputs, moduleInputs, "capacity_max")
	if err != nil {
		return PhysicalDatabaseInstance{}, err
	}
	status, ok := stringTerraformOutputOrInput(outputs, moduleInputs, "status")
	if !ok {
		status = "active"
	}
	securityClass, _ := stringTerraformOutputOrInput(outputs, moduleInputs, "security_class")
	return PhysicalDatabaseInstance{
		Endpoint:            endpoint,
		MasterCredentialRef: masterCredentialRef,
		CapacityMax:         capacityMax,
		Status:              status,
		SecurityClass:       securityClass,
	}, nil
}

func physicalDatabaseInstanceEndpoint(outputs map[string]terraformOutputValue) (string, error) {
	if endpoint, err := stringTerraformOutput(outputs, "endpoint"); err == nil {
		return endpoint, nil
	}
	connectionMetadata := mapOutputValue(outputs, "connection_metadata")
	host, _ := stringMapValue(connectionMetadata, "host")
	if host == "" {
		return "", errors.New("physical database instance terraform output connection_metadata.host is required")
	}
	if port, ok := intMapValue(connectionMetadata, "port"); ok {
		return fmt.Sprintf("%s:%d", host, port), nil
	}
	return host, nil
}

func physicalDatabaseInstanceMasterCredentialRef(outputs map[string]terraformOutputValue) map[string]any {
	if ref := mapOutputValue(outputs, "master_credential_ref"); len(ref) > 0 {
		return ref
	}
	credentialRefs := mapOutputValue(outputs, "credential_refs")
	passwordRef, _ := credentialRefs["password"].(map[string]any)
	return passwordRef
}

func stringTerraformOutput(outputs map[string]terraformOutputValue, key string) (string, error) {
	output, ok := outputs[key]
	if !ok {
		return "", fmt.Errorf("physical database instance terraform output %s is required", key)
	}
	value, ok := output.Value.(string)
	if !ok || value == "" {
		return "", fmt.Errorf("physical database instance terraform output %s must be a non-empty string", key)
	}
	return value, nil
}

func stringTerraformOutputOrInput(outputs map[string]terraformOutputValue, inputs map[string]any, key string) (string, bool) {
	if value, err := stringTerraformOutput(outputs, key); err == nil {
		return value, true
	}
	return stringMapValue(inputs, key)
}

func intTerraformOutputOrInput(outputs map[string]terraformOutputValue, inputs map[string]any, key string) (int, error) {
	output, ok := outputs[key]
	if ok {
		if value, ok := positiveInt(output.Value); ok {
			return value, nil
		}
		return 0, fmt.Errorf("physical database instance terraform output %s must be a positive integer", key)
	}
	if value, ok := intMapValue(inputs, key); ok {
		return value, nil
	}
	return 0, fmt.Errorf("physical database instance terraform output or module input %s is required", key)
}

func stringMapValue(values map[string]any, key string) (string, bool) {
	value, ok := values[key].(string)
	return value, ok && value != ""
}

func intMapValue(values map[string]any, key string) (int, bool) {
	return positiveInt(values[key])
}

func positiveInt(value any) (int, bool) {
	switch typed := value.(type) {
	case int:
		return typed, typed > 0
	case int32:
		return int(typed), typed > 0
	case int64:
		return int(typed), typed > 0
	case float64:
		if typed < 1 || math.Trunc(typed) != typed {
			return 0, false
		}
		return int(typed), true
	default:
		return 0, false
	}
}

func newPhysicalDatabaseInstanceProvisionID() (string, error) {
	var value [16]byte
	if _, err := rand.Read(value[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(value[:]), nil
}
