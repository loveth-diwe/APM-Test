import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    Payment Testing Hub
                </h1>
                <p className="text-gray-500 mb-8">
                    Select a payment method to begin testing the integration flow.
                </p>

                <div className="space-y-4">
                    {/* Apple Pay Button */}
                    <button
                        onClick={() => navigate('/applepay')}
                        className="w-full flex items-center justify-center gap-3 bg-black text-white py-4 px-6 rounded-xl font-semibold hover:bg-gray-800 transition duration-300 shadow-lg"
                    >
                        <span className="text-lg">Test Apple Pay</span>
                    </button>

                    {/* Google Pay Button */}
                    <button
                        onClick={() => navigate('/googlepay')}
                        className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 border-2 border-gray-200 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition duration-300 shadow-sm"
                    >
                        <span className="text-lg">Test Google Pay</span>
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">
                        Powered by Checkout.com SDK
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Home;