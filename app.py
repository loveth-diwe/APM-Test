# Payment Session - Universal Wallet Processing
from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS
from checkout_sdk import CheckoutSdk
from checkout_sdk.environment import Environment
import json, os, uuid, requests, traceback
from pathlib import Path

# BASE_DIR is the root folder where app.py and .well-known live
BASE_DIR = Path(__file__).resolve().parent
# If you have a build folder for a frontend (e.g. React/Vue)
BUILD_FOLDER = BASE_DIR / 'src' / 'build'

app = Flask(__name__,
            static_folder=str(BUILD_FOLDER / 'static'),
            template_folder=str(BUILD_FOLDER))
app.config["DEBUG"] = True

# Update CORS to your Render URL
CORS(app, origins=["https://apm-test-c5yi.onrender.com"])

CHECKOUT_SECRET_KEY = os.environ.get('CHECKOUT_SECRET_KEY')
CHECKOUT_PUBLIC_KEY = os.environ.get('CHECKOUT_PUBLIC_KEY')

# Apple Pay Specifics
APPLE_PAY_CERT = './certificate_sandbox.pem'
APPLE_PAY_KEY = './certificate_sandbox.key'
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


# --- UNIVERSAL PAYMENT ROUTE ---
@app.route('/api/process-payment', methods=['POST'])
def process_payment():
    data = request.get_json()
    wallet_type = data.get("walletType", "applepay")

    print(f"Processing {wallet_type} tokenization...")

    # 1. Tokenize the Wallet data
    try:
        token_response = checkout_api.tokens.request_wallet_token({
            "type": wallet_type,
            "token_data": data["tokenData"]
        })
        token = token_response.token
    except Exception as e:
        print(f"Tokenization failed: {e}")
        return jsonify({"error": "Tokenization failed", "details": str(e)}), 400

    # 2. Create payment request
    try:
        payment_request = {
            "source": {
                "type": "token",
                "token": token,
                "billing_address": {
                    "country": data.get("countryCode", "GB"),
                }
            },
            "amount": data["amount"],
            "currency": data["currencyCode"],
            "reference": f"{wallet_type}-demo-{uuid.uuid4().hex[:6]}",
            "processing_channel_id": "pc_ksz7aa7a7gdu7oxgdqrak5allq",
        }

        # Risk Data
        device_session_id = data.get("deviceSessionId")
        if device_session_id:
            payment_request['risk'] = {"enabled": True, "device_session_id": device_session_id}

        payment_response = checkout_api.payments.request_payment(payment_request)

        is_approved = payment_response.status in ["Authorized", "Captured"]
        return jsonify({
            "approved": is_approved,
            "status": payment_response.status,
            "payment_id": payment_response.id
        }), 200
    except Exception as e:
        print(f"Payment failed: {str(e)}")
        return jsonify({"approved": False, "error": str(e), "status": "Failed"}), 400


# Apple-specific validation route
@app.route('/api/apple-pay/validate-merchant', methods=['POST'])
def validate_merchant():
    # Insert your merchant validation logic here
    pass


# --- APPLE DOMAIN VERIFICATION ROUTE ---
@app.route('/.well-known/apple-developer-merchantid-domain-association.txt')
def serve_apple_pay_verification():
    # base_dir points to the root where .well-known folder exists
    base_dir = os.path.dirname(os.path.abspath(__file__))
    well_known_dir = os.path.join(base_dir, '.well-known')

    return send_from_directory(
        well_known_dir,
        'apple-developer-merchantid-domain-association.txt',
        mimetype='text/plain'
    )


@app.route('/<path:path>')
def catch_all(path):
    return render_template("index.html")


if __name__ == '__main__':
    app.run()