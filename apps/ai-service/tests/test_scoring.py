import json
from unittest.mock import MagicMock, patch


def _mock_groq_response(score: int, reasoning: str):
    """Builds a fake Groq completion object matching the shape
    groq_client.py reads: completion.choices[0].message.content"""
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = json.dumps(
        {"score": score, "reasoning": reasoning}
    )
    return mock_completion


VALID_PAYLOAD = {
    "source": "Referral",
    "notes": "Wants 5 laptops, budget confirmed, needs by month end.",
    "status": "NEW",
    "daysSinceCreated": 1,
    "contact": {
        "hasFullName": True,
        "hasEmail": True,
        "hasPhone": True,
        "companyName": "TechHub Electronics",
        "companyDomain": "techhub.com",
    },
}


def test_rejects_missing_internal_key(client):
    res = client.post("/score-lead", json=VALID_PAYLOAD)
    assert res.status_code == 422  # FastAPI: required header missing entirely


def test_rejects_wrong_internal_key(client):
    res = client.post(
        "/score-lead", json=VALID_PAYLOAD, headers={"X-Internal-Service-Key": "wrong"}
    )
    assert res.status_code == 401


def test_scores_a_lead_successfully(client, auth_headers):
    with patch("app.services.groq_client.client.chat.completions.create") as mock_create:
        mock_create.return_value = _mock_groq_response(85, "Clear bulk order with budget and timeline.")
        res = client.post("/score-lead", json=VALID_PAYLOAD, headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["score"] == 85
    assert body["reasoning"] == "Clear bulk order with budget and timeline."


def test_clamps_score_above_100(client, auth_headers):
    with patch("app.services.groq_client.client.chat.completions.create") as mock_create:
        mock_create.return_value = _mock_groq_response(150, "Overconfident model output.")
        res = client.post("/score-lead", json=VALID_PAYLOAD, headers=auth_headers)

    assert res.status_code == 200
    assert res.json()["score"] == 100


def test_clamps_score_below_0(client, auth_headers):
    with patch("app.services.groq_client.client.chat.completions.create") as mock_create:
        mock_create.return_value = _mock_groq_response(-20, "Somehow negative.")
        res = client.post("/score-lead", json=VALID_PAYLOAD, headers=auth_headers)

    assert res.status_code == 200
    assert res.json()["score"] == 0


def test_truncates_long_reasoning_to_300_chars(client, auth_headers):
    long_reasoning = "x" * 500
    with patch("app.services.groq_client.client.chat.completions.create") as mock_create:
        mock_create.return_value = _mock_groq_response(50, long_reasoning)
        res = client.post("/score-lead", json=VALID_PAYLOAD, headers=auth_headers)

    assert res.status_code == 200
    assert len(res.json()["reasoning"]) == 300


def test_rejects_missing_required_field(client, auth_headers):
    bad_payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "status"}
    res = client.post("/score-lead", json=bad_payload, headers=auth_headers)
    assert res.status_code == 422
