from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class CooldownStatus(BaseModel):
    scope: Literal["application", "route"]
    action: str
    expires_at: datetime
