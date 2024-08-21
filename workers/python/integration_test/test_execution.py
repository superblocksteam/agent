def test_can_run_hello_world(redis_client, generate_execute_request, generate_inbox_id):
    inbox_id = generate_inbox_id()
    code_to_execute = """
    return "hello world"
    """
    response, _ = redis_client.execute(
        inbox_id, generate_execute_request(code_to_execute=code_to_execute)
    )
    assert response["output"] == "hello world"


def test_can_run_with_globals(
    redis_client, generate_execute_request, generate_inbox_id
):
    inbox_id = generate_inbox_id()
    code_to_execute = """
    return foo
    """
    execution_request = generate_execute_request(
        code_to_execute=code_to_execute,
        globals={"foo": "bar"},
        bindingKeys=[{"key": "foo", "type": "global"}],
    )
    redis_client.write_global(execution_request["executionId"], "foo", "bar")
    response, _ = redis_client.execute(inbox_id, execution_request)
    assert response["output"] == "bar"


def test_can_run_with_json_globals(
    redis_client, generate_execute_request, generate_inbox_id
):
    inbox_id = generate_inbox_id()
    code_to_execute = """
    return foo.bar.baz
    """
    execution_request = generate_execute_request(
        code_to_execute=code_to_execute,
        globals={"foo": {"bar": {"baz": "qux"}}},
        bindingKeys=[{"key": "foo", "type": "global"}],
    )
    redis_client.write_global(
        execution_request["executionId"], "foo", {"bar": {"baz": "qux"}}
    )
    response, err = redis_client.execute(inbox_id, execution_request)
    assert err is None
    assert response["output"] == "qux"


def test_can_run_with_outputs(
    redis_client, generate_execute_request, generate_inbox_id
):
    inbox_id = generate_inbox_id()
    code_to_execute = """
    return foo
    """
    execution_request = generate_execute_request(
        code_to_execute=code_to_execute,
        outputs={"foo": "bar"},
        bindingKeys=[{"key": "foo", "type": "output"}],
    )
    redis_client.write_output(execution_request["executionId"], "foo", "bar")
    response, _ = redis_client.execute(inbox_id, execution_request)
    assert response["output"] == "bar"
