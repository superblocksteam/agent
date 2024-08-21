class RedisMalformedResponseError(Exception):
    def __init__(self, msg: str = ""):
        self.msg = msg

    def __str__(self):
        if self.msg:
            return f"Redis response is malformed: {self.msg}"
        else:
            return "Redis response is malformed"
