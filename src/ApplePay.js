/* global ApplePaySession */
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const defaultConfig = {
    amount: '1.00',
    currencyCode: 'GBP',
    countryCode: 'GB',
    supportedNetworks: ['masterCard', 'visa', 'amex'],
    merchantCapabilities: ['supports3DS'],
    initiativeContext: 'apm-test-c5yi.onrender.com',
    merchantIdentifier: 'merchant.lovethdiwe.sandbox',
    displayName: 'APM Test Store',
    paymentMode: 'processPayment',
};

const allNetworks = ['masterCard', 'visa', 'amex', 'discover', 'jcb'];
const optionalCapabilities = ['supportsCredit', 'supportsDebit', 'supportsEMV'];

const ApplePay = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "";

  const [config, setConfig] = useState(defaultConfig);
  const [paymentToken, setPaymentToken] = useState(null);
  const [showMainContent, setShowMainContent] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    const saved = localStorage.getItem('applePayConfig');
    if (saved) {
        try {
            setConfig(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to load persistence", e);
        }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('applePayConfig', JSON.stringify(config));
  }, [config]);

  // --- UI HELPERS ---
  const toggleSelection = (list, item, field) => {
    const newList = list.includes(item)
        ? list.filter(i => i !== item)
        : [...list, item];
    setConfig({ ...config, [field]: newList });
  };

  // --- BUTTON INITIALIZATION ---
  useEffect(() => {
    if (!showMainContent) return;

    const existingButton = document.querySelector('apple-pay-button');
    if (existingButton) existingButton.remove();

    const applePayButton = document.createElement('apple-pay-button');
    applePayButton.setAttribute('buttonstyle', 'black');
    applePayButton.setAttribute('type', 'plain');
    applePayButton.setAttribute('locale', 'en-GB');
    // --- ADD THESE LINES BELOW ---
    applePayButton.style.display = 'inline-block'; // Ensures it behaves like a block
    applePayButton.style.width = '100%';           // Sets the width to fill the container
    applePayButton.style.height = '50px';          // Sets a standard height for the button
    applePayButton.style.cursor = 'pointer';       // Makes it clear it's clickable
    // -----------------------------
    containerRef.current?.appendChild(applePayButton);

    applePayButton.addEventListener('click', handleApplePay);
    return () => applePayButton.removeEventListener('click', handleApplePay);
  }, [config, showMainContent]);

  // --- PAYMENT LOGIC ---
  const handleApplePay = () => {
    if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
      toast.error("Apple Pay is not available on this device/browser.");
      return;
    }

    setLoading(true);
    let deviceSessionId = null;

    const paymentRequest = {
      countryCode: config.countryCode,
      currencyCode: config.currencyCode,
      supportedNetworks: config.supportedNetworks,
      merchantCapabilities: config.merchantCapabilities,
      merchantIdentifier: config.merchantIdentifier,
      total: {
        label: config.displayName,
        amount: parseFloat(config.amount).toFixed(2),
      },
    };

    const session = new window.ApplePaySession(3, paymentRequest);

    session.onvalidatemerchant = async (event) => {
        try {
            // Risk.js Collection
            const risk = await window.Risk.create("pk_sbox_uzuta5525nrhece4ke67nqtgpik");
            deviceSessionId = await risk.publishRiskData();

            // Merchant Validation
            const res = await axios.post(`${API_BASE_URL}/api/apple-pay/validate-merchant`, {
                validationURL: event.validationURL,
                initiativeContext: config.initiativeContext,
                merchantIdentifier: config.merchantIdentifier,
                displayName: config.displayName
            });
            session.completeMerchantValidation(res.data);
        } catch (err) {
            console.error("Validation failed", err);
            session.abort();
        }
    };

    session.onpaymentauthorized = async (event) => {
      const token = event.payment.token;
      const params = {
          version: token.paymentData.version,
          data: token.paymentData.data,
          signature: token.paymentData.signature,
          header: {
            ephemeralPublicKey: token.paymentData.header.ephemeralPublicKey,
            publicKeyHash: token.paymentData.header.publicKeyHash,
            transactionId: token.paymentData.header.transactionId
          }
      };

      if (config.paymentMode === 'processPayment') {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/process-payment`, {
            walletType: 'applepay',
            tokenData: params,
            amount: Math.round(parseFloat(config.amount) * 100),
            currencyCode: config.currencyCode,
            countryCode: config.countryCode,
            deviceSessionId: deviceSessionId
          });

          if (res.data.approved) {
              setPaymentToken(JSON.stringify(token.paymentData));
              session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
              toast.success('Payment successful!');
            } else {
              session.completePayment(window.ApplePaySession.STATUS_FAILURE);
              toast.error('Payment declined.');
            }
          } catch (err) {
            session.completePayment(window.ApplePaySession.STATUS_FAILURE);
          }
      } else {
          setPaymentToken(JSON.stringify(token.paymentData));
          session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
          toast.info('Token generated successfully!');
      }
      setLoading(false);
    };

    session.begin();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={() => navigate('/')} className="mb-6 flex items-center text-gray-500 hover:text-black transition-colors font-medium">
          ← Back to Selection Hub
      </button>

      {!showMainContent ? (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Apple Pay Setup</h2>
                <p className="text-gray-500 mb-6 text-sm">Configure parameters before opening the test panel.</p>
                <select
                  value={config.paymentMode}
                  onChange={(e) => setConfig({...config, paymentMode: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-6 focus:ring-2 focus:ring-black outline-none"
                >
                    <option value="processPayment">End-to-End Payment</option>
                    <option value="generateTokenOnly">Token Generation Only</option>
                </select>
                <button onClick={() => setShowMainContent(true)} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition shadow-lg">
                    Start Testing
                </button>
            </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: CONFIGURATION PANEL */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-y-auto max-h-[85vh]">
            <h3 className="text-lg font-bold mb-6 border-b pb-4">Merchant Settings</h3>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Merchant Identifier</label>
                    <input type="text" value={config.merchantIdentifier} onChange={(e) => setConfig({...config, merchantIdentifier: e.target.value})} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-100 font-mono text-sm" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Initiative Context</label>
                    <input type="text" value={config.initiativeContext} onChange={(e) => setConfig({...config, initiativeContext: e.target.value})} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-100 font-mono text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Display Name</label>
                        <input type="text" value={config.displayName} onChange={(e) => setConfig({...config, displayName: e.target.value})} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-100" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount</label>
                        <input type="number" value={config.amount} onChange={(e) => setConfig({...config, amount: e.target.value})} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-100" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Supported Networks</label>
                    <div className="flex flex-wrap gap-2">
                        {allNetworks.map(net => (
                            <button key={net} onClick={() => toggleSelection(config.supportedNetworks, net, 'supportedNetworks')}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${config.supportedNetworks.includes(net) ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200'}`}>
                                {net}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Merchant Capabilities</label>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200">supports3DS</span>
                        {optionalCapabilities.map(cap => (
                            <button key={cap} onClick={() => toggleSelection(config.merchantCapabilities, cap, 'merchantCapabilities')}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${config.merchantCapabilities.includes(cap) ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200'}`}>
                                {cap}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE PANEL */}
          <div className="flex flex-col space-y-6">
            <div className="bg-white p-10 rounded-2xl shadow-lg text-center border border-gray-50">
                <div className="mb-8">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Order Total</span>
                    <h1 className="text-4xl font-black text-gray-900 mt-2">{config.currencyCode} {parseFloat(config.amount).toFixed(2)}</h1>
                </div>
                <div className="flex justify-center min-h-[50px]" ref={containerRef}></div>
            </div>

            {/* TRANSACTION CONSOLE */}
            <div className="bg-gray-900 rounded-2xl p-6 h-80 shadow-2xl flex flex-col border border-gray-800">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-500 text-xs font-mono uppercase tracking-tighter">Response JSON</span>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                </div>
                <pre className="text-green-400 font-mono text-[10px] leading-relaxed overflow-auto flex-1 custom-scrollbar">
                    {paymentToken ? JSON.stringify(JSON.parse(paymentToken), null, 2) : "// Awaiting transaction..."}
                </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplePay;