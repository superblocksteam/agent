#!/usr/bin/env bash

# set up s3 for testing
BUCKET_NAME=test-bucket
# Dedicated bucket for Postman UPLOAD_MULTIPLE_OBJECTS so list-bucket assertions on test-bucket stay stable.
UPLOAD_BUCKET_NAME=postman-upload-bucket

awslocal s3api create-bucket --bucket $BUCKET_NAME
awslocal s3api create-bucket --bucket $UPLOAD_BUCKET_NAME

# add some dummy data
echo "This is a test file for S3 upload." > foo.txt
awslocal s3api put-object \
  --bucket $BUCKET_NAME \
  --key foo.txt \
  --body foo.txt

awslocal s3api put-object \
  --bucket $BUCKET_NAME \
  --key prefix1/foo.txt \
  --body foo.txt

awslocal s3api put-object \
  --bucket $BUCKET_NAME \
  --key prefix1/bar.txt \
  --body foo.txt
