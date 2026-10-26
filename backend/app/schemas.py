from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=128)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Enter a valid email address")
        return v


class RegisterRequest(BaseModel):
    customer_id: str = Field(min_length=4, max_length=20, pattern=r"^[A-Za-z0-9]+$")
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    domain: Literal["insurance", "banking"] = "insurance"

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Enter a valid email address")
        return v

    @field_validator("password")
    @classmethod
    def _strength(cls, v: str) -> str:
        if not (any(c.isalpha() for c in v) and any(c.isdigit() for c in v)):
            raise ValueError("Password must contain at least one letter and one number")
        return v


class ProfileUpdate(BaseModel):
    """Only non-sensitive fields are editable. KYC, name, DOB and email are not."""
    phone: Optional[str] = Field(default=None, pattern=r"^[+0-9 \-]{8,20}$")
    address: Optional[str] = Field(default=None, min_length=3, max_length=255)
    city: Optional[str] = Field(default=None, min_length=2, max_length=80)
    state: Optional[str] = Field(default=None, min_length=2, max_length=80)
    pincode: Optional[str] = Field(default=None, pattern=r"^[0-9]{6}$")


class QueryContext(BaseModel):
    type: Literal["payment", "claim", "policy", "renewal"]
    id: str = Field(max_length=40)


class AssistantQuery(BaseModel):
    message: str = Field(min_length=3, max_length=1000)
    conversation_id: Optional[str] = Field(default=None, max_length=64)
    context: Optional[QueryContext] = None


class FeedbackRequest(BaseModel):
    query_id: int
    value: Literal["up", "down"]
