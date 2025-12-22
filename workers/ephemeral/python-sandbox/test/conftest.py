"""Pytest configuration and fixtures for python-sandbox tests."""

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Add the parent directory and gen/ to the path so we can import from the sandbox modules
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "gen"))


@pytest.fixture
def mock_grpc_channel():
    """Create a mock gRPC channel."""
    channel = MagicMock()
    return channel


@pytest.fixture
def mock_variable_store_stub():
    """Create a mock VariableStoreService stub."""
    stub = MagicMock()
    return stub


@pytest.fixture
def sample_context():
    """Sample context for execution tests."""
    return {
        "globals": {
            "$agentKey": "test-key",
            "$fileServerUrl": "http://localhost:8080/v2/files",
            "$superblocksFiles": {},
        },
        "outputs": {},
    }


@pytest.fixture
def sample_script():
    """Sample Python script for testing."""
    return "return 1 + 1"


@pytest.fixture
def sample_script_with_context():
    """Sample Python script that uses context variables."""
    return "return foo + bar"
