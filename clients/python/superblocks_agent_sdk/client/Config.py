import urllib.parse
from dataclasses import dataclass
from typing import Optional

from superblocks_agent_sdk._constant import DEFAULT_AGENT_ENDPOINT
from superblocks_agent_sdk._util.doc import modify_pdoc


@dataclass(kw_only=True, eq=False)
class Config:
    """
    Client configuration.
    Any configuration set here will be overridden the configuration set in the client.

    Args:
        token: (str): The agent auth token.
        endpoint: (str): The endpoint of the execution engine. Defaults to `'agent.superblocks.com:8443'`
        authority (Optional[str]): The authority to use. Defaults to `None`.
        insecure (bool): Whether to use an insecure channel or not. Defaults to `False`.
    """

    token: str
    endpoint: str = DEFAULT_AGENT_ENDPOINT
    authority: Optional[str] = None
    insecure: bool = False

    @property
    def token_formatted(self) -> str:
        """
        Returns the token formatted as the agent expects it to be.
        Will URL decode the token.
        Returns:
            str: The formatted token.
        """
        return f"Bearer {urllib.parse.unquote(self.token)}"


__pdoc__ = modify_pdoc(dataclass=Config)
