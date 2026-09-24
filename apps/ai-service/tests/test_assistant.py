from unittest.mock import MagicMock, patch


def _mock_text_response(text: str):
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = text
    mock_completion.choices[0].message.tool_calls = None
    return mock_completion


def _mock_tool_call_response(call_id: str, name: str, arguments: str):
    mock_call = MagicMock()
    mock_call.id = call_id
    mock_call.function.name = name
    mock_call.function.arguments = arguments
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = None
    mock_completion.choices[0].message.tool_calls = [mock_call]
    return mock_completion


VALID_PAYLOAD = {
    "messages": [{"role": "user", "content": "Who are my best target leads?"}],
    "tools": [
        {
            "type": "function",
            "function": {
                "name": "search_leads",
                "description": "Search leads",
                "parameters": {"type": "object", "properties": {}},
            },
        }
    ],
}


def test_rejects_missing_internal_key(client):
    res = client.post("/assistant/chat", json=VALID_PAYLOAD)
    assert res.status_code == 422


def test_rejects_wrong_internal_key(client):
    res = client.post(
        "/assistant/chat",
        json=VALID_PAYLOAD,
        headers={"X-Internal-Service-Key": "wrong"},
    )
    assert res.status_code == 401


def test_returns_assistant_text(client, auth_headers):
    with patch("app.services.assistant_chat.client.chat.completions.create") as mock_create:
        mock_create.return_value = _mock_text_response(
            "Your highest-scoring open lead is Acme at 91."
        )
        res = client.post("/assistant/chat", json=VALID_PAYLOAD, headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["role"] == "assistant"
    assert "Acme" in body["content"]
    assert body["tool_calls"] is None
    messages = mock_create.call_args.kwargs["messages"]
    assert messages[0]["role"] == "system"
    assert mock_create.call_args.kwargs["tools"][0]["function"]["name"] == "search_leads"


def test_returns_parsed_tool_calls(client, auth_headers):
    with patch("app.services.assistant_chat.client.chat.completions.create") as mock_create:
        mock_create.return_value = _mock_tool_call_response(
            "call_1", "search_leads", '{"sortBy":"score","limit":5}'
        )
        res = client.post("/assistant/chat", json=VALID_PAYLOAD, headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["content"] is None
    assert body["tool_calls"][0]["name"] == "search_leads"
    assert body["tool_calls"][0]["arguments"]["sortBy"] == "score"
    assert body["tool_calls"][0]["arguments"]["limit"] == 5


def test_malformed_tool_arguments_become_empty_dict(client, auth_headers):
    with patch("app.services.assistant_chat.client.chat.completions.create") as mock_create:
        mock_create.return_value = _mock_tool_call_response("call_1", "search_leads", "not-json")
        res = client.post("/assistant/chat", json=VALID_PAYLOAD, headers=auth_headers)

    assert res.status_code == 200
    assert res.json()["tool_calls"][0]["arguments"] == {}
