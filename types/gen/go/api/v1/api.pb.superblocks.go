// Code generated by protoc-gen-superblocks. DO NOT EDIT.
// source: api/v1/api.proto

package v1

import (
	"bytes"
	"encoding/json"

	"github.com/golang/protobuf/jsonpb"
)

var marshaler = &jsonpb.Marshaler{EmitDefaults: true}

func (*Step_Python) Name() string { return "python" }

func (*Step_Python) Type() string { return "python" }

func (plugin *Step_Python) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Python); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Bigquery) Name() string { return "bigquery" }

func (*Step_Bigquery) Type() string { return "bigquery" }

func (plugin *Step_Bigquery) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Bigquery); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Dynamodb) Name() string { return "dynamodb" }

func (*Step_Dynamodb) Type() string { return "dynamodb" }

func (plugin *Step_Dynamodb) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Dynamodb); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Email) Name() string { return "email" }

func (*Step_Email) Type() string { return "email" }

func (plugin *Step_Email) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Email); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Graphql) Name() string { return "graphql" }

func (*Step_Graphql) Type() string { return "graphql" }

func (plugin *Step_Graphql) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Graphql); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Graphqlintegration) Name() string { return "graphqlintegration" }

func (*Step_Graphqlintegration) Type() string { return "graphqlintegration" }

func (plugin *Step_Graphqlintegration) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Graphqlintegration); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Gsheets) Name() string { return "gsheets" }

func (*Step_Gsheets) Type() string { return "gsheets" }

func (plugin *Step_Gsheets) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Gsheets); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Mariadb) Name() string { return "mariadb" }

func (*Step_Mariadb) Type() string { return "mariadb" }

func (plugin *Step_Mariadb) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Mariadb); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Mssql) Name() string { return "mssql" }

func (*Step_Mssql) Type() string { return "mssql" }

func (plugin *Step_Mssql) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Mssql); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Mysql) Name() string { return "mysql" }

func (*Step_Mysql) Type() string { return "mysql" }

func (plugin *Step_Mysql) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Mysql); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Postgres) Name() string { return "postgres" }

func (*Step_Postgres) Type() string { return "postgres" }

func (plugin *Step_Postgres) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Postgres); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Redshift) Name() string { return "redshift" }

func (*Step_Redshift) Type() string { return "redshift" }

func (plugin *Step_Redshift) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Redshift); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Restapi) Name() string { return "restapi" }

func (*Step_Restapi) Type() string { return "restapi" }

func (plugin *Step_Restapi) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Restapi); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Restapiintegration) Name() string { return "restapiintegration" }

func (*Step_Restapiintegration) Type() string { return "restapiintegration" }

func (plugin *Step_Restapiintegration) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Restapiintegration); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Rockset) Name() string { return "rockset" }

func (*Step_Rockset) Type() string { return "rockset" }

func (plugin *Step_Rockset) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Rockset); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_S3) Name() string { return "s3" }

func (*Step_S3) Type() string { return "s3" }

func (plugin *Step_S3) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.S3); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Snowflake) Name() string { return "snowflake" }

func (*Step_Snowflake) Type() string { return "snowflake" }

func (plugin *Step_Snowflake) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Snowflake); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Workflow) Name() string { return "workflow" }

func (*Step_Workflow) Type() string { return "workflow" }

func (plugin *Step_Workflow) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Workflow); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Javascript) Name() string { return "javascript" }

func (*Step_Javascript) Type() string { return "javascript" }

func (plugin *Step_Javascript) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Javascript); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Mongodb) Name() string { return "mongodb" }

func (*Step_Mongodb) Type() string { return "mongodb" }

func (plugin *Step_Mongodb) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Mongodb); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Gcs) Name() string { return "gcs" }

func (*Step_Gcs) Type() string { return "gcs" }

func (plugin *Step_Gcs) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Gcs); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Openai) Name() string { return "openai" }

func (*Step_Openai) Type() string { return "openai" }

func (plugin *Step_Openai) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Openai); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Ocr) Name() string { return "ocr" }

func (*Step_Ocr) Type() string { return "ocr" }

func (plugin *Step_Ocr) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Ocr); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Kafka) Name() string { return "kafka" }

func (*Step_Kafka) Type() string { return "kafka" }

func (plugin *Step_Kafka) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Kafka); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Confluent) Name() string { return "confluent" }

func (*Step_Confluent) Type() string { return "confluent" }

func (plugin *Step_Confluent) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Confluent); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Msk) Name() string { return "msk" }

func (*Step_Msk) Type() string { return "msk" }

func (plugin *Step_Msk) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Msk); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Redpanda) Name() string { return "redpanda" }

func (*Step_Redpanda) Type() string { return "redpanda" }

func (plugin *Step_Redpanda) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Redpanda); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Aivenkafka) Name() string { return "aivenkafka" }

func (*Step_Aivenkafka) Type() string { return "aivenkafka" }

func (plugin *Step_Aivenkafka) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Aivenkafka); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Cockroachdb) Name() string { return "cockroachdb" }

func (*Step_Cockroachdb) Type() string { return "cockroachdb" }

func (plugin *Step_Cockroachdb) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Cockroachdb); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Airtable) Name() string { return "airtable" }

func (*Step_Airtable) Type() string { return "restapiintegration" }

func (plugin *Step_Airtable) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Airtable); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Notion) Name() string { return "notion" }

func (*Step_Notion) Type() string { return "restapiintegration" }

func (plugin *Step_Notion) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Notion); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Pagerduty) Name() string { return "pagerduty" }

func (*Step_Pagerduty) Type() string { return "restapiintegration" }

func (plugin *Step_Pagerduty) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Pagerduty); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Sendgrid) Name() string { return "sendgrid" }

func (*Step_Sendgrid) Type() string { return "restapiintegration" }

func (plugin *Step_Sendgrid) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Sendgrid); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Slack) Name() string { return "slack" }

func (*Step_Slack) Type() string { return "restapiintegration" }

func (plugin *Step_Slack) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Slack); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Athena) Name() string { return "athena" }

func (*Step_Athena) Type() string { return "athena" }

func (plugin *Step_Athena) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Athena); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Redis) Name() string { return "redis" }

func (*Step_Redis) Type() string { return "redis" }

func (plugin *Step_Redis) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Redis); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Asana) Name() string { return "asana" }

func (*Step_Asana) Type() string { return "restapiintegration" }

func (plugin *Step_Asana) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Asana); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Github) Name() string { return "github" }

func (*Step_Github) Type() string { return "restapiintegration" }

func (plugin *Step_Github) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Github); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Smtp) Name() string { return "smtp" }

func (*Step_Smtp) Type() string { return "smtp" }

func (plugin *Step_Smtp) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Smtp); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Salesforce) Name() string { return "salesforce" }

func (*Step_Salesforce) Type() string { return "salesforce" }

func (plugin *Step_Salesforce) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Salesforce); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Bitbucket) Name() string { return "bitbucket" }

func (*Step_Bitbucket) Type() string { return "restapiintegration" }

func (plugin *Step_Bitbucket) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Bitbucket); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Circleci) Name() string { return "circleci" }

func (*Step_Circleci) Type() string { return "restapiintegration" }

func (plugin *Step_Circleci) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Circleci); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Front) Name() string { return "front" }

func (*Step_Front) Type() string { return "restapiintegration" }

func (plugin *Step_Front) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Front); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Intercom) Name() string { return "intercom" }

func (*Step_Intercom) Type() string { return "restapiintegration" }

func (plugin *Step_Intercom) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Intercom); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Segment) Name() string { return "segment" }

func (*Step_Segment) Type() string { return "restapiintegration" }

func (plugin *Step_Segment) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Segment); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Launchdarkly) Name() string { return "launchdarkly" }

func (*Step_Launchdarkly) Type() string { return "restapiintegration" }

func (plugin *Step_Launchdarkly) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Launchdarkly); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Dropbox) Name() string { return "dropbox" }

func (*Step_Dropbox) Type() string { return "restapiintegration" }

func (plugin *Step_Dropbox) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Dropbox); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Twilio) Name() string { return "twilio" }

func (*Step_Twilio) Type() string { return "restapiintegration" }

func (plugin *Step_Twilio) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Twilio); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Googledrive) Name() string { return "googledrive" }

func (*Step_Googledrive) Type() string { return "restapiintegration" }

func (plugin *Step_Googledrive) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Googledrive); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Googleanalytics) Name() string { return "googleanalytics" }

func (*Step_Googleanalytics) Type() string { return "restapiintegration" }

func (plugin *Step_Googleanalytics) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Googleanalytics); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Box) Name() string { return "box" }

func (*Step_Box) Type() string { return "restapiintegration" }

func (plugin *Step_Box) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Box); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Hubspot) Name() string { return "hubspot" }

func (*Step_Hubspot) Type() string { return "restapiintegration" }

func (plugin *Step_Hubspot) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Hubspot); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Stripe) Name() string { return "stripe" }

func (*Step_Stripe) Type() string { return "restapiintegration" }

func (plugin *Step_Stripe) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Stripe); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Zoom) Name() string { return "zoom" }

func (*Step_Zoom) Type() string { return "restapiintegration" }

func (plugin *Step_Zoom) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Zoom); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Jira) Name() string { return "jira" }

func (*Step_Jira) Type() string { return "restapiintegration" }

func (plugin *Step_Jira) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Jira); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Zendesk) Name() string { return "zendesk" }

func (*Step_Zendesk) Type() string { return "restapiintegration" }

func (plugin *Step_Zendesk) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Zendesk); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Adls) Name() string { return "adls" }

func (*Step_Adls) Type() string { return "adls" }

func (plugin *Step_Adls) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Adls); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Pinecone) Name() string { return "pinecone" }

func (*Step_Pinecone) Type() string { return "restapiintegration" }

func (plugin *Step_Pinecone) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Pinecone); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Cosmosdb) Name() string { return "cosmosdb" }

func (*Step_Cosmosdb) Type() string { return "cosmosdb" }

func (plugin *Step_Cosmosdb) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Cosmosdb); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Datadog) Name() string { return "datadog" }

func (*Step_Datadog) Type() string { return "restapiintegration" }

func (plugin *Step_Datadog) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Datadog); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Xero) Name() string { return "xero" }

func (*Step_Xero) Type() string { return "restapiintegration" }

func (plugin *Step_Xero) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Xero); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Oracledb) Name() string { return "oracledb" }

func (*Step_Oracledb) Type() string { return "oracledb" }

func (plugin *Step_Oracledb) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Oracledb); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Elasticsearch) Name() string { return "elasticsearch" }

func (*Step_Elasticsearch) Type() string { return "restapiintegration" }

func (plugin *Step_Elasticsearch) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Elasticsearch); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Databricks) Name() string { return "databricks" }

func (*Step_Databricks) Type() string { return "databricks" }

func (plugin *Step_Databricks) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Databricks); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Couchbase) Name() string { return "couchbase" }

func (*Step_Couchbase) Type() string { return "couchbase" }

func (plugin *Step_Couchbase) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Couchbase); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Custom) Name() string { return "custom" }

func (*Step_Custom) Type() string { return "custom" }

func (plugin *Step_Custom) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Custom); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Anthropic) Name() string { return "anthropic" }

func (*Step_Anthropic) Type() string { return "restapiintegration" }

func (plugin *Step_Anthropic) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Anthropic); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Cohere) Name() string { return "cohere" }

func (*Step_Cohere) Type() string { return "restapiintegration" }

func (plugin *Step_Cohere) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Cohere); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Fireworks) Name() string { return "fireworks" }

func (*Step_Fireworks) Type() string { return "restapiintegration" }

func (plugin *Step_Fireworks) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Fireworks); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Mistral) Name() string { return "mistral" }

func (*Step_Mistral) Type() string { return "restapiintegration" }

func (plugin *Step_Mistral) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Mistral); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Groq) Name() string { return "groq" }

func (*Step_Groq) Type() string { return "restapiintegration" }

func (plugin *Step_Groq) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Groq); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Perplexity) Name() string { return "perplexity" }

func (*Step_Perplexity) Type() string { return "restapiintegration" }

func (plugin *Step_Perplexity) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Perplexity); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Stabilityai) Name() string { return "stabilityai" }

func (*Step_Stabilityai) Type() string { return "restapiintegration" }

func (plugin *Step_Stabilityai) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Stabilityai); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func (*Step_Gemini) Name() string { return "gemini" }

func (*Step_Gemini) Type() string { return "restapiintegration" }

func (plugin *Step_Gemini) Build() (map[string]any, error) {
	var buf bytes.Buffer
	if err := marshaler.Marshal(&buf, plugin.Gemini); err != nil {
		return nil, err
	}
	var obj map[string]any
	if err := json.Unmarshal(buf.Bytes(), &obj); err != nil {
		return nil, err
	}
	return obj, nil
}