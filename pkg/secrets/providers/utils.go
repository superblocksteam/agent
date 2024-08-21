package providers

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/client"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/credentials/stscreds"
	"github.com/aws/aws-sdk-go/aws/session"

	"github.com/superblocksteam/agent/pkg/secrets/errors"
	"github.com/superblocksteam/agent/pkg/secrets/options"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
)

func InitAws[T any](new func(client.ConfigProvider, ...*aws.Config) *T, config *commonv1.AwsAuth, ops ...options.Option) (_ *T, err error) {

	var sess *session.Session
	var configs []*aws.Config
	{
		switch config.GetConfig().(type) {
		case *commonv1.AwsAuth_Static_:
			key := config.GetStatic().GetAccessKeyId()
			secret := config.GetStatic().GetSecretAccessKey()

			sess, err = session.NewSession(&aws.Config{
				Region:      aws.String(config.GetRegion()),
				Credentials: credentials.NewStaticCredentials(key, secret, ""),
			})
			if err != nil {
				return nil, err
			}
		case *commonv1.AwsAuth_AssumeRole_:
			sess, err = session.NewSession(&aws.Config{
				Region: aws.String(options.Apply(ops...).Region),
			})
			if err != nil {
				return nil, err
			}

			configs = append(configs, &aws.Config{
				Credentials: stscreds.NewCredentials(sess, config.GetAssumeRole().GetRoleArn()),
				Region:      aws.String(config.GetRegion()),
			})
		default:
			return nil, errors.ErrUnknownAuthMethod
		}
	}

	return new(sess, configs...), nil
}

func IsAwsAuthError(err error) bool {
	if _, ok := err.(awserr.Error); !ok {
		return false
	}

	switch err.(awserr.Error).Code() {
	case "AccessDenied", "ExpiredToken", "NoCredentialProviders", "InvalidClientTokenId", "UnrecognizedClientException", "AccessDeniedException":
		// https://github.com/aws/aws-sdk-go/issues/4023#issue-951634453
		return true
	}

	return false
}
