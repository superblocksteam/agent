package pluginparser

import (
	"strings"

	"github.com/superblocksteam/agent/pkg/utils"
)

var SUPERBLOCKS_PLUGINS_SET = utils.NewSet(
	"adls",
	"athena",
	"bigquery",
	"cockroachdb",
	"cosmosdb",
	"couchbase",
	"databricks",
	"dynamodb",
	"email",
	"gcs",
	"graphql",
	"gsheets",
	"javascript",
	"javascriptsdkapi",
	"javascriptwasm",
	"kafka",
	"kinesis",
	"mariadb",
	"mongodb",
	"mssql",
	"mysql",
	"openai",
	"ocr",
	"oracledb",
	"postgres",
	"python",
	"redis",
	"redshift",
	"restapi",
	"restapiintegration",
	"rockset",
	"s3",
	"salesforce",
	"smtp",
	"snowflake",
	"workflow", // Note: this plugin may be obsolete (workflow steps should be handled in the orchestrator)
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
