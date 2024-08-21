# TODO: (joey) some of these imports are weird

from typing import Optional

from superblocks_agent_sdk._util.convert import from_protobuf_value, to_protobuf_value
from superblocks_agent_sdk._util.decorator import support_sync
from superblocks_agent_sdk._util.doc import modify_pdoc
from superblocks_agent_sdk._util.generate import get_unique_id_for_object
from superblocks_agent_sdk.api.Config import Config as ApiConfig
from superblocks_agent_sdk.api.Result import Result
from superblocks_agent_sdk.client import Client
from superblocks_agent_sdk.testing.step import Mock, Params
from superblocks_types.api.v1.service_pb2 import (
    ExecuteRequest,
    Function,
    StreamResponse,
    TwoWayRequest,
    TwoWayResponse,
)
from superblocks_types.api.v1.service_pb2_grpc import ExecutorServiceStub
from superblocks_types.common.v1.common_pb2 import Profile
from superblocks_types.common.v1.errors_pb2 import Error


class Api:
    """
    A representation of a Superblocks API.
    """

    def __init__(self, id_: str, *, config: Optional[ApiConfig] = None):
        """
        Args:
            id_ (str): The API ID.
            config (Optional[superblocks_agent.api.Config]): The API configuration. Defaults to `ApiConfig`.
        """

        self.id_ = id_
        self.__config = config or ApiConfig()
        self.mock_func_lookup: dict[str, callable] = {}

    @support_sync(async_is_default=False)
    async def run(
        self,
        *,
        client: Client,
        inputs: Optional[dict] = None,
        mocks: Optional[list[Mock]] = None,
    ) -> Result:
        """
        Runs *this* api.

        Args:
            client (superblocks_agent.client.Client): The client to use for this API run.
            inputs (Optional[dict]): The inputs to use for this API run. Defaults to `{}`.
            mocks (Optional[list[superblocks_agent.testing.step.Mock]]): The mocks to use for this API run. Defaults to `[]`.
            run_async (bool): Whether to run this function asyncronously or not. Defaults to `False`.

        Returns:
            superblocks_agent.api.Result: `run_async=False` The result of the API run.
            typing.Coroutine[superblocks_agent.api.Result, None, None]: `run_async=True` The result of the API run.
        """
        mocks = [] if mocks is None else mocks
        inputs = {} if inputs is None else inputs

        # hydrate mock lookup dict so we can reference it later
        self.__hydrate_mock_func_lookup(mocks)

        stream_responses = await client._run(
            with_stub=ExecutorServiceStub,
            stub_func_name="TwoWayStream",
            initial_request=TwoWayRequest(
                execute=self.__build_execute_request(
                    inputs=inputs, mocks=mocks, client=client
                )
            ),
            response_handler=self.__get_handle_two_way_response_func(),
        )
        return Result._from_proto_stream_responses(stream_responses)

    def __hydrate_mock_func_lookup(self, mocks: list[Mock]) -> None:
        """
        This function is called before every API run.
        It hydrates a map that belongs to this API which allows the lookup of mock return functions.
        """
        for mock in mocks:
            if mock._get_return_callable() is not None:
                self.mock_func_lookup[
                    get_unique_id_for_object(mock._get_return_callable())
                ] = mock._get_return_callable()
            if mock._get_when_callable() is not None:
                self.mock_func_lookup[
                    get_unique_id_for_object(mock._get_when_callable())
                ] = mock._get_when_callable()

    def __get_handle_two_way_response_func(self) -> callable:
        def handle_two_way_response(
            response: TwoWayResponse,
        ) -> tuple[Optional[TwoWayRequest], Optional[StreamResponse]]:
            """
            Function to handle each TwoWayResponse.
            """
            match response:
                # CASE 1
                # RESPONSE TYPE: TwoWayResponse.Function.Request
                # the orchestrator is asking us to run a local function to determine the step output
                # 1. locate the function we should run
                # 2. call the function with the parameters the orchestrator gave us
                # 3. send the orchestrator a response with the output/error of the function call
                case _ if response.HasField("function"):
                    # find function we want to execute
                    function_to_execute: Optional[callable] = self.mock_func_lookup.get(
                        response.function.name
                    )

                    if function_to_execute is None:
                        raise Exception("FOUND NO FUNCTION TO EXECUTE!")
                    # execute function with params and send response
                    function_response = Function.Response(id=response.function.id)
                    try:
                        resp = function_to_execute(
                            Params._from_dict(
                                *[
                                    from_protobuf_value(v)
                                    for v in response.function.parameters
                                ]
                            )
                        )
                        function_response.value.CopyFrom(to_protobuf_value(resp))
                    except Exception as e:
                        print(f"ERROR DURING FUNCTION EXECUTION: {e}")
                        function_response.error.CopyFrom(Error(message=str(e)))
                        # TODO: (joey) may want to add more fields to the error here
                    return TwoWayRequest(function=function_response), None

                # CASE 2
                # RESPONSE TYPE: TwoWayResponse.StreamResponse
                # a "normal" response from the orchestrator
                # just forward the metadata
                case _ if response.HasField("stream"):
                    return None, response
                case _:
                    raise Exception(f"got unexpected type: {type(response)}")

        return handle_two_way_response

    def __build_execute_request(
        self, *, inputs: dict, mocks: list[Mock], client: Client
    ) -> ExecuteRequest:
        """
        Returns a hydrated ExecuteRequest object.
        """
        execute_request = ExecuteRequest()
        for input_key, input_value in inputs.items():
            value = to_protobuf_value(input_value)
            execute_request.inputs[input_key].CopyFrom(value)

        # set options
        for self_mock in mocks:
            execute_request.mocks.append(self_mock._to_proto_mock())
        execute_request.options.include_event_outputs = True
        execute_request.options.include_events = True
        execute_request.options.include_api_events = True

        # NOTE: (joey) do we need to set any other ExecuteRequest.Options fields?

        # set inputs
        for k, v in inputs.items():
            execute_request.inputs[k].CopyFrom(to_protobuf_value(v))

        # set fetch
        execute_request.fetch.CopyFrom(self.__to_proto_fetch(client))

        return execute_request

    # TODO: (joey) add granular unit test for this
    def __to_proto_fetch(self, client: Client) -> ExecuteRequest.Fetch:
        """
        Returns a hydrated Fetch object to be used in an ExecuteRequest.
        """
        fetch = ExecuteRequest.Fetch()
        fetch.id = self.id_
        fetch.token = client.config.token_formatted

        if self.__config is not None and client.defaults is not None:
            profile_name = (
                self.__config.profile
                if self.__config.profile is not None
                else client.defaults.profile
            )
            if profile_name is not None:
                profile = Profile()
                profile.name = profile_name
                fetch.profile.CopyFrom(profile)
            view_mode = (
                self.__config.view_mode
                if self.__config.view_mode is not None
                else client.defaults.view_mode
            )
            if view_mode is not None:
                fetch.view_mode = view_mode._to_proto_view_mode()
            commit_id = (
                self.__config.commit_id
                if self.__config.commit_id is not None
                else client.defaults.commit_id
            )
            if commit_id is not None:
                fetch.commit_id = commit_id
            branch_name = (
                self.__config.branch_name
                if self.__config.branch_name is not None
                else client.defaults.branch_name
            )
            if branch_name is not None:
                fetch.branch_name = branch_name
        return fetch


__pdoc__ = modify_pdoc(
    exclude=[
        "Error",
        "ExecuteRequest",
        "Function",
        "Profile",
        "StreamResponse",
        "TwoWayRequest",
        "TwoWayResponse",
    ]
)
