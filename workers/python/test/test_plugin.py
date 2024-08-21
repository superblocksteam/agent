from datetime import datetime

import pytest
from plugin.plugin import DATETIME_FORMAT, Python


@pytest.mark.asyncio
async def test_plugin_execute_set_result_properly(mocker):
    p = Python()
    mocker.patch.object(p, "_run", return_value=["{}", [], []])
    result = await p.execute(
        {
            "actionConfiguration": {"body": ""},
            "context": {
                "globals": {"$agentKey": "", "$superblocksFiles": {}},
                "outputs": {},
            },
        },
        None,
        None,
        {"size": None, "duration": None},
        None,
        {},
    )

    assert "executionOutput" in result
    assert type(result["executionOutput"]["executionTime"]) is int
    try:
        datetime.strptime(result["executionOutput"]["startTimeUtc"], DATETIME_FORMAT)
    except ValueError:
        assert False, "invalid datetime format"
