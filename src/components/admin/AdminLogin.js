import React, { useState } from 'react';
import api from '../../utils/api';

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/admin/login', { email, password });
      onLogin(response.data);
    } catch (err) {
      setError('Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-indigo-50/50 backdrop-blur-3xl z-0" />
      <div className="w-full max-w-md p-8 glass rounded-3xl shadow-2xl relative z-10 border border-white/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 transform -rotate-6 hover:rotate-0 transition-transform">
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Portal</h2>
          <p className="text-slate-500 font-medium mt-2">Secure access for administrators</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 flex items-center gap-2 animate-bounce">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-white/60 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition font-medium"
              placeholder="admin@smartstore.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-white/60 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition font-medium"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <span className="animate-spin text-xl">⏳</span> : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
