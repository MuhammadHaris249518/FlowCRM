from unittest.mock import patch

from app.services import job_store

VALID_PAYLOAD = {
    "instructions": "Follow up about the demo we gave last week.",
    "context": {"contactName": "Ahmed", "companyName": "TechHub"},
}


def test_rejects_missing_internal_key(client):
    res = client.post("/email/draft", json=VALID_PAYLOAD)
    assert res.status_code == 422


def test_rejects_wrong_internal_key(client):
    res = client.post(
        "/email/draft", json=VALID_PAYLOAD, headers={"X-Internal-Service-Key": "wrong"}
    )
    assert res.status_code == 401


def test_creates_a_job_and_returns_immediately(client, auth_headers):
    # The actual LangGraph loop runs in a background task — this only
    # tests that the endpoint itself returns 202 + a job id right away,
    # without waiting for that background work to finish.
    with patch("app.routers.email_draft.asyncio.create_task"):
        res = client.post("/email/draft", json=VALID_PAYLOAD, headers=auth_headers)

    assert res.status_code == 202
    body = res.json()
    assert body["status"] == "pending"
    assert body["jobId"]


def test_rejects_missing_instructions(client, auth_headers):
    bad_payload = {"context": {}}
    res = client.post("/email/draft", json=bad_payload, headers=auth_headers)
    assert res.status_code == 422


def test_get_status_rejects_missing_internal_key(client):
    res = client.get("/email/draft/some-job-id")
    assert res.status_code == 422


def test_get_status_404_for_unknown_job(client, auth_headers):
    res = client.get("/email/draft/does-not-exist", headers=auth_headers)
    assert res.status_code == 404


def test_get_status_reflects_completed_job(client, auth_headers):
    job_id = job_store.create_job()
    job_store.update_job(
        job_id,
        status="completed",
        result={
            "subject": "Following up",
            "body": "Hi Ahmed, ...",
            "revisionCount": 1,
            "finalFeedback": "Looks good.",
        },
    )

    res = client.get(f"/email/draft/{job_id}", headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "completed"
    assert body["result"]["subject"] == "Following up"
    assert body["error"] is None


def test_get_status_reflects_failed_job(client, auth_headers):
    job_id = job_store.create_job()
    job_store.update_job(job_id, status="failed", error="Groq API timeout")

    res = client.get(f"/email/draft/{job_id}", headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "failed"
    assert body["error"] == "Groq API timeout"
    assert body["result"] is None
