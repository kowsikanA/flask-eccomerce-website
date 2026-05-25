from flask import Blueprint, request, jsonify, session
from groq import Groq
from models import Product
from products import fetchApiProducts
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


def get_product_link(product):
    return (
        "https://flask-eccomerce-website.onrender.com/"
        f"productDetails?id={product.id}"
    )


def get_stock_status(product):
    inventory = getattr(product, "inventory", None)
    available = getattr(product, "available", None)

    if inventory is not None:
        return f"In Stock ({inventory} available)" if inventory > 0 else "Out of Stock"

    if available is not None:
        return "Available" if available else "Out of Stock"

    return "Available"


def score_product_match(product, prompt):
    prompt_lower = (prompt or "").lower()
    prompt_words = clean_words(prompt_lower)

    name = getattr(product, "name", "") or ""
    description = getattr(product, "description", "") or ""
    category = getattr(product, "category", "") or ""
    brand = getattr(product, "brand", "") or ""

    searchable_text = f"{name} {description} {category} {brand}".lower()
    product_words = clean_words(searchable_text)

    score = 0

    if name.lower() and name.lower() in prompt_lower:
        score += 30

    if category.lower() and category.lower() in prompt_lower:
        score += 20

    if brand.lower() and brand.lower() in prompt_lower:
        score += 15

    for word in prompt_words:
        if word in product_words:
            score += 4

    return score


def detect_category(prompt):
    prompt_lower = (prompt or "").lower()

    category_map = {
        "laptops": ["laptop", "laptops", "computer", "computers", "macbook"],
        "smartphones": ["phone", "phones", "smartphone", "smartphones", "iphone", "android", "samsung"],
        "beauty": ["beauty", "makeup", "cosmetic", "cosmetics", "skincare"],
        "fragrances": ["fragrance", "fragrances", "perfume", "cologne"],
        "groceries": ["grocery", "groceries", "food", "snack", "snacks", "steak"],
        "furniture": ["furniture", "chair", "table", "desk", "sofa"],
        "mens-shirts": ["men", "mens", "shirt", "shirts"],
        "womens-dresses": ["women", "womens", "dress", "dresses"],
        "sports-accessories": ["sport", "sports", "fitness", "ball", "accessories"],
    }

    for category, keywords in category_map.items():
        if any(keyword in prompt_lower for keyword in keywords):
            return category

    return None


def is_product_query(prompt):
    text = (prompt or "").lower()

    product_keywords = [
        "product", "products", "item", "items",
        "recommend", "suggest", "show", "find", "search",
        "cheap", "cheapest", "affordable", "budget",
        "expensive", "premium", "best", "top", "rating", "rated",
        "price", "cost", "buy", "purchase", "stock", "available",
        "laptop", "laptops", "computer", "computers", "macbook",
        "phone", "phones", "smartphone", "smartphones", "iphone", "android", "samsung",
        "groceries", "grocery", "food", "snack", "steak",
        "furniture", "chair", "table", "desk", "sofa",
        "beauty", "makeup", "skincare", "cosmetics",
        "fragrance", "perfume", "cologne",
        "shirt", "dress", "sports", "gaming", "electronics",
        "explain", "details", "tell me about",
    ]

    follow_up_keywords = [
        "which one",
        "which is better",
        "best one",
        "highest rated",
        "top rated",
        "what about",
        "that one",
    ]

    return (
        any(keyword in text for keyword in product_keywords)
        or any(keyword in text for keyword in follow_up_keywords)
    )


def build_not_found_response(message=None):
    return f"""
    <div style='line-height:1.6;'>
        <strong>{message or "No matching products found."}</strong>
        <br><br>
        Try searching for:
        <ul>
            <li>Laptops</li>
            <li>Smartphones</li>
            <li>Beauty products</li>
            <li>Furniture</li>
            <li>Groceries</li>
        </ul>
    </div>
    """


def find_matching_products(prompt, limit=3):
    prompt_lower = (prompt or "").lower()
    products = Product.query.all()

    print("\n========== CHATBOT DATABASE DEBUG ==========")
    print("User prompt:", prompt)
    print("Total products in database:", len(products))

    detected_category = detect_category(prompt)

    follow_up_phrases = [
        "which one",
        "best one",
        "highest rated",
        "top rated",
        "which is better",
    ]

    if not detected_category and any(phrase in prompt_lower for phrase in follow_up_phrases):
        detected_category = session.get("last_category")

    if detected_category:
        session["last_category"] = detected_category

    wants_cheapest = any(word in prompt_lower for word in [
        "cheap", "cheapest", "lowest", "budget", "affordable"
    ])

    wants_best_rating = any(word in prompt_lower for word in [
        "best rating", "highest rating", "top rated", "best", "rating", "rated"
    ])

    wants_explanation = any(word in prompt_lower for word in [
        "explain", "tell me about", "details about", "what is"
    ])

    iphone_match = re.search(r"iphone\s*\d+", prompt_lower)

    if iphone_match:
        requested_product = iphone_match.group(0)

        exact_product_exists = any(
            requested_product in (getattr(product, "name", "") or "").lower()
            for product in products
        )

        if not exact_product_exists:
            session["not_found_message"] = f"Sorry, we currently do not have {requested_product.title()} in our catalog."
            return []

    exact_matches = []

    for product in products:
        product_name = (getattr(product, "name", "") or "").lower()

        if product_name and product_name in prompt_lower:
            exact_matches.append(product)

    if exact_matches:
        session["last_category"] = getattr(exact_matches[0], "category", None)

        return exact_matches[:limit]

    filtered_products = products

    if detected_category:
        filtered_products = [
            product
            for product in products
            if (getattr(product, "category", "") or "").lower() == detected_category.lower()
        ]

        print("Detected category:", detected_category)
        print("Products after category filter:", len(filtered_products))

    if not filtered_products and detected_category:
        return []

    if wants_cheapest:
        filtered_products.sort(key=lambda p: float(getattr(p, "price", 0) or 0))
        session["last_product_ids"] = [p.id for p in filtered_products[:limit]]
        return filtered_products[:limit]

    if wants_best_rating:
        filtered_products.sort(
            key=lambda p: float(getattr(p, "rating", 0) or 0),
            reverse=True
        )
        session["last_product_ids"] = [p.id for p in filtered_products[:limit]]
        return filtered_products[:limit]

    if wants_explanation:
        scored_products = []

        for product in filtered_products:
            score = score_product_match(product, prompt)

            if score > 0:
                scored_products.append((score, product))

        scored_products.sort(key=lambda x: x[0], reverse=True)

        result = [product for _, product in scored_products[:1]]
        session["last_product_ids"] = [p.id for p in result]
        return result

    scored_products = []

    for product in filtered_products:
        score = score_product_match(product, prompt)

        if score > 0:
            scored_products.append((score, product))

    scored_products.sort(key=lambda x: x[0], reverse=True)

    result = [product for _, product in scored_products[:limit]]
    session["last_product_ids"] = [p.id for p in result]

    return result


def build_product_card(product):
    product_link = get_product_link(product)
    description = getattr(product, "description", "") or "No description available."

    short_description = (
        description[:140] + "..."
        if len(description) > 140
        else description
    )

    rating = getattr(product, "rating", None)
    category = getattr(product, "category", None)

    return f"""
    <div style="
        margin-bottom:18px;
        padding:14px;
        border-radius:14px;
        background:#1e293b;
        color:white;
    ">
        <strong style="font-size:16px;">{product.name}</strong>

        <br><br>

        💲 Price: ${float(product.price):.2f}<br>
        📦 Category: {category or 'General'}<br>
        ⭐ Rating: {rating or 'N/A'}<br>
        📍 Stock: {get_stock_status(product)}<br><br>

        <div style="line-height:1.5;">
            {short_description}
        </div>

        <br>

        <a
            href="{product_link}"
            target="_blank"
            rel="noopener noreferrer"
            style="color:#7dd3fc; font-weight:bold; text-decoration:underline;"
        >
            View Product
        </a>
    </div>
    """


def build_multiple_products_response(products):
    response = """
    <div style="line-height:1.6;">
        <strong>Recommended Products:</strong>
        <br><br>
    """

    for product in products:
        response += build_product_card(product)

    response += "</div>"

    return response


def build_ai_response(prompt):
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": """
You are NorthStar Assistant, a friendly ecommerce chatbot.

Rules:
- Reply naturally to greetings and general conversation.
- Keep replies short.
- Do not recommend products unless the user asks about products.
- Do not invent fake products or fake links.
"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_completion_tokens=200,
        )

        ai_text = completion.choices[0].message.content.strip()

        return f"""
        <div style='line-height:1.6;'>
            {ai_text}
        </div>
        """

    except Exception as e:
        print("AI fallback error:", e)

        return """
        <div style='line-height:1.6;'>
            Hi! I can help you find products, compare prices, or answer store questions.
        </div>
        """


@chat_bp.route("/ask", methods=["POST"])
def generate():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"error": "Missing 'prompt'"}), 400

    if not is_product_query(prompt):
        return jsonify({
            "output": build_ai_response(prompt),
            "source": "ai",
            "products": []
        })

    try:
        fetchApiProducts()
        print("DummyJSON products synced successfully.")
    except Exception as e:
        print("Product sync failed:", e)

    session.pop("not_found_message", None)

    matched_products = find_matching_products(prompt)

    if matched_products:
        return jsonify({
            "output": build_multiple_products_response(matched_products),
            "source": "database",
            "products": [product.to_dict() for product in matched_products]
        })

    not_found_message = session.pop("not_found_message", None)

    return jsonify({
        "output": build_not_found_response(not_found_message),
        "source": "database",
        "products": []
    })