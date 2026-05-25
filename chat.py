from flask import Blueprint, request, jsonify
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
    """
    Cleans user text for easier keyword matching.
    """

    text = (text or "").lower()

    text = re.sub(r"[^a-z0-9\s]", " ", text)

    return [
        word
        for word in text.split()
        if len(word) > 2
    ]


def get_product_link(product):
    """
    Builds clickable product details URL.
    """

    return (
        "https://flask-eccomerce-website.onrender.com/"
        f"productDetails?id={product.id}"
    )


def get_stock_status(product):
    """
    Returns stock availability text.
    """

    stock = getattr(product, "stock", None)

    inventory = getattr(product, "inventory", None)

    available = getattr(product, "available", None)

    if stock is not None:
        return (
            f"In Stock ({stock} available)"
            if stock > 0
            else "Out of Stock"
        )

    if inventory is not None:
        return (
            f"In Stock ({inventory} available)"
            if inventory > 0
            else "Out of Stock"
        )

    if available is not None:
        return (
            "Available"
            if available
            else "Out of Stock"
        )

    return "Available"


def product_text(product):
    """
    Combines searchable product text.
    """

    return f"""
    {getattr(product, "name", "") or ""}
    {getattr(product, "description", "") or ""}
    {getattr(product, "category", "") or ""}
    {getattr(product, "brand", "") or ""}
    """.lower()


def score_product_match(product, prompt):
    """
    Gives products a relevance score.
    Higher score = better match.
    """

    prompt_lower = (prompt or "").lower()

    prompt_words = clean_words(prompt_lower)

    name = getattr(product, "name", "") or ""

    description = getattr(product, "description", "") or ""

    category = getattr(product, "category", "") or ""

    brand = getattr(product, "brand", "") or ""

    searchable_text = (
        f"{name} {description} {category} {brand}"
    ).lower()

    product_words = clean_words(searchable_text)

    score = 0

    # exact name match
    if name.lower() and name.lower() in prompt_lower:
        score += 30

    # category match
    if category.lower() and category.lower() in prompt_lower:
        score += 20

    # brand match
    if brand.lower() and brand.lower() in prompt_lower:
        score += 15

    # keyword match
    for word in prompt_words:
        if word in product_words:
            score += 4

    return score


def detect_category(prompt):
    """
    Detects product category from user message.
    """

    prompt_lower = (prompt or "").lower()

    category_map = {
        "laptops": [
            "laptop",
            "laptops",
            "computer",
            "computers",
            "macbook",
        ],

        "smartphones": [
            "phone",
            "phones",
            "smartphone",
            "smartphones",
            "iphone",
            "android",
            "samsung",
        ],

        "beauty": [
            "beauty",
            "makeup",
            "cosmetic",
            "cosmetics",
            "skincare",
        ],

        "fragrances": [
            "fragrance",
            "fragrances",
            "perfume",
            "cologne",
        ],

        "groceries": [
            "grocery",
            "groceries",
            "food",
            "snack",
            "snacks",
            "steak",
        ],

        "furniture": [
            "furniture",
            "chair",
            "table",
            "desk",
            "sofa",
        ],

        "mens-shirts": [
            "men",
            "mens",
            "shirt",
            "shirts",
        ],

        "womens-dresses": [
            "women",
            "womens",
            "dress",
            "dresses",
        ],

        "sports-accessories": [
            "sport",
            "sports",
            "fitness",
            "ball",
            "accessories",
        ],
    }

    for category, keywords in category_map.items():

        if any(
            keyword in prompt_lower
            for keyword in keywords
        ):
            return category

    return None


def find_matching_products(prompt, limit=3):
    """
    Finds matching products from database.
    """

    prompt_lower = (prompt or "").lower()

    products = Product.query.all()

    print("\n========== CHATBOT DATABASE DEBUG ==========")

    print("User prompt:", prompt)

    print("Total products in database:", len(products))

    for product in products[:10]:

        print({
            "id": getattr(product, "id", None),
            "name": getattr(product, "name", None),
            "category": getattr(product, "category", None),
            "price": getattr(product, "price", None),
        })

    detected_category = detect_category(prompt)

    wants_cheapest = any(
        word in prompt_lower
        for word in [
            "cheap",
            "cheapest",
            "lowest",
            "affordable",
            "budget",
            "low price",
        ]
    )

    wants_expensive = any(
        word in prompt_lower
        for word in [
            "expensive",
            "premium",
            "highest price",
        ]
    )

    filtered_products = products

    # category filtering
    if detected_category:

        filtered_products = [
            product
            for product in products
            if detected_category in product_text(product)
        ]

        print("Detected category:", detected_category)

        print(
            "Products after category filter:",
            len(filtered_products)
        )

    # no products found
    if not filtered_products and detected_category:

        print(
            "No products found for category:",
            detected_category
        )

        return []

    # cheapest products
    if wants_cheapest:

        filtered_products.sort(
            key=lambda p: float(
                getattr(p, "price", 0) or 0
            )
        )

        return filtered_products[:limit]

    # expensive products
    if wants_expensive:

        filtered_products.sort(
            key=lambda p: float(
                getattr(p, "price", 0) or 0
            ),
            reverse=True
        )

        return filtered_products[:limit]

    # normal matching
    scored_products = []

    for product in filtered_products:

        score = score_product_match(
            product,
            prompt
        )

        if score > 0:
            scored_products.append(
                (score, product)
            )

    scored_products.sort(
        key=lambda x: x[0],
        reverse=True
    )

    return [
        product
        for _, product in scored_products[:limit]
    ]


def build_product_card(product):
    """
    Creates HTML product card for chatbot.
    """

    product_link = get_product_link(product)

    description = (
        getattr(product, "description", "")
        or "No description available."
    )

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

        <strong style="font-size:16px;">
            {product.name}
        </strong>

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
            style="
                color:#7dd3fc;
                font-weight:bold;
                text-decoration:underline;
            "
        >
            View Product
        </a>

    </div>
    """


def build_multiple_products_response(products):
    """
    Builds final chatbot recommendation HTML.
    """

    response = """
    <div style="line-height:1.6;">
        <strong>
            Recommended Products:
        </strong>
        <br><br>
    """

    for product in products:

        response += build_product_card(
            product
        )

    response += "</div>"

    return response


@chat_bp.route("/ask", methods=["POST"])
def generate():
    """
    Main chatbot endpoint.
    """

    data = request.get_json(
        silent=True
    ) or {}

    prompt = (
        data.get("prompt") or ""
    ).strip()

    if not prompt:

        return jsonify({
            "error": "Missing 'prompt'"
        }), 400

    # =====================================
    # Sync DummyJSON into DB
    # =====================================

    try:

        fetchApiProducts()

        print(
            "DummyJSON products synced successfully."
        )

    except Exception as e:

        print(
            "Product sync failed:",
            e
        )

    # =====================================
    # Find matching products
    # =====================================

    matched_products = find_matching_products(
        prompt
    )

    # =====================================
    # Database products found
    # =====================================

    if matched_products:

        output = (
            build_multiple_products_response(
                matched_products
            )
        )

        return jsonify({

            "output": output,

            "source": "database",

            "products": [
                product.to_dict()
                for product in matched_products
            ]
        })

    # =====================================
    # No products found
    # =====================================

    return jsonify({

        "output": """
        <div style='line-height:1.6;'>

            <strong>
                No matching products found.
            </strong>

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
        """,

        "source": "database",

        "products": []
    })