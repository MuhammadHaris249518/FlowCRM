import json
from unittest.mock import MagicMock, patch

from app.services.email_draft_graph import run_email_draft, MAX_REVISIONS


def _mock_completion(payload: dict):
    mock = MagicMock()
    mock.choices[0].message.content = json.dumps(payload)
    return mock


def test_approves_on_first_try_needs_no_revision():
    draft_response = _mock_completion({"subject": "Following up", "body": "Hi there."})
    evaluate_response = _mock_completion({"approved": True, "feedback": "Looks good."})

    with patch(
        "app.services.email_draft_graph.client.chat.completions.create",
        side_effect=[draft_response, evaluate_response],
    ):
        result = run_email_draft("Follow up about the quote", {"contactName": "Ahmed"})

    assert result["subject"] == "Following up"
    assert result["revisionCount"] == 1
    assert result["finalFeedback"] == "Looks good."


def test_rewrites_once_then_gets_approved():
    responses = [
        _mock_completion({"subject": "Draft 1", "body": "First attempt."}),
        _mock_completion({"approved": False, "feedback": "Too generic, mention the laptops."}),
        _mock_completion({"subject": "Draft 2", "body": "Second attempt, mentions laptops."}),
        _mock_completion({"approved": True, "feedback": "Much better."}),
    ]

    with patch(
        "app.services.email_draft_graph.client.chat.completions.create",
        side_effect=responses,
    ):
        result = run_email_draft("Follow up about the laptop order", {})

    assert result["subject"] == "Draft 2"
    assert result["revisionCount"] == 2
    assert result["finalFeedback"] == "Much better."


def test_terminates_at_max_revisions_instead_of_looping_forever():
    # Evaluate ALWAYS rejects — this is the test that protects the exact
    # infinite-loop risk this design was built to avoid.
    always_reject = _mock_completion({"approved": False, "feedback": "Still not right."})
    always_draft = _mock_completion({"subject": "Draft", "body": "Body."})

    # draft, evaluate, draft, evaluate, ... — alternating, capped by MAX_REVISIONS
    responses = [always_draft, always_reject] * (MAX_REVISIONS + 1)

    with patch(
        "app.services.email_draft_graph.client.chat.completions.create",
        side_effect=responses,
    ):
        result = run_email_draft("Anything", {})

    assert result["revisionCount"] == MAX_REVISIONS
    assert result["finalFeedback"] == "Still not right."


def test_second_draft_receives_previous_feedback():
    """Confirms the rewrite actually gets told what to fix, not just
    re-run blind — checks the second draft call's user message contains
    the first evaluation's feedback."""
    responses = [
        _mock_completion({"subject": "Draft 1", "body": "First."}),
        _mock_completion({"approved": False, "feedback": "SPECIFIC_FEEDBACK_MARKER"}),
        _mock_completion({"subject": "Draft 2", "body": "Second."}),
        _mock_completion({"approved": True, "feedback": "Fixed."}),
    ]

    with patch(
        "app.services.email_draft_graph.client.chat.completions.create",
        side_effect=responses,
    ) as mock_create:
        run_email_draft("Instructions", {})

    second_draft_call_args = mock_create.call_args_list[2]
    user_message = second_draft_call_args.kwargs["messages"][1]["content"]
    assert "SPECIFIC_FEEDBACK_MARKER" in user_message
