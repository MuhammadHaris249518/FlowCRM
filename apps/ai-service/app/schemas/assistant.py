from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


class AssistantToolCall(BaseModel):
    id: str
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class AssistantChatMessage(BaseModel):
    role: Literal["user", "assistant", "tool"]
    content: Optional[str] = None
    tool_call_id: Optional[str] = None
    name: Optional[str] = None
    tool_calls: Optional[list[AssistantToolCall]] = None


class AssistantToolDefinition(BaseModel):
    type: Literal["function"] = "function"
    function: dict[str, Any]


class AssistantChatRequest(BaseModel):
    messages: list[AssistantChatMessage]
    tools: list[AssistantToolDefinition] = Field(default_factory=list)


class AssistantChatResponse(BaseModel):
    role: Literal["assistant"] = "assistant"
    content: Optional[str] = None
    tool_calls: Optional[list[AssistantToolCall]] = None
