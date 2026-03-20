package pluginparser

import (
	"strings"

	"github.com/superblocksteam/agent/pkg/utils"
)

var SUPERBLOCKS_PLUGINS_SET = utils.NewSet(
	"adls",
	"aivenkafka",
	"athena",
	"bigquery",
	"cockroachdb",
	"confluent",
	"cosmosdb",
	"couchbase",
	"databricks",
	"dynamodb",
	"email",
	"gcs",
	"graphql",
	"graphqlintegration",
	"gsheets",
	"javascript",
	"javascriptsdkapi",
	"javascriptwasm",
	"kafka",
	"kinesis",
	"lakebase",
	"mariadb",
	"mongodb",
	"msk",
	"mssql",
	"mysql",
	"openai",
	"ocr",
	"oracledb",
	"postgres",
	"python",
	"redis",
	"redpanda",
	"redshift",
	"restapi",
	"restapiintegration",
	"rockset",
	"s3",
	"salesforce",
	"smtp",
	"snowflake",
	"snowflakepostgres",
	"workflow",
)

func ParsePlugins(inputPlugins []string) *utils.Set[string] {
	parsedPlugins := utils.NewSet[string]()
	pluginsToRemove := utils.NewSet[string]()

	for _, input := range inputPlugins {
		if input == "*" {
			parsedPlugins = parsedPlugins.Union(SUPERBLOCKS_PLUGINS_SET)
		} else if strings.HasPrefix(input, "-") {
			pluginsToRemove.Add(input[1:])
		} else {
			parsedPlugins.Add(input)
		}
	}

	return parsedPlugins.Difference(pluginsToRemove)
}
