package databaselifecycle

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"regexp"
	"strings"
)

const (
	iamAuthDescriptorVersion = 1
	iamAuthMode              = "aws_iam_role"
	iamSessionPolicySID      = "ConnectToThisNativeDatabaseUser"
)

var (
	awsAccountIDPattern       = regexp.MustCompile(`^[0-9]{12}$`)
	awsRegionPattern          = regexp.MustCompile(`^[a-z]{2}-[a-z]+-[0-9]+$`)
	clusterResourceIDPattern  = regexp.MustCompile(`^(cluster|db)-[A-Za-z0-9-]+$`)
	connectorRoleARNPattern   = regexp.MustCompile(`^arn:aws:iam::([0-9]{12}):role/(?:[A-Za-z0-9_+=,.@-]+/)*[A-Za-z0-9_+=,.@-]+$`)
	databaseIdentifierPattern = regexp.MustCompile(`^sbndb_([0-9a-f]{12})_([0-9a-f]{24})$`)
	rdsHostnameLabelPattern   = regexp.MustCompile(`^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`)
	runtimeUsernamePattern    = regexp.MustCompile(`^sbndb_([0-9a-f]{12})_([0-9a-f]{24})_runtime$`)
)

// IAMAuthDescriptor is the non-secret authorization context emitted by the
// native database Terraform modules. The policy and auth token are always
// reconstructed locally from these primitive fields.
type IAMAuthDescriptor struct {
	ApplicationID     string
	AWSAccountID      string
	BindingID         string
	ClusterResourceID string
	ConnectorRoleARN  string
	Database          string
	Host              string
	Port              int
	Region            string
	Username          string
}

func ParseIAMAuthDescriptor(metadata map[string]any) (IAMAuthDescriptor, error) {
	if metadata == nil {
		return IAMAuthDescriptor{}, errors.New("connection_metadata missing on callback")
	}
	authMode, ok := metadata["auth_mode"].(string)
	if !ok || authMode != iamAuthMode {
		return IAMAuthDescriptor{}, fmt.Errorf("connection_metadata.auth_mode must be %q", iamAuthMode)
	}
	version, ok := descriptorInteger(metadata["auth_descriptor_version"])
	if !ok || version != iamAuthDescriptorVersion {
		return IAMAuthDescriptor{}, fmt.Errorf("connection_metadata.auth_descriptor_version must be %d", iamAuthDescriptorVersion)
	}

	port, ok := descriptorInteger(metadata["port"])
	if !ok || port < 1 || port > 65535 {
		return IAMAuthDescriptor{}, errors.New("connection_metadata.port must be an integer between 1 and 65535")
	}

	descriptor := IAMAuthDescriptor{
		ApplicationID:     descriptorString(metadata, "application_id"),
		AWSAccountID:      descriptorString(metadata, "aws_account_id"),
		BindingID:         descriptorString(metadata, "binding_id"),
		ClusterResourceID: descriptorString(metadata, "cluster_resource_id"),
		ConnectorRoleARN:  descriptorString(metadata, "connector_role_arn"),
		Database:          descriptorString(metadata, "database"),
		Host:              descriptorString(metadata, "host"),
		Port:              port,
		Region:            descriptorString(metadata, "region"),
		Username:          descriptorString(metadata, "username"),
	}
	if err := descriptor.Validate(); err != nil {
		return IAMAuthDescriptor{}, err
	}
	return descriptor, nil
}

func (descriptor IAMAuthDescriptor) Validate() error {
	required := []struct {
		field string
		value string
	}{
		{field: "application_id", value: descriptor.ApplicationID},
		{field: "binding_id", value: descriptor.BindingID},
		{field: "database", value: descriptor.Database},
	}
	for _, requiredField := range required {
		if strings.TrimSpace(requiredField.value) == "" {
			return fmt.Errorf("connection_metadata.%s missing", requiredField.field)
		}
		if strings.ContainsRune(requiredField.value, '\x00') {
			return fmt.Errorf("connection_metadata.%s contains a NUL byte", requiredField.field)
		}
	}
	if !awsAccountIDPattern.MatchString(descriptor.AWSAccountID) {
		return errors.New("connection_metadata.aws_account_id must contain exactly 12 digits")
	}
	if !awsRegionPattern.MatchString(descriptor.Region) {
		return errors.New("connection_metadata.region is not a valid AWS region")
	}
	if !clusterResourceIDPattern.MatchString(descriptor.ClusterResourceID) {
		return errors.New("connection_metadata.cluster_resource_id must start with cluster- or db- and contain only letters, digits, or hyphens")
	}
	databaseIdentifier := databaseIdentifierPattern.FindStringSubmatch(descriptor.Database)
	if databaseIdentifier == nil {
		return errors.New("connection_metadata.database must match sbndb_<12 lowercase hex>_<24 lowercase hex>")
	}
	usernameIdentifier := runtimeUsernamePattern.FindStringSubmatch(descriptor.Username)
	if usernameIdentifier == nil {
		return errors.New("connection_metadata.username must match sbndb_<12 lowercase hex>_<24 lowercase hex>_runtime")
	}
	if databaseIdentifier[1] != usernameIdentifier[1] {
		return errors.New("connection_metadata.database and connection_metadata.username deployment tokens do not match")
	}
	if databaseIdentifier[2] != expectedIAMDatabaseToken(descriptor.BindingID) {
		return errors.New("connection_metadata.database token does not match connection_metadata.binding_id")
	}
	if usernameIdentifier[2] != expectedIAMApplicationToken(descriptor.ApplicationID) {
		return errors.New("connection_metadata.username application token does not match connection_metadata.application_id")
	}

	roleARN := connectorRoleARNPattern.FindStringSubmatch(descriptor.ConnectorRoleARN)
	if roleARN == nil {
		return errors.New("connection_metadata.connector_role_arn must be a commercial AWS IAM role ARN")
	}
	if roleARN[1] != descriptor.AWSAccountID {
		return errors.New("connection_metadata.connector_role_arn account does not match aws_account_id")
	}
	if err := validateRDSHostname(descriptor.Host, descriptor.Region); err != nil {
		return err
	}
	return nil
}

func expectedIAMApplicationToken(applicationID string) string {
	return domainSeparatedIdentifierToken("application", applicationID)
}

func expectedIAMDatabaseToken(bindingID string) string {
	return domainSeparatedIdentifierToken("database", bindingID)
}

func CanonicalIAMSessionPolicy(descriptor IAMAuthDescriptor) (string, error) {
	if err := descriptor.Validate(); err != nil {
		return "", err
	}
	policy := struct {
		Version   string `json:"Version"`
		Statement []struct {
			SID      string `json:"Sid"`
			Effect   string `json:"Effect"`
			Action   string `json:"Action"`
			Resource string `json:"Resource"`
		} `json:"Statement"`
	}{
		Version: "2012-10-17",
		Statement: []struct {
			SID      string `json:"Sid"`
			Effect   string `json:"Effect"`
			Action   string `json:"Action"`
			Resource string `json:"Resource"`
		}{{
			SID:      iamSessionPolicySID,
			Effect:   "Allow",
			Action:   "rds-db:connect",
			Resource: fmt.Sprintf("arn:aws:rds-db:%s:%s:dbuser:%s/%s", descriptor.Region, descriptor.AWSAccountID, descriptor.ClusterResourceID, descriptor.Username),
		}},
	}
	encoded, err := json.Marshal(policy)
	if err != nil {
		return "", fmt.Errorf("encode IAM database session policy: %w", err)
	}
	return string(encoded), nil
}

func iamSessionPolicyDigest(policy string) string {
	digest := sha256.Sum256([]byte(policy))
	return hex.EncodeToString(digest[:])
}

func descriptorString(metadata map[string]any, key string) string {
	value, _ := metadata[key].(string)
	return value
}

func descriptorInteger(value any) (int, bool) {
	switch number := value.(type) {
	case int:
		return number, true
	case int32:
		return int(number), true
	case int64:
		if int64(int(number)) != number {
			return 0, false
		}
		return int(number), true
	case float64:
		if math.Trunc(number) != number || number > float64(math.MaxInt) || number < float64(math.MinInt) {
			return 0, false
		}
		return int(number), true
	default:
		return 0, false
	}
}

func validateRDSHostname(host, region string) error {
	if host == "" || host != strings.ToLower(host) || len(host) > 253 {
		return errors.New("connection_metadata.host must be a lowercase RDS hostname")
	}
	suffix := "." + region + ".rds.amazonaws.com"
	prefix := strings.TrimSuffix(host, suffix)
	if prefix == host || prefix == "" {
		return fmt.Errorf("connection_metadata.host must be an RDS hostname in region %s", region)
	}
	for _, label := range strings.Split(host, ".") {
		if !rdsHostnameLabelPattern.MatchString(label) {
			return errors.New("connection_metadata.host is not a valid RDS hostname")
		}
	}
	return nil
}
