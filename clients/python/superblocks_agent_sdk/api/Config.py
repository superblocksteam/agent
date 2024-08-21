# TODO: (joey) some of these imports are weird

from dataclasses import dataclass
from typing import Optional

from superblocks_agent_sdk._util.doc import modify_pdoc
from superblocks_agent_sdk.api.ViewMode import ViewMode


@dataclass(kw_only=True, eq=False)
class Config:
    """
    Configuration for a Superblocks API.
    Any configuration set here will override the configuration set in the client.

    Args:
        branch_name (Optional[str]): The default branch to use. Defaults to `None`.
        commit_id (Optional[str]): The ID of the commit to use. Defaults to `None`.
        profile (Optional[str]): The default profile to use. If not set, the default for view_mode will be used. Defaults to `None`.
        view_mode (superblocks_agent.api.ViewMode): The default view mode. Defaults to `ViewMode.DEPLOYED`.
    """

    branch_name: Optional[str] = None
    commit_id: Optional[str] = None
    profile: Optional[str] = None
    view_mode: ViewMode = ViewMode.EDITOR


__pdoc__ = modify_pdoc(dataclass=Config)
