#!/usr/bin/env bash

set -e

op item get "plugins/.env" --vault Local --fields 'notesPlain' --format json | jq -r .value > gcs/.env
op item get "k8s-secret-dev-plugins-salesforce-env" --vault Dev --fields 'notesPlain' --format json | jq -r .value > salesforce/.env
op item get "k8s-secret-dev-plugins-openai-env" --vault Dev --fields 'notesPlain' --format json | jq -r .value > openai/.env
op item get "k8s-secret-dev-plugins-superblocks-ocr-env" --vault Dev --fields 'notesPlain' --format json | jq -r .value > superblocks-ocr/.env
