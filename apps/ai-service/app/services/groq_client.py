import json
from groq import Groq
from app.core.config import GROQ_API_KEY, GROQ_MODEL
from app.schemas.scoring import ScoreLeadRequest

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are a B2B sales lead qualification assistant for a CRM.
Score how likely this lead is to convert into a paying customer, from 0 to 100.

Weigh these signals:
- Lead source quality (a Referral or Demo Request is stronger than Cold
  Outreach or an unspecified source).
- Notes: read them for concrete buying signals — stated budget, timeline,
  team size, decision-making authority, urgency. Vague or empty notes should
  not inflate the score just because notes exist.
- Contact completeness: a lead with a full name, work email, and phone is
  more real than one missing most of that.
- Company signal: a lead linked to a company with a real business email
  domain is stronger than one with no company at all.
- Staleness: a lead sitting untouched for many days without status progress
  is a weaker signal, not a stronger one.

Respond with ONLY a JSON object, no other text:
{"score": <integer 0-100>, "reasoning": "<one sentence, under 30 words>"}
"""


def score_lead(payload: ScoreLeadRequest) -> dict:
    user_content = json.dumps(payload.model_dump())

    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    raw = completion.choices[0].message.content
    parsed = json.loads(raw)

    # Never trust the model's range compliance blindly — clamp server-side.
    score = max(0, min(100, int(parsed["score"])))
    reasoning = str(parsed["reasoning"])[:300]

    return {"score": score, "reasoning": reasoning}
