package databaselifecycle

import (
	"context"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type staticCredentialProvider struct {
	accessKeyID string
}

const (
	validIAMApplicationID    = "application-1"
	validIAMApplicationToken = "135c0d252350f3bba710c990"
	validIAMBindingID        = "binding-1"
	validIAMBindingToken     = "96883863630a181689324e37"
	validIAMConnectorRoleARN = "arn:aws:iam::123456789012:role/superblocks-native-db-connector"
	validIAMDeploymentToken  = "0123456789ab"
	validIAMDatabase         = "sbndb_" + validIAMDeploymentToken + "_" + validIAMBindingToken
	validIAMRuntimeUsername  = "sbndb_" + validIAMDeploymentToken + "_" + validIAMApplicationToken + "_runtime"
	validIAMV2Username       = "sbndb_" + validIAMDeploymentToken + "_" + validIAMBindingToken + "_runtime"
)

func (provider staticCredentialProvider) Retrieve(context.Context) (aws.Credentials, error) {
	return aws.Credentials{
		AccessKeyID:     provider.accessKeyID,
		SecretAccessKey: "secret",
		SessionToken:    "session",
	}, nil
}

func validIAMMetadata() map[string]any {
	return map[string]any{
		"application_id":          validIAMApplicationID,
		"auth_descriptor_version": float64(1),
		"auth_mode":               "aws_iam_role",
		"aws_account_id":          "123456789012",
		"binding_id":              validIAMBindingID,
		"cluster_resource_id":     "cluster-ABC123DEF456EXAMPLE",
		"connector_role_arn":      validIAMConnectorRoleARN,
		"database":                validIAMDatabase,
		"host":                    "orders.cluster-abc123.us-east-1.rds.amazonaws.com",
		"port":                    float64(5432),
		"region":                  "us-east-1",
		"username":                validIAMRuntimeUsername,
	}
}

func validIAMV2Metadata() map[string]any {
	metadata := validIAMMetadata()
	metadata["auth_descriptor_version"] = float64(2)
	metadata["username"] = validIAMV2Username
	return metadata
}

func TestParseIAMAuthDescriptorAcceptsBindingDerivedV2(t *testing.T) {
	descriptor, err := ParseIAMAuthDescriptor(validIAMV2Metadata())

	require.NoError(t, err)
	require.Equal(t, validIAMV2Username, descriptor.Username)
}

func TestParseIAMAuthDescriptorKeepsApplicationDerivedV1Compatibility(t *testing.T) {
	descriptor, err := ParseIAMAuthDescriptor(validIAMMetadata())

	require.NoError(t, err)
	require.Equal(t, validIAMRuntimeUsername, descriptor.Username)
}

func TestParseIAMAuthDescriptorRejectsApplicationDerivedV2Username(t *testing.T) {
	metadata := validIAMV2Metadata()
	metadata["username"] = validIAMRuntimeUsername

	_, err := ParseIAMAuthDescriptor(metadata)

	require.ErrorContains(t, err, "username binding token does not match connection_metadata.binding_id")
}

func TestCanonicalIAMSessionPolicy(t *testing.T) {
	descriptor, err := ParseIAMAuthDescriptor(validIAMMetadata())
	require.NoError(t, err)

	policy, err := CanonicalIAMSessionPolicy(descriptor)
	require.NoError(t, err)
	require.Equal(
		t,
		`{"Version":"2012-10-17","Statement":[{"Sid":"ConnectToThisNativeDatabaseUser","Effect":"Allow","Action":"rds-db:connect","Resource":"arn:aws:rds-db:us-east-1:123456789012:dbuser:cluster-ABC123DEF456EXAMPLE/sbndb_0123456789ab_135c0d252350f3bba710c990_runtime"}]}`,
		policy,
	)
}

func TestStandaloneRDSIAMDescriptor(t *testing.T) {
	metadata := validIAMMetadata()
	metadata["cluster_resource_id"] = "db-ABCDEF0123456789-1"
	metadata["host"] = "orders.abc123.us-east-1.rds.amazonaws.com"

	descriptor, err := ParseIAMAuthDescriptor(metadata)
	require.NoError(t, err)

	policy, err := CanonicalIAMSessionPolicy(descriptor)
	require.NoError(t, err)
	require.Equal(
		t,
		`{"Version":"2012-10-17","Statement":[{"Sid":"ConnectToThisNativeDatabaseUser","Effect":"Allow","Action":"rds-db:connect","Resource":"arn:aws:rds-db:us-east-1:123456789012:dbuser:db-ABCDEF0123456789-1/sbndb_0123456789ab_135c0d252350f3bba710c990_runtime"}]}`,
		policy,
	)
}

func TestStandaloneRDSIAMDescriptorV2UsesExactBindingPolicy(t *testing.T) {
	metadata := validIAMV2Metadata()
	metadata["cluster_resource_id"] = "db-ABCDEF0123456789-1"
	metadata["host"] = "orders.abc123.us-east-1.rds.amazonaws.com"

	descriptor, err := ParseIAMAuthDescriptor(metadata)
	require.NoError(t, err)
	policy, err := CanonicalIAMSessionPolicy(descriptor)

	require.NoError(t, err)
	require.Equal(
		t,
		`{"Version":"2012-10-17","Statement":[{"Sid":"ConnectToThisNativeDatabaseUser","Effect":"Allow","Action":"rds-db:connect","Resource":"arn:aws:rds-db:us-east-1:123456789012:dbuser:db-ABCDEF0123456789-1/sbndb_0123456789ab_96883863630a181689324e37_runtime"}]}`,
		policy,
	)
}

func TestStandaloneRDSIAMDescriptorV2DeniesCrossBindingIdentity(t *testing.T) {
	first := validIAMV2Metadata()
	first["cluster_resource_id"] = "db-ABCDEF0123456789-1"
	first["host"] = "orders.abc123.us-east-1.rds.amazonaws.com"

	crossBinding := validIAMV2Metadata()
	crossBinding["binding_id"] = "binding-2"
	crossBinding["cluster_resource_id"] = "db-ABCDEF0123456789-1"
	crossBinding["host"] = "orders.abc123.us-east-1.rds.amazonaws.com"
	_, err := ParseIAMAuthDescriptor(crossBinding)
	require.ErrorContains(t, err, "database token does not match connection_metadata.binding_id")

	second := validIAMV2Metadata()
	second["binding_id"] = "binding-2"
	second["cluster_resource_id"] = "db-ABCDEF0123456789-1"
	second["database"] = "sbndb_0123456789ab_2f2721a87e9f6c0af16ba7a3"
	second["host"] = "orders.abc123.us-east-1.rds.amazonaws.com"
	second["username"] = "sbndb_0123456789ab_2f2721a87e9f6c0af16ba7a3_runtime"

	firstDescriptor, err := ParseIAMAuthDescriptor(first)
	require.NoError(t, err)
	secondDescriptor, err := ParseIAMAuthDescriptor(second)
	require.NoError(t, err)
	firstPolicy, err := CanonicalIAMSessionPolicy(firstDescriptor)
	require.NoError(t, err)
	secondPolicy, err := CanonicalIAMSessionPolicy(secondDescriptor)
	require.NoError(t, err)
	require.NotEqual(t, firstPolicy, secondPolicy)
}

func TestParseIAMAuthDescriptorValidation(t *testing.T) {
	tests := []struct {
		name        string
		key         string
		value       any
		errorString string
	}{
		{name: "descriptor version", key: "auth_descriptor_version", value: float64(3), errorString: "auth_descriptor_version must be 1 or 2"},
		{name: "fractional descriptor version", key: "auth_descriptor_version", value: 1.5, errorString: "auth_descriptor_version must be 1 or 2"},
		{name: "missing application id", key: "application_id", value: " ", errorString: "application_id missing"},
		{name: "missing binding id", key: "binding_id", value: "", errorString: "binding_id missing"},
		{name: "account id", key: "aws_account_id", value: "123", errorString: "exactly 12 digits"},
		{name: "commercial region only", key: "region", value: "us-gov-west-1", errorString: "not a valid AWS region"},
		{name: "cluster resource id", key: "cluster_resource_id", value: "instance-ABC", errorString: "must start with cluster- or db-"},
		{name: "role arn", key: "connector_role_arn", value: "arn:aws:iam::123456789012:user/not-a-role", errorString: "commercial AWS IAM role ARN"},
		{name: "role partition", key: "connector_role_arn", value: "arn:aws-us-gov:iam::123456789012:role/connector", errorString: "commercial AWS IAM role ARN"},
		{name: "role account", key: "connector_role_arn", value: "arn:aws:iam::210987654321:role/connector", errorString: "account does not match"},
		{name: "database identifier", key: "database", value: "orders", errorString: "database must match"},
		{name: "runtime username", key: "username", value: "ordinary_user", errorString: "username must match"},
		{
			name:        "deployment token mismatch",
			key:         "username",
			value:       "sbndb_fedcba987654_" + validIAMApplicationToken + "_runtime",
			errorString: "deployment tokens do not match",
		},
		{
			name:        "canonical username for another application",
			key:         "username",
			value:       "sbndb_" + validIAMDeploymentToken + "_" + expectedIAMApplicationToken("application-2") + "_runtime",
			errorString: "application token does not match",
		},
		{
			name:        "same-application database for another binding",
			key:         "binding_id",
			value:       "binding-2",
			errorString: "database token does not match",
		},
		{name: "host region", key: "host", value: "orders.cluster-abc123.us-west-2.rds.amazonaws.com", errorString: "RDS hostname in region us-east-1"},
		{name: "custom hostname", key: "host", value: "postgres.example.com", errorString: "RDS hostname in region us-east-1"},
		{name: "China hostname", key: "host", value: "orders.cluster-abc123.us-east-1.rds.amazonaws.com.cn", errorString: "RDS hostname in region us-east-1"},
		{name: "uppercase hostname", key: "host", value: "Orders.cluster-abc123.us-east-1.rds.amazonaws.com", errorString: "lowercase RDS hostname"},
		{name: "invalid hostname label", key: "host", value: "-orders.cluster-abc123.us-east-1.rds.amazonaws.com", errorString: "not a valid RDS hostname"},
		{name: "hostname too long", key: "host", value: strings.Repeat("a", 240) + ".us-east-1.rds.amazonaws.com", errorString: "lowercase RDS hostname"},
		{name: "port", key: "port", value: float64(0), errorString: "integer between 1 and 65535"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			metadata := validIAMMetadata()
			metadata[test.key] = test.value

			_, err := ParseIAMAuthDescriptor(metadata)
			require.ErrorContains(t, err, test.errorString)
		})
	}
}

func TestNewDSNBuilderIAMUsesExactSignerInputsAndPolicy(t *testing.T) {
	var (
		assumePolicy     string
		assumeRoleARN    string
		configRegion     string
		roleSessionName  string
		signerEndpoint   string
		signerRegion     string
		signerUsername   string
		signerCredential aws.CredentialsProvider
	)
	provider := staticCredentialProvider{accessKeyID: "assumed-access-key"}
	build := NewDSNBuilder(DSNOptions{
		ExpectedConnectorRoleARN: validIAMConnectorRoleARN,
		SSLMode:                  sslModeVerifyFull,
		SSLRootCert:              "/etc/rds/global-bundle.pem",
		AWSConfigLoader: func(_ context.Context, region string) (aws.Config, error) {
			configRegion = region
			return aws.Config{Region: region}, nil
		},
		AssumeRoleProviderFactory: func(_ aws.Config, roleARN, sessionName, policy string) (aws.CredentialsProvider, error) {
			assumeRoleARN = roleARN
			roleSessionName = sessionName
			assumePolicy = policy
			return provider, nil
		},
		RDSAuthTokenGenerator: func(_ context.Context, endpoint, region, username string, credentials aws.CredentialsProvider) (string, error) {
			signerEndpoint = endpoint
			signerRegion = region
			signerUsername = username
			signerCredential = credentials
			return "signed-token", nil
		},
	})

	dsn, err := build(context.Background(), TerminalCallback{ConnectionMetadata: validIAMMetadata()})
	require.NoError(t, err)
	parsed, err := url.Parse(dsn)
	require.NoError(t, err)

	assert.Equal(t, "us-east-1", configRegion)
	assert.Equal(t, validIAMConnectorRoleARN, assumeRoleARN)
	assert.Equal(t, "orders.cluster-abc123.us-east-1.rds.amazonaws.com:5432", signerEndpoint)
	assert.Equal(t, "us-east-1", signerRegion)
	assert.Equal(t, validIAMRuntimeUsername, signerUsername)
	assert.Equal(t, provider, signerCredential)
	assert.Equal(t, "verify-full", parsed.Query().Get("sslmode"))
	assert.Equal(t, "/etc/rds/global-bundle.pem", parsed.Query().Get("sslrootcert"))
	assert.Equal(t, "signed-token", mustURLPassword(t, parsed))
	assert.Equal(t, "/"+validIAMDatabase, parsed.Path)
	assert.Equal(
		t,
		`{"Version":"2012-10-17","Statement":[{"Sid":"ConnectToThisNativeDatabaseUser","Effect":"Allow","Action":"rds-db:connect","Resource":"arn:aws:rds-db:us-east-1:123456789012:dbuser:cluster-ABC123DEF456EXAMPLE/sbndb_0123456789ab_135c0d252350f3bba710c990_runtime"}]}`,
		assumePolicy,
	)
	assert.LessOrEqual(t, len(roleSessionName), 64)
	assert.Regexp(t, regexp.MustCompile(`^sb-ndb-[0-9a-f]{32}$`), roleSessionName)
}

func TestNewDSNBuilderIAMSeparatesV2BindingsAndReconstructsPolicies(t *testing.T) {
	var (
		policies     []string
		sessionNames []string
		usernames    []string
	)
	build := NewDSNBuilder(DSNOptions{
		ExpectedConnectorRoleARN: validIAMConnectorRoleARN,
		SSLMode:                  sslModeVerifyFull,
		SSLRootCert:              "/ca.pem",
		AWSConfigLoader: func(context.Context, string) (aws.Config, error) {
			return aws.Config{}, nil
		},
		AssumeRoleProviderFactory: func(_ aws.Config, _ string, sessionName, policy string) (aws.CredentialsProvider, error) {
			policies = append(policies, policy)
			sessionNames = append(sessionNames, sessionName)
			return staticCredentialProvider{accessKeyID: sessionName}, nil
		},
		RDSAuthTokenGenerator: func(_ context.Context, _ string, _ string, username string, _ aws.CredentialsProvider) (string, error) {
			usernames = append(usernames, username)
			return "signed-token", nil
		},
	})
	first := validIAMV2Metadata()
	first["session_policy"] = `{"Statement":[{"Effect":"Allow","Action":"rds-db:connect","Resource":"*"}]}`
	second := validIAMV2Metadata()
	second["binding_id"] = "binding-2"
	second["database"] = "sbndb_0123456789ab_2f2721a87e9f6c0af16ba7a3"
	second["username"] = "sbndb_0123456789ab_2f2721a87e9f6c0af16ba7a3_runtime"

	_, err := build(context.Background(), TerminalCallback{ConnectionMetadata: first})
	require.NoError(t, err)
	_, err = build(context.Background(), TerminalCallback{ConnectionMetadata: second})
	require.NoError(t, err)

	require.Equal(t, []string{validIAMV2Username, "sbndb_0123456789ab_2f2721a87e9f6c0af16ba7a3_runtime"}, usernames)
	require.Equal(t, []string{
		`{"Version":"2012-10-17","Statement":[{"Sid":"ConnectToThisNativeDatabaseUser","Effect":"Allow","Action":"rds-db:connect","Resource":"arn:aws:rds-db:us-east-1:123456789012:dbuser:cluster-ABC123DEF456EXAMPLE/sbndb_0123456789ab_96883863630a181689324e37_runtime"}]}`,
		`{"Version":"2012-10-17","Statement":[{"Sid":"ConnectToThisNativeDatabaseUser","Effect":"Allow","Action":"rds-db:connect","Resource":"arn:aws:rds-db:us-east-1:123456789012:dbuser:cluster-ABC123DEF456EXAMPLE/sbndb_0123456789ab_2f2721a87e9f6c0af16ba7a3_runtime"}]}`,
	}, policies)
	require.Len(t, sessionNames, 2, "binding-specific authorization must create distinct cache entries")
	require.NotEqual(t, sessionNames[0], sessionNames[1], "binding identity must produce distinct role sessions")
}

func TestNewDSNBuilderIAMRequiresVerifyFullAndRootCertificate(t *testing.T) {
	for _, test := range []struct {
		name        string
		options     DSNOptions
		errorString string
	}{
		{name: "require mode", options: DSNOptions{SSLMode: sslModeRequire, SSLRootCert: "/ca.pem"}, errorString: "requires sslmode=verify-full"},
		{name: "missing root", options: DSNOptions{SSLMode: sslModeVerifyFull}, errorString: "requires SSLRootCert"},
	} {
		t.Run(test.name, func(t *testing.T) {
			_, err := NewDSNBuilder(test.options)(context.Background(), TerminalCallback{ConnectionMetadata: validIAMMetadata()})
			require.ErrorContains(t, err, test.errorString)
		})
	}
}

func TestNewDSNBuilderIAMRequiresOperatorConfiguredConnectorRole(t *testing.T) {
	for _, test := range []struct {
		name                     string
		expectedConnectorRoleARN string
		errorString              string
	}{
		{name: "missing expected role", errorString: "requires an operator-configured expected connector role ARN"},
		{
			name:                     "descriptor role mismatch",
			expectedConnectorRoleARN: "arn:aws:iam::123456789012:role/other-connector",
			errorString:              "does not match the operator-configured expected connector role ARN",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			build := NewDSNBuilder(DSNOptions{
				ExpectedConnectorRoleARN: test.expectedConnectorRoleARN,
				SSLMode:                  sslModeVerifyFull,
				SSLRootCert:              "/ca.pem",
				AWSConfigLoader: func(context.Context, string) (aws.Config, error) {
					t.Fatal("AWS config must not be loaded for an untrusted connector role")
					return aws.Config{}, nil
				},
				AssumeRoleProviderFactory: func(aws.Config, string, string, string) (aws.CredentialsProvider, error) {
					t.Fatal("AssumeRole must not be called for an untrusted connector role")
					return nil, nil
				},
			})

			_, err := build(context.Background(), TerminalCallback{ConnectionMetadata: validIAMMetadata()})
			require.ErrorContains(t, err, test.errorString)
		})
	}
}

func TestIAMCredentialCacheSeparatesFullAuthorizationTuple(t *testing.T) {
	base := iamAuthorizationCacheKey{
		AWSAccountID:      "123456789012",
		ClusterResourceID: "cluster-A",
		ConnectorRoleARN:  "arn:aws:iam::123456789012:role/connector",
		PolicyDigest:      strings.Repeat("a", 64),
		Region:            "us-east-1",
		Username:          "sbndb_a_runtime",
	}
	keys := []iamAuthorizationCacheKey{
		base,
		func() iamAuthorizationCacheKey { key := base; key.AWSAccountID = "210987654321"; return key }(),
		func() iamAuthorizationCacheKey { key := base; key.ClusterResourceID = "cluster-B"; return key }(),
		func() iamAuthorizationCacheKey { key := base; key.ConnectorRoleARN += "-other"; return key }(),
		func() iamAuthorizationCacheKey { key := base; key.PolicyDigest = strings.Repeat("b", 64); return key }(),
		func() iamAuthorizationCacheKey { key := base; key.Region = "us-west-2"; return key }(),
		func() iamAuthorizationCacheKey { key := base; key.Username = "sbndb_b_runtime"; return key }(),
	}

	cache := newIAMCredentialCache()
	createCalls := 0
	for index, key := range keys {
		provider, err := cache.getOrCreate(key, func() (aws.CredentialsProvider, error) {
			createCalls++
			return staticCredentialProvider{accessKeyID: fmt.Sprintf("key-%d", index)}, nil
		})
		require.NoError(t, err)
		credentials, err := provider.Retrieve(context.Background())
		require.NoError(t, err)
		require.Equal(t, fmt.Sprintf("key-%d", index), credentials.AccessKeyID)
	}
	_, err := cache.getOrCreate(base, func() (aws.CredentialsProvider, error) {
		t.Fatal("cached provider should be reused")
		return nil, nil
	})
	require.NoError(t, err)
	require.Equal(t, len(keys), createCalls)
	require.Len(t, cache.providers, len(keys))
}

func TestIAMCredentialCacheInitializesDifferentAuthorizationTuplesConcurrently(t *testing.T) {
	cache := newIAMCredentialCache()
	firstKey := iamAuthorizationCacheKey{AWSAccountID: "123456789012", Username: "first"}
	secondKey := iamAuthorizationCacheKey{AWSAccountID: "123456789012", Username: "second"}
	firstStarted := make(chan struct{})
	releaseFirst := make(chan struct{})
	firstDone := make(chan error, 1)
	go func() {
		_, err := cache.getOrCreate(firstKey, func() (aws.CredentialsProvider, error) {
			close(firstStarted)
			<-releaseFirst
			return staticCredentialProvider{accessKeyID: "first"}, nil
		})
		firstDone <- err
	}()
	<-firstStarted

	secondDone := make(chan error, 1)
	go func() {
		_, err := cache.getOrCreate(secondKey, func() (aws.CredentialsProvider, error) {
			return staticCredentialProvider{accessKeyID: "second"}, nil
		})
		secondDone <- err
	}()

	select {
	case err := <-secondDone:
		require.NoError(t, err)
	case <-time.After(time.Second):
		t.Fatal("initializing one authorization tuple blocked an unrelated tuple")
	}
	close(releaseFirst)
	require.NoError(t, <-firstDone)
}

func TestIAMCredentialCacheSharesConcurrentInitializationForSameAuthorizationTuple(t *testing.T) {
	cache := newIAMCredentialCache()
	key := iamAuthorizationCacheKey{AWSAccountID: "123456789012", Username: "shared"}
	firstStarted := make(chan struct{})
	releaseFirst := make(chan struct{})
	firstDone := make(chan aws.CredentialsProvider, 1)
	go func() {
		provider, _ := cache.getOrCreate(key, func() (aws.CredentialsProvider, error) {
			close(firstStarted)
			<-releaseFirst
			return staticCredentialProvider{accessKeyID: "shared"}, nil
		})
		firstDone <- provider
	}()
	<-firstStarted

	duplicateCreate := make(chan struct{}, 1)
	secondDone := make(chan aws.CredentialsProvider, 1)
	go func() {
		provider, _ := cache.getOrCreate(key, func() (aws.CredentialsProvider, error) {
			duplicateCreate <- struct{}{}
			return staticCredentialProvider{accessKeyID: "duplicate"}, nil
		})
		secondDone <- provider
	}()

	select {
	case <-duplicateCreate:
		t.Fatal("same authorization tuple initialized more than once")
	case <-secondDone:
		t.Fatal("same authorization tuple returned before its initialization completed")
	case <-time.After(100 * time.Millisecond):
	}
	close(releaseFirst)
	require.Equal(t, <-firstDone, <-secondDone)
}

func TestNewDSNBuilderIAMDoesNotPersistAuthTokens(t *testing.T) {
	factoryCalls := 0
	tokenCalls := 0
	build := NewDSNBuilder(DSNOptions{
		ExpectedConnectorRoleARN: validIAMConnectorRoleARN,
		SSLMode:                  sslModeVerifyFull,
		SSLRootCert:              "/ca.pem",
		AWSConfigLoader: func(context.Context, string) (aws.Config, error) {
			return aws.Config{}, nil
		},
		AssumeRoleProviderFactory: func(aws.Config, string, string, string) (aws.CredentialsProvider, error) {
			factoryCalls++
			return staticCredentialProvider{accessKeyID: "assumed"}, nil
		},
		RDSAuthTokenGenerator: func(context.Context, string, string, string, aws.CredentialsProvider) (string, error) {
			tokenCalls++
			return fmt.Sprintf("single-use-token-%d", tokenCalls), nil
		},
	})

	first, err := build(context.Background(), TerminalCallback{ConnectionMetadata: validIAMMetadata()})
	require.NoError(t, err)
	second, err := build(context.Background(), TerminalCallback{ConnectionMetadata: validIAMMetadata()})
	require.NoError(t, err)

	firstURL, err := url.Parse(first)
	require.NoError(t, err)
	secondURL, err := url.Parse(second)
	require.NoError(t, err)
	require.Equal(t, "single-use-token-1", mustURLPassword(t, firstURL))
	require.Equal(t, "single-use-token-2", mustURLPassword(t, secondURL))
	require.Equal(t, 1, factoryCalls, "assumed credentials should be cached")
	require.Equal(t, 2, tokenCalls, "tokens must be freshly generated and never cached")
}

func mustURLPassword(t *testing.T, parsed *url.URL) string {
	t.Helper()
	password, ok := parsed.User.Password()
	require.True(t, ok)
	return password
}
