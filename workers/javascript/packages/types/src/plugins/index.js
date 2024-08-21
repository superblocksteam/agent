"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpPluginV1 = exports.SalesforcePluginV1 = exports.RestApiIntegrationV1 = exports.RestApiV1 = exports.RedisPluginV1 = exports.OracleDbPluginV1 = exports.KafkaV1 = exports.GraphQlV1 = exports.DynamoDbV1 = exports.DatabricksPluginV1 = exports.CustomV1 = exports.CouchbasePluginV1 = exports.CosmosDbPluginV1 = exports.PluginCommonV1 = exports.AuthCommonV1 = exports.AthenaPluginV1 = exports.AdlsPluginV1 = void 0;
exports.AdlsPluginV1 = __importStar(require("./adls/v1/plugin_pb"));
exports.AthenaPluginV1 = __importStar(require("./athena/v1/plugin_pb"));
exports.AuthCommonV1 = __importStar(require("./common/v1/auth_pb"));
exports.PluginCommonV1 = __importStar(require("./common/v1/plugin_pb"));
exports.CosmosDbPluginV1 = __importStar(require("./cosmosdb/v1/plugin_pb"));
exports.CouchbasePluginV1 = __importStar(require("./couchbase/v1/plugin_pb"));
exports.CustomV1 = __importStar(require("./custom/v1/plugin_pb"));
exports.DatabricksPluginV1 = __importStar(require("./databricks/v1/plugin_pb"));
exports.DynamoDbV1 = __importStar(require("./dynamodb/v1/plugin_pb"));
exports.GraphQlV1 = __importStar(require("./graphql/v1/plugin_pb"));
exports.KafkaV1 = __importStar(require("./kafka/v1/plugin_pb"));
exports.OracleDbPluginV1 = __importStar(require("./oracledb/v1/plugin_pb"));
exports.RedisPluginV1 = __importStar(require("./redis/v1/plugin_pb"));
exports.RestApiV1 = __importStar(require("./restapi/v1/plugin_pb"));
exports.RestApiIntegrationV1 = __importStar(require("./restapiintegration/v1/plugin_pb"));
exports.SalesforcePluginV1 = __importStar(require("./salesforce/v1/plugin_pb"));
exports.SmtpPluginV1 = __importStar(require("./smtp/v1/plugin_pb"));
//# sourceMappingURL=index.map