import React, { useState } from 'react';
import GooglePayButton from '@google-pay/button-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const GooglePay = () => {
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "";

    // 1. Move configuration into State
    const [config, setConfig] = useState({
        publicKey: "pk_sbox_w5tsowjlb3s27oveipn5bmrs34f",
        merchantId: "12345678901234567890",
        amount: "1.00",
        currency: "GBP"
    });

    const [paymentToken, setPaymentToken] = useState(null);

    const processPayment = async (paymentData) => {
        try {
            const tokenResponse = JSON.parse(paymentData.paymentMethodData.tokenizationData.token);
            setPaymentToken(JSON.stringify(tokenResponse, null, 2));

            const response = await axios.post(`${API_BASE_URL}/api/process-payment`, {
                walletType: 'googlepay',
                tokenData: tokenResponse,
                amount: Math.round(parseFloat(config.amount) * 100),
                currencyCode: config.currency,
                countryCode: 'GB'
            });

            if (response.data.approved) toast.success("Google Pay Success!");
            else toast.error("Payment Declined");
        } catch (error) { toast.error("Processing error"); }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <button onClick={() => navigate('/')} className="mb-6 flex items-center text-gray-500 hover:text-black font-medium">
                ← Back to Hub
            </button>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: CONFIGURATION PANEL */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 border-b pb-4 text-gray-800">Configuration</h3>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Checkout Public Key</label>
                            <input
                                type="text"
                                value={config.publicKey}
                                onChange={(e) => setConfig({...config, publicKey: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                placeholder="pk_sbox_..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Google Merchant ID</label>
                            <input
                                type="text"
                                value={config.merchantId}
                                onChange={(e) => setConfig({...config, merchantId: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount</label>
                                <input
                                    type="number"
                                    value={config.amount}
                                    onChange={(e) => setConfig({...config, amount: e.target.value})}
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Currency</label>
                                <input
                                    type="text"
                                    value={config.currency}
                                    className="w-full p-3 bg-gray-100 rounded-xl border-none text-gray-500"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: INTERACTIVE PANEL */}
                <div className="flex flex-col space-y-6">
                    <div className="bg-white p-10 rounded-2xl shadow-lg flex flex-col items-center border border-gray-50">
                        <div className="mb-8 text-center">
                            <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Secure Checkout</span>
                            <h2 className="text-3xl font-black mt-1 text-gray-900">{config.currency} {config.amount}</h2>
                        </div>

                        <GooglePayButton
                            environment="TEST"
                            buttonColor="black"
                            buttonType="buy"
                            buttonSizeMode="fill"
                            style={{ width: '100%', maxWidth: '300px', height: '50px' }}
                            paymentRequest={{
                                apiVersion: 2,
                                apiVersionMinor: 0,
                                allowedPaymentMethods: [{
                                    type: 'CARD',
                                    parameters: {
                                        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                        allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX'],
                                    },
                                    tokenizationSpecification: {
                                        type: 'PAYMENT_GATEWAY',
                                        parameters: {
                                            'gateway': 'checkoutltd',
                                            // 2. Button uses state-driven Public Key
                                            'gatewayMerchantId': config.publicKey,
                                        },
                                    },
                                }],
                                merchantInfo: {
                                    // 3. Button uses state-driven Merchant ID
                                    merchantId: config.configmerchantId,
                                    merchantName: 'APM Test'
                                },
                                transactionInfo: {
                                    totalPriceStatus: 'FINAL',
                                    totalPrice: config.amount,
                                    currencyCode: config.currency,
                                    countryCode: 'GB',
                                },
                            }}
                            onLoadPaymentData={processPayment}
                        />
                    </div>

                    <div className="bg-gray-900 rounded-2xl p-6 h-64 shadow-2xl flex flex-col border border-gray-800">
                        <span className="text-gray-500 text-xs font-mono mb-2 uppercase">Google Pay Response JSON</span>
                        <pre className="text-green-400 font-mono text-xs overflow-auto flex-1 custom-scrollbar">
                            {paymentToken ? paymentToken : "// Token data will appear here..."}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GooglePay;