import os
from typing import Optional

from dotenv import load_dotenv


class EnvironmentReader:
    @staticmethod
    def get(
        name: str, default: Optional[any] = None, *, err_if_not_found: bool = True
    ) -> str:
        load_dotenv()
        env_var = os.getenv(name)
        if env_var is None:
            env_var = default
        if err_if_not_found and env_var is None:
            raise Exception(f"env var '{name}' not found")
        return env_var
