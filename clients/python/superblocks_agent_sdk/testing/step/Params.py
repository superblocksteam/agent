from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from superblocks_agent_sdk._util.convert import to_protobuf_value
from superblocks_agent_sdk._util.doc import modify_pdoc
from superblocks_agent_sdk.types_._DictDeserializable import DictDeserializable
from superblocks_types.api.v1.service_pb2 import Mock as ProtoMock


@dataclass(kw_only=True)
class Params(DictDeserializable):
    """
    Parameters for a Superblocks Step.

    Args:
        integration_type (Optional[str]): The integration type of this step. Defaults to `None`.
        step_name (Optional[str]): The name of this step. Defaults to `None`.
        configuration (Optional[dict]): The configuration of this step. Defaults to `None`.
    """

    integration_type: Optional[str] = None
    step_name: Optional[str] = None
    configuration: Optional[dict] = None

    def _to_proto_params(self) -> ProtoMock.Params:
        params = ProtoMock.Params()
        if self.integration_type is not None:
            params.integration_type = self.integration_type
        if self.step_name is not None:
            params.step_name = self.step_name
        if self.configuration is not None:
            params.inputs.CopyFrom(to_protobuf_value(self.configuration))
        return params

    @staticmethod
    def _from_dict(d: dict) -> Params:
        return Params(
            integration_type=d.get("integration"),
            step_name=d.get("name"),
            configuration=d.get("configuration"),
        )


__pdoc__ = modify_pdoc(dataclass=Params, exclude=["ProtoMock"])
