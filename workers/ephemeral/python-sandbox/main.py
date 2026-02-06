#!/usr/bin/env python3
"""Python gRPC server that executes Python scripts with full sandbox support.

This module re-exports components for backwards compatibility.
The actual implementation is in the src/ package.
"""

import asyncio

# Re-export for backwards compatibility and tests
from src.executor import Executor
from src.service import SandboxTransportServicer
from src.superblocks import Object, List, Reader, loads, encode_bytestring_as_json
from src.variables.variable_client import VariableClient
from src.variables.variable import SimpleVariable, AdvancedVariable, build_variables
from src.entry import serve


if __name__ == "__main__":
    asyncio.run(serve())
