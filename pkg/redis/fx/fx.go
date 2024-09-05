package redisfx

import (
	"context"
	"crypto/tls"
	"fmt"
	"time"

	redisiam "github.com/superblocksteam/agent/pkg/redis/iam"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/ec2/imds"
	"github.com/redis/go-redis/v9"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("redis",
	fx.Provide(
		provideDefaults,
		New,
	),
)

func init() {
	var awsCurrentRegion string

	func() {
		ctx := context.Background()
		cfg, err := config.LoadDefaultConfig(ctx)
		if err != nil {
			return
		}

		client := imds.NewFromConfig(cfg)

		regionOut, err := client.GetRegion(ctx, &imds.GetRegionInput{})
		if err != nil {
			return
		}

		awsCurrentRegion = regionOut.Region
	}()

	//
	// defaults are for local dev; production must set specific details
	// in the deployment config
	//
	pflag.String("redis.aws.elasticache.name", "", "name of the elasticache instance")
	pflag.Bool("redis.aws.iam", awsCurrentRegion != "", "enable AWS IAM authentication with redis (default on in EC2)")
	pflag.String("redis.aws.region", awsCurrentRegion, "AWS region to use (defaults to current region in EC2)")
	pflag.String("redis.host", "127.0.0.1", "")
	pflag.Int("redis.port", 6379, "")
	pflag.Int("redis.pool.min", 5, "")
	pflag.Int("redis.pool.max", 10, "")
	pflag.Duration("redis.timeout.dial", 5*time.Second, "")
	pflag.Duration("redis.timeout.read", 5*time.Minute, "")
	pflag.Duration("redis.timeout.write", 10*time.Second, "")
	pflag.Duration("redis.timeout.pool", 5*time.Minute, "")
	pflag.String("redis.username", "default", "")
	pflag.String("redis.password", "koala", "")
	pflag.Bool("redis.tls", false, "")
	pflag.String("redis.servername", "", "")
}

func provideDefaults(lc fx.Lifecycle, log *zap.Logger) (*redis.Options, error) {
	options := &redis.Options{
		Addr:         fmt.Sprintf("%s:%d", viper.GetString("redis.host"), viper.GetInt("redis.port")),
		Username:     viper.GetString("redis.username"),
		Password:     viper.GetString("redis.password"),
		DB:           0,
		PoolSize:     viper.GetInt("redis.pool.max"),
		MinIdleConns: viper.GetInt("redis.pool.min"),
		DialTimeout:  viper.GetDuration("redis.timeout.dial"),
		ReadTimeout:  viper.GetDuration("redis.timeout.read"),
		WriteTimeout: viper.GetDuration("redis.timeout.write"),
		PoolTimeout:  viper.GetDuration("redis.timeout.pool"),
	}

	if viper.GetBool("redis.aws.iam") {
		// using iam password authn
		options.Password = ""

		ctx, cancel := context.WithCancel(context.Background())
		lc.Append(fx.Hook{
			OnStop: func(ctx context.Context) error {
				cancel()
				return nil
			},
		})

		region := viper.GetString("redis.aws.region")
		cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
		if err != nil {
			return nil, fmt.Errorf("cannot aws load config: %w", err)
		}

		cacheName := viper.GetString("redis.aws.elasticache.name")
		if cacheName == "" {
			return nil, fmt.Errorf("redis.aws.elasticache.name required with redis.aws.iam=true")
		}

		cp, err := redisiam.New(log, cacheName, options.Username, region, cfg.Credentials,
			redisiam.WithCtx(ctx),
		)
		if err != nil {
			return nil, fmt.Errorf("cannot create redisiam credential provider: %w", err)
		}

		options.CredentialsProvider = cp
	}

	if viper.GetBool("redis.tls") {
		options.TLSConfig = &tls.Config{
			ServerName: viper.GetString("redis.servername"),
		}
	}

	return options, nil
}

func New(log *zap.Logger, options *redis.Options) *redis.Client {
	log = log.Named("redis")

	client := redis.NewClient(options)

	ctx := context.Background()

	// explicitly do not return err due to this initial bootup; redis may be
	// temporarily unavailable during startup and this runtime should not be
	// torn down as a result of that
	//
	// this is useful sanity checking that redis is configured correctly
	// only for manual inspection
	info, err := client.Info(ctx).Result()
	log.Info("redis client info",
		zap.String("info", info),
		zap.Error(err),
	)

	return client
}
