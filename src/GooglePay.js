import React, { useEffect, useState } from 'react';
import GooglePayButton from '@google-pay/button-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Default values to revert to
const DEFAULT_CONFIG = {
    publicKey: "pk_sbox_uzuta5525nrhece4ke67nqtgpik",
    merchantId: "BCR2DN7TVH76T2QP",
    amount: "1.00",
    currency: "GBP",
    allowedNetworks: ['MASTERCARD', 'VISA', 'AMEX']
};

const ALL_NETWORKS = ['MASTERCARD', 'VISA', 'AMEX', 'DISCOVER', 'JCB'];

const GooglePay = () => {
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "";

    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [paymentToken, setPaymentToken] = useState(null);

    // Persistence: Load on Mount
    useEffect(() => {
        const saved = localStorage.getItem('googlePayConfig');
        if (saved) {
            try { setConfig(JSON.parse(saved)); }
            catch (e) { console.error("Persistence error", e); }
        }
    }, []);

    // Persistence: Save on Change
    useEffect(() => {
        localStorage.setItem('googlePayConfig', JSON.stringify(config));
    }, [config]);

    // NEW: Reset to Defaults Function
    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
        setPaymentToken(null);
        localStorage.removeItem('googlePayConfig');
        toast.info("Settings reset to defaults");
    };

    const toggleNetwork = (net) => {
        const newList = config.allowedNetworks.includes(net)
            ? config.allowedNetworks.filter(n => n !== net)
            : [...config.allowedNetworks, net];
        setConfig({ ...config, allowedNetworks: newList });
    };

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

            if (response.data.approved) toast.success("Payment Successful!");
            else toast.error("Payment Declined");
        } catch (error) {
            toast.error("Error connecting to backend.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <button onClick={() => navigate('/')} className="mb-6 flex items-center text-gray-500 hover:text-black transition-colors font-medium">
                ← Back to Selection Hub
            </button>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: CONFIGURATION PANEL */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold mb-6 border-b pb-4 text-gray-800">Configuration</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Checkout Public Key</label>
                                <input
                                    type="text"
                                    value={config.publicKey}
                                    onChange={(e) => setConfig({...config, publicKey: e.target.value})}
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-black outline-none font-mono text-sm"
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
                                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Currency</label>
                                    <input
                                        type="text"
                                        value={config.currency}
                                        onChange={(e) => setConfig({...config, currency: e.target.value.toUpperCase()})}
                                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Allowed Card Networks</label>
                                <div className="flex flex-wrap gap-2">
                                    {ALL_NETWORKS.map(net => (
                                        <button
                                            key={net}
                                            onClick={() => toggleNetwork(net)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                                config.allowedNetworks.includes(net) 
                                                ? 'bg-black text-white border-black shadow-md' 
                                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            {net}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NEW: RESET TO DEFAULTS BUTTON */}
                    <button
                        onClick={handleReset}
                        className="mt-10 px-4 py-2 text-sm font-bold text-red-600 border border-red-100 rounded-xl hover:bg-red-50 transition-colors w-full lg:w-max"
                    >
                        Reset to Defaults
                    </button>
                </div>

                {/* RIGHT: INTERACTIVE PANEL */}
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
                                            allowedCardNetworks: config.allowedNetworks,
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
                            />
                        </div>
                    </div>

                    <div className="bg-gray-900 rounded-2xl p-6 h-80 shadow-2xl flex flex-col border border-gray-800">
                        <span className="text-gray-500 text-xs font-mono mb-2 uppercase tracking-widest">Gateway Response JSON</span>
                        <pre className="text-green-400 font-mono text-[11px] leading-relaxed overflow-auto flex-1 custom-scrollbar">
                            {paymentToken ? paymentToken : "// Awaiting transaction..."}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GooglePay;