"""Tests for the VariableClient class."""

import json
from unittest.mock import MagicMock, patch

import grpc
import pytest

from src.store.kvstore import KV
from src.superblocks import Object
from src.variables.variable_client import (
    MAX_RECEIVE_MESSAGE_LENGTH,
    MAX_SEND_MESSAGE_LENGTH,
    VariableClient,
)


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

        mock_channel.assert_called_once_with(
            "localhost:50052",
            options=[
                ("grpc.max_receive_message_length", MAX_RECEIVE_MESSAGE_LENGTH),
                ("grpc.max_send_message_length", MAX_SEND_MESSAGE_LENGTH),
            ],
        )
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

        client.close("done")

        mock_channel.close.assert_called_once()
        assert client.channel is None
        assert client.stub is None

    def test_close_when_not_connected(self, client):
        """Test closing when not connected."""
        client.close("done")  # Should not raise

    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read(self, MockRequest, client):
        """Test reading a variable via read(keys)."""
        mock_stub = MagicMock()
        mock_response = MagicMock()
        mock_response.values = [json.dumps(123)]
        mock_stub.GetVariables.return_value = mock_response
        client.stub = mock_stub

        values, size = client.read(["my_key"])

        assert values == [123]
        assert size == len(json.dumps(123))
        MockRequest.assert_called_once_with(
            execution_id="test-execution-id",
            keys=["my_key"],
        )

    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_dict_supports_dot_notation(self, MockRequest, client):
        """Test that reading a dict variable supports dot notation access."""
        mock_stub = MagicMock()
        mock_response = MagicMock()
        mock_response.values = [json.dumps({"name": "test", "nested": {"value": 42}})]
        mock_stub.GetVariables.return_value = mock_response
        client.stub = mock_stub

        values, _ = client.read(["my_key"])
        result = values[0]

        # Should return Object instance, not plain dict
        assert isinstance(result, Object)
        # Dot notation should work
        assert result.name == "test"
        assert result.nested.value == 42
        # Bracket notation should also work
        assert result["name"] == "test"
        assert result["nested"]["value"] == 42

    def test_read_without_stub(self, client):
        """Test reading without a stub."""
        values, size = client.read(["my_key"])
        assert values == [None]
        assert size == 0

    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_not_found(self, MockRequest, client):
        """Test reading a variable that doesn't exist (empty/null value)."""
        mock_stub = MagicMock()
        mock_response = MagicMock()
        mock_response.values = ["null"]
        mock_stub.GetVariables.return_value = mock_response
        client.stub = mock_stub

        values, _ = client.read(["missing_key"])

        assert values == [None]

    @patch("src.variables.variable_client.variable_store_pb2.SetVariableRequest")
    def test_write(self, MockRequest, client):
        """Test writing a variable."""
        mock_stub = MagicMock()
        client.stub = mock_stub

        size = client.write("my_key", 456)

        assert size == len(json.dumps(456))
        MockRequest.assert_called_once_with(
            execution_id="test-execution-id",
            key="my_key",
            value=json.dumps(456),
        )
        mock_stub.SetVariable.assert_called_once()

    def test_write_without_stub(self, client):
        """Test writing without a stub returns 0 and does not raise."""
        size = client.write("my_key", 456)
        assert size == 0

    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_many(self, MockRequest, client):
        """Test reading multiple variables."""
        mock_stub = MagicMock()
        mock_response = MagicMock()
        mock_response.values = [json.dumps(1), json.dumps(2), json.dumps(3)]
        mock_stub.GetVariables.return_value = mock_response
        client.stub = mock_stub

        values, size = client.read(["key1", "key2", "key3"])

        assert values == [1, 2, 3]
        MockRequest.assert_called_once_with(
            execution_id="test-execution-id",
            keys=["key1", "key2", "key3"],
        )

    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_many_dict_supports_dot_notation(self, MockRequest, client):
        """Test that reading multiple dict variables supports dot notation access."""
        mock_stub = MagicMock()
        mock_response = MagicMock()
        mock_response.values = [
            json.dumps({"name": "item1", "value": {"count": 10}}),
            json.dumps({"name": "item2", "value": {"count": 20}}),
        ]
        mock_stub.GetVariables.return_value = mock_response
        client.stub = mock_stub

        values, _ = client.read(["key1", "key2"])

        # All results should be Object instances
        assert all(isinstance(r, Object) for r in values)
        # Dot notation should work
        assert values[0].name == "item1"
        assert values[0].value.count == 10
        assert values[1].name == "item2"
        assert values[1].value.count == 20

    def test_read_many_without_stub(self, client):
        """Test reading multiple variables without a stub."""
        values, size = client.read(["key1", "key2"])
        assert values == [None, None]
        assert size == 0

    def test_write_buffer(self, client):
        """Test buffering a write (buffer stores KV objects)."""
        client.write_buffer("key1", 123)
        client.write_buffer("key2", "value")

        assert list(client.buffer.keys()) == ["key1", "key2"]
        assert client.buffer["key1"].key == "key1"
        assert client.buffer["key1"].value == 123
        assert client.buffer["key2"].key == "key2"
        assert client.buffer["key2"].value == "value"

    @patch("src.variables.variable_client.variable_store_pb2.SetVariablesRequest")
    def test_flush(self, MockRequest, client):
        """Test flushing buffered writes."""
        mock_stub = MagicMock()
        client.stub = mock_stub
        client.buffer = {
            "key1": KV("key1", 123),
            "key2": KV("key2", "value"),
        }

        client.flush()

        mock_stub.SetVariables.assert_called_once()
        assert client.buffer == {}

    def test_flush_without_stub(self, client):
        """Test flushing without a stub (write_many no-ops, buffer is still cleared)."""
        client.write_buffer("key1", 123)
        client.flush()  # Should not raise
        assert client.buffer == {}

    def test_flush_empty_buffer(self, client):
        """Test flushing an empty buffer."""
        mock_stub = MagicMock()
        client.stub = mock_stub

        client.flush()

        mock_stub.SetVariables.assert_not_called()


class TestVariableClientFetchFile:
    @pytest.fixture
    def client(self):
        c = VariableClient("localhost:50052", "test-execution-id")
        c.stub = MagicMock()
        return c

    def test_fetch_file_success(self, client):
        """Test successful file fetch."""
        mock_response = MagicMock()
        mock_response.error = ""
        mock_response.contents = b"file-contents"
        client.stub.FetchFile.return_value = mock_response

        result = client.fetch_file("/tmp/some-file")

        assert result == b"file-contents"

    def test_fetch_file_application_error(self, client):
        """Test fetch_file raises on application-level error from server."""
        mock_response = MagicMock()
        mock_response.error = "no file context for execution"
        client.stub.FetchFile.return_value = mock_response

        with pytest.raises(Exception, match="Failed to fetch file /tmp/some-file: no file context for execution"):
            client.fetch_file("/tmp/some-file")

    def test_fetch_file_not_connected(self):
        """Test fetch_file raises when client not connected."""
        client = VariableClient("localhost:50052", "test-execution-id")

        with pytest.raises(Exception, match="Variable client not connected"):
            client.fetch_file("/tmp/some-file")

    def test_fetch_file_grpc_resource_exhausted(self, client):
        """Test fetch_file handles RESOURCE_EXHAUSTED (message too large)."""
        rpc_error = grpc.RpcError()
        rpc_error.code = lambda: grpc.StatusCode.RESOURCE_EXHAUSTED
        rpc_error.details = lambda: "Received message larger than max (5000000 vs. 4194304)"
        client.stub.FetchFile.side_effect = rpc_error

        with pytest.raises(Exception, match="gRPC StatusCode.RESOURCE_EXHAUSTED"):
            client.fetch_file("/tmp/some-file")

    def test_fetch_file_generic_exception(self, client):
        """Test fetch_file handles non-gRPC exceptions."""
        client.stub.FetchFile.side_effect = RuntimeError("unexpected error")

        with pytest.raises(Exception, match="Error fetching file /tmp/some-file: unexpected error"):
            client.fetch_file("/tmp/some-file")


class TestVariableClientErrorHandling:
    @pytest.fixture
    def client(self):
        return VariableClient("localhost:50052", "test-execution-id")

    @staticmethod
    def _make_rpc_error(status_code, details_msg):
        err = grpc.RpcError()
        err.code = lambda: status_code
        err.details = lambda: details_msg
        return err

    @patch("src.variables.variable_client.error")
    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_raises_on_grpc_unavailable(self, MockRequest, mock_error, client):
        """Test that read propagates UNAVAILABLE and logs structured error."""
        mock_stub = MagicMock()
        rpc_error = self._make_rpc_error(grpc.StatusCode.UNAVAILABLE, "Connection refused")
        mock_stub.GetVariables.side_effect = rpc_error
        client.stub = mock_stub

        with pytest.raises(grpc.RpcError) as exc_info:
            client.read(["my_key"])

        # The exact same exception object is re-raised (not wrapped)
        assert exc_info.value is rpc_error
        # Structured logging called with context
        mock_error.assert_called_once()
        call_args = mock_error.call_args
        assert call_args[0][0] == "gRPC error reading variables"
        assert call_args[1]["status_code"] == str(grpc.StatusCode.UNAVAILABLE)
        assert call_args[1]["details"] == "Connection refused"
        assert call_args[1]["execution_id"] == "test-execution-id"
        assert call_args[1]["keys"] == ["my_key"]

    @patch("src.variables.variable_client.error")
    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_raises_on_grpc_deadline_exceeded(self, MockRequest, mock_error, client):
        """Test that read propagates DEADLINE_EXCEEDED (timeout to task-manager)."""
        mock_stub = MagicMock()
        rpc_error = self._make_rpc_error(grpc.StatusCode.DEADLINE_EXCEEDED, "Deadline exceeded")
        mock_stub.GetVariables.side_effect = rpc_error
        client.stub = mock_stub

        with pytest.raises(grpc.RpcError) as exc_info:
            client.read(["var1", "var2"])

        assert exc_info.value is rpc_error
        assert mock_error.call_args[1]["status_code"] == str(grpc.StatusCode.DEADLINE_EXCEEDED)
        assert mock_error.call_args[1]["keys"] == ["var1", "var2"]

    @patch("src.variables.variable_client.error")
    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_raises_on_grpc_resource_exhausted(self, MockRequest, mock_error, client):
        """Test that read propagates RESOURCE_EXHAUSTED (response too large)."""
        mock_stub = MagicMock()
        rpc_error = self._make_rpc_error(
            grpc.StatusCode.RESOURCE_EXHAUSTED,
            "Received message larger than max (5000000 vs. 4194304)",
        )
        mock_stub.GetVariables.side_effect = rpc_error
        client.stub = mock_stub

        with pytest.raises(grpc.RpcError) as exc_info:
            client.read(["big_var"])

        assert exc_info.value is rpc_error

    @patch("src.variables.variable_client.error")
    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_raises_on_generic_exception(self, MockRequest, mock_error, client):
        """Test that read propagates non-gRPC exceptions with logging."""
        mock_stub = MagicMock()
        original_err = RuntimeError("Connection error")
        mock_stub.GetVariables.side_effect = original_err
        client.stub = mock_stub

        with pytest.raises(RuntimeError, match="Connection error") as exc_info:
            client.read(["my_key"])

        assert exc_info.value is original_err
        mock_error.assert_called_once_with("Error reading variables: Connection error")

    @patch("src.variables.variable_client.error")
    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_does_not_print_to_stdout(self, MockRequest, mock_error, client, capsys):
        """Test that read uses structured error(), never print()."""
        mock_stub = MagicMock()
        mock_stub.GetVariables.side_effect = self._make_rpc_error(
            grpc.StatusCode.INTERNAL, "server error"
        )
        client.stub = mock_stub

        with pytest.raises(grpc.RpcError):
            client.read(["key"])

        captured = capsys.readouterr()
        assert captured.out == ""
        assert captured.err == ""

    @patch("src.variables.variable_client.variable_store_pb2.SetVariableRequest")
    def test_write_raises_on_exception(self, MockRequest, client):
        """Test that write re-raises on exception."""
        mock_stub = MagicMock()
        mock_stub.SetVariable.side_effect = Exception("Connection error")
        client.stub = mock_stub

        with pytest.raises(Exception, match="Connection error"):
            client.write("my_key", 123)

    @patch("src.variables.variable_client.error")
    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_many_raises_on_grpc_error(self, MockRequest, mock_error, client):
        """Test that read propagates gRPC errors for multiple keys with all keys in log."""
        mock_stub = MagicMock()
        rpc_error = self._make_rpc_error(grpc.StatusCode.INTERNAL, "Internal server error")
        mock_stub.GetVariables.side_effect = rpc_error
        client.stub = mock_stub

        with pytest.raises(grpc.RpcError):
            client.read(["key1", "key2", "key3"])

        assert mock_error.call_args[1]["keys"] == ["key1", "key2", "key3"]

    @patch("src.variables.variable_client.error")
    @patch("src.variables.variable_client.variable_store_pb2.GetVariablesRequest")
    def test_read_grpc_error_without_code_attribute(self, MockRequest, mock_error, client):
        """Test hasattr guard: RpcError missing code() falls back to UNKNOWN."""
        mock_stub = MagicMock()
        bare_error = grpc.RpcError()
        # Don't set code or details -- test the hasattr fallback
        if hasattr(bare_error, "code"):
            delattr(bare_error, "code")
        if hasattr(bare_error, "details"):
            delattr(bare_error, "details")
        mock_stub.GetVariables.side_effect = bare_error
        client.stub = mock_stub

        with pytest.raises(grpc.RpcError):
            client.read(["key"])

        assert mock_error.call_args[1]["status_code"] == "UNKNOWN"

    @patch("src.variables.variable_client.variable_store_pb2.SetVariablesRequest")
    def test_flush_swallows_grpc_error(self, MockRequest, client, caplog):
        """Test that flush swallows grpc.RpcError (best-effort write, not propagated)."""
        mock_stub = MagicMock()
        rpc_error = grpc.RpcError()
        rpc_error.code = lambda: grpc.StatusCode.UNAVAILABLE
        rpc_error.details = lambda: "Connection refused"
        mock_stub.SetVariables.side_effect = rpc_error
        client.stub = mock_stub
        client.write_buffer("key1", 123)

        client.flush()  # Should not raise even for grpc.RpcError

        assert "Error flushing variables" in caplog.text
        assert len(client.buffer) == 1

    @patch("src.variables.variable_client.variable_store_pb2.SetVariablesRequest")
    def test_flush_handles_generic_exception(self, MockRequest, client, caplog):
        """Test that flush handles generic exceptions gracefully (logs, buffer unchanged)."""
        mock_stub = MagicMock()
        mock_stub.SetVariables.side_effect = Exception("Connection error")
        client.stub = mock_stub
        client.write_buffer("key1", 123)

        client.flush()  # Should not raise

        assert "Error flushing variables" in caplog.text
        assert len(client.buffer) == 1
        assert client.buffer["key1"].value == 123
