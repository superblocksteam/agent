package databaselifecycle

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net"
	"net/url"
	"strconv"
	"strings"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials/stscreds"
	"github.com/aws/aws-sdk-go-v2/feature/rds/auth"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

type AWSConfigLoader func(context.Context, string) (aws.Config, error)

type AssumeRoleProviderFactory func(aws.Config, string, string, string) (aws.CredentialsProvider, error)

type RDSAuthTokenGenerator func(context.Context, string, string, string, aws.CredentialsProvider) (string, error)

type iamAuthorizationCacheKey struct {
	AWSAccountID      string
	ClusterResourceID string
	ConnectorRoleARN  string
	PolicyDigest      string
	Region            string
	Username          string
}

type iamCredentialCache struct {
	mu           sync.Mutex
	initializing map[iamAuthorizationCacheKey]*iamCredentialCacheCall
	providers    map[iamAuthorizationCacheKey]aws.CredentialsProvider
}

type iamCredentialCacheCall struct {
	done     chan struct{}
	err      error
	provider aws.CredentialsProvider
}

func newIAMCredentialCache() *iamCredentialCache {
	return &iamCredentialCache{
		initializing: make(map[iamAuthorizationCacheKey]*iamCredentialCacheCall),
		providers:    make(map[iamAuthorizationCacheKey]aws.CredentialsProvider),
	}
}

func (cache *iamCredentialCache) getOrCreate(key iamAuthorizationCacheKey, create func() (aws.CredentialsProvider, error)) (aws.CredentialsProvider, error) {
	cache.mu.Lock()
	if provider, ok := cache.providers[key]; ok {
		cache.mu.Unlock()
		return provider, nil
	}
	if call, ok := cache.initializing[key]; ok {
		cache.mu.Unlock()
		<-call.done
		return call.provider, call.err
	}
	call := &iamCredentialCacheCall{done: make(chan struct{})}
	cache.initializing[key] = call
	cache.mu.Unlock()

	provider, err := create()
	if err == nil && provider == nil {
		err = errors.New("databaselifecycle: AssumeRoleProviderFactory returned nil credentials provider")
	}

	cache.mu.Lock()
	if err == nil {
		cache.providers[key] = provider
	}
	delete(cache.initializing, key)
	call.provider = provider
	call.err = err
	close(call.done)
	cache.mu.Unlock()
	return provider, err
}

func withDefaultIAMDependencies(opts DSNOptions) DSNOptions {
	if opts.AWSConfigLoader == nil {
		opts.AWSConfigLoader = func(ctx context.Context, region string) (aws.Config, error) {
			loaded, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
			if err != nil {
				return aws.Config{}, fmt.Errorf("load AWS config for IAM database authentication: %w", err)
			}
			return loaded, nil
		}
	}
	if opts.AssumeRoleProviderFactory == nil {
		opts.AssumeRoleProviderFactory = func(cfg aws.Config, roleARN, roleSessionName, sessionPolicy string) (aws.CredentialsProvider, error) {
			provider := stscreds.NewAssumeRoleProvider(sts.NewFromConfig(cfg), roleARN, func(options *stscreds.AssumeRoleOptions) {
				options.Policy = aws.String(sessionPolicy)
				options.RoleSessionName = roleSessionName
			})
			return aws.NewCredentialsCache(provider), nil
		}
	}
	if opts.RDSAuthTokenGenerator == nil {
		opts.RDSAuthTokenGenerator = func(
			ctx context.Context,
			endpoint, region, username string,
			credentials aws.CredentialsProvider,
		) (string, error) {
			return auth.BuildAuthToken(ctx, endpoint, region, username, credentials)
		}
	}
	return opts
}

func buildIAMDSNFromCallback(
	ctx context.Context,
	callback TerminalCallback,
	opts DSNOptions,
	cache *iamCredentialCache,
) (string, error) {
	if opts.SSLMode != sslModeVerifyFull {
		return "", fmt.Errorf("databaselifecycle: auth_mode=%s requires sslmode=%s", iamAuthMode, sslModeVerifyFull)
	}
	if opts.SSLRootCert == "" {
		return "", fmt.Errorf("databaselifecycle: auth_mode=%s requires SSLRootCert", iamAuthMode)
	}

	descriptor, err := ParseIAMAuthDescriptor(callback.ConnectionMetadata)
	if err != nil {
		return "", err
	}
	if opts.ExpectedConnectorRoleARN == "" {
		return "", errors.New("databaselifecycle: IAM database authentication requires an operator-configured expected connector role ARN")
	}
	if descriptor.ConnectorRoleARN != opts.ExpectedConnectorRoleARN {
		return "", errors.New("connection_metadata.connector_role_arn does not match the operator-configured expected connector role ARN")
	}
	sessionPolicy, err := CanonicalIAMSessionPolicy(descriptor)
	if err != nil {
		return "", err
	}
	policyDigest := iamSessionPolicyDigest(sessionPolicy)
	cacheKey := iamAuthorizationCacheKey{
		AWSAccountID:      descriptor.AWSAccountID,
		ClusterResourceID: descriptor.ClusterResourceID,
		ConnectorRoleARN:  descriptor.ConnectorRoleARN,
		PolicyDigest:      policyDigest,
		Region:            descriptor.Region,
		Username:          descriptor.Username,
	}
	provider, err := cache.getOrCreate(cacheKey, func() (aws.CredentialsProvider, error) {
		cfg, loadErr := opts.AWSConfigLoader(ctx, descriptor.Region)
		if loadErr != nil {
			return nil, loadErr
		}
		return opts.AssumeRoleProviderFactory(
			cfg,
			descriptor.ConnectorRoleARN,
			iamRoleSessionName(descriptor, policyDigest),
			sessionPolicy,
		)
	})
	if err != nil {
		return "", fmt.Errorf("initialize IAM database credentials: %w", err)
	}

	endpoint := net.JoinHostPort(descriptor.Host, strconv.Itoa(descriptor.Port))
	token, err := opts.RDSAuthTokenGenerator(ctx, endpoint, descriptor.Region, descriptor.Username, provider)
	if err != nil {
		return "", fmt.Errorf("generate RDS IAM database auth token: %w", err)
	}
	if token == "" {
		return "", errors.New("generate RDS IAM database auth token: token is empty")
	}

	dsn := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(descriptor.Username, token),
		Host:   endpoint,
		Path:   "/" + descriptor.Database,
	}
	query := dsn.Query()
	query.Set("sslmode", sslModeVerifyFull)
	query.Set("sslrootcert", opts.SSLRootCert)
	dsn.RawQuery = query.Encode()
	return dsn.String(), nil
}

func iamRoleSessionName(descriptor IAMAuthDescriptor, policyDigest string) string {
	components := []string{
		descriptor.ApplicationID,
		descriptor.BindingID,
		descriptor.ConnectorRoleARN,
		descriptor.AWSAccountID,
		descriptor.Region,
		descriptor.ClusterResourceID,
		descriptor.Username,
		policyDigest,
	}
	digest := sha256.Sum256([]byte(strings.Join(components, "\x00")))
	return "sb-ndb-" + hex.EncodeToString(digest[:16])
}
