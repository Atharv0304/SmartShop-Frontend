import React, { useState } from 'react';
import axios from 'axios';

const OtpVerification = ({ order, onVerified }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      setError('Please enter 4 digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(
        'https://smartshop-backend-64zl.onrender.com/api/orders/verify-delivery-otp',
        { orderId: order.id, otp },
        { headers: {
          Authorization: `Bearer ${localStorage.getItem('deliveryToken')}`
        }}
      );
      setSuccess(true);
      setTimeout(() => {
        onVerified && onVerified();
      }, 2000);
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Invalid OTP!';
      setError(errMsg);
      setOtp('');
    }
    setLoading(false);
  };

  const handleKeyPress = (key) => {
    if (key === '⌫') {
      setOtp(prev => prev.slice(0, -1));
    } else if (key !== '' && otp.length < 4) {
      const newOtp = otp + key;
      setOtp(newOtp);
    }
  };

  if (success) {
    return (
      <div className="text-center p-6">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-green-600 font-bold text-xl mb-2">
          Delivery Confirmed!
        </p>
        <p className="text-gray-500 text-sm">
          Order #{order.id} delivered successfully
        </p>
        <div className="mt-4 bg-green-50 rounded-xl p-3">
          <p className="text-green-600 text-sm">
            ✅ OTP verified and order marked as delivered!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🔐</div>
        <h3 className="text-lg font-bold text-gray-800">
          Verify Delivery OTP
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Ask customer for their 4-digit OTP
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Order #{order.id} — {order.customerName}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-3 text-sm text-center">
          ❌ {error}
        </div>
      )}

      {/* OTP Display */}
      <div className="flex justify-center gap-2 mb-4">
        {[0,1,2,3].map(i => (
          <div key={i}
            className={`w-14 h-16 border-2 rounded-xl flex items-center justify-center text-3xl font-bold transition ${
              otp[i]
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-300 bg-gray-50 text-gray-400'}`}>
            {otp[i] || '·'}
          </div>
        ))}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((key, i) => (
          <button key={i} type="button"
            onClick={() => handleKeyPress(key.toString())}
            disabled={key === ''}
            className={`py-3 rounded-xl font-bold text-lg transition ${
              key === '⌫'
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : key === ''
                ? 'bg-transparent cursor-default'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 active:bg-gray-300'}`}>
            {key}
          </button>
        ))}
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={loading || otp.length !== 4}
        className={`w-full font-bold py-3 rounded-xl transition text-white ${
          otp.length === 4 && !loading
            ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
            : 'bg-gray-300 cursor-not-allowed'}`}>
        {loading ? '⏳ Verifying...' : '✅ Confirm Delivery'}
      </button>

      {otp.length > 0 && (
        <button onClick={() => setOtp('')}
          className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700">
          Clear
        </button>
      )}
    </div>
  );
};

export default OtpVerification;