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
      className={`relative flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm whitespace-nowrap ${
        page === tab
          ? 'bg-white text-emerald-700 shadow-md scale-105'
          : 'text-gray-600 hover:bg-white/70 hover:text-gray-800'
      }`}
    >
      {label}
      <NotificationBadge count={badges[tab]} pulse={isPulse} />
    </button>
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* ── Sticky Navbar ────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        padding: '0 24px',
        height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '28px' }}>🛒</span>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', letterSpacing: '-0.5px' }}>
              Smart Store
            </span>
            <span style={{
              marginLeft: '8px', fontSize: '11px', fontWeight: 700,
              background: '#d1fae5', color: '#065f46',
              padding: '2px 8px', borderRadius: '6px', border: '1px solid #a7f3d0'
            }}>Shopkeeper</span>
          </div>
        </div>

        {/* Nav Tabs */}
        <div style={{
          display: 'flex', gap: '4px', alignItems: 'center',
          background: '#f3f4f6', padding: '5px', borderRadius: '14px',
          border: '1px solid #e5e7eb', overflowX: 'auto', flexShrink: 1,
          scrollbarWidth: 'none'
        }}>
          {navBtn('dashboard', '🏠 Dashboard')}
          {navBtn('list',      '📦 Inventory')}
          {navBtn('add',       '➕ Add Product')}
          {navBtn('alerts',    '🔔 Alerts',    true)}
          {navBtn('shop',      '🏪 My Shop')}
          {navBtn('orders',    '📋 Orders',    true)}
          {navBtn('delivery',  '🚴 Delivery')}
          {navBtn('profile',   '👤 Profile')}
        </div>

        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
            👤 {shopkeeper.name}
          </span>
          <button
            onClick={onLogout}
            style={{
              background: '#f9fafb', color: '#dc2626', border: '1px solid #fca5a5',
              padding: '8px 18px', borderRadius: '10px', fontSize: '13px',
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = '#fee2e2'}
            onMouseLeave={e => e.target.style.background = '#f9fafb'}
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