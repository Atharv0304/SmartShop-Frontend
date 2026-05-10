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

  const navBtn = (tab, label, isPulse = false) => {
    const isActive = page === tab;
    return (
      <button
        key={tab}
        id={`nav-${tab}`}
        onClick={() => navigate(tab)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 20px',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '15px',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          border: 'none',
          transition: 'all 0.18s ease',
          background: isActive ? '#ffffff' : 'transparent',
          color: isActive ? '#059669' : '#4b5563',
          boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.12)' : 'none',
          transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
          marginTop: '10px',   /* space above for badge */
        }}
      >
        {label}
        <NotificationBadge count={badges[tab]} pulse={isPulse} />
      </button>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* ── Two-row Sticky Navbar ──────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#ffffff',
        borderBottom: '2px solid #e5e7eb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        {/* ── Row 1: Brand + User ─────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 28px',
          borderBottom: '1px solid #f3f4f6',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '30px' }}>🛒</span>
            <div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#065f46', letterSpacing: '-0.5px' }}>
                Smart Store
              </span>
              <span style={{
                marginLeft: '10px', fontSize: '11px', fontWeight: 700,
                background: '#d1fae5', color: '#065f46',
                padding: '3px 10px', borderRadius: '20px', border: '1px solid #a7f3d0'
              }}>Shopkeeper</span>
            </div>
          </div>

          {/* User + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>
              👤 {shopkeeper.name}
            </span>
            <button
              onClick={onLogout}
              style={{
                background: '#fff1f2', color: '#dc2626', border: '1.5px solid #fca5a5',
                padding: '8px 20px', borderRadius: '10px', fontSize: '14px',
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff1f2'; }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* ── Row 2: Nav Tabs (full width) ────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          gap: '4px',
          padding: '0 20px 8px 20px',
          background: '#f9fafb',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {navBtn('dashboard', '🏠 Dashboard')}
          {navBtn('list',      '📦 Inventory')}
          {navBtn('add',       '➕ Add Product')}
          {navBtn('alerts',    '🔔 Alerts',   true)}
          {navBtn('shop',      '🏪 My Shop')}
          {navBtn('orders',    '📋 Orders',   true)}
          {navBtn('delivery',  '🚴 Delivery')}
          {navBtn('profile',   '👤 Profile')}
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