from unittest.mock import AsyncMock, MagicMock, patch

import pandas as pd
import pytest
from fixtures import dump_and_load
from hypothesis import given
from hypothesis import strategies as st

import superblocks


def test_to_superblocks_datastructure_object():
    superblocks_object = dump_and_load(
        {
            "this": {
                "be": {
                    "a": {"very": {"nested": {"object": [{"my": {"value": "bar"}}]}}}
                }
            }
        }
    )

    assert superblocks_object.this.be.a.very.nested.object[0].my.value == "bar"


def test_to_superblocks_datastructure_iter_object():
    superblocks_object = dump_and_load(
        {"foo": {"test": "test1"}, "bar": {"test": "test2"}, "baz": {"test": "test3"}}
    )
    for key, value in superblocks_object.items():
        assert value.test == superblocks_object[key]["test"]


def test_to_superblocks_datastructure_iter_list():
    superblocks_list = dump_and_load(
        [
            {"test": "0"},
            {"test": "1"},
            {"test": "2"},
            {"test": "3"},
            {"test": "4"},
        ]
    )

    for item in superblocks_list:
        assert type(item) is superblocks.Object
        assert item.test == item["test"]

    for idx, value in enumerate(superblocks_list):
        assert type(value) is superblocks.Object
        assert str(idx) == value.test

    superblocks_object = dump_and_load(
        {"context": {"Step1": {"output": [{"foo": "bar"}, {"foo": "baz"}]}}}
    )

    for item in superblocks_object.context.Step1.output:
        assert type(item) is superblocks.Object
        assert item.foo


def test_to_superblocks_datastructure_with_list():
    superblocks_list = dump_and_load(
        [
            {"test": "0"},
            {"test": "1"},
            {"test": "2"},
            {"test": "3"},
            {"test": "4"},
        ]
    )

    assert superblocks_list[0].test == "0"
    assert superblocks_list[1].test == "1"
    assert superblocks_list[2].test == "2"
    assert superblocks_list[3].test == "3"
    assert superblocks_list[4].test == "4"

    superblocks_object = dump_and_load(
        {
            "list_1": ["1", "2", "3"],
            "list_2": ["a", "b", "c"],
            "list_3": ["foo", "bar", "baz"],
        }
    )

    assert type(superblocks_object.list_1) is superblocks.List
    assert type(superblocks_object.list_2) is superblocks.List
    assert type(superblocks_object.list_3) is superblocks.List


nested_dictionary_strategy: st.SearchStrategy = st.deferred(
    lambda: st.dictionaries(st.text(), st.text())
    | st.dictionaries(st.text(), st.booleans())
    | st.dictionaries(st.text(), st.integers())
    | st.lists(st.text())
    | st.lists(st.booleans())
    | st.lists(st.integers())
    | st.lists(nested_dictionary_strategy)
    | st.dictionaries(st.text(), nested_dictionary_strategy)
)


@given(nested_dictionary_strategy)
def test_to_superblocks_datastructure(input):
    """
    We actually do not care about whether the lists in the Object are all
    converted to Superblocks Lists. The only thing we care about is if all
    the Objects when retrieved are Superblocks Objects.
    """
    superblocks_object = dump_and_load(input)

    def assert_superblocks_object(data):
        if isinstance(data, list):
            for item in data:
                assert_superblocks_object(item)
        elif isinstance(data, dict):
            assert type(data) is superblocks.Object
            for value in data.values():
                assert_superblocks_object(value)

    assert_superblocks_object(superblocks_object)


def test_pandas_can_process_list_object():
    superblocks_list = superblocks.List(
        [
            {
                "userId": "7dfdd314-7d19-4e8c-a586-81e3832bc48f",
                "email": "foo@bar.com",
                "entityType": "user",
                "properties": {},
                "type": "created user",
                "_id": "bbd4744c-fc83-41c0-b5dd-79b0c6d69de1-1",
                "_event_time": "2022-09-21T08:59:08.073000Z",
                "entityName": "Keren Brody",
                "entityId": "7dfdd314-7d19-4e8c-a586-81e3832bc48f",
                "organizationId": "32920a24-5cc0-4b85-95b2-862f1c820c2f",
                "createdAt": "2022-09-21T08:59:07.965Z",
            }
        ]
    )

    assert pd.DataFrame.from_records(superblocks_list).empty is False


def test_sanitize_agent_key():
    reader = superblocks.Reader({})

    assert reader._sanitize_agent_key("are/you/serious") == "are__you__serious"
    assert reader._sanitize_agent_key("/are/you/serious") == "__are__you__serious"
    assert reader._sanitize_agent_key("are/you/serious/") == "are__you__serious__"
    assert reader._sanitize_agent_key("are+you+serious") == "are--you--serious"
    assert reader._sanitize_agent_key("+are+you+serious") == "--are--you--serious"
    assert reader._sanitize_agent_key("are+you+serious+") == "are--you--serious--"
    assert reader._sanitize_agent_key("/are+you/serious+") == "__are--you__serious--"


@pytest.mark.asyncio
async def test_readContentsAsync_returns_text():
    """Test readContentsAsync returns text content by default."""
    reader = superblocks.Reader(
        {"$fileServerUrl": "http://localhost/v1/files", "$agentKey": "test-key"}
    )

    # Mock the async fetch
    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.read = AsyncMock(return_value=b"Hello, World!")

    mock_session = MagicMock()
    mock_session.get = MagicMock(
        return_value=AsyncMock(
            __aenter__=AsyncMock(return_value=mock_response), __aexit__=AsyncMock()
        )
    )
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock()

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await reader.readContentsAsync("test.txt", "/tmp/test.txt")
        assert result == "Hello, World!"


@pytest.mark.asyncio
async def test_readContentsAsync_returns_base64_for_binary():
    """Test readContentsAsync returns base64 for binary content."""
    reader = superblocks.Reader(
        {"$fileServerUrl": "http://localhost/v1/files", "$agentKey": "test-key"}
    )

    # Binary content with NUL bytes (0x00) which are detected as binary
    # The detection considers bytes 0x00-0x06, 0x0E-0x1A, 0x1C-0x1F as binary
    binary_content = b"\x00\x01\x02\x03"

    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.read = AsyncMock(return_value=binary_content)

    mock_session = MagicMock()
    mock_session.get = MagicMock(
        return_value=AsyncMock(
            __aenter__=AsyncMock(return_value=mock_response), __aexit__=AsyncMock()
        )
    )
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock()

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await reader.readContentsAsync("test.bin", "/tmp/test.bin")
        # Should be base64 encoded
        assert isinstance(result, str)
        assert result == "AAECAw=="  # base64 of \x00\x01\x02\x03


@pytest.mark.asyncio
async def test_readContentsAsync_with_raw_mode():
    """Test readContentsAsync with mode='raw' returns bytes."""
    reader = superblocks.Reader(
        {"$fileServerUrl": "http://localhost/v1/files", "$agentKey": "test-key"}
    )

    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.read = AsyncMock(return_value=b"raw bytes")

    mock_session = MagicMock()
    mock_session.get = MagicMock(
        return_value=AsyncMock(
            __aenter__=AsyncMock(return_value=mock_response), __aexit__=AsyncMock()
        )
    )
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock()

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await reader.readContentsAsync("test.bin", "/tmp/test.bin", mode="raw")
        assert result == b"raw bytes"


@pytest.mark.asyncio
async def test_readContentsAsync_v2_file_server():
    """Test readContentsAsync handles v2 file server JSON format."""
    import base64
    import json

    reader = superblocks.Reader(
        {"$fileServerUrl": "http://localhost/v2/files", "$agentKey": "test-key"}
    )

    # V2 format: newline-delimited JSON with base64 data
    chunk_data = base64.b64encode(b"Hello from v2").decode()
    v2_response = json.dumps({"result": {"data": chunk_data}}) + "\n"

    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.read = AsyncMock(return_value=v2_response.encode())

    mock_session = MagicMock()
    mock_session.get = MagicMock(
        return_value=AsyncMock(
            __aenter__=AsyncMock(return_value=mock_response), __aexit__=AsyncMock()
        )
    )
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock()

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await reader.readContentsAsync("test.txt", "/tmp/test.txt")
        assert result == "Hello from v2"
