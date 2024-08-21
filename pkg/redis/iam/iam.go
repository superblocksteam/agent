package iam

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	signer "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"go.uber.org/zap"
)

var (
	emptyBodySha256 = fmt.Sprintf("%x", sha256.Sum256([]byte("")))
)

type Signer interface {
	PresignHTTP(ctx context.Context, credentials aws.Credentials, r *http.Request, payloadHash string, service string, region string, signingTime time.Time, optFns ...func(*signer.SignerOptions)) (signedURI string, signedHeaders http.Header, err error)
}

// New returns a |redis.CredentialProvider| (returns (username, password)).
func New(log *zap.Logger, cacheName, username, region string, cp aws.CredentialsProvider, options ...Option) (func() (string, string), error) {
	log = log.Named("redis/iam")

	config := &config{
		ctx:    context.Background(),
		now:    time.Now,
		signer: signer.NewSigner(),
	}
	for _, opt := range options {
		opt(config)
	}
	ctx := config.ctx

	query := url.Values{
		"Action":        {"connect"},
		"User":          {username},
		"X-Amz-Expires": {strconv.FormatInt(int64(899), 10)},
	}
	u := url.URL{
		Scheme:   "http",
		Host:     cacheName,
		Path:     "/",
		RawQuery: query.Encode(),
	}
	req, err := http.NewRequest(http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("cannot create request to sign for redis/iam: %w", err)
	}

	return func() (string, string) {
		var credentials aws.Credentials
		var err error

		for ctx.Err() == nil {
			credentials, err = cp.Retrieve(ctx)
			if err != nil {
				log.Error("CredentialProvider.Retrieve error", zap.Error(err))

				// don't busy retry too fast
				time.Sleep(time.Millisecond)
				continue
			}
			break
		}

		var uri string
		for ctx.Err() == nil {
			uri, _, err = config.signer.PresignHTTP(
				ctx,
				credentials,
				req,
				emptyBodySha256,
				"elasticache",
				region,
				config.now(),
			)
			if err != nil {
				log.Error("signer.PresignHTTP error", zap.Error(err))

				// don't busy retry too fast
				time.Sleep(time.Millisecond)
				continue
			}
			break
		}

		return username, strings.TrimPrefix(uri, "http://")
	}, nil
}
