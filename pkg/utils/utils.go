package utils

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"math/rand"
	"reflect"
	"strconv"
	"strings"

	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/observability"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	integrationv1 "github.com/superblocksteam/agent/types/gen/go/integration/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/encoding/protojson"
)

func Unwrap(template string) (string, error) {
	if !strings.HasPrefix(template, "{{") || !strings.HasSuffix(template, "}}") {
		return "", fmt.Errorf("binding (%s) must be wrapped with {{ <expression> }}", template)
	}

	return IdempotentUnwrap(template), nil
}

func IdempotentUnwrap(template string) string {
	template = strings.TrimPrefix(template, "{{")
	template = strings.TrimSuffix(template, "}}")
	return strings.TrimSpace(template)
}

func IsTemplate(template string) bool {
	if !strings.Contains(template, "{{") {
		return false
	}

	if !strings.Contains(template, "}}") {
		return false
	}

	return true
}

func ConvertToString(value any) string {
	switch v := value.(type) {
	case string:
		return v
	case int:
		return strconv.Itoa(v)
	case int64:
		return strconv.FormatInt(v, 10)
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(v)
	}

	return ""
}

func Zero[T any]() T {
	var result T
	return result
}

func Escape(data string) string {
	return strings.ReplaceAll(data, "\n", "\\n")
}

func Random(prefix string, min, max int) string {
	return "sb" + strconv.Itoa(rand.Intn(max-min)+min)
}

func ContexualLogger(ctx context.Context, logger *zap.Logger) *zap.Logger {
	if logger == nil {
		return logger
	}

	return logger.With(
		zap.String(observability.OBS_TAG_CORRELATION_ID, constants.ExecutionID(ctx)),
	)
}

// SprayAndCollect runs the provided function concurrently for each item in the provided slice.
// The results are collcted into a map where the key is the name given to the task and the
// value is what it returns.
func SprayAndCollect[T any, K comparable](stuff []K, fn func(K) (string, T, error)) (map[string]T, error) {
	results := NewMap[T]()
	errCh := make(chan error, len(stuff))

	for _, item := range stuff {
		go func(thing K) {
			who, what, err := fn(thing)
			results.Put(who, what)
			errCh <- err
		}(item)
	}

	var failures error
	{
		for i := 0; i < len(stuff); i++ {
			if err := <-errCh; err != nil {
				failures = errors.Join(failures, err)
			}
		}
	}

	if failures != nil {
		return results.ToGoMap(), failures
	}

	return results.ToGoMap(), nil
}

func MergeMaps[T any](maps ...map[string]T) map[string]T {
	result := map[string]T{}

	for _, m := range maps {
		for k, v := range m {
			result[k] = v
		}
	}

	return result
}

func ObjectKeys[T any](x map[string]T) []string {
	var result []string

	for k := range x {
		result = append(result, k)
	}

	return result
}

func Md5(input string) string {
	hasher := md5.New()
	_, err := hasher.Write([]byte(input))
	if err != nil {
		return "<failed to calculate MD5>"
	}
	md5Sum := hasher.Sum(nil)
	md5Hex := hex.EncodeToString(md5Sum)
	return md5Hex
}

func IntegrationsToSecretStores(in []*integrationv1.Integration) (out []*secretsv1.Store, _ error) {
	if in == nil {
		return nil, nil
	}

	for _, integration := range in {
		if integration == nil || len(integration.Configurations) == 0 {
			continue
		}

		if len(integration.Configurations) > 1 {
			return nil, errors.New("integration has more than one configuration")
		}

		configuration := integration.Configurations[0]

		store := new(secretsv1.Store)

		// NOTE(frank): This will be here until we pay for our sines and make the integration type a oneof.
		data, err := protojson.Marshal(configuration.Configuration)
		if err != nil {
			return nil, err
		}

		unmarshaler := protojson.UnmarshalOptions{
			DiscardUnknown: true,
		}

		if err := unmarshaler.Unmarshal(data, store); err != nil {
			return nil, err
		}

		store.Metadata = &commonv1.Metadata{
			Name:         integration.Slug,
			Organization: integration.OrganizationId,
		}

		store.ConfigurationId = configuration.Id

		out = append(out, store)
	}

	return
}

func EnrichSpanWithPerformance(span trace.Span, data *transportv1.Performance) {
	if data == nil {
		return
	}

	if metrics := data.GetKvStoreFetch(); metrics != nil {
		span.SetAttributes(
			attribute.Int64(observability.OBS_TAG_FETCH_BYTES, int64(metrics.GetBytes())),
		)
	}

	if metrics := data.GetKvStorePush(); metrics != nil {
		span.SetAttributes(
			attribute.Int64(observability.OBS_TAG_PUSH_BYTES, int64(metrics.GetBytes())),
		)
	}
}

func IsSubset(b, a map[string]any) bool {
	for key, bVal := range b {
		aVal, exists := a[key]
		if !exists {
			return false
		}

		if reflect.TypeOf(aVal) != reflect.TypeOf(bVal) {
			return false
		}

		switch aValTyped := aVal.(type) {
		case map[string]any:
			bValTyped := bVal.(map[string]any)
			if !IsSubset(bValTyped, aValTyped) {
				return false
			}
		default:
			if !reflect.DeepEqual(aVal, bVal) {
				return false
			}
		}
	}
	return true
}
