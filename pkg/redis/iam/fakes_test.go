package iam

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	signer "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
)

type fakeAwsCredentialProvider struct {
	mu  sync.Mutex
	err error
}

func newFakeAwsCredentialProvider() *fakeAwsCredentialProvider {
	return &fakeAwsCredentialProvider{}
}

func (f *fakeAwsCredentialProvider) Retrieve(ctx context.Context) (aws.Credentials, error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.err != nil {
		return aws.Credentials{}, f.err
	}

	return aws.Credentials{
		AccessKeyID:     "fake-access-key-id",
		SecretAccessKey: "fake-secret-access-key",
		SessionToken:    "fake-session-token",
		Source:          "fake",
		CanExpire:       false,
	}, nil
}

func (f *fakeAwsCredentialProvider) SetErrRetrieve(err error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.err = err
}

type fakeSigner struct {
	mu  sync.Mutex
	err error
}

func newFakeSigner() *fakeSigner {
	return &fakeSigner{}
}

func (f *fakeSigner) PresignHTTP(ctx context.Context, credentials aws.Credentials, r *http.Request, payloadHash string, service string, region string, signingTime time.Time, optFns ...func(*signer.SignerOptions)) (signedURI string, signedHeaders http.Header, err error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.err != nil {
		return "", nil, f.err
	}

	return "http://" + validPassword, nil, nil
}

func (f *fakeSigner) SetErrPresignHTTP(err error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.err = err
}
