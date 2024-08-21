from superblocks_agent_sdk.api import Api
from superblocks_agent_sdk.client import Client
from superblocks_agent_sdk.client import Config as ClientConfig

from .env import API_ID, ENDPOINT, TOKEN


def get_client() -> Client:
    return Client(config=ClientConfig(endpoint=ENDPOINT, token=TOKEN))


def get_api() -> Api:
    return Api(API_ID)
