import React, { useState } from 'react';
import axios from 'axios';

const CustomerLogin = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('https://smartshop-backend-64zl.onrender.com/api/customer/register', form);
      setMessage('✅ Registered! Please login.');
      setIsRegister(false);
      setError('');
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || '❌ Registration failed';
      setError(errMsg);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('https://smartshop-backend-64zl.onrender.com/api/customer/login', {
        email: form.email,
        password: form.password
      });
      if (res.data.token) {
        localStorage.setItem('customerToken', res.data.token);
        localStorage.setItem('customer', JSON.stringify(res.data));
        onLogin(res.data);
      }
    } catch (err) {
      setError('❌ Invalid email or password!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🛍️</div>
          <h1 className="text-2xl font-bold text-blue-600">Smart Store</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isRegister ? 'Create Customer Account' : 'Customer Login'}
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

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="Enter your name" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="Enter phone number" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="Enter email" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="Enter password" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">
            {loading ? '⏳ Please wait...' : isRegister ? '📝 Register' : '🔐 Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); setMessage(''); }}
            className="text-blue-600 font-semibold ml-1 hover:underline">
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-gray-400">Are you a shopkeeper?
            <a href="/" className="text-green-600 font-semibold ml-1 hover:underline">
              Go to Shopkeeper Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;