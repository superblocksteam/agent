"""Network proxy module for intercepting and redirecting network connections.

This module provides socket-level interception that can redirect all outbound
TCP connections through a proxy server. ALL traffic goes through the proxy -
there is no bypass list.

Usage:
    from src.network_proxy import install_socket_proxy

    # Install the proxy hook at application startup
    install_socket_proxy(proxy_url="http://smokescreen:4750")
"""

from __future__ import annotations

import re
import socket
import threading
from typing import Optional, Tuple
from urllib.parse import urlparse

# ============================================================================
# Constants
# ============================================================================

# Buffer size for reading proxy responses (bytes)
_RECV_BUFFER_SIZE = 4096

# Thread lock for safe installation/uninstallation
_install_lock = threading.Lock()

# Store original socket functions
_original_create_connection = socket.create_connection
_original_socket_connect = socket.socket.connect
_proxy_installed = False

# Proxy configuration (set by install_socket_proxy)
_proxy_host: str = ""
_proxy_port: int = 0

# Regex to validate HTTP status line: HTTP/1.x 200 ...
_HTTP_STATUS_REGEX = re.compile(r'^HTTP/1\.[01]\s+(\d{3})\s+')


# ============================================================================
# HTTP CONNECT Protocol Helpers
# ============================================================================

def _parse_http_status_code(response_line: str) -> int:
    """Parse HTTP status code from response line.

    Args:
        response_line: First line of HTTP response (e.g., "HTTP/1.1 200 OK")

    Returns:
        HTTP status code as integer, or -1 if parsing fails
    """
    match = _HTTP_STATUS_REGEX.match(response_line)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return -1
    return -1


def _send_connect_request(sock: socket.socket, target_host: str, target_port: int) -> None:
    """Send HTTP CONNECT request and validate response.

    This implements the HTTP CONNECT tunnel protocol used by HTTPS proxies.
    After successful completion, the socket is ready for direct communication
    with the target host through the established tunnel.

    Args:
        sock: Connected socket to the proxy server
        target_host: Target hostname to connect to
        target_port: Target port to connect to

    Raises:
        ConnectionError: If proxy connection fails or returns non-200 status
    """
    # Send HTTP CONNECT request
    connect_request = (
        f"CONNECT {target_host}:{target_port} HTTP/1.1\r\n"
        f"Host: {target_host}:{target_port}\r\n"
        f"\r\n"
    )
    sock.sendall(connect_request.encode('utf-8'))

    # Read the response (headers end with \r\n\r\n)
    response = b""
    while b"\r\n\r\n" not in response:
        chunk = sock.recv(_RECV_BUFFER_SIZE)
        if not chunk:
            raise ConnectionError("Proxy connection closed unexpectedly")
        response += chunk

    # Parse and validate HTTP status code
    response_line = response.split(b"\r\n")[0].decode('utf-8', errors='replace')
    status_code = _parse_http_status_code(response_line)

    if status_code != 200:
        raise ConnectionError(f"Proxy CONNECT failed with status {status_code}: {response_line}")


# ============================================================================
# Socket Patching Functions
# ============================================================================

def _proxied_create_connection(
    address: Tuple[str, int],
    timeout: Optional[float] = None,
    source_address: Optional[Tuple[str, int]] = None,
    **kwargs
) -> socket.socket:
    """Replacement for socket.create_connection that routes through the proxy.

    For HTTP CONNECT proxies, this:
    1. Connects to the proxy server
    2. Sends a CONNECT request for the target host
    3. Returns the socket after the tunnel is established
    """
    target_host, target_port = address

    if not _proxy_host or not _proxy_port:
        return _original_create_connection(address, timeout, source_address, **kwargs)

    # Connect to the proxy instead
    proxy_address = (_proxy_host, _proxy_port)
    sock = _original_create_connection(proxy_address, timeout, source_address, **kwargs)

    try:
        _send_connect_request(sock, target_host, target_port)
        return sock
    except Exception:
        sock.close()
        raise


def _proxied_socket_connect(self: socket.socket, address: Tuple[str, int]) -> None:
    """Replacement for socket.socket.connect that routes through the proxy.

    This is a lower-level hook than create_connection and catches direct
    socket.connect() calls.

    Note: This only works for TCP sockets (SOCK_STREAM). UDP and other
    socket types are passed through unchanged.
    """
    # Only intercept TCP sockets
    if self.type != socket.SOCK_STREAM:
        return _original_socket_connect(self, address)

    target_host, target_port = address

    if not _proxy_host or not _proxy_port:
        return _original_socket_connect(self, address)

    # Connect to the proxy instead
    proxy_address = (_proxy_host, _proxy_port)
    _original_socket_connect(self, proxy_address)

    # Establish CONNECT tunnel (raises on failure)
    _send_connect_request(self, target_host, target_port)


# ============================================================================
# Public API
# ============================================================================

def install_socket_proxy(
    proxy_host: str = "",
    proxy_port: int = 0,
    proxy_url: str = "",
) -> bool:
    """Install socket-level proxy interception.

    This patches socket.create_connection and socket.socket.connect to route
    ALL TCP connections through the specified proxy server.

    The proxy must support the HTTP CONNECT method (standard for HTTPS proxies).

    This function is thread-safe and can be called from multiple threads.

    Args:
        proxy_host: Proxy server hostname or IP
        proxy_port: Proxy server port (must be 1-65535)
        proxy_url: Alternative: full proxy URL (e.g., "http://proxy:4750")
                   Port MUST be specified in the URL - no default is assumed.

    Returns:
        True if proxy was installed, False if already installed or disabled

    Raises:
        ValueError: If proxy_port is invalid (not in range 1-65535)

    Example:
        install_socket_proxy(proxy_url="http://smokescreen:4750")
    """
    global _proxy_installed, _proxy_host, _proxy_port

    with _install_lock:
        if _proxy_installed:
            return False

        # Parse proxy URL if provided
        if proxy_url:
            parsed = urlparse(proxy_url)
            proxy_host = parsed.hostname or ""
            # Require explicit port - fail fast if missing to avoid confusion
            # (e.g., smokescreen uses 4750, not standard 8080)
            proxy_port = parsed.port or 0

        if not proxy_host or not proxy_port:
            return False

        # Validate port range
        if proxy_port < 1 or proxy_port > 65535:
            raise ValueError(f"Invalid proxy port: {proxy_port}. Must be 1-65535.")

        _proxy_host = proxy_host
        _proxy_port = proxy_port

        # Patch socket functions
        socket.create_connection = _proxied_create_connection
        socket.socket.connect = _proxied_socket_connect

        _proxy_installed = True
        return True


def uninstall_socket_proxy() -> bool:
    """Remove socket-level proxy interception.

    Restores the original socket.create_connection and socket.socket.connect
    functions.

    This function is thread-safe.

    Returns:
        True if proxy was uninstalled, False if not installed
    """
    global _proxy_installed, _proxy_host, _proxy_port

    with _install_lock:
        if not _proxy_installed:
            return False

        socket.create_connection = _original_create_connection
        socket.socket.connect = _original_socket_connect

        _proxy_host = ""
        _proxy_port = 0
        _proxy_installed = False

        return True


def is_proxy_installed() -> bool:
    """Check if socket-level proxy interception is installed."""
    return _proxy_installed


def get_proxy_config() -> dict:
    """Get the current proxy configuration.

    Returns:
        Dictionary with proxy configuration:
        - installed: Whether proxy is installed
        - host: Proxy host
        - port: Proxy port
    """
    return {
        "installed": _proxy_installed,
        "host": _proxy_host,
        "port": _proxy_port,
    }
