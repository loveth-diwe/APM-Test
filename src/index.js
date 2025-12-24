import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home'; // Import the new Home component
import ApplePay from './ApplePay';
import GooglePay from './GooglePay';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* The Landing Page is now the root path */}
        <Route path="/" element={<Home />} />

        {/* Specific payment routes */}
        <Route path="/applepay" element={<ApplePay />} />
        <Route path="/googlepay" element={<GooglePay />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);