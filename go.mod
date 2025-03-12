module github.com/superblocksteam/agent

go 1.23.7

require (
	buf.build/gen/go/bufbuild/protovalidate/protocolbuffers/go v1.34.2-20240508200655-46a4cf4ba109.2
	cloud.google.com/go/secretmanager v1.14.2
	github.com/akeylesslabs/akeyless-go/v4 v4.2.1
	github.com/avast/retry-go v3.0.0+incompatible
	github.com/aws/aws-sdk-go v1.55.5
	github.com/aws/aws-sdk-go-v2 v1.30.5
	github.com/aws/aws-sdk-go-v2/config v1.27.33
	github.com/bufbuild/protovalidate-go v0.6.3
	github.com/buger/jsonparser v1.1.1
	github.com/cenkalti/backoff v2.2.1+incompatible
	github.com/cloudevents/sdk-go/v2 v2.15.2
	github.com/confluentinc/confluent-kafka-go/v2 v2.8.0
	github.com/evanw/esbuild v0.20.2
	github.com/go-redis/redismock/v9 v9.2.0
	github.com/gofrs/uuid/v5 v5.1.0
	github.com/golang-jwt/jwt/v4 v4.5.0
	github.com/golang-jwt/jwt/v5 v5.2.1
	github.com/golang/protobuf v1.5.4
	github.com/google/go-cmp v0.6.0
	github.com/google/uuid v1.6.0
	github.com/googleapis/gax-go/v2 v2.13.0
	github.com/grpc-ecosystem/go-grpc-middleware v1.4.0
	github.com/grpc-ecosystem/go-grpc-middleware/v2 v2.1.0
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.19.1
	github.com/hashicorp/vault-client-go v0.4.3
	github.com/jonboulle/clockwork v0.4.0
	github.com/launchdarkly/go-sdk-common/v3 v3.1.0
	github.com/launchdarkly/go-server-sdk/v7 v7.8.0
	github.com/lestrrat-go/jwx/v2 v2.0.21
	github.com/pkg/errors v0.9.1
	github.com/pkoukk/tiktoken-go v0.1.7
	github.com/prometheus/client_golang v1.19.1
	github.com/redis/go-redis/v9 v9.6.1
	github.com/rs/cors v1.11.1
	github.com/samber/slog-zap/v2 v2.4.0
	github.com/sashabaranov/go-openai v1.22.0
	github.com/spf13/pflag v1.0.5
	github.com/spf13/viper v1.16.0
	github.com/stretchr/testify v1.9.0
	github.com/superblocksteam/run v0.0.7
	github.com/thejerf/abtime v1.0.7
	github.com/titanous/json5 v1.0.0
	go.kuoruan.net/v8go-polyfills v0.5.0
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.54.0
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.54.0
	go.opentelemetry.io/otel v1.29.0
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp v1.24.0
	go.opentelemetry.io/otel/exporters/stdout/stdouttrace v1.24.0
	go.opentelemetry.io/otel/sdk v1.29.0
	go.opentelemetry.io/otel/trace v1.29.0
	go.uber.org/fx v1.21.1
	go.uber.org/zap v1.27.0
	golang.org/x/sync v0.10.0
	google.golang.org/api v0.203.0
	google.golang.org/genproto/googleapis/api v0.0.0-20241007155032-5fefd90f89a9
	google.golang.org/grpc v1.67.1
	google.golang.org/protobuf v1.35.1
	k8s.io/apimachinery v0.29.3
	rogchap.com/v8go v0.9.0
)

require (
	cloud.google.com/go/auth v0.9.9 // indirect
	cloud.google.com/go/auth/oauth2adapt v0.2.4 // indirect
	cloud.google.com/go/compute/metadata v0.5.2 // indirect
	cloud.google.com/go/iam v1.2.1 // indirect
	github.com/antlr4-go/antlr/v4 v4.13.0 // indirect
	github.com/containerd/containerd/api v1.7.19 // indirect
	github.com/decred/dcrd/dcrec/secp256k1/v4 v4.2.0 // indirect
	github.com/felixge/httpsnoop v1.0.4 // indirect
	github.com/go-ole/go-ole v1.2.6 // indirect
	github.com/goccy/go-json v0.10.2 // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/google/s2a-go v0.1.8 // indirect
	github.com/googleapis/enterprise-certificate-proxy v0.3.4 // indirect
	github.com/hashicorp/go-retryablehttp v0.7.7 // indirect
	github.com/hashicorp/go-rootcerts v1.0.2 // indirect
	github.com/hashicorp/go-secure-stdlib/strutil v0.1.2 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/launchdarkly/go-jsonstream/v3 v3.1.0 // indirect
	github.com/launchdarkly/go-sdk-events/v3 v3.4.0 // indirect
	github.com/launchdarkly/go-server-sdk-evaluation/v3 v3.0.1 // indirect
	github.com/lestrrat-go/blackmagic v1.0.2 // indirect
	github.com/lestrrat-go/httpcc v1.0.1 // indirect
	github.com/lestrrat-go/httprc v1.0.5 // indirect
	github.com/lestrrat-go/iter v1.0.2 // indirect
	github.com/lestrrat-go/option v1.0.1 // indirect
	github.com/mitchellh/go-homedir v1.1.0 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/pelletier/go-toml v1.9.5 // indirect
	github.com/rogpeppe/go-internal v1.11.0 // indirect
	github.com/ryanuber/go-glob v1.0.0 // indirect
	github.com/samber/lo v1.38.1 // indirect
	github.com/samber/slog-common v0.16.0 // indirect
	github.com/segmentio/asm v1.2.0 // indirect
	github.com/spf13/jwalterweatherman v1.1.0 // indirect
	github.com/tklauser/go-sysconf v0.3.12 // indirect
	github.com/tklauser/numcpus v0.6.1 // indirect
	github.com/yusufpapurcu/wmi v1.2.3 // indirect
	go.opencensus.io v0.24.0 // indirect
	go.opentelemetry.io/otel/metric v1.29.0 // indirect
	go.uber.org/dig v1.17.1 // indirect
	golang.org/x/crypto v0.31.0 // indirect
	golang.org/x/oauth2 v0.28.0 // indirect
	golang.org/x/time v0.7.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20241015192408-796eee8c2d53 // indirect
	k8s.io/klog/v2 v2.110.1 // indirect
	k8s.io/utils v0.0.0-20230726121419-3b25d923346b // indirect
)

require (
	github.com/aws/aws-sdk-go-v2/credentials v1.17.32 // indirect
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.16.13
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.3.17 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.6.17 // indirect
	github.com/aws/aws-sdk-go-v2/internal/ini v1.8.1 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.11.4 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.11.19 // indirect
	github.com/aws/aws-sdk-go-v2/service/sso v1.22.7 // indirect
	github.com/aws/aws-sdk-go-v2/service/ssooidc v1.26.7 // indirect
	github.com/aws/aws-sdk-go-v2/service/sts v1.30.7 // indirect
	github.com/aws/smithy-go v1.20.4 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/cenkalti/backoff/v4 v4.3.0
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/dlclark/regexp2 v1.10.0 // indirect
	github.com/envoyproxy/protoc-gen-validate v1.1.0
	github.com/fsnotify/fsnotify v1.7.0 // indirect
	github.com/go-logr/logr v1.4.2
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/google/cel-go v0.20.1 // indirect
	github.com/gregjones/httpcache v0.0.0-20180305231024-9cad4c3443a7 // indirect
	github.com/hashicorp/go-cleanhttp v0.5.2 // indirect
	github.com/hashicorp/hcl v1.0.0 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/launchdarkly/ccache v1.1.0 // indirect
	github.com/launchdarkly/eventsource v1.6.2 // indirect
	github.com/launchdarkly/go-semver v1.0.3 // indirect
	github.com/magiconair/properties v1.8.7 // indirect
	github.com/mailru/easyjson v0.7.7 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/patrickmn/go-cache v2.1.0+incompatible // indirect
	github.com/pmezard/go-difflib v1.0.1-0.20181226105442-5d4384ee4fb2 // indirect
	github.com/prometheus/client_model v0.6.1
	github.com/prometheus/common v0.48.0 // indirect
	github.com/prometheus/procfs v0.12.0 // indirect
	github.com/shirou/gopsutil v3.21.11+incompatible
	github.com/spf13/afero v1.11.0 // indirect
	github.com/spf13/cast v1.6.0 // indirect
	github.com/stoewer/go-strcase v1.3.0 // indirect
	github.com/stretchr/objx v0.5.2 // indirect
	github.com/subosito/gotenv v1.6.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlptrace v1.24.0 // indirect
	go.opentelemetry.io/proto/otlp v1.1.0 // indirect
	go.uber.org/multierr v1.11.0 // indirect
	golang.org/x/exp v0.0.0-20240808152545-0cdaa3abc0fa // indirect
	golang.org/x/net v0.30.0 // indirect
	golang.org/x/sys v0.28.0 // indirect
	golang.org/x/text v0.21.0
	google.golang.org/genproto v0.0.0-20241015192408-796eee8c2d53 // indirect
	gopkg.in/ghodss/yaml.v1 v1.0.0 // indirect
	gopkg.in/ini.v1 v1.67.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

replace (
	// CVE-2023-25153
	// CVE-2022-23471
	// CVE-2023-25173
	github.com/containerd/containerd => github.com/containerd/containerd v1.7.20
	// CVE-2023-2253
	github.com/docker/distribution/v2 => github.com/docker/distribution/v2 v2.8.3
	// CVE-2023-28840
	github.com/docker/docker v20.10.17+incompatible => github.com/docker/docker v20.10.24+incompatible
	// CVE-2024-6104
	github.com/hashicorp/go-retryablehttp v0.7.4 => github.com/hashicorp/go-retryablehttp v0.7.7
	// CVE-2023-46129
	github.com/nats-io/nkeys => github.com/nats-io/nkeys v0.4.7
	// CVE-2023-28642
	github.com/opencontainers/runc v1.1.3 => github.com/opencontainers/runc v1.1.5
)

replace github.com/spf13/viper => github.com/spf13/viper v1.7.0
