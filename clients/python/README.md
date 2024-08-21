# Superblocks Agent Python SDK

[![Python version](https://img.shields.io/badge/python-%3E=_3.10-teal.svg)](https://www.python.org/downloads/)
[![PyPi Version](https://img.shields.io/pypi/v/superblocks-agent-sdk)](https://pypi.org/project/superblocks-agent-sdk/)

## Installation

Use the package manager [pip](https://pip.pypa.io/en/stable/) to install.

```sh
pip install superblocks-agent-sdk
```

## Quickstart

### Run an API

```python3
from superblocks_agent_sdk.api import Api
from superblocks_agent_sdk.client import Client, Config
from superblocks_agent_sdk.testing.step import on, Params


# configure client
client = Client(config=Config(token="my-token"))

# specify api to run
api = Api("my-api-id")

# run with client in context manager
with client as c:
    # run api
    result = api.run(client=c, inputs={"input1": "foo", "input2": 5})
    # create a mock for any step named "Step1" and have it return {"im": "mocked"}
    mock = on(params=Params(step_name="Step1")).return_({"im": "mocked"})
    result_with_mock = api.run(client=c, mocks=[mock])

# get api output
print(result.get_result())
# get block output by name
print(result_with_mock.get_block_result("Step1"))  # {"im": "mocked"}
```
