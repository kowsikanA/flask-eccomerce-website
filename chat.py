# from flask import Blueprint, request, jsonify
# import os
# import requests
# import json

# chat_bp = Blueprint("chat", __name__)

# # Ollama configuration
# OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
# OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:1b")


# @chat_bp.route("/ask", methods=["POST"])
# def generate():
#     """Forward a prompt to the local Ollama model and return the generated text."""
#     data = request.get_json(silent=True) or {}
#     prompt = (data.get("prompt") or "").strip()

#     if not prompt:
#         return jsonify({"error": "Missing 'prompt'"}), 400

#     payload = {
#         "model": OLLAMA_MODEL,
#         "prompt": prompt,
#     }

#     try:
#         resp = requests.post(
#             OLLAMA_URL,
#             json=payload,
#             stream=True,
#             timeout=300,
#         )
#         resp.raise_for_status()
#     except requests.RequestException as e:
#         return jsonify({"error": f"Ollama request failed: {e}"}), 500

#     chunks = []
#     for line in resp.iter_lines():
#         if not line:
#             continue
#         try:
#             chunk = json.loads(line.decode("utf-8"))
#             piece = chunk.get("response", "")
#             if piece:
#                 chunks.append(piece)
#         except Exception:
#             # Ignore malformed lines and continue streaming
#             continue

#     output = "".join(chunks).strip()
#     return jsonify({"output": output})

from flask import Blueprint, request, jsonify
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

chat_bp = Blueprint("chat", __name__)

# Pass the API key directly since you said you still want to use it here
client = Groq(
    api_key= os.getenv("GROQ_API_KEY")
)

GROQ_MODEL = "openai/gpt-oss-120b"


@chat_bp.route("/ask", methods=["POST"])
def generate():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"error": "Missing 'prompt'"}), 400

    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful store assistant. Answer product questions clearly and briefly."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=1,
            max_completion_tokens=1024,
            top_p=1,
            reasoning_effort="medium",
            stream=True,
            stop=None
        )

        chunks = []
        for chunk in completion:
            if (
                chunk.choices
                and chunk.choices[0].delta
                and chunk.choices[0].delta.content
            ):
                chunks.append(chunk.choices[0].delta.content)

        output = "".join(chunks).strip()

        return jsonify({"output": output})

    except Exception as e:
        return jsonify({"error": str(e)}), 500