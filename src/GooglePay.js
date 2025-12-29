import React, { useEffect, useState } from 'react';
import GooglePayButton from '@google-pay/button-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const GooglePay = () => {
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "";

    // 1. Configuration State
    const [config, setConfig] = useState({
        publicKey: "pk_sbox_w5tsowjlb3s27oveipn5bmrs34f",
        merchantId: "BCR2DN7TVH76T2QP",
        amount: "1.00",
        currency: "GBP"
    });

    const [paymentToken, setPaymentToken] = useState(null);

    // 2. Persistence: Load on Mount
    useEffect(() => {
        const saved = localStorage.getItem('googlePayConfig');
        if (saved) {
            try { setConfig(JSON.parse(saved)); }
            catch (e) { console.error("Persistence error", e); }
        }
    }, []);

    // 3. Persistence: Save on Change
    useEffect(() => {
        localStorage.setItem('googlePayConfig', JSON.stringify(config));
    }, [config]);

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

            if (response.data.approved) {
                toast.success("Google Pay Payment Successful!");
            } else {
                toast.error("Payment Declined by Gateway.");
            }
        } catch (error) {
            console.error("Payment Error:", error);
            toast.error("Error connecting to backend.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header Navigation */}
            <button
                onClick={() => navigate('/')}
                className="mb-6 flex items-center text-gray-500 hover:text-black transition-colors font-medium"
            >
                ← Back to Selection Hub
            </button>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT: CONFIGURATION PANEL */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 border-b pb-4 text-gray-800">Configuration</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Checkout Public Key</label>
                            <input
                                type="text"
                                value={config.publicKey}
                                onChange={(e) => setConfig({...config, publicKey: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-black outline-none font-mono text-sm"
                                placeholder="pk_sbox_..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Google Merchant ID</label>
                            <input
                                type="text"
                                value={config.merchantId}
                                onChange={(e) => setConfig({...config, merchantId: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-black outline-none font-mono text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Amount</label>
                                <input
                                    type="number"
                                    value={config.amount}
                                    onChange={(e) => setConfig({...config, amount: e.target.value})}
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Currency</label>
                                <input
                                    type="text"
                                    value={config.currency}
                                    className="w-full p-3 bg-gray-100 rounded-xl border-none text-gray-400 font-bold"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: INTERACTIVE PAYMENT PANEL */}
                <div className="flex flex-col space-y-6">
                    <div className="bg-white p-12 rounded-2xl shadow-lg flex flex-col items-center border border-gray-50">
                        <div className="mb-10 text-center">
                            <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Secure Checkout</span>
                            <h2 className="text-4xl font-black mt-2 text-gray-900">
                                {config.currency} {parseFloat(config.amount).toFixed(2)}
                            </h2>
                        </div>

                        <div className="w-full max-w-[300px]">
                            <GooglePayButton
                                environment="TEST"
                                buttonColor="black"
                                buttonType="buy"
                                buttonSizeMode="fill"
                                style={{ width: '100%', height: '50px' }}
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
                                                'gatewayMerchantId': config.publicKey,
                                            },
                                        },
                                    }],
                                    merchantInfo: {
                                        merchantId: config.merchantId,
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
                                onError={err => console.error(err)}
                            />
                        </div>
                    </div>

                    {/* TRANSACTION CONSOLE */}
                    <div className="bg-gray-900 rounded-2xl p-6 h-80 shadow-2xl flex flex-col border border-gray-800">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                            <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">Gateway Response</span>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                            </div>
                        </div>
                        <pre className="text-green-400 font-mono text-[11px] leading-relaxed overflow-auto flex-1 custom-scrollbar">
                            {paymentToken ? paymentToken : "// Awaiting Google Pay interaction..."}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GooglePay;