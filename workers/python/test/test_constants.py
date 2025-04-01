import os

import pytest

from constants import (
    AGENT_KEY_HEADER,
    SUPERBLOCKS_AGENT_ASYNC_REDIS,
    SUPERBLOCKS_AGENT_DOMAIN,
    SUPERBLOCKS_AGENT_HEALTH_HOST,
    SUPERBLOCKS_AGENT_HEALTH_PORT,
    SUPERBLOCKS_AGENT_INTAKE_TRACES_ENABLE,
    SUPERBLOCKS_AGENT_INTAKE_TRACES_URL,
    SUPERBLOCKS_AGENT_KEY,
    SUPERBLOCKS_AGENT_LOG_JSON_FORMAT,
    SUPERBLOCKS_AGENT_LOG_LEVEL,
    SUPERBLOCKS_AGENT_PLATFORM_NAME,
    SUPERBLOCKS_AGENT_REDIS_GROUP,
    SUPERBLOCKS_AGENT_REDIS_HOST,
    SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST,
    SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT,
    SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN,
    SUPERBLOCKS_AGENT_REDIS_PORT,
    SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE,
    SUPERBLOCKS_AGENT_REDIS_TOKEN,
    SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS,
    SUPERBLOCKS_AGENT_TLS_INSECURE,
    SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE,
    SUPERBLOCKS_SLIM_IMAGE,
    SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST,
    SUPERBLOCKS_WORKER_EXECUTION_PYTHON_TIMEOUT_MS,
    SUPERBLOCKS_WORKER_HEALTHY_PATH,
    SUPERBLOCKS_WORKER_ID,
    SUPERBLOCKS_WORKER_SUBPROCESS_GID,
    SUPERBLOCKS_WORKER_SUBPROCESS_UID,
    SUPERBLOCKS_WORKER_VERSION,
    get_env_var,
)


def test_get_env_var_gets_existing_env_var():
    os.environ["TEST_VAR"] = "test_value"
    assert get_env_var("TEST_VAR") == "test_value"


def test_get_env_var_unsets_by_default():
    os.environ["TEST_VAR"] = "test_value"
    get_env_var("TEST_VAR")
    assert os.environ.get("TEST_VAR", None) is None


def test_get_env_var_doesnt_unset():
    os.environ["TEST_VAR"] = "test_value"
    get_env_var("TEST_VAR", unset=False)
    assert os.environ.get("TEST_VAR", None) == "test_value"


def test_get_env_var_non_existing_str_default():
    assert get_env_var("NON_EXISTING_VAR", default="default_value") == "default_value"


def test_get_env_var_existing_int_cast():
    os.environ["INT_VAR"] = "123"
    assert get_env_var("INT_VAR", as_type=int) == 123


def test_get_env_var_bad_cast():
    os.environ["BAD_CAST_VAR"] = "not_an_int"
    with pytest.raises(ValueError) as context:
        get_env_var("BAD_CAST_VAR", as_type=int)
    assert "invalid literal for int() with base 10: 'not_an_int'" == str(context.value)


def test_get_env_var_bool_cast_true():
    os.environ["BOOL_VAR_TRUE"] = "True"
    assert get_env_var("BOOL_VAR_TRUE", as_type=bool) is True
    os.environ["BOOL_VAR_TRUE"] = "true"
    assert get_env_var("BOOL_VAR_TRUE", as_type=bool) is True
    os.environ["BOOL_VAR_TRUE"] = "1"
    assert get_env_var("BOOL_VAR_TRUE", as_type=bool) is True


def test_get_env_var_bool_cast_false():
    os.environ["BOOL_VAR_FALSE"] = "False"
    assert get_env_var("BOOL_VAR_FALSE", as_type=bool) is False
    os.environ["BOOL_VAR_FALSE"] = "false"
    assert get_env_var("BOOL_VAR_FALSE", as_type=bool) is False
    os.environ["BOOL_VAR_FALSE"] = "0"
    assert get_env_var("BOOL_VAR_FALSE", as_type=bool) is False


def test_get_env_var_bool_cast_invalid():
    os.environ["OS_BAD_BOOL"] = "notvalidbool"
    with pytest.raises(ValueError) as context:
        get_env_var("OS_BAD_BOOL", as_type=bool)
    assert "could not cast value 'notvalidbool' to bool" == str(context.value)


def test_get_env_var_as_type_list():
    os.environ["LIST_VAR"] = "foo,bar"
    assert get_env_var("LIST_VAR", as_type=list) == ["foo", "bar"]
    os.environ["LIST_VAR"] = "foo, bar"
    assert get_env_var("LIST_VAR", as_type=list) == ["foo", "bar"]
    os.environ["LIST_VAR"] = "foo"
    assert get_env_var("LIST_VAR", as_type=list) == ["foo"]
    os.environ["LIST_VAR"] = ""
    assert get_env_var("LIST_VAR", as_type=list) == []


# Cleanup environment variables to avoid side effects
@pytest.fixture(autouse=True)
def clean_env_vars():
    saved_env = os.environ.copy()
    yield
    os.environ.clear()
    os.environ.update(saved_env)


"""
Now you may be wondering: "Why are we unit testing constant default values?"

Good question.

1. These values are hardcoded
2. It's important that these values are initialized correctly
"""


def test_constant_defaults():
    saved_env = os.environ.copy()
    os.environ.clear()
    try:
        assert AGENT_KEY_HEADER == "x-superblocks-agent-key"
        assert SUPERBLOCKS_AGENT_PLATFORM_NAME == "main"
        assert SUPERBLOCKS_AGENT_DOMAIN == "superblocks.com"
        assert len(SUPERBLOCKS_WORKER_ID) == 36
        assert SUPERBLOCKS_WORKER_VERSION == "v0.0.0"
        assert SUPERBLOCKS_AGENT_KEY is None
        assert SUPERBLOCKS_WORKER_EXECUTION_PYTHON_TIMEOUT_MS == 1200000
        assert SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST == []
        assert SUPERBLOCKS_AGENT_INTAKE_TRACES_ENABLE is True
        assert (
            SUPERBLOCKS_AGENT_INTAKE_TRACES_URL
            == "https://traces.intake.superblocks.com/v1/traces"
        )
        assert SUPERBLOCKS_WORKER_SUBPROCESS_UID == 1000
        assert SUPERBLOCKS_WORKER_SUBPROCESS_GID == 1000
        assert SUPERBLOCKS_WORKER_HEALTHY_PATH == "/tmp/worker_healthy"
        assert SUPERBLOCKS_AGENT_TLS_INSECURE is False
        assert SUPERBLOCKS_AGENT_REDIS_HOST == "localhost"
        assert SUPERBLOCKS_AGENT_REDIS_PORT == 6379
        assert SUPERBLOCKS_AGENT_REDIS_TOKEN is None
        assert SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST == "localhost"
        assert SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT == 6379
        assert SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN is None
        assert SUPERBLOCKS_AGENT_REDIS_GROUP == ""
        assert SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE == 10000
        assert SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS == 3600
        assert SUPERBLOCKS_AGENT_LOG_JSON_FORMAT is True
        assert SUPERBLOCKS_AGENT_LOG_LEVEL == "INFO"
        assert (
            SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE
            == "https://logs.intake.superblocks.com"
        )
        assert SUPERBLOCKS_SLIM_IMAGE is False
        assert SUPERBLOCKS_AGENT_HEALTH_HOST == "127.0.0.1"
        assert SUPERBLOCKS_AGENT_HEALTH_PORT == 1717
        assert SUPERBLOCKS_AGENT_ASYNC_REDIS is True
    finally:
        os.environ.update(saved_env)
