import logging

logger = logging.getLogger(__name__)


class ApplicationException(Exception):
    """
    Single blueprint exception for the entire app.

    Fields:
        name       – Where the error comes from, e.g. "OPENAI_SERVICE", "IMAGEKIT_SERVICE"
        message    – Human-readable description of what went wrong
        statusCode – HTTP status code
        errors     – Raw error details (list of strings, API error dicts, etc.)
    """

    def __init__(self, *, name: str, message: str, statusCode: int = 500, errors: list = None):
        super().__init__(message)
        self.name = name
        self.message = message
        self.statusCode = statusCode
        self.errors = errors or []

        logger.error(f"[{self.name}] {self.message}")


class NotFoundException(ApplicationException):
    def __init__(self, message: str = "Resource not found", errors: list = None):
        super().__init__(name="NOT_FOUND", message=message, statusCode=404, errors=errors)


class UnauthorizedException(ApplicationException):
    def __init__(self, message: str = "Unauthorized", errors: list = None):
        super().__init__(name="UNAUTHORIZED", message=message, statusCode=401, errors=errors)


#  child class instance is also considered the instance of the parent class 