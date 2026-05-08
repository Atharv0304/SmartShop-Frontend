import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [step, setStep] = useState('login'); // login, register, otp
  const [form, setForm] = useState({
    name: '', email: '', password: '', shopName: '', phone: ''
  });
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 1 - Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('https://smartshop-backend-64zl.onrender.com/api/shopkeeper/send-otp',
        { email: form.email });
      setMessage('✅ OTP sent to ' + form.email);
      setError('');
      setStep('otp');
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || '❌ Failed to send OTP';
      setError(errMsg);
      setMessage('');
    }
    setLoading(false);
  };

  // Step 2 - Verify OTP and Register
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Verify OTP
      await axios.post('https://smartshop-backend-64zl.onrender.com/api/shopkeeper/verify-otp',
        { email: form.email, otp });

      // Register
      await axios.post('https://smartshop-backend-64zl.onrender.com/api/shopkeeper/register', form);

      setMessage('✅ Registered successfully! Please login.');
      setError('');
      setStep('login');
      setForm({ name: '', email: '', password: '', shopName: '', phone: '' });
      setOtp('');
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || '❌ Invalid OTP!';
      setError(errMsg);
      setMessage('');
    }
    setLoading(false);
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('https://smartshop-backend-64zl.onrender.com/api/shopkeeper/login', {
        email: form.email,
        password: form.password
      });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('shopkeeper', JSON.stringify(res.data));
        onLogin(res.data);
      }
    } catch (err) {
      setError('❌ Invalid email or password!');
      setMessage('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🛒</div>
          <h1 className="text-2xl font-bold text-green-700">Smart Store</h1>
          <p className="text-gray-400 text-sm mt-1">
            {step === 'login' ? 'Shopkeeper Login' :
             step === 'register' ? 'Create Account' :
             'Verify Your Email'}
          </p>
        </div>

        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 text-center text-sm font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-center text-sm font-medium">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="Enter email" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="Enter password" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition">
              {loading ? '⏳ Logging in...' : '🔐 Login'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Don't have an account?
              <button type="button" onClick={() => { setStep('register'); setError(''); setMessage(''); }}
                className="text-green-600 font-semibold ml-1 hover:underline">
                Register
              </button>
            </p>
          </form>
        )}

        {/* REGISTER FORM */}
        {step === 'register' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="Enter your name" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Name</label>
              <input type="text" name="shopName" value={form.shopName} onChange={handleChange}
                placeholder="Enter shop name" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input type="text" name="phone" value={form.phone} onChange={handleChange}
                placeholder="Enter phone number" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="Enter email" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="Enter password" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition">
              {loading ? '⏳ Sending OTP...' : '📧 Send OTP to Email'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Already have an account?
              <button type="button" onClick={() => { setStep('login'); setError(''); setMessage(''); }}
                className="text-green-600 font-semibold ml-1 hover:underline">
                Login
              </button>
            </p>
          </form>
        )}

        {/* OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">📧</div>
              <p className="text-gray-600 text-sm">
                OTP sent to <span className="font-bold text-green-700">{form.email}</span>
              </p>
              <p className="text-gray-400 text-xs mt-1">Check your inbox and enter the 6 digit OTP</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Enter OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="Enter 6 digit OTP" maxLength="6" required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-center text-2xl font-bold tracking-widest" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition">
              {loading ? '⏳ Verifying...' : '✅ Verify & Register'}
            </button>
            <button type="button" onClick={() => handleSendOtp({ preventDefault: () => {} })}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 rounded-lg transition text-sm">
              🔄 Resend OTP
            </button>
            <p className="text-center text-sm text-gray-500">
              <button type="button" onClick={() => { setStep('register'); setError(''); setMessage(''); }}
                className="text-green-600 font-semibold hover:underline">
                ← Back to Register
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;