# Payment Session - Universal Wallet Processing
from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS
from checkout_sdk import CheckoutSdk
from checkout_sdk.environment import Environment
import json, os, uuid, requests, traceback
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BUILD_FOLDER = BASE_DIR / 'build'

app = Flask(__name__, static_folder=str(BUILD_FOLDER / 'static'), template_folder=str(BUILD_FOLDER))
app.config["DEBUG"] = True

CORS(app, origins=["https://apm-test-c5yi.onrender.com"])

CHECKOUT_SECRET_KEY = os.environ.get('CHECKOUT_SECRET_KEY')
CHECKOUT_PUBLIC_KEY = os.environ.get('CHECKOUT_PUBLIC_KEY')

# Apple Pay Specifics
# Absolute path logic for Render
current_dir = os.path.dirname(os.path.abspath(__file__))
APPLE_PAY_CERT = os.path.join(current_dir, 'certificate_sandbox.pem')
APPLE_PAY_KEY = os.path.join(current_dir, 'certificate_sandbox.key')
MERCHANT_ID = 'merchant.lovethdiwe.sandbox'

# Initialise Checkout SDK
checkout_api = CheckoutSdk.builder() \
    .secret_key(CHECKOUT_SECRET_KEY) \
    .public_key(CHECKOUT_PUBLIC_KEY) \
    .environment(Environment.sandbox()) \
    .build()


@app.route('/')
def get_data():
    return render_template('index.html')


@app.route('/api/process-payment', methods=['POST'])
def process_payment():
    data = request.get_json()
    wallet_type = data.get("walletType", "applepay")
    try:
        token_response = checkout_api.tokens.request_wallet_token({
            "type": wallet_type,
            "token_data": data["tokenData"]
        })
        token = token_response.token

        payment_request = {
            "source": {
                "type": "token",
                "token": token,
                "billing_address": {"country": data.get("countryCode", "GB")}
            },
            "amount": data["amount"],
            "currency": data["currencyCode"],
            "reference": f"{wallet_type}-demo-{uuid.uuid4().hex[:6]}",
            "processing_channel_id": "pc_ksz7aa7a7gdu7oxgdqrak5allq",
        }

        if data.get("deviceSessionId"):
            payment_request['risk'] = {"enabled": True, "device_session_id": data.get("deviceSessionId")}

        payment_response = checkout_api.payments.request_payment(payment_request)
        is_approved = payment_response.status in ["Authorized", "Captured"]
        return jsonify(
            {"approved": is_approved, "status": payment_response.status, "payment_id": payment_response.id}), 200
    except Exception as e:
        return jsonify({"approved": False, "error": str(e), "status": "Failed"}), 400


# --- UPDATED MERCHANT VALIDATION ---
@app.route('/api/apple-pay/validate-merchant', methods=['POST'])
def validate_merchant():
    data = request.get_json()
    validation_url = data.get('validationURL')  # Sent by Safari

    # The payload Apple expects
    payload = {
        "merchantIdentifier": MERCHANT_ID,
        "displayName": "APM Test Store",
        "initiative": "web",
        "initiativeContext": "apm-test-c5yi.onrender.com"  # Must match verified domain
    }

    try:
        # We must use the Merchant Identity certificate/key to authenticate with Apple
        response = requests.post(
            validation_url,
            json=payload,
            cert=(APPLE_PAY_CERT, APPLE_PAY_KEY)
        )

        if response.status_code == 200:
            return jsonify(response.json())  # Send the session object back to the frontend
        else:
            print(f"Validation Error: {response.text}")
            return jsonify({"error": "Apple rejected validation", "details": response.text}), response.status_code
    except Exception as e:
        print(f"Server Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/.well-known/apple-developer-merchantid-domain-association.txt')
def serve_apple_pay_verification():
    well_known_dir = os.path.join(BASE_DIR, '.well-known')
    return send_from_directory(well_known_dir, 'apple-developer-merchantid-domain-association.txt')


@app.route('/<path:path>')
def catch_all(path):
    return render_template("index.html")


if __name__ == '__main__':
    app.run()