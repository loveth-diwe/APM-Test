import React, { useState } from 'react';
import GooglePayButton from '@google-pay/button-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const GooglePay = () => {
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "";
    const CHECKOUT_PUBLIC_KEY = "pk_sbox_w5tsowjlb3s27oveipn5bmrs34f";

    const [paymentToken, setPaymentToken] = useState(null);
    const [loading, setLoading] = useState(false);

    const processPayment = async (paymentData) => {
        setLoading(true);
        try {
            const tokenResponse = JSON.parse(paymentData.paymentMethodData.tokenizationData.token);
            setPaymentToken(JSON.stringify(tokenResponse, null, 2));

            const response = await axios.post(`${API_BASE_URL}/api/process-payment`, {
                walletType: 'googlepay', // Updated parameter
                tokenData: tokenResponse,
                amount: 100,
                currencyCode: 'GBP',
                countryCode: 'GB'
            });

            if (response.data.approved) {
                toast.success("Google Pay Payment Successful!");
            } else {
                toast.error("Payment Declined.");
            }
        } catch (error) {
            toast.error("Processing error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <button onClick={() => navigate('/')} className="mb-6 flex items-center text-gray-600 hover:text-black font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Selection
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Google Pay Config</h2>
                    <div className="space-y-4 text-sm text-gray-600">
                        <p><strong>Environment:</strong> Sandbox</p>
                        <p><strong>Merchant:</strong> My Awesome Store</p>
                        <p><strong>Amount:</strong> 1.00 GBP</p>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="my-10">
                        <GooglePayButton
                            environment="TEST"
                            buttonColor="black"
                            buttonType="buy"
                            buttonSizeMode="fill"
                            style={{ width: '240px', height: '48px' }}
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
                                            'gatewayMerchantId': CHECKOUT_PUBLIC_KEY,
                                        },
                                    },
                                }],
                                merchantInfo: { merchantId: '1234567890', merchantName: 'Demo Merchant' },
                                transactionInfo: {
                                    totalPriceStatus: 'FINAL',
                                    totalPrice: '1.00',
                                    currencyCode: 'GBP',
                                    countryCode: 'GB',
                                },
                            }}
                            onLoadPaymentData={processPayment}
                        />
                    </div>

                    <div className="w-full bg-black text-green-400 p-4 rounded font-mono text-xs overflow-auto h-64">
                        {paymentToken ? paymentToken : "Waiting for Google Pay token..."}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GooglePay;