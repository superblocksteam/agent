"""Tests for the VariableClient class."""

import json
from unittest.mock import MagicMock, patch

import pytest

from src.superblocks import Object
from src.variables.variable_client import VariableClient


class TestVariableClient:
    @pytest.fixture
    def client(self):
        return VariableClient("localhost:50052", "test-execution-id")

    def test_init(self, client):
        """Test client initialization."""
        assert client.address == "localhost:50052"
        assert client.execution_id == "test-execution-id"
        assert client.channel is None
        assert client.stub is None
        assert client.buffer == {}

    @patch("src.variables.variable_client.grpc.insecure_channel")
    @patch("src.variables.variable_client.variable_store_pb2_grpc.SandboxVariableStoreServiceStub")
    def test_connect(self, MockStub, mock_channel, client):
        """Test connecting to the gRPC server."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance
        mock_stub_instance = MagicMock()
        MockStub.return_value = mock_stub_instance

        client.connect()

        mock_channel.assert_called_once_with("localhost:50052")
        MockStub.assert_called_once_with(mock_channel_instance)
        assert client.channel == mock_channel_instance
        assert client.stub == mock_stub_instance

    def test_connect_without_address(self):
        """Test connecting without an address."""
        client = VariableClient("", "test-execution-id")
        client.connect()
        assert client.channel is None
        assert client.stub is None

    def test_connect_already_connected(self, client):
        """Test connecting when already connected."""
        client.channel = MagicMock()
        client.stub = MagicMock()
        original_channel = client.channel
        original_stub = client.stub

        client.connect()

        assert client.channel is original_channel
        assert client.stub is original_stub

    def test_close(self, client):
        """Test closing the connection."""
        mock_channel = MagicMock()
        client.channel = mock_channel
        client.stub = MagicMock()

        client.close()

        mock_channel.close.assert_called_once()
        assert client.channel is None
        assert client.stub is None

    def test_close_when_not_connected(self, client):
        """Test closing when not connected."""
        client.close()  # Should not raise

    @patch("src.variables.variable_client.variable_store_pb2.GetVariableRequest")
    def test_get(self, MockRequest, client):
        """Test getting a variable."""
        mock_stub = MagicMock()
        mock_response = MagicMock()
        mock_response.found = True
        mock_response.value = json.dumps(123)
        mock_stub.GetVariable.return_value = mock_response
        client.stub = mock_stub

        result = client.get("my_key")

        assert result == 123
        MockRequest.assert_called_once_with(
            execution_id="test-execution-id",
            key="my_key",
        )

    @patch("src.variables.variable_client.variable_store_pb2.GetVariableRequest")
    def test_get_dict_supports_dot_notation(self, MockRequest, client):
        """Test that getting a dict variable supports dot notation access."""
        mock_stub = MagicMock()
        mock_response = MagicMock()
        mock_response.found = True
        mock_response.value = json.dumps({"name": "test", "nested": {"value": 42}})
        mock_stub.GetVariable.return_value = mock_response
        client.stub = mock_stub

        result = client.get("my_key")

        # Should return Object instance, not plain dict
        assert isinstance(result, Object)
        # Dot notation should work
        assert result.name == "test"
        assert result.nested.value == 42
        # Bracket notation should also work
        assert result["name"] == "test"
        assert result["nested"]["value"] == 42

    def test_get_without_stub(self, client):
        """Test getting a variable without a stub."""
        result = client.get("my_key")
        assert result is None

    @patch("src.variables.variable_client.variable_store_pb2.GetVariableRequest")
    def test_get_not_found(self, MockRequest, client):
        """Test getting a variable that doesn't exist."""
        mock_stub = MagicMock()
        mock_response = MagicMock()
        mock_response.found = False
        mock_stub.GetVariable.return_value = mock_response
        client.stub = mock_stub

        result = client.get("missing_key")

        assert result is None

    @patch("src.variables.variable_client.variable_store_pb2.SetVariableRequest")
    def test_set(self, MockRequest, client):
        """Test setting a variable."""
        mock_stub = MagicMock()
        client.stub = mock_stub

        client.set("my_key", 456)

        MockRequest.assert_called_once_with(
            execution_id="test-execution-id",
            key="my_key",
            value=json.dumps(456),
        )
        mock_stub.SetVariable.assert_called_once()

    def test_set_without_stub(self, client):
        """Test setting a variable without a stub."""
        client.set("my_key", 456)  # Should not raise

    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_get_many(self, MockRequest, client):
        """Test getting multiple variables."""
        mock_stub = MagicMock()
        mock_response = MagicMock()
        mock_response.values = [json.dumps(1), json.dumps(2), json.dumps(3)]
        mock_stub.GetVariables.return_value = mock_response
        client.stub = mock_stub

        result = client.get_many(["key1", "key2", "key3"])

        assert result == [1, 2, 3]
        MockRequest.assert_called_once_with(
            execution_id="test-execution-id",
            keys=["key1", "key2", "key3"],
        )

    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_get_many_dict_supports_dot_notation(self, MockRequest, client):
        """Test that getting multiple dict variables supports dot notation access."""
        mock_stub = MagicMock()
        mock_response = MagicMock()
        mock_response.values = [
            json.dumps({"name": "item1", "value": {"count": 10}}),
            json.dumps({"name": "item2", "value": {"count": 20}}),
        ]
        mock_stub.GetVariables.return_value = mock_response
        client.stub = mock_stub

        result = client.get_many(["key1", "key2"])

        # All results should be Object instances
        assert all(isinstance(r, Object) for r in result)
        # Dot notation should work
        assert result[0].name == "item1"
        assert result[0].value.count == 10
        assert result[1].name == "item2"
        assert result[1].value.count == 20

    def test_get_many_without_stub(self, client):
        """Test getting multiple variables without a stub."""
        result = client.get_many(["key1", "key2"])
        assert result == [None, None]

    def test_write_buffer(self, client):
        """Test buffering a write."""
        client.write_buffer("key1", 123)
        client.write_buffer("key2", "value")

        assert client.buffer == {"key1": 123, "key2": "value"}

    @patch("src.variables.variable_client.variable_store_pb2.SetVariablesRequest")
    @patch("src.variables.variable_client.variable_store_pb2.KeyValue")
    def test_flush(self, MockKeyValue, MockRequest, client):
        """Test flushing buffered writes."""
        mock_stub = MagicMock()
        client.stub = mock_stub
        client.buffer = {"key1": 123, "key2": "value"}

        client.flush()

        assert MockKeyValue.call_count == 2
        mock_stub.SetVariables.assert_called_once()
        assert client.buffer == {}

    def test_flush_without_stub(self, client):
        """Test flushing without a stub."""
        client.buffer = {"key1": 123}
        client.flush()  # Should not raise
        assert client.buffer == {"key1": 123}  # Buffer unchanged

    def test_flush_empty_buffer(self, client):
        """Test flushing an empty buffer."""
        mock_stub = MagicMock()
        client.stub = mock_stub

        client.flush()

        mock_stub.SetVariables.assert_not_called()


class TestVariableClientErrorHandling:
    @pytest.fixture
    def client(self):
        return VariableClient("localhost:50052", "test-execution-id")

    @patch("src.variables.variable_client.variable_store_pb2.GetVariableRequest")
    def test_get_handles_exception(self, MockRequest, client, capsys):
        """Test that get handles exceptions gracefully."""
        mock_stub = MagicMock()
        mock_stub.GetVariable.side_effect = Exception("Connection error")
        client.stub = mock_stub

        result = client.get("my_key")

        assert result is None
        captured = capsys.readouterr()
        assert "Error getting variable" in captured.out

    @patch("src.variables.variable_client.variable_store_pb2.SetVariableRequest")
    def test_set_handles_exception(self, MockRequest, client, capsys):
        """Test that set handles exceptions gracefully."""
        mock_stub = MagicMock()
        mock_stub.SetVariable.side_effect = Exception("Connection error")
        client.stub = mock_stub

        client.set("my_key", 123)  # Should not raise

        captured = capsys.readouterr()
        assert "Error setting variable" in captured.out

    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_get_many_handles_exception(self, MockRequest, client, capsys):
        """Test that get_many handles exceptions gracefully."""
        mock_stub = MagicMock()
        mock_stub.GetVariables.side_effect = Exception("Connection error")
        client.stub = mock_stub

        result = client.get_many(["key1", "key2"])

        assert result == [None, None]
        captured = capsys.readouterr()
        assert "Error getting variables" in captured.out

    @patch("src.variables.variable_client.variable_store_pb2.SetVariablesRequest")
    @patch("src.variables.variable_client.variable_store_pb2.KeyValue")
    def test_flush_handles_exception(self, MockKeyValue, MockRequest, client, capsys):
        """Test that flush handles exceptions gracefully."""
        mock_stub = MagicMock()
        mock_stub.SetVariables.side_effect = Exception("Connection error")
        client.stub = mock_stub
        client.buffer = {"key1": 123}

        client.flush()  # Should not raise

        captured = capsys.readouterr()
        assert "Error flushing variables" in captured.out
