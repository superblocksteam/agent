# NOTE(frank): This Dockerfile is NOT optimized for caching. Rather, it's optimized
#              for the smallest possible image size via the fewest layers.

# If you update the python version or base image, ensure that the site-packages
# path in scripts/add-lib.sh is correct.
FROM ghcr.io/superblocksteam/python-mirror:3.10.18-slim-trixie

# NOTE(frank): We do not want this message printed to STDOUT
#   UserWarning: slack package is deprecated. Please use slack_sdk.web/webhook/rtm package instead. For more info, go to https://slack.dev/python-slack-sdk/v3-migration/
#
#   https://github.com/slackapi/python-slack-sdk/blob/7e71b7377a9f0e627f0da45fd5a74fe6117b7cbc/slack/deprecation.py#L6C40-L6C68
#
ENV SLACKCLIENT_SKIP_DEPRECATION true
ENV NODE_VERSION 18.x
ENV SUPERBLOCKS_SLIM_IMAGE true

ARG EXTRA_DEBIAN_PACKAGES

WORKDIR /usr/app/worker-python

COPY requirements-slim.txt /usr/app/worker-python/
COPY src/ /usr/app/worker-python/src/

RUN set -ex; \
    pip install --upgrade pip && \
    pip install "setuptools>=65,<82" && \
    groupadd --gid 1000 node && \
    useradd --uid 1000 --gid node --shell /bin/bash --create-home node && \
    apt-get update && \
    apt-get install -yqq gcc gnupg libc6-dev libpq-dev wget dnsutils iputils-ping curl build-essential cmake --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* && \
    pip3 install -r requirements-slim.txt && \
    chmod -R u=rwx,go=rx /usr/app/worker-python

# this will fail if theres a dif
# this is how we can ensure the requirements file stays accurate with transitive deps
RUN pip freeze > freeze.txt && \
    if diff -q requirements-slim.txt freeze.txt; then \
    rm freeze.txt; \
    else \
    echo "Differences found between requirements-slim.txt and freeze.txt:"; \
    echo "Contents of requirements-slim.txt:" && cat requirements-slim.txt; \
    diff requirements-slim.txt freeze.txt; \
    exit 1; \
    fi

CMD [ "python3", "/usr/app/worker-python/src/entry.py"]
