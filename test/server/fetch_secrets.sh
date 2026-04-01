#!/bin/bash

# staging environment
op item get gkrzrqajgcmg4mwkjnbkdsndsi --vault Staging --fields notesPlain | tr -d '\"' > .env.staging

# prod environment
op item get 2g5wv7lcfkmvwqfpjid2uf4v5a --vault Prod --fields notesPlain | tr -d '\"' > .env.prod
