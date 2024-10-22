#!/usr/bin/env bash

# set up s3 for testing
BUCKET_NAME=test-bucket

awslocal s3api create-bucket --bucket $BUCKET_NAME 

# add some dummy data
echo "This is a test file for S3 upload." > foo.txt
awslocal s3api put-object \
  --bucket $BUCKET_NAME \
  --key foo.txt \
  --body foo.txt
