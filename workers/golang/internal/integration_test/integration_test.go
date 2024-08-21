package integration_test

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	r "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/store"
	redisstore "github.com/superblocksteam/agent/pkg/store/redis"
	"github.com/superblocksteam/agent/pkg/worker"
	redis "github.com/superblocksteam/agent/pkg/worker/transport/redis"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

type testCase struct {
	name           string
	plugin         string
	event          worker.Event
	request        *transportv1.Request_Data_Data
	expected       string
	seed           map[string]any
	pluginError    *commonv1.Error
	transportError *commonv1.Error
}

func TestV8Execution(t *testing.T) {
	t.Parallel()
	options := &r.Options{
		Addr:         "127.0.0.1:6379",
		Username:     "default",
		Password:     "dev-agent-key",
		DB:           0,
		PoolSize:     10,
		MinIdleConns: 5,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  5 * time.Minute,
		WriteTimeout: 10 * time.Second,
		PoolTimeout:  5 * time.Minute,
	}

	redisClient := r.NewClient(options)
	storeClient := redisstore.New(redisClient)
	for _, tc := range []*testCase{
		{
			name:   "undefined output",
			plugin: "v8",
			event:  worker.EventExecute,
			request: &transportv1.Request_Data_Data{
				Quotas: &transportv1.Request_Data_Data_Quota{},
				Props: &transportv1.Request_Data_Data_Props{
					ActionConfiguration: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"body": structpb.NewStringValue(`return undefined;`),
						},
					},
				},
			},
			expected: `{"request": "return undefined;"}`,
		},
		{
			name:   "comprehensive",
			plugin: "v8",
			event:  worker.EventExecute,
			request: &transportv1.Request_Data_Data{
				Quotas: &transportv1.Request_Data_Data_Quota{},
				Props: &transportv1.Request_Data_Data_Props{
					ActionConfiguration: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"body": structpb.NewStringValue(`console.log('console.log'); console.log('not console.error'); return { foo: { bar: '5', car: [1,2,3] } };`),
						},
					},
				},
			},
			expected: `{
				"request": "console.log('console.log'); console.log('not console.error'); return { foo: { bar: '5', car: [1,2,3] } };",
				"output": {
					"foo": {
						"bar": "5",
						"car": [1, 2, 3]
					}
				},
				"log": ["console.log", "not console.error"]
			}`,
		},
		{
			name:   "only console",
			plugin: "v8",
			event:  worker.EventExecute,
			request: &transportv1.Request_Data_Data{
				Quotas: &transportv1.Request_Data_Data_Quota{},
				Props: &transportv1.Request_Data_Data_Props{
					ActionConfiguration: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"body": structpb.NewStringValue(`console.log('console.log'); console.log('not console.error');`),
						},
					},
				},
			},
			expected: `{
				"request": "console.log('console.log'); console.log('not console.error');",
				"log": ["console.log", "not console.error"]
			}`,
		},
		{
			name:   "only return value",
			plugin: "v8",
			event:  worker.EventExecute,
			request: &transportv1.Request_Data_Data{
				Quotas: &transportv1.Request_Data_Data_Quota{},
				Props: &transportv1.Request_Data_Data_Props{
					ActionConfiguration: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"body": structpb.NewStringValue(`return 'hello world'`),
						},
					},
				},
			},
			expected: `{
				"request": "return 'hello world'",
				"output": "hello world"
			}`,
		},
		{
			name:   "invalid javascript",
			plugin: "v8",
			event:  worker.EventExecute,
			request: &transportv1.Request_Data_Data{
				Quotas: &transportv1.Request_Data_Data_Quota{},
				Props: &transportv1.Request_Data_Data_Props{
					ActionConfiguration: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"body": structpb.NewStringValue(`retur 'foo'`),
						},
					},
				},
			},
			expected:    `{"request": "retur 'foo'"}`,
			pluginError: &commonv1.Error{Name: "BindingError", Message: "Expected \";\" but found \"'foo'\""},
		},
		{
			name:   "console error fails step",
			plugin: "v8",
			event:  worker.EventExecute,
			request: &transportv1.Request_Data_Data{
				Quotas: &transportv1.Request_Data_Data_Quota{},
				Props: &transportv1.Request_Data_Data_Props{
					ActionConfiguration: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"body": structpb.NewStringValue(`console.log('console.log'); console.error('error'); console.error('console.error');`),
						},
					},
				},
			},
			expected: `{
				"request": "console.log('console.log'); console.error('error'); console.error('console.error');",
				"log": ["console.log", "[ERROR] error", "[ERROR] console.error"]
			}`,
			pluginError: &commonv1.Error{Name: "", Message: "console.error"},
		},
		{
			name:   "simple variable",
			plugin: "v8",
			event:  worker.EventExecute,
			request: &transportv1.Request_Data_Data{
				Quotas: &transportv1.Request_Data_Data_Quota{},
				Props: &transportv1.Request_Data_Data_Props{
					ActionConfiguration: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"body": structpb.NewStringValue(`return myVarOne.value;`),
						},
					},
					Variables: map[string]*transportv1.Variable{
						"myVarOne": {
							Key:  "REF.MY_VAR_ONE",
							Type: apiv1.Variables_TYPE_SIMPLE,
							Mode: apiv1.Variables_MODE_READWRITE,
						},
					},
				},
			},
			seed: map[string]any{
				"REF.MY_VAR_ONE": `"HELLO"`,
			},
			expected: `{
				"request": "return myVarOne.value;",
				"output": "HELLO"
			}`,
		},
		{
			name:   "unknown variable",
			plugin: "v8",
			event:  worker.EventExecute,
			request: &transportv1.Request_Data_Data{
				Quotas: &transportv1.Request_Data_Data_Quota{},
				Props: &transportv1.Request_Data_Data_Props{
					ActionConfiguration: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"body": structpb.NewStringValue(`return foo;`),
						},
					},
				},
			},
			expected: `{
				"request": "return foo;"
			}`,
			pluginError: &commonv1.Error{Name: "BindingError", Message: "Error on line 1:\\nReferenceError: foo is not defined"},
		},
		{
			name:   "quota duration enforced",
			plugin: "v8",
			event:  worker.EventExecute,
			request: &transportv1.Request_Data_Data{
				Quotas: &transportv1.Request_Data_Data_Quota{
					// Setting this too low will prevent the engine from even being created due to the context
					// already being cancelled
					Duration: 50,
				},
				Props: &transportv1.Request_Data_Data_Props{
					ActionConfiguration: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"body": structpb.NewStringValue(`await new Promise((resolve) => { const start = Date.now(); while (Date.now() - start < 1000) { continue; }; return resolve(5); })`),
						},
					},
				},
			},
			expected:    `{"request": "await new Promise((resolve) => { const start = Date.now(); while (Date.now() - start < 1000) { continue; }; return resolve(5); })"}`,
			pluginError: &commonv1.Error{Name: "", Message: "DurationQuotaError"},
		},
		{
			name:   "quota size enforced",
			plugin: "v8",
			event:  worker.EventExecute,
			request: &transportv1.Request_Data_Data{
				Quotas: &transportv1.Request_Data_Data_Quota{
					Size: 1,
				},
				Props: &transportv1.Request_Data_Data_Props{
					ActionConfiguration: &structpb.Struct{
						Fields: map[string]*structpb.Value{
							"body": structpb.NewStringValue(`return 'foo'`),
						},
					},
				},
			},
			expected:    `{"request": "return 'foo'"}`,
			pluginError: &commonv1.Error{Name: "QuotaError"},
		},
	} {
		ctx := context.Background()

		for k, v := range tc.seed {
			err := redisClient.Set(ctx, k, v, 0).Err()
			if err != nil {
				t.Fatalf("Failed to write to Redis: %s", err)
			}
		}
		runRedisTest(ctx, t, tc, redisClient, storeClient)
	}
}

func runRedisTest(ctx context.Context, t *testing.T, tc *testCase, redisClient *r.Client, storeClient store.Store) {
	t.Run(tc.name, func(t *testing.T) {
		inbox := fmt.Sprintf("INBOX.%s", uuid.New().String())

		stream := fmt.Sprintf("agent.main.bucket.BA.plugin.%s.event.%s", tc.plugin, tc.event)
		msgId, err := redis.SendWorkerMessage(worker.WithEvent(ctx, tc.event), redisClient, stream, inbox, "ba", tc.plugin, tc.request)
		defer redisClient.XDel(ctx, stream, msgId)
		assert.NoError(t, err)

		response, err := redisClient.XRead(ctx, &r.XReadArgs{
			Streams: []string{inbox, "0-1"},
			Block:   5 * time.Second,
		}).Result()
		assert.NoError(t, err)

		msg, err := redis.UnwrapOneRedisProtoMessageFromStream[*transportv1.Response](response, func() *transportv1.Response {
			return new(transportv1.Response)
		}, inbox, "data")

		assertOutput(t, tc, msg, err, storeClient)
	})
}

func assertOutput(t *testing.T, tc *testCase, resp *transportv1.Response, err error, storeClient store.Store) {
	assert.NoError(t, err)
	assert.NotNil(t, resp.GetData().GetData().GetKey())

	output, err := readResponseFromRedis(storeClient, resp.GetData().GetData().GetKey())
	assert.NoError(t, err)

	// NOTE: (joey) we do these proto clones to avoid
	// deeply nested default diffs in the proto object that we do not care about
	// such as "atomicMessageInfo"

	// theres 2 places here to check for errors
	expectedPluginErr := proto.Clone(tc.pluginError).(*commonv1.Error)
	actualPluginErr := proto.Clone(resp.GetData().GetData().GetErr()).(*commonv1.Error)
	if expectedPluginErr.GetMessage() != "" {
		assert.Equal(t, expectedPluginErr.GetMessage(), actualPluginErr.GetMessage())
	}
	assert.Equal(t, expectedPluginErr.GetName(), actualPluginErr.GetName())

	expectedTransportErr := proto.Clone(tc.transportError)
	actualTransportErr := proto.Clone(resp.GetPinned())
	assert.Equal(t, expectedTransportErr, actualTransportErr)

	expected := new(apiv1.Output)
	assert.NoError(t, json.Unmarshal([]byte(tc.expected), expected))
	output = proto.Clone(output).(*apiv1.Output)
	expected = proto.Clone(expected).(*apiv1.Output)

	assert.Equal(t, expected, output)
}

func readResponseFromRedis(storeClient store.Store, key string) (*apiv1.Output, error) {
	ctx := context.Background()
	defer storeClient.Delete(ctx, key)
	storedResponse, err := storeClient.Read(ctx, key)
	if err != nil {

		return nil, err
	}

	output := new(apiv1.Output)
	redisResp := storedResponse[0]
	if err := json.Unmarshal([]byte(redisResp.(string)), output); err != nil {
		return nil, err
	}

	return output, nil
}
