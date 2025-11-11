"""Tests for PluginPropsReader"""

import pytest

from kvstore.kvstore import MockStore
from plugin.props_reader import PluginPropsReader
from variables.constants import VariableType


@pytest.mark.asyncio
async def test_props_reader_native_variable_with_string():
    """Test that native variables with string values don't crash"""
    kv_store = MockStore()
    await kv_store.write("key1", "string_value")

    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": {
            "var1": {"key": "key1", "type": VariableType.NATIVE},
        },
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    # Should not crash and should have context
    assert result is not None
    assert "context" in result
    assert "globals" in result["context"]


@pytest.mark.asyncio
async def test_props_reader_native_variable_with_number():
    """Test that native variables with numeric values don't crash"""
    kv_store = MockStore()
    await kv_store.write("key1", 123)
    await kv_store.write("key2", 45.67)

    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": {
            "var1": {"key": "key1", "type": VariableType.NATIVE},
            "var2": {"key": "key2", "type": VariableType.NATIVE},
        },
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    assert result is not None
    assert "context" in result


@pytest.mark.asyncio
async def test_props_reader_native_variable_with_boolean():
    """Test that native variables with boolean values don't crash"""
    kv_store = MockStore()
    await kv_store.write("key1", True)
    await kv_store.write("key2", False)

    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": {
            "var1": {"key": "key1", "type": VariableType.NATIVE},
            "var2": {"key": "key2", "type": VariableType.NATIVE},
        },
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    assert result is not None


@pytest.mark.asyncio
async def test_props_reader_native_variable_with_none():
    """Test that native variables with None values don't crash"""
    kv_store = MockStore()
    await kv_store.write("key1", None)

    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": {
            "var1": {"key": "key1", "type": VariableType.NATIVE},
        },
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    assert result is not None


@pytest.mark.asyncio
async def test_props_reader_native_variable_with_dict_without_files():
    """Test that native variables with dict values (but no files) work correctly"""
    kv_store = MockStore()
    await kv_store.write("key1", {"data": "value", "count": 42})

    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": {
            "var1": {"key": "key1", "type": VariableType.NATIVE},
        },
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    assert result is not None
    # Should NOT be added to globals since it doesn't have files
    assert "var1" not in result["context"]["globals"]


@pytest.mark.asyncio
async def test_props_reader_filepicker_with_superblocks_id():
    """Test that filepicker variables with $superblocksId are added to globals"""
    kv_store = MockStore()
    await kv_store.write(
        "key1",
        {
            "files": [
                {"name": "file.txt", "$superblocksId": "abc123"},
            ]
        },
    )

    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": {
            "myFile": {"key": "key1", "type": VariableType.FILEPICKER},
        },
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    assert result is not None
    # Should be added to globals since it has files with $superblocksId
    assert "myFile" in result["context"]["globals"]
    assert (
        result["context"]["globals"]["myFile"]["files"][0]["$superblocksId"] == "abc123"
    )


@pytest.mark.asyncio
async def test_props_reader_filepicker_with_empty_files():
    """Test that filepicker variables with empty files array are added to globals"""
    kv_store = MockStore()
    await kv_store.write("key1", {"files": []})

    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": {
            "myFile": {"key": "key1", "type": VariableType.FILEPICKER},
        },
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    assert result is not None
    # Should be added to globals even with empty files array
    assert "myFile" in result["context"]["globals"]
    assert result["context"]["globals"]["myFile"]["files"] == []


@pytest.mark.asyncio
async def test_props_reader_filepicker_without_superblocks_id():
    """Test that filepicker variables without $superblocksId are NOT added to globals"""
    kv_store = MockStore()
    await kv_store.write(
        "key1",
        {
            "files": [
                {"name": "file.txt", "url": "http://example.com/file.txt"},
            ]
        },
    )

    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": {
            "myFile": {"key": "key1", "type": VariableType.FILEPICKER},
        },
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    assert result is not None
    # Should NOT be added to globals since files don't have $superblocksId
    assert "myFile" not in result["context"]["globals"]


@pytest.mark.asyncio
async def test_props_reader_with_binding_keys_global():
    """Test that binding keys for global variables are loaded from store"""
    kv_store = MockStore()
    await kv_store.write("test-exec.context.global.myVar", "global_value")

    props = {
        "executionId": "test-exec",
        "bindingKeys": [{"key": "myVar", "type": "global"}],
        "actionConfiguration": {"body": "return myVar"},
        "variables": {},
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    assert result is not None
    assert "context" in result
    assert "globals" in result["context"]
    assert result["context"]["globals"]["myVar"] == "global_value"


@pytest.mark.asyncio
async def test_props_reader_with_binding_keys_output():
    """Test that binding keys for output variables are loaded from store"""
    kv_store = MockStore()
    await kv_store.write("test-exec.context.output.Step1", {"data": "output_value"})

    props = {
        "executionId": "test-exec",
        "bindingKeys": [{"key": "Step1", "type": "output"}],
        "actionConfiguration": {"body": "return Step1"},
        "variables": {},
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    assert result is not None
    assert "context" in result
    assert "outputs" in result["context"]
    assert result["context"]["outputs"]["Step1"] == {"data": "output_value"}


@pytest.mark.asyncio
async def test_props_reader_with_mixed_variables():
    """Test that reader handles mix of native primitives, filepickers, and dicts"""
    kv_store = MockStore()
    await kv_store.write("key1", "string_value")
    await kv_store.write("key2", 123)
    await kv_store.write("key3", {"files": [{"$superblocksId": "abc"}]})
    await kv_store.write("key4", {"data": "no files"})

    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": {
            "var1": {"key": "key1", "type": VariableType.NATIVE},
            "var2": {"key": "key2", "type": VariableType.NATIVE},
            "var3": {"key": "key3", "type": VariableType.FILEPICKER},
            "var4": {"key": "key4", "type": VariableType.NATIVE},
        },
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, kv_store, {})
    result = await reader.build()

    assert result is not None
    # Only var3 should be in globals (has files with $superblocksId)
    assert "var1" not in result["context"]["globals"]
    assert "var2" not in result["context"]["globals"]
    assert "var3" in result["context"]["globals"]
    assert "var4" not in result["context"]["globals"]


@pytest.mark.asyncio
async def test_props_reader_stream_properties():
    """Test that stream properties are loaded correctly"""
    props = {
        "executionId": "test-exec-123",
        "stepName": "Step1",
        "bindingKeys": [],
        "actionConfiguration": {"body": "return 1"},
        "environment": "production",
        "variables": {},
        "$fileServerUrl": "http://localhost:8080",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, MockStore(), {})
    result = await reader.build()

    assert result is not None
    assert result["executionId"] == "test-exec-123"
    assert result["stepName"] == "Step1"
    assert result["actionConfiguration"] == {"body": "return 1"}
    assert result["environment"] == "production"
    assert result["$fileServerUrl"] == "http://localhost:8080"
    assert result["$flagWorker"] is True


@pytest.mark.asyncio
async def test_props_reader_no_variables():
    """Test that reader works when variables is None"""
    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": None,
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, MockStore(), {})
    result = await reader.build()

    assert result is not None
    assert "context" in result


@pytest.mark.asyncio
async def test_props_reader_empty_variables():
    """Test that reader works when variables is empty dict"""
    props = {
        "executionId": "test-exec",
        "bindingKeys": [],
        "actionConfiguration": {},
        "variables": {},
        "$fileServerUrl": "http://localhost",
        "$flagWorker": True,
    }

    reader = PluginPropsReader(props, MockStore(), {})
    result = await reader.build()

    assert result is not None
    assert "context" in result
