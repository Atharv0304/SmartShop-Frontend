import React, { useState } from 'react';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ManageShops from './components/admin/ManageShops';
import ManageDeliveryBoys from './components/admin/ManageDeliveryBoys';
import MonitorOrders from './components/admin/MonitorOrders';
import HandleDisputes from './components/admin/HandleDisputes';

function AdminMain() {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('admin');
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = useState('dashboard');

  const handleLogin = (data) => {
    localStorage.setItem('admin', JSON.stringify(data));
    setAdmin(data);
    setPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    setAdmin(null);
  };

  if (!admin) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <span>🛡️</span> SmartStore <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md ml-2 border border-indigo-200">Admin</span>
        </h1>
        <div className="flex gap-2 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50 overflow-x-auto hide-scrollbar">
          <button onClick={() => setPage('dashboard')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'dashboard' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}>
            📊 Analytics
          </button>
          <button onClick={() => setPage('shops')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'shops' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}>
            🏪 Shops
          </button>
          <button onClick={() => setPage('delivery')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'delivery' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}>
            🚴 Delivery Partners
          </button>
          <button onClick={() => setPage('orders')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'orders' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}>
            📋 Orders & Payments
          </button>
          <button onClick={() => setPage('disputes')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'disputes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}>
            ⚖️ Disputes
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-700 hidden md:block">
            👤 {admin.name}
          </span>
          <button onClick={handleLogout}
            className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition border border-slate-200 hover:border-rose-200">
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        {page === 'dashboard' && <AdminDashboard />}
        {page === 'shops' && <ManageShops />}
        {page === 'delivery' && <ManageDeliveryBoys />}
        {page === 'orders' && <MonitorOrders />}
        {page === 'disputes' && <HandleDisputes />}
      </div>
    </div>
  );
}

export default AdminMain;
