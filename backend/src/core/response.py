from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """
    Standard response wrapper for ALL success responses.

    Every endpoint returns this shape:
    {
        "success": true,
        "message": "Human-readable message",
        "data": { ... },           ← the actual payload (typed per endpoint)
        "statusCode": 200
    }

    Error responses (from error_handler.py) follow:
    {
        "success": false,
        "name": "ERROR_NAME",
        "message": "What went wrong",
        "statusCode": 4xx/5xx,
        "errors": [...]
    }
    """
    success: bool = True
    message: str
    data: Optional[T] = None
    statusCode: int = 200
