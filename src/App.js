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
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '10px',
        fontWeight: 600,
        fontSize: '14px',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s ease',
        background: page === tab ? '#ffffff' : 'transparent',
        color: page === tab ? '#065f46' : '#6b7280',
        boxShadow: page === tab ? '0 1px 8px rgba(0,0,0,0.1)' : 'none',
        transform: page === tab ? 'scale(1.04)' : 'scale(1)',
      }}
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
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        padding: '0 24px',
        minHeight: '76px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px',
        overflow: 'visible',
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

        {/* Nav Tabs — paddingTop:14px makes room for absolute-positioned badges */}
        <div style={{
          display: 'flex', gap: '4px', alignItems: 'center',
          background: '#f3f4f6',
          padding: '14px 6px 6px 6px',
          borderRadius: '14px',
          border: '1px solid #e5e7eb',
          overflowX: 'auto',
          overflowY: 'visible',
          flexShrink: 1,
          scrollbarWidth: 'none',
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