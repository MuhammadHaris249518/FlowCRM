"""
One Groq turn for the in-product CRM assistant.

Node owns the tool loop and the database. This service is stateless: it
receives conversation + tool schemas, calls Groq once, and returns either
a final reply or tool_calls for Node to execute.
"""
import json
from groq import Groq
from app.core.config import GROQ_API_KEY, GROQ_MODEL
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse, AssistantToolCall

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are FlowCRM's in-product sales assistant. You answer \
questions about THIS user's CRM using the provided tools.

Hard rules:
- Call tools to get live data before answering anything about leads, deals, \
tasks, contacts, companies, pipeline, reports, emails, documents, or workflows. \
Never invent names, scores, dollar amounts, or counts.
- If a tool returns an empty list or a not-found error, say so. Do not \
fabricate example records.
- You may use contact names, company names, and emails from tool results — \
the user already has this data in their workspace.
- "Best target leads" / "who should I focus on": call search_leads with \
sortBy=score (and optionally get_workspace_snapshot for stale follow-ups).
- Email: use draft_email. Never claim an email was sent. Drafts become a \
review Task for a human. You cannot send mail.
- Scoring: use score_lead with a real lead id from a prior search. Score at \
most 5 leads per user message.
- You cannot create workflows, change deal stages, delete records, invite \
users, or modify settings. Point the user to the matching page for those.
- Be concise. Use short bullet lists when naming multiple records. Include \
score and id when listing leads.
- If the question is unrelated to this CRM, decline politely.
"""


def _to_groq_messages(payload: AssistantChatRequest) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in payload.messages:
        if msg.role == "tool":
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": msg.tool_call_id,
                    "name": msg.name,
                    "content": msg.content or "",
                }
            )
            continue

        entry: dict = {"role": msg.role, "content": msg.content}
        if msg.role == "assistant" and msg.tool_calls:
            entry["tool_calls"] = [
                {
                    "id": call.id,
                    "type": "function",
                    "function": {
                        "name": call.name,
                        "arguments": json.dumps(call.arguments),
                    },
                }
                for call in msg.tool_calls
            ]
        messages.append(entry)
    return messages


def _to_groq_tools(payload: AssistantChatRequest) -> list[dict] | None:
    if not payload.tools:
        return None
    return [tool.model_dump() for tool in payload.tools]


def _parse_tool_calls(raw_calls) -> list[AssistantToolCall] | None:
    if not raw_calls:
        return None
    parsed: list[AssistantToolCall] = []
    for call in raw_calls:
        try:
            arguments = json.loads(call.function.arguments or "{}")
        except json.JSONDecodeError:
            arguments = {}
        if not isinstance(arguments, dict):
            arguments = {}
        parsed.append(
            AssistantToolCall(id=call.id, name=call.function.name, arguments=arguments)
        )
    return parsed or None


def run_assistant_turn(payload: AssistantChatRequest) -> AssistantChatResponse:
    kwargs: dict = {
        "model": GROQ_MODEL,
        "messages": _to_groq_messages(payload),
        "temperature": 0.2,
    }
    tools = _to_groq_tools(payload)
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"

    completion = client.chat.completions.create(**kwargs)
    message = completion.choices[0].message
    tool_calls = _parse_tool_calls(getattr(message, "tool_calls", None))

    return AssistantChatResponse(
        content=message.content,
        tool_calls=tool_calls,
    )
