import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import SalesAnalytics from './SalesAnalytics';
import DeliveryManagement from './DeliveryManagement';

const Dashboard = ({ shopkeeper }) => {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState('inventory');
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (shopkeeper?.email) {
      api.get(`/api/products/shopkeeper/${shopkeeper.email}`)
        .then(res => setProducts(res.data))
        .catch(err => console.error(err));
        
      fetchPendingConnections();
      const interval = setInterval(fetchPendingConnections, 10000);
      return () => clearInterval(interval);
    }
  }, [shopkeeper]);

  const fetchPendingConnections = async () => {
    try {
      const shopsRes = await api.get('/api/shops/all');
      const myShop = shopsRes.data.find(s => s.email === shopkeeper?.email);
      if (myShop) {
        const connRes = await api.get(`/api/connections/shop/${myShop.id}`);
        const pending = connRes.data.filter(c => c.status === 'PENDING').length;
        setPendingRequests(pending);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date();
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const expiredProducts = products.filter(p => new Date(p.expiryDate) < today).length;
  const expiringSoon = products.filter(p => {
    const diff = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  }).length;
  const goodProducts = products.filter(p => {
    const diff = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
    return diff > 30;
  }).length;

  const categories = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const recent = [...products].slice(-5).reverse();

  const StatCard = ({ icon, label, value, gradient, textShadow }) => (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 relative overflow-hidden group border border-gray-100">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-10 transition-opacity duration-300`} />
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500`} />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-[11px] text-gray-500 font-extrabold mb-1 tracking-widest uppercase">{label}</p>
          <p className={`text-4xl font-black ${textShadow}`}>{value}</p>
        </div>
        <span className="text-5xl opacity-90 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-sm">{icon}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 relative">
      {/* Fixed Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: "url('/images/dashboard_bg.png')" }} 
      />
      {/* Glassmorphism Overlay */}
      <div className="fixed inset-0 z-0 bg-white/50 backdrop-blur-md" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">👋 Welcome, Shopkeeper!</h2>
            <p className="text-gray-500 text-sm mt-1">Here's your store overview for today</p>
          </div>
          
          <div className="bg-white/50 backdrop-blur-md p-1 rounded-xl border border-white/60 inline-flex shadow-sm">
            <button 
              onClick={() => setView('inventory')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${view === 'inventory' ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📦 Inventory
            </button>
            <button 
              onClick={() => setView('sales')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${view === 'sales' ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📈 Sales Analytics
            </button>
            <button 
              onClick={() => setView('delivery')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 relative ${view === 'delivery' ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🚴 Delivery
              {pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {pendingRequests}
                </span>
              )}
            </button>
          </div>
        </div>

        {pendingRequests > 0 && view !== 'delivery' && (
          <div className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 shadow-lg text-white flex items-center justify-between cursor-pointer hover:shadow-xl transition-all" onClick={() => setView('delivery')}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full animate-pulse">
                🔔
              </div>
              <div>
                <p className="font-bold text-lg">New Delivery Partner Requests!</p>
                <p className="text-orange-100 text-sm">{pendingRequests} rider(s) want to join your shop.</p>
              </div>
            </div>
            <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors shadow-sm">
              View Requests
            </button>
          </div>
        )}

        {view === 'delivery' ? (
          <DeliveryManagement shopkeeper={shopkeeper} />
        ) : view === 'sales' ? (
          <SalesAnalytics shopkeeper={shopkeeper} />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon="📦" label="Total Products" value={totalProducts} gradient="from-blue-400 to-indigo-600" textShadow="text-blue-900" />
          <StatCard icon="🗂️" label="Total Stock" value={totalStock} gradient="from-purple-400 to-pink-600" textShadow="text-purple-900" />
          <StatCard icon="💰" label="Stock Value" value={`₹${totalValue.toLocaleString()}`} gradient="from-emerald-400 to-teal-600" textShadow="text-emerald-900" />
          <StatCard icon="✅" label="Good Products" value={goodProducts} gradient="from-green-400 to-emerald-600" textShadow="text-green-900" />
          <StatCard icon="⚠️" label="Expiring Soon" value={expiringSoon} gradient="from-yellow-400 to-orange-500" textShadow="text-orange-900" />
          <StatCard icon="❌" label="Expired" value={expiredProducts} gradient="from-red-400 to-rose-600" textShadow="text-red-900" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-lg font-bold text-gray-700 mb-4">📊 Products by Category</h3>
            {Object.keys(categories).length === 0 ? (
              <p className="text-gray-400 text-sm">No products yet</p>
            ) : (
              Object.entries(categories).map(([cat, count]) => (
                <div key={cat} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize font-medium text-gray-600">{cat}</span>
                    <span className="text-gray-500">{count} items</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(count / totalProducts) * 100}%` }}>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-lg font-bold text-gray-700 mb-4">🕐 Recently Added</h3>
            {recent.length === 0 ? (
              <p className="text-gray-400 text-sm">No products yet</p>
            ) : (
              recent.map((p) => {
                const diff = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
                const color = diff < 0 ? 'text-red-500' : diff <= 7 ? 'text-orange-500' : 'text-green-500';
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-700">{p.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{p.category} • Qty: {p.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700">₹{p.price}</p>
                      <p className={`text-xs font-medium ${color}`}>
                        {diff < 0 ? 'Expired' : `${diff}d left`}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;