"""Request bodies for the REST API."""

from typing import Literal

from pydantic import BaseModel, Field


class LoginStart(BaseModel):
    method: Literal["claudeai", "console"] = "claudeai"


class LoginCode(BaseModel):
    code: str = Field(min_length=1)


class ApiKeyBody(BaseModel):
    api_key: str = Field(min_length=20)


class PathBody(BaseModel):
    path: str = Field(min_length=1)


class RenameBody(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    cwd: str | None = None
