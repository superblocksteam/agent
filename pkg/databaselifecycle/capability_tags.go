package databaselifecycle

import (
	"encoding/json"
	"slices"
	"strings"

	"github.com/superblocksteam/agent/pkg/secrets/refresolver"
)

const (
	capabilityTagOperations          = "databaseLifecycle:operations"
	capabilityTagEngines             = "databaseLifecycle:engines"
	capabilityTagEnvironmentProfiles = "databaseLifecycle:environmentProfiles"
	capabilityTagCapabilities        = "databaseLifecycle:capabilities"
	environmentProfileSeparator      = ":"
	managedIAMCapabilityV1           = "managed-IAM-v1"
)

func (config LifecycleConfig) CapabilityTags() map[string][]string {
	values := map[string]map[string]struct{}{
		capabilityTagOperations:          {},
		capabilityTagEngines:             {},
		capabilityTagEnvironmentProfiles: {},
	}
	internalProvisionOperations := config.internalPhysicalProvisionOperations()

	for _, entry := range config.Entries {
		for _, profile := range entry.Profiles {
			addCapabilityTag(values, capabilityTagEnvironmentProfiles, entry.Environment+environmentProfileSeparator+profile)
		}
		for _, engine := range entry.Engines {
			addCapabilityTag(values, capabilityTagEngines, engine)
		}
		for _, operation := range entry.operationNames() {
			if _, internal := internalProvisionOperations[operation]; internal {
				continue
			}
			addCapabilityTag(values, capabilityTagOperations, operation)
		}
	}

	tags := make(map[string][]string)
	for key, set := range values {
		if len(set) > 0 {
			tags[key] = sortedCapabilityValues(set)
		}
	}
	return tags
}

func (config LifecycleConfig) internalPhysicalProvisionOperations() map[string]struct{} {
	operations := map[string]struct{}{}
	for _, entry := range config.Entries {
		for _, operation := range entry.Operations {
			if operation.PhysicalDatabase != nil && operation.PhysicalDatabase.ProvisionOperation != "" {
				operations[operation.PhysicalDatabase.ProvisionOperation] = struct{}{}
			}
		}
	}
	return operations
}

func CapabilityTagsFromEnv(getenv func(string) string) (map[string][]string, error) {
	rawConfig := getenv(envConfig)
	if rawConfig == "" {
		return map[string][]string{}, nil
	}
	config, err := parseLifecycleConfig(rawConfig)
	if err != nil {
		return nil, err
	}
	tags := config.CapabilityTags()
	if managedIAMV1Available(config, getenv) {
		tags[capabilityTagCapabilities] = []string{managedIAMCapabilityV1}
	}
	return tags, nil
}

func managedIAMV1Available(config LifecycleConfig, getenv func(string) string) bool {
	expectedConnectorRoleARN := getenv(envConnectorRoleARN)
	// IAM ensure still resolves the RDS master secret through refresolver for
	// logical-database bootstrap. An empty secrets allowlist is deny-default, so
	// advertising managed-IAM-v1 without prefixes guarantees every IAM provision fails.
	if !connectorRoleARNPattern.MatchString(expectedConnectorRoleARN) ||
		getenv(envSSLMode) != sslModeVerifyFull ||
		strings.TrimSpace(getenv(envSSLRootCert)) == "" ||
		!postgresIAMRoleARNAllowed(expectedConnectorRoleARN, getenv(envIAMAllowedRoleARNPrefixes)) ||
		!secretsRefAllowlistConfigured(getenv(refresolver.AllowedRefPrefixesEnvVar)) {
		return false
	}
	for _, entry := range config.Entries {
		for _, operation := range entry.Operations {
			if operation.Terraform == nil {
				continue
			}
			module, exists := operation.Terraform.ModuleSelectors["postgres"]
			if exists && isProvisionableIAMAuthModule(module.Inputs, expectedConnectorRoleARN) {
				return true
			}
		}
	}
	return false
}

func secretsRefAllowlistConfigured(rawAllowlist string) bool {
	for _, prefix := range strings.Split(rawAllowlist, ",") {
		if strings.TrimSpace(prefix) != "" {
			return true
		}
	}
	return false
}

// postgresIAMRoleARNAllowed mirrors the JS postgres plugin allowlist: exact ARN
// match, or path-prefix match when the entry ends with "/". Empty/invalid
// allowlists deny every role (runtime deny-default).
func postgresIAMRoleARNAllowed(roleARN string, rawAllowlist string) bool {
	rawAllowlist = strings.TrimSpace(rawAllowlist)
	if rawAllowlist == "" {
		return false
	}
	var parsed []any
	if err := json.Unmarshal([]byte(rawAllowlist), &parsed); err != nil {
		return false
	}
	for _, item := range parsed {
		allowed, ok := item.(string)
		if !ok {
			return false
		}
		allowed = strings.TrimSpace(allowed)
		if allowed == "" {
			continue
		}
		if strings.HasSuffix(allowed, "/") {
			if strings.HasPrefix(roleARN, allowed) {
				return true
			}
			continue
		}
		if roleARN == allowed {
			return true
		}
	}
	return false
}

// isProvisionableIAMAuthModule reports whether module inputs are complete enough
// to materialize an IAM ensure without failing after advertising managed-IAM-v1.
// auth_mode alone is insufficient: shared IAM roots require a deployment_token
// and a connector_role_arn that matches the operator-configured expected role.
func isProvisionableIAMAuthModule(inputs map[string]any, expectedConnectorRoleARN string) bool {
	if !isIAMAuthModule(inputs) {
		return false
	}
	deploymentToken, _ := inputs[deploymentTokenInput].(string)
	if !deploymentTokenPattern.MatchString(deploymentToken) {
		return false
	}
	connectorRoleARN, _ := inputs["connector_role_arn"].(string)
	return connectorRoleARN == expectedConnectorRoleARN
}

func MergeCapabilityTags(tags map[string][]string, capabilityTags map[string][]string) map[string][]string {
	if tags == nil {
		tags = make(map[string][]string)
	}

	for key, values := range capabilityTags {
		replacement := make(map[string]struct{})
		for _, value := range values {
			if value != "" {
				replacement[value] = struct{}{}
			}
		}
		if len(replacement) > 0 {
			tags[key] = sortedCapabilityValues(replacement)
		} else {
			delete(tags, key)
		}
	}
	return tags
}

func addCapabilityTag(values map[string]map[string]struct{}, key string, value string) {
	if value != "" {
		values[key][value] = struct{}{}
	}
}

func sortedCapabilityValues(values map[string]struct{}) []string {
	sorted := make([]string, 0, len(values))
	for value := range values {
		sorted = append(sorted, value)
	}
	slices.Sort(sorted)
	return sorted
}
