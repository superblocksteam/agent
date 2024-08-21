def test_files_cleaned_up(redis_client, generate_execute_request, generate_inbox_id):
    inbox_id = generate_inbox_id()
    code_to_execute = """
    import os
    with open("test.txt", "w") as f:
        f.write("hello world")

    return "done"
    """
    result, err = redis_client.execute(
        inbox_id, generate_execute_request(code_to_execute=code_to_execute)
    )

    assert result["output"] == "done"
    assert err is None

    inbox_id_2 = generate_inbox_id()
    code_to_execute = """
    import os
    with open("test.txt", "r") as f:
        return f.read()
    """
    _, err = redis_client.execute(
        inbox_id_2, generate_execute_request(code_to_execute=code_to_execute)
    )
    assert err["name"] == "IntegrationError"


def test_can_read_file_in_same_execution(
    redis_client, generate_execute_request, generate_inbox_id
):
    inbox_id = generate_inbox_id()
    code_to_execute = """
    import os

    with open("test.txt", "w") as f:
        f.write("hello world")

    with open("test.txt", "r") as f:
        return f.read()
    """
    result, _ = redis_client.execute(
        inbox_id, generate_execute_request(code_to_execute=code_to_execute)
    )

    assert result["output"] == "hello world"
