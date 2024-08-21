package iam

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest"
)

const (
	validPassword = "redis/?Action=connect&User=default&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=fake-access-key-id%2F00010101%2Fus-west-2%2Felasticache%2Faws4_request&X-Amz-Date=00010101T000000Z&X-Amz-Expires=899&X-Amz-Security-Token=fake-session-token&X-Amz-SignedHeaders=host&X-Amz-Signature=5ab925518d1490e04f355fcf2f3207cd9e1b7b23f3add1cd76e815383802315a"
)

var (
	broken = errors.New("broken")
)

type args struct {
	log       *zap.Logger
	cacheName string
	username  string
	region    string
	cp        *fakeAwsCredentialProvider
	options   []Option
}

func validArgs(t *testing.T) *args {
	return &args{
		log:       zaptest.NewLogger(t),
		cacheName: "redis",
		username:  "default",
		region:    "us-west-2",
		cp:        newFakeAwsCredentialProvider(),
		options: []Option{
			WithNow(func() time.Time {
				return time.Time{}
			}),
		},
	}
}

func verifyNew(t *testing.T, args *args, expectErr string) func() (string, string) {
	f, err := New(args.log, args.cacheName, args.username, args.region, args.cp, args.options...)
	if expectErr == "" {
		require.NoError(t, err)
	} else {
		require.EqualError(t, err, expectErr)
		return nil
	}

	return f
}

func verifyCp(t *testing.T, args *args, cp func() (string, string)) {
	username, password := cp()
	require.Equal(t, args.username, username)
	require.Equal(t, validPassword, password)
}

func verifyRecovery(t *testing.T, args *args, cp func() (string, string), f func()) {
	done := make(chan struct{})
	go func() {
		defer close(done)
		verifyCp(t, args, cp)
	}()

	select {
	case <-done:
		t.Fatal("CredentialProvider.Retrieve error returned in error")
	case <-time.After(100 * time.Millisecond):
	}

	f()

	select {
	case <-done:
	case <-time.After(100 * time.Millisecond):
		t.Fatal("timed out waiting for recovery")
	}
}

func TestNew(t *testing.T) {
	t.Parallel()
	args := validArgs(t)
	cp := verifyNew(t, args, "")
	verifyCp(t, args, cp)
}

func TestNewCtxCancelationIsRespected(t *testing.T) {
	t.Parallel()
	args := validArgs(t)
	ctx, cancel := context.WithCancel(context.Background())
	args.options = append(args.options, WithCtx(ctx))
	cp := verifyNew(t, args, "")
	cancel()

	username, password := cp()
	require.Equal(t, args.username, username)
	require.Equal(t, "", password)
}

func TestNewErrInvalidCacheName(t *testing.T) {
	t.Parallel()
	args := validArgs(t)
	args.cacheName = "!?!??"
	verifyNew(t, args, `cannot create request to sign for redis/iam: parse "http://!%3F!%3F%3F/?Action=connect&User=default&X-Amz-Expires=899": invalid URL escape "%3F"`)
}

func TestNewRetrieveErrsThenRecover(t *testing.T) {
	t.Parallel()
	args := validArgs(t)
	args.cp.SetErrRetrieve(broken)
	cp := verifyNew(t, args, "")

	verifyRecovery(t, args, cp, func() {
		args.cp.SetErrRetrieve(nil)
	})
}

func TestNewSignerErrsThenRecover(t *testing.T) {
	t.Parallel()
	args := validArgs(t)
	signer := newFakeSigner()
	signer.SetErrPresignHTTP(broken)
	args.options = append(args.options, WithSigner(signer))

	cp := verifyNew(t, args, "")

	verifyRecovery(t, args, cp, func() {
		signer.SetErrPresignHTTP(nil)
	})
}
