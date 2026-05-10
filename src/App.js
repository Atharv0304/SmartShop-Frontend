import React, { useState } from 'react';
import AddProduct from './components/AddProduct';
import ProductList from './components/ProductList';
import Dashboard from './components/Dashboard';
import ExpiryAlerts from './components/ExpiryAlerts';
import Login from './components/Login';
import ShopRegister from './components/ShopRegister';
import OrderManagement from './components/OrderManagement';
import DeliveryManagement from './components/DeliveryManagement';
import ShopkeeperProfile from './components/ShopkeeperProfile';
import ChatBot from './components/customer/ChatBot';
import NotificationBadge from './components/NotificationBadge';
import { NotificationProvider, useNotifications } from './context/NotificationContext';

// ─── Inner component — consumes the notification context ──────────────────────
function ShopkeeperDashboard({ shopkeeper, onUpdate, onLogout }) {
  const [page, setPage] = useState('dashboard');
  const { badges, clearBadge } = useNotifications();

  // Navigate to a tab and clear its badge
  const navigate = (tab) => {
    setPage(tab);
    clearBadge(tab);
  };

  const navBtn = (tab, label, isPulse = false) => (
    <button
      id={`nav-${tab}`}
      onClick={() => navigate(tab)}
      className={`relative px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${
        page === tab
          ? 'bg-white text-emerald-700 shadow-sm'
          : 'text-gray-600 hover:bg-white/50'
      }`}
    >
      {label}
      <NotificationBadge count={badges[tab]} pulse={isPulse} />
    </button>
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* ── Sticky Navbar ────────────────────────────────────────────── */}
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-2xl font-extrabold text-gradient flex items-center gap-2">
          <span>🛒</span> Smart Store{' '}
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md ml-2 border border-emerald-200">
            Shopkeeper
          </span>
        </h1>

        <div className="flex gap-2 bg-gray-100/50 p-1 rounded-xl border border-gray-200/50 overflow-x-auto hide-scrollbar">
          {navBtn('dashboard', '🏠 Dashboard')}
          {navBtn('list',      '📦 Inventory')}
          {navBtn('add',       '➕ Add Product')}
          {navBtn('alerts',    '🔔 Alerts',    true)}   {/* pulse on urgent */}
          {navBtn('shop',      '🏪 My Shop')}
          {navBtn('orders',    '📋 Orders',    true)}   {/* pulse on pending orders */}
          {navBtn('delivery',  '🚴 Delivery')}
          {navBtn('profile',   '👤 Profile')}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-700 hidden md:block">
            👤 {shopkeeper.name}
          </span>
          <button
            onClick={onLogout}
            className="bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition border border-gray-200 hover:border-rose-200"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── Page Content ─────────────────────────────────────────────── */}
      {page === 'dashboard' && <Dashboard shopkeeper={shopkeeper} />}
      {page === 'list'      && <ProductList shopkeeper={shopkeeper} />}
      {page === 'add'       && <AddProduct shopkeeper={shopkeeper} />}
      {page === 'alerts'    && <ExpiryAlerts shopkeeper={shopkeeper} />}
      {page === 'shop'      && <ShopRegister shopkeeper={shopkeeper} />}
      {page === 'orders'    && <OrderManagement shopkeeper={shopkeeper} />}
      {page === 'delivery'  && <DeliveryManagement shopkeeper={shopkeeper} />}
      {page === 'profile'   && (
        <ShopkeeperProfile
          shopkeeper={shopkeeper}
          onUpdate={onUpdate}
          onLogout={onLogout}
        />
      )}

      {/* AI Chatbot */}
      <ChatBot role="SHOPKEEPER" />
    </div>
  );
}

// ─── Root component — owns auth state & wraps with context provider ───────────
function App() {
  const [shopkeeper, setShopkeeper] = useState(() => {
    const saved = localStorage.getItem('shopkeeper');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('shopkeeper', JSON.stringify(data));
    setShopkeeper(data);
  };

  const handleUpdate = (updatedData) => {
    const newData = { ...shopkeeper, ...updatedData };
    localStorage.setItem('shopkeeper', JSON.stringify(newData));
    setShopkeeper(newData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('shopkeeper');
    setShopkeeper(null);
  };

  if (!shopkeeper) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <NotificationProvider shopkeeper={shopkeeper}>
      <ShopkeeperDashboard
        shopkeeper={shopkeeper}
        onUpdate={handleUpdate}
        onLogout={handleLogout}
      />
    </NotificationProvider>
  );
}

export default App;