import os
import time
from datetime import UTC, datetime, timedelta

import requests

# 0. init
SERVER_SCHEME = "https"
SERVER_HOST = os.environ["SERVER_HOST"]
ORCHESTRATOR_SCHEME = os.environ["ORCHESTRATOR_SCHEME"]
ORCHESTRATOR_HOST = os.environ["ORCHESTRATOR_HOST"]


# 1. get auth0 access token
AUTH0_DOMAIN = os.environ["AUTH0_DOMAIN"]
AUTH0_URL = f"https://{AUTH0_DOMAIN}/oauth/token"
AUTH0_CLIENT_ID = os.environ["AUTH0_CLIENT_ID"]
SUPERBLOCKS_EMAIL = os.environ["AUTH0_USERNAME"]
AUTH0_PASSWORD = os.environ["AUTH0_PASSWORD"]
AUTH0_AUDIENCE = "https://superblocks/api"
AUTH0_REALM = os.environ["AUTH0_REALM"]

response = requests.post(
    AUTH0_URL,
    data={
        "grant_type": "http://auth0.com/oauth/grant-type/password-realm",
        "client_id": AUTH0_CLIENT_ID,
        "username": SUPERBLOCKS_EMAIL,
        "password": AUTH0_PASSWORD,
        "audience": AUTH0_AUDIENCE,
        "realm": AUTH0_REALM,
    },
    headers={"Content-Type": "application/x-www-form-urlencoded"},
)
response.raise_for_status()
json_response = response.json()
ACCESS_TOKEN = json_response.get("access_token")

# 2. get user info
response = requests.get(
    f"{SERVER_SCHEME}://{SERVER_HOST}/api/v1/users/me",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
)
response.raise_for_status()
ORGANIZATION_ID = response.json()["data"]["user"]["currentOrganizationId"]

# 3. get superblocks jwt
response = requests.post(
    f"{SERVER_SCHEME}://{SERVER_HOST}/api/v1/token",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
)
response.raise_for_status()
SUPERBLOCKS_JWT = response.json()["access_token"]

# 4. get embed token
response = requests.post(
    f"{SERVER_SCHEME}://{SERVER_HOST}/api/v1/organizations/{ORGANIZATION_ID}/tokens",
    json={
        "name": "e2e test token",
        "scope": "ORG_SESSION_MANAGEMENT",
        # 5 minutes from now
        "expiresAt": (datetime.now(UTC) + timedelta(minutes=5)).isoformat(),
    },
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
)
response.raise_for_status()
EMBED_TOKEN = response.json()["data"]["key"]
EMBED_TOKEN_ID = response.json()["data"]["id"]

# 5. get public token
response = requests.post(
    f"{SERVER_SCHEME}://{SERVER_HOST}/api/v1/public/token",
    json={"email": SUPERBLOCKS_EMAIL},
    headers={"Authorization": f"Bearer {EMBED_TOKEN}"},
)
response.raise_for_status()
SUPERBLOCKS_PUBLIC_JWT = response.json()["access_token"]

# 6. create application
response = requests.post(
    f"{SERVER_SCHEME}://{SERVER_HOST}/api/v2/applications",
    json={"name": f"e2e-server-application", "organizationId": ORGANIZATION_ID},
    headers={
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "X-Superblocks-Authorization": f"Bearer {SUPERBLOCKS_JWT}",
    },
)
response.raise_for_status()
APPLICATION_ID = response.json()["data"]["id"]
APPLICATION_PAGE_ID = response.json()["data"]["pageSummaryList"][0]["id"]

# 7. create application api
response = requests.post(
    f"{SERVER_SCHEME}://{SERVER_HOST}/api/v3/apis?v2=true",
    json={
        "api": {
            "metadata": {
                "name": "API1",
                "organization": ORGANIZATION_ID,
            },
            "blocks": [
                {
                    "name": "Step1",
                    "step": {
                        "integration": "javascript",
                        "javascript": {
                            "body": "return 'howdy from e2e-server';",
                        },
                    },
                }
            ],
            "trigger": {
                "application": {
                    "id": APPLICATION_ID,
                    "pageId": APPLICATION_PAGE_ID,
                }
            },
        },
        "pageId": APPLICATION_PAGE_ID,
    },
    headers={
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "X-Superblocks-Authorization": f"Bearer {SUPERBLOCKS_JWT}",
    },
)
response.raise_for_status()
APPLICATION_API_ID = response.json()["data"]["id"]

# 8. commit application
# NOTE: @joeyagreco - take a short nap to give the server time before committing
time.sleep(3)
response = requests.post(
    f"{SERVER_SCHEME}://{SERVER_HOST}/api/v2/applications/{APPLICATION_ID}/commit",
    json={"commitMessage": ".", "lastSuccessfulWrite": int(time.time() * 1000)},
    headers={
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "X-Superblocks-Authorization": f"Bearer {SUPERBLOCKS_JWT}",
    },
)
response.raise_for_status()
APPLICATION_COMMIT_ID = response.json()["data"]["commitId"]

# 9. deploy application
response = requests.post(
    f"{SERVER_SCHEME}://{SERVER_HOST}/api/v2/applications/{APPLICATION_ID}/deployments",
    json={"commitId": APPLICATION_COMMIT_ID, "deployMessage": "."},
    headers={
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "X-Superblocks-Authorization": f"Bearer {SUPERBLOCKS_JWT}",
    },
)
response.raise_for_status()

# 10. execute application api with superblocks public jwt
response = requests.post(
    f"{ORCHESTRATOR_SCHEME}://{ORCHESTRATOR_HOST}/v2/execute",
    json={
        "options": {"includeEventOutputs": True, "includeResolved": True},
        # mock server application api
        "fetch": {
            "id": APPLICATION_API_ID,
            "profile": {"name": "staging"},
            "viewMode": 3,
        },
    },
    headers={
        "Authorization": f"Bearer {SUPERBLOCKS_PUBLIC_JWT}",
        "X-Superblocks-Authorization": f"Bearer {SUPERBLOCKS_PUBLIC_JWT}",
    },
)
response.raise_for_status()
assert response.json()["output"] == {"result": "howdy from e2e-server"}

# 11. delete embed token
response = requests.delete(
    f"{SERVER_SCHEME}://{SERVER_HOST}/api/v1/organizations/{ORGANIZATION_ID}/tokens/{EMBED_TOKEN_ID}",
    headers={
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "X-Superblocks-Authorization": f"Bearer {SUPERBLOCKS_JWT}",
    },
)
response.raise_for_status()

# 12. delete application
response = requests.delete(
    f"{SERVER_SCHEME}://{SERVER_HOST}/api/v2/applications/{APPLICATION_ID}",
    headers={
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "X-Superblocks-Authorization": f"Bearer {SUPERBLOCKS_JWT}",
    },
)
response.raise_for_status()
