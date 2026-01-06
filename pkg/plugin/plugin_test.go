package plugin

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"reflect"
	"strings"
	"testing"

	"github.com/golang/protobuf/jsonpb"
	"github.com/stretchr/testify/assert"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

var typeRegistry = make(map[string]reflect.Type)

func TestMarshal(t *testing.T) {
	file, err := os.Open("action_configurations.csv")
	if err != nil {
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return
	}

	for i, record := range records {
		if i == 0 {
			continue // skip header
		}

		pluginId := record[1]
		actionConfiguration := record[2]

		step := unmarshalPb(t, actionConfiguration, pluginId)
		var built map[string]interface{}
		var err error

		if pluginId == `"python"` {
			built, err = step.GetConfig().(*apiv1.Step_Python).Build()
		} else if pluginId == `"postgres"` {
			built, err = step.GetConfig().(*apiv1.Step_Postgres).Build()
		} else if pluginId == `"mongodb"` {
			built, err = step.GetConfig().(*apiv1.Step_Mongodb).Build()
		} else if pluginId == `"javascript"` {
			built, err = step.GetConfig().(*apiv1.Step_Javascript).Build()
		} else if pluginId == `"workflow"` {
			built, err = step.GetConfig().(*apiv1.Step_Workflow).Build()
		} else if pluginId == `"snowflake"` {
			built, err = step.GetConfig().(*apiv1.Step_Snowflake).Build()
		} else if pluginId == `"s3"` {
			built, err = step.GetConfig().(*apiv1.Step_S3).Build()
		} else if pluginId == `"rockset"` {
			built, err = step.GetConfig().(*apiv1.Step_Rockset).Build()
		} else if pluginId == `"restapi"` {
			built, err = step.GetConfig().(*apiv1.Step_Restapi).Build()
		} else if pluginId == `"restapiintegration"` {
			built, err = step.GetConfig().(*apiv1.Step_Restapiintegration).Build()
		} else if pluginId == `"redshift"` {
			built, err = step.GetConfig().(*apiv1.Step_Redshift).Build()
		} else if pluginId == `"kinesis"` {
			built, err = step.GetConfig().(*apiv1.Step_Kinesis).Build()
		} else if pluginId == `"mysql"` {
			built, err = step.GetConfig().(*apiv1.Step_Mysql).Build()
		} else if pluginId == `"mssql"` {
			built, err = step.GetConfig().(*apiv1.Step_Mssql).Build()
		} else if pluginId == `"mariadb"` {
			built, err = step.GetConfig().(*apiv1.Step_Mariadb).Build()
		} else if pluginId == `"gsheets"` {
			built, err = step.GetConfig().(*apiv1.Step_Gsheets).Build()
		} else if pluginId == `"graphql"` {
			built, err = step.GetConfig().(*apiv1.Step_Graphql).Build()
		} else if pluginId == `"graphqlintegration"` {
			built, err = step.GetConfig().(*apiv1.Step_Graphqlintegration).Build()
		} else if pluginId == `"email"` {
			built, err = step.GetConfig().(*apiv1.Step_Email).Build()
		} else if pluginId == `"dynamodb"` {
			built, err = step.GetConfig().(*apiv1.Step_Dynamodb).Build()
		} else if pluginId == `"bigquery"` {
			built, err = step.GetConfig().(*apiv1.Step_Bigquery).Build()
		} else if pluginId == `"gcs"` {
			built, err = step.GetConfig().(*apiv1.Step_Gcs).Build()
		} else if pluginId == `"openai"` {
			built, err = step.GetConfig().(*apiv1.Step_Openai).Build()
		} else if pluginId == `"superblocks-ocr"` {
			// override since superblocks-ocr uses the ocr proto
			step = unmarshalPb(t, actionConfiguration, `"ocr"`)
			built, err = step.GetConfig().(*apiv1.Step_Ocr).Build()
		} else if pluginId == `"cockroachdb"` {
			continue
		} else if pluginId == "elasticsearch" {
			built, err = step.GetConfig().(*apiv1.Step_Elasticsearch).Build()
		}

		if err != nil {
			t.Error(err)
			t.Fail()
		}

		assertEquivalent(t, actionConfiguration, built, pluginId)
	}
}

func unmarshalPb(t *testing.T, pb string, acName string) *apiv1.Step {
	step := &apiv1.Step{}
	stepStr := fmt.Sprintf(`{%s: %s}`, acName, pb)
	unmarshaler := &jsonpb.Unmarshaler{AllowUnknownFields: true}
	err := unmarshaler.Unmarshal(strings.NewReader(stepStr), step)
	if err != nil {
		t.Error(err)
		t.Fail()
	}
	return step
}

func removeZeroValues(m map[string]interface{}) {
	val := reflect.ValueOf(m)
	for _, mapKey := range val.MapKeys() {
		v := val.MapIndex(mapKey)

		if v.IsNil() || v.IsZero() || v.Elem().IsZero() || v.Elem().String() == "" {
			delete(m, mapKey.String())
			continue
		}

		switch t := v.Interface().(type) {
		case string:
			// Protobuf enums with zero value are conventionally named *_UNSPECIFIED
			if strings.HasSuffix(t, "_UNSPECIFIED") {
				delete(m, mapKey.String())
			}
		case map[string]interface{}:
			// Recurse into the map, then remove the field if it's empty
			removeZeroValues(t)
			if len(t) == 0 {
				delete(m, mapKey.String())
			}
		case int, int32, int64:
			if t != 0 {
				m[mapKey.String()] = fmt.Sprintf("%v", t)
			}
		case float32, float64:
			if t != 0 {
				m[mapKey.String()] = fmt.Sprintf("%v", t)
			}
		case bool:
			if t == false {
				delete(m, mapKey.String())
			}
		case []any:
			// Remove the field if it's an empty array
			if len(t) == 0 {
				delete(m, mapKey.String())
				continue
			}
			// Recursively check if the element is an object
			for _, elem := range t {
				switch t2 := elem.(type) {
				case map[string]interface{}:
					removeZeroValues(t2)
				}
			}
		}
	}
}

func assertEquivalent(t *testing.T, expectedJsonStr string, actual map[string]any, pluginId string) {
	var expected map[string]any
	json.Unmarshal([]byte(expectedJsonStr), &expected)

	removeZeroValues(actual)
	removeZeroValues(expected)

	assert.Equal(t, expected, actual, pluginId)
}
