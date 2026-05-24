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

# from flask import Blueprint, request, jsonify
# from groq import Groq
# import os
# from dotenv import load_dotenv

# load_dotenv()

# chat_bp = Blueprint("chat", __name__)

# # Pass the API key directly since you said you still want to use it here
# client = Groq(
#     api_key= os.getenv("GROQ_API_KEY")
# )

# GROQ_MODEL = "openai/gpt-oss-120b"


# @chat_bp.route("/ask", methods=["POST"])
# def generate():
#     data = request.get_json(silent=True) or {}
#     prompt = (data.get("prompt") or "").strip()

#     if not prompt:
#         return jsonify({"error": "Missing 'prompt'"}), 400

#     try:
#         completion = client.chat.completions.create(
#             model=GROQ_MODEL,
#             messages=[
#                 {
#                     "role": "system",
#                     "content": "You are a helpful store assistant. Answer product questions clearly and briefly."
#                 },
#                 {
#                     "role": "user",
#                     "content": prompt
#                 }
#             ],
#             temperature=1,
#             max_completion_tokens=1024,
#             top_p=1,
#             reasoning_effort="medium",
#             stream=True,
#             stop=None
#         )

#         chunks = []
#         for chunk in completion:
#             if (
#                 chunk.choices
#                 and chunk.choices[0].delta
#                 and chunk.choices[0].delta.content
#             ):
#                 chunks.append(chunk.choices[0].delta.content)

#         output = "".join(chunks).strip()

#         return jsonify({"output": output})

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

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

# from flask import Blueprint, request, jsonify
# from groq import Groq
# import os
# from dotenv import load_dotenv

# load_dotenv()

# chat_bp = Blueprint("chat", __name__)

# # Pass the API key directly since you said you still want to use it here
# client = Groq(
#     api_key= os.getenv("GROQ_API_KEY")
# )

# GROQ_MODEL = "openai/gpt-oss-120b"


# @chat_bp.route("/ask", methods=["POST"])
# def generate():
#     data = request.get_json(silent=True) or {}
#     prompt = (data.get("prompt") or "").strip()

#     if not prompt:
#         return jsonify({"error": "Missing 'prompt'"}), 400

#     try:
#         completion = client.chat.completions.create(
#             model=GROQ_MODEL,
#             messages=[
#                 {
#                     "role": "system",
#                     "content": "You are a helpful store assistant. Answer product questions clearly and briefly."
#                 },
#                 {
#                     "role": "user",
#                     "content": prompt
#                 }
#             ],
#             temperature=1,
#             max_completion_tokens=1024,
#             top_p=1,
#             reasoning_effort="medium",
#             stream=True,
#             stop=None
#         )

#         chunks = []
#         for chunk in completion:
#             if (
#                 chunk.choices
#                 and chunk.choices[0].delta
#                 and chunk.choices[0].delta.content
#             ):
#                 chunks.append(chunk.choices[0].delta.content)

#         output = "".join(chunks).strip()

#         return jsonify({"output": output})

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

from flask import Blueprint, request, jsonify
from groq import Groq
from models import Product
import os
import re
from dotenv import load_dotenv

load_dotenv()

chat_bp = Blueprint("chat", __name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

GROQ_MODEL = "openai/gpt-oss-120b"


def clean_words(text):
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return [word for word in text.split() if len(word) > 2]


def find_matching_product(prompt):
    products = Product.query.all()

    prompt_lower = (prompt or "").lower()
    prompt_words = clean_words(prompt_lower)

    best_match = None
    best_score = 0

    for product in products:
        product_name = product.name or ""
        product_description = product.description or ""

        searchable_text = f"{product_name} {product_description}".lower()
        product_words = clean_words(searchable_text)

        score = 0

        if product_name.lower() in prompt_lower:
            score += 20

        for word in product_words:
            if word in prompt_words:
                score += 3

        if score > best_score:
            best_score = score
            best_match = product

    return best_match if best_score > 0 else None


def get_product_link(product):
    return f"http://127.0.0.1:5001/productDetails?id={product.id}"


def get_stock_status(product):
    inventory = getattr(product, "inventory", None)
    available = getattr(product, "available", None)

    if available is False:
        return "Out of Stock"

    if inventory is None:
        return "Available" if available else "Not Available"

    if inventory > 0:
        return f"In Stock ({inventory} available)"

    return "Out of Stock"


def build_product_details_response(product):
    product_link = get_product_link(product)

    product_details = [
        f"Product Name: {product.name}",
        f"Price: ${float(product.price):.2f}",
        f"Description: {product.description or 'No description available.'}",
        f"Stock: {get_stock_status(product)}",
    ]

    category = getattr(product, "category", None)
    if category:
        product_details.append(f"Category: {category}")

    specifications = getattr(product, "specifications", None)
    if specifications:
        product_details.append(f"Specifications: {specifications}")

    rating = getattr(product, "rating", None)
    if rating:
        product_details.append(f"Rating: {rating}")

    image_url = getattr(product, "image_url", None)
    if image_url:
        product_details.append(f"Image: {image_url}")

    product_details.append(
        f'Product Link: <a href="{product_link}" target="_blank" rel="noopener noreferrer">{product_link}</a>'
    )

    return "<br>".join(product_details)


@chat_bp.route("/ask", methods=["POST"])
def generate():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"error": "Missing 'prompt'"}), 400

    matched_product = find_matching_product(prompt)

    # If a product is found, always return the real database product info.
    # This prevents the AI from making fake links like store.example.com.
    if matched_product:
        product_link = get_product_link(matched_product)
        output = build_product_details_response(matched_product)

        return jsonify(
            {
                "output": output,
                "product": matched_product.to_dict(),
                "product_link": product_link,
            }
        )

    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful store assistant. "
                        "Answer clearly and briefly. "
                        "Do not invent product links. "
                        "Only provide a product link if it is given by the database."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.7,
            max_completion_tokens=1024,
            top_p=1,
            reasoning_effort="medium",
            stream=True,
            stop=None,
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

        return jsonify(
            {
                "output": output,
                "product": None,
                "product_link": None,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500