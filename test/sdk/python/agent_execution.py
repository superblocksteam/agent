from superblocks_agent_sdk.api import Api
from superblocks_agent_sdk.client import Client, Config

# mock server utils
workflow_id = "00000000-0000-0000-0000-000000000031"
app_api_id = "00000000-0000-0000-0000-000000000032"
scheduled_job_id = "00000000-0000-0000-0000-000000000033"

test_cases = [
    {
        "name": "workflow executes",
        "api_id": workflow_id,
        "expected_result": "foobarbaz from a workflow",
    },
    {
        "name": "app api executes",
        "api_id": app_api_id,
        "expected_result": "foobarbaz from an app api",
    },
    {
        "name": "scheduled job executes",
        "api_id": scheduled_job_id,
        "expected_result": "foobarbaz from a scheduled job",
    },
]


client = Client(
    config=Config(
        token="some_execution_token",
        endpoint="127.0.0.1:8081",
        insecure=True,
    )
)

for test_case in test_cases:
    api = Api(test_case["api_id"])

    with client as c:
        result = api.run(client=c)

    expected = test_case["expected_result"]
    actual = result.get_result()
    assert expected == actual, f"\nexpected: '{expected}'\nactual: '{actual}'"
