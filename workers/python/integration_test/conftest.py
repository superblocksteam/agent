# contains fixtures used across integration tests
from uuid import uuid4

import pytest
from redis_fixtures import TestRedisClient


@pytest.fixture
def redis_client():
    return TestRedisClient()


@pytest.fixture
def generate_inbox_id():
    def generate_inbox_id():
        return f"INBOX.{uuid4()}"

    return generate_inbox_id


@pytest.fixture
def generate_execute_request(
    code_to_execute: str = "",
    bindingKeys: list = [],
    variables: dict = {},
    outputs: dict = {},
    globals: dict = {},
):
    def generate_execute_request(
        code_to_execute: str = code_to_execute,
        bindingKeys: list = bindingKeys,
        variables: dict = variables,
        outputs: dict = outputs,
        globals: dict = globals,
    ):
        return {
            "stepName": "Step1",
            "executionId": f"plugin-exec-js-{uuid4()}",
            "bindingKeys": bindingKeys,
            "context": {"outputs": outputs, "globals": globals},
            "variables": variables,
            "environment": "production",
            "redactedContext": {},
            "agentCredentials": {},
            "redactedDatasourceConfiguration": {},
            "actionConfiguration": {
                "body": code_to_execute,
            },
            "datasourceConfiguration": {},
            "files": {},
            "recursionContext": {
                "executedWorkflowsPath": [],
                "isEvaluatingDatasource": False,
            },
            "relayDelegate": {"body": {"relays": {}}},
            "$fileServerUrl": None,
            "$flagWorker": True,
        }

    return generate_execute_request
