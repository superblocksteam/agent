class RetryableError(Exception):
    def __init__(self, message=None):
        super().__init__(message)


class BusyError(RetryableError):
    def __init__(self, message=None):
        super().__init__(message)


class IntegrationError(Exception):
    def __init__(self, message=None):
        super().__init__(message)


class QuotaError(Exception):
    def __init__(self, message=None):
        super().__init__(message)
