from unittest.mock import patch, MagicMock


# This test ensures that the chatbox returns 400 when no prompt is entered
def test_ask_without_prompt_returns_400(client):
    resp = client.post("/ai/ask", json={})
    assert resp.status_code == 400

    data = resp.get_json()
    assert data is not None
    assert "error" in data


# This test does not connect to Groq itself.
# It mocks the Groq streamed response and checks that chat.py builds the output.
@patch("chat.client.chat.completions.create")
def test_ask_with_prompt_calls_groq_and_returns_output(mock_create, client):
    mock_chunk = MagicMock()
    mock_chunk.choices = [MagicMock()]
    mock_chunk.choices[0].delta = MagicMock()
    mock_chunk.choices[0].delta.content = "Hello from Groq!"

    mock_create.return_value = [mock_chunk]

    resp = client.post("/ai/ask", json={"prompt": "Hello?"})

    assert resp.status_code == 200

    data = resp.get_json()
    assert data is not None
    assert "output" in data
    assert data["output"] == "Hello from Groq!"

    mock_create.assert_called_once()