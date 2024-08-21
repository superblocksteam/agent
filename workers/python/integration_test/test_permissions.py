def test_cannot_kill_parent_process(
    redis_client, generate_execute_request, generate_inbox_id
):
    inbox_id = generate_inbox_id()
    code_to_execute = """
    import os
    import signal

    os.kill(os.getppid(), signal.SIGTERM)
    """
    _, err = redis_client.execute(
        inbox_id, generate_execute_request(code_to_execute=code_to_execute)
    )

    assert err["name"] == "IntegrationError"
    assert "Operation not permitted" in err["message"]


def test_background_process_cleaned(
    redis_client, generate_execute_request, generate_inbox_id
):
    inbox_id = generate_inbox_id()
    code_to_execute = """
    import subprocess

    proc = subprocess.Popen(['sleep', '10000'])
    return proc.pid
    """

    response, _ = redis_client.execute(
        inbox_id, generate_execute_request(code_to_execute=code_to_execute)
    )

    inbox_id_2 = generate_inbox_id()
    code_to_execute = """
    import psutil

    return len([ proc for proc in psutil.process_iter() if proc.name() == 'sleep' ])
    """
    response, _ = redis_client.execute(
        inbox_id_2, generate_execute_request(code_to_execute=code_to_execute)
    )
    assert response["output"] == 0
