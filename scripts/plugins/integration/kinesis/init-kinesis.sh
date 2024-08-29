#!/usr/bin/env bash

# set up kinesis for testing
STREAM_NAME=test-stream

# create a stream
awslocal kinesis create-stream --stream-name $STREAM_NAME --shard-count 1

# wait until the stream is ACTIVE
until [ "$(awslocal kinesis describe-stream --stream-name $STREAM_NAME --query 'StreamDescription.StreamStatus' --output text)" == "ACTIVE" ]; do
	echo "Waiting for stream $STREAM_NAME to become ACTIVE..."
	sleep 2
done

# put a record on the stream
awslocal kinesis put-record --data '{"foo": "bar"}' --partition-key "test_pk_1" --stream-name $STREAM_NAME
