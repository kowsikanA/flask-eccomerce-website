from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, CartItem, Order, OrderItem
import stripe
import os

payment_bp = Blueprint("payments", __name__)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:5001")


@payment_bp.route("/checkout", methods=["POST"])
@jwt_required()
def create_checkout_session():
    current_user_email = get_jwt_identity()

    user = User.query.filter_by(email=current_user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    cart_items = CartItem.query.filter_by(user_id=user.id).all()
    if not cart_items:
        return jsonify({"error": "Cart is empty"}), 400

    if not stripe.api_key:
        return jsonify({"error": "Stripe secret key is missing"}), 500

    line_items = []
    total_price = 0

    for item in cart_items:
        product = item.product

        if not product:
            return jsonify({"error": "A product in your cart no longer exists"}), 400

        unit_price = int(float(product.price) * 100)
        total_price += float(product.price) * item.quantity

        image_urls = []

        if (
            product.image_url
            and isinstance(product.image_url, str)
            and product.image_url.startswith(("http://", "https://"))
        ):
            image_urls.append(product.image_url)

        product_data = {
            "name": product.name or "Product",
        }

        if image_urls:
            product_data["images"] = image_urls

        line_items.append({
            "price_data": {
                "currency": "cad",
                "unit_amount": unit_price,
                "product_data": product_data,
            },
            "quantity": item.quantity,
        })

    order = Order(
        user_id=user.id,
        payment_status="pending",
        total_price=total_price,
    )

    db.session.add(order)
    db.session.commit()

    for item in cart_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.product.price,
        )
        db.session.add(order_item)

    db.session.commit()

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{BASE_URL}/order/confirmed?order_id={order.id}",
            cancel_url=f"{BASE_URL}/order/failed?order_id={order.id}",
            metadata={
                "order_id": str(order.id),
                "user_id": str(user.id),
            },
        )

    except Exception as e:
        print("STRIPE CHECKOUT ERROR:", str(e))
        return jsonify({"error": f"Stripe error: {str(e)}"}), 500

    for item in cart_items:
        db.session.delete(item)

    db.session.commit()

    return jsonify({
        "checkout_url": session.url,
        "order_id": order.id,
    }), 200