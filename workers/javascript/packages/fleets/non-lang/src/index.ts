import { run, secrets } from '@superblocks/worker.js';

import sb_adls from '@superblocksteam/adls';
import sb_athena from '@superblocksteam/athena';
import sb_bigquery from '@superblocksteam/bigquery';
import sb_cockroachdb from '@superblocksteam/cockroachdb';
import sb_cosmosdb from '@superblocksteam/cosmosdb';
import sb_couchbase from '@superblocksteam/couchbase';
import sb_databricks from '@superblocksteam/databricks';
import sb_dynamodb from '@superblocksteam/dynamodb';
import sb_email from '@superblocksteam/email';
import sb_gcs from '@superblocksteam/gcs';
import sb_graphql from '@superblocksteam/graphql';
import sb_gsheets from '@superblocksteam/gsheets';
import sb_javascript_wasm from '@superblocksteam/javascript-wasm';
import sb_kafka from '@superblocksteam/kafka';
import sb_kinesis from '@superblocksteam/kinesis';
import sb_lakebase from '@superblocksteam/lakebase';
import sb_mariadb from '@superblocksteam/mariadb';
import sb_mongodb from '@superblocksteam/mongodb';
import sb_mssql from '@superblocksteam/mssql';
import sb_mysql from '@superblocksteam/mysql';
import sb_openai from '@superblocksteam/openai';
import sb_oracledb from '@superblocksteam/oracledb';
import sb_postgres from '@superblocksteam/postgres';
import sb_redis from '@superblocksteam/redis';
import sb_redshift from '@superblocksteam/redshift';
import sb_restapi from '@superblocksteam/restapi';
import sb_restapiintegration from '@superblocksteam/restapiintegration';
import sb_rockset from '@superblocksteam/rockset';
import sb_s3 from '@superblocksteam/s3';
import sb_salesforce from '@superblocksteam/salesforce';
import sb_smtp from '@superblocksteam/smtp';
import sb_snowflake from '@superblocksteam/snowflake';
import sb_snowflakepostgres from '@superblocksteam/snowflakepostgres';
import sb_superblocks_ocr from '@superblocksteam/superblocks-ocr';
import sb_workflow from '@superblocksteam/workflow';

const kafka = new sb_kafka();
const graphql = new sb_graphql();
const restapiintegration = new sb_restapiintegration();
const redis = new sb_redis();
const secretStore = secrets();

(async () =>
  run({
    'sb-athena': new sb_athena(),
    'sb-bigquery': new sb_bigquery(),
    'sb-cockroachdb': new sb_cockroachdb(),
    'sb-dynamodb': new sb_dynamodb(),
    'sb-email': new sb_email(),
    'sb-gcs': new sb_gcs(),
    // graphql and graphqlintegration have same action config / datasource configs
    'sb-graphql': graphql,
    'sb-graphqlintegration': graphql,
    'sb-gsheets': new sb_gsheets(),
    'sb-javascriptwasm': new sb_javascript_wasm(),
    'sb-kafka': kafka,
    'sb-kinesis': new sb_kinesis(),
    'sb-confluent': kafka,
    'sb-msk': kafka,
    'sb-redpanda': kafka,
    'sb-aivenkafka': kafka,
    'sb-mariadb': new sb_mariadb(),
    'sb-mongodb': new sb_mongodb(),
    'sb-mssql': new sb_mssql(),
    'sb-mysql': new sb_mysql(secretStore),
    'sb-openai': new sb_openai(),
    'sb-postgres': new sb_postgres(secretStore),
    'sb-redshift': new sb_redshift(),
    'sb-restapi': new sb_restapi(),
    'sb-restapiintegration': restapiintegration,
    'sb-rockset': new sb_rockset(),
    'sb-s3': new sb_s3(),
    'sb-salesforce': new sb_salesforce(),
    'sb-smtp': new sb_smtp(),
    'sb-snowflake': new sb_snowflake(),
    'sb-snowflakepostgres': new sb_snowflakepostgres(),
    'sb-ocr': new sb_superblocks_ocr(),
    'sb-workflow': new sb_workflow(),
    'sb-redis': redis,
    'sb-cosmosdb': new sb_cosmosdb(),
    'sb-adls': new sb_adls(),
    'sb-databricks': new sb_databricks(),
    'sb-couchbase': new sb_couchbase(),
    'sb-oracledb': new sb_oracledb(),
    'sb-lakebase': new sb_lakebase()
  }))();
