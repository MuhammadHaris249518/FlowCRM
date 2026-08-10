"""
Evaluator-Optimizer loop for AI-drafted outreach emails.

Flow: draft -> evaluate -> (approved or out of revisions? END : draft again)

This never sends anything. Its only job is to produce a subject/body pair
that Node will later wrap in a draft Task for a human sales rep to review.
"""
import json
from typing import TypedDict

from langgraph.graph import StateGraph, END
from groq import Groq

from app.core.config import GROQ_API_KEY, GROQ_MODEL

client = Groq(api_key=GROQ_API_KEY)

MAX_REVISIONS = 2

DRAFT_SYSTEM_PROMPT = """You are a B2B sales rep's writing assistant for a CRM. \
Write a short, professional outreach/follow-up email based on the given \
instructions and context. Never invent facts (pricing, dates, promises) \
that are not present in the instructions or context — if something is \
missing, write around it generically rather than fabricating it.

Respond with ONLY a JSON object, no other text:
{"subject": "<subject line>", "body": "<email body, plain text, no markdown>"}
"""

EVALUATE_SYSTEM_PROMPT = """You are a strict editor reviewing a sales email \
draft before it reaches a human for approval. Check:
- Does it actually follow the given instructions?
- Is the tone professional, not pushy or generic filler?
- Are there any claims (price, dates, guarantees) not grounded in the \
provided context or instructions? If so, reject it.
- Is it a reasonable length for a follow-up email (not a wall of text)?

Respond with ONLY a JSON object, no other text:
{"approved": <true or false>, "feedback": "<one or two sentences. If \
approved, briefly say why. If not approved, say exactly what to fix.>"}
"""


class EmailDraftState(TypedDict):
    instructions: str
    context: dict
    subject: str
    body: str
    feedback: str
    approved: bool
    revision_count: int


def _chat_json(system_prompt: str, user_content: str) -> dict:
    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
    )
    return json.loads(completion.choices[0].message.content)


def draft_node(state: EmailDraftState) -> dict:
    payload = {
        "instructions": state["instructions"],
        "context": state["context"],
    }
    if state.get("feedback"):
        payload["previous_feedback_to_address"] = state["feedback"]
        payload["previous_subject"] = state.get("subject")
        payload["previous_body"] = state.get("body")

    result = _chat_json(DRAFT_SYSTEM_PROMPT, json.dumps(payload))

    return {
        "subject": str(result["subject"])[:200],
        "body": str(result["body"])[:5000],
        "revision_count": state.get("revision_count", 0) + 1,
    }


def evaluate_node(state: EmailDraftState) -> dict:
    payload = {
        "instructions": state["instructions"],
        "context": state["context"],
        "subject": state["subject"],
        "body": state["body"],
    }
    result = _chat_json(EVALUATE_SYSTEM_PROMPT, json.dumps(payload))

    return {
        "approved": bool(result["approved"]),
        "feedback": str(result["feedback"])[:500],
    }


def route_after_evaluate(state: EmailDraftState) -> str:
    if state["approved"]:
        return END
    if state["revision_count"] >= MAX_REVISIONS:
        return END
    return "draft"


def build_graph():
    builder = StateGraph(EmailDraftState)
    builder.add_node("draft", draft_node)
    builder.add_node("evaluate", evaluate_node)
    builder.set_entry_point("draft")
    builder.add_edge("draft", "evaluate")
    builder.add_conditional_edges(
        "evaluate", route_after_evaluate, {"draft": "draft", END: END}
    )
    return builder.compile()


_graph = build_graph()


def run_email_draft(instructions: str, context: dict) -> dict:
    """Synchronous, blocking. Callers must run this off the event loop —
    see app/routers/email_draft.py, which wraps it in asyncio.to_thread."""
    initial_state: EmailDraftState = {
        "instructions": instructions,
        "context": context,
        "subject": "",
        "body": "",
        "feedback": "",
        "approved": False,
        "revision_count": 0,
    }
    final_state = _graph.invoke(initial_state)

    return {
        "subject": final_state["subject"],
        "body": final_state["body"],
        "revisionCount": final_state["revision_count"],
        "finalFeedback": final_state["feedback"],
    }
