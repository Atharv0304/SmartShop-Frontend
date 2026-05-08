import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const CustomerProfile = ({ customer, onLogout }) => {
  const [orders, setOrders]         = useState([]);
  const [activeTab, setActiveTab]   = useState('profile');
  const [loading, setLoading]       = useState(false);
  const [cancelModal, setCancelModal] = useState(null); // { orderId, shopName, amount }
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg]   = useState('');
  const [hasUnreadOrders, setHasUnreadOrders] = useState(false);

  const ordersRef = useRef([]);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'orders') {
      setHasUnreadOrders(false);
    }
  }, [activeTab]);

  const CANCEL_REASONS = [
    { emoji: '😕', label: 'Changed my mind' },
    { emoji: '📦', label: 'Wrong items ordered' },
    { emoji: '💰', label: 'Found better price' },
    { emoji: '⏰', label: 'Order taking too long' },
  ];

  const CANCELLABLE = ['PENDING','CONFIRMED','PREPARING','LOOKING_FOR_DELIVERY'];

  useEffect(() => {
    fetchOrders(false);
    const interval = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await axios.get(
        `https://smartshop-backend-64zl.onrender.com/api/orders/customer/${customer.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('customerToken')}` }}
      );
      const sorted = [...res.data].sort((a, b) => b.id - a.id);
      
      if (isPolling && ordersRef.current.length > 0) {
        const isDifferent = JSON.stringify(sorted) !== JSON.stringify(ordersRef.current);
        if (isDifferent && activeTabRef.current !== 'orders') {
          setHasUnreadOrders(true);
        }
      }
      
      ordersRef.current = sorted;
      setOrders(sorted);
    } catch (err) {
      console.error(err);
    }
    if (!isPolling) setLoading(false);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      await axios.put(
        `https://smartshop-backend-64zl.onrender.com/api/orders/cancel/${cancelModal.orderId}?customerId=${customer.id}&reason=${encodeURIComponent(cancelReason)}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('customerToken')}` }}
      );
      setCancelMsg('✅ Order cancelled successfully!');
      fetchOrders();
      setTimeout(() => { setCancelModal(null); setCancelMsg(''); setCancelReason(''); }, 1800);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data || 'Failed to cancel order.';
      setCancelMsg('❌ ' + msg);
    }
    setCancelling(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
      case 'PREPARING': return 'bg-orange-100 text-orange-700';
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'CONFIRMED': return '✅';
      case 'PREPARING': return '👨‍🍳';
      case 'DELIVERED': return '🚚';
      case 'CANCELLED': return '❌';
      default: return '📦';
    }
  };

  const totalSpent = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      try {
        await axios.delete(`https://smartshop-backend-64zl.onrender.com/api/customer/profile/${customer.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('customerToken')}` }
        });
        alert("Your account has been deleted successfully.");
        onLogout();
      } catch (err) {
        console.error("Failed to delete account", err);
        alert("Failed to delete account.");
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow">
              👤
            </div>
            <div>
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <p className="text-blue-100 text-sm">{customer.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-blue-100 mt-1">Total Orders</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">
                {orders.filter(o => o.status === 'DELIVERED').length}
              </p>
              <p className="text-xs text-blue-100 mt-1">Delivered</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">₹{totalSpent}</p>
              <p className="text-xs text-blue-100 mt-1">Total Spent</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            👤 Profile
          </button>
          <button onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition relative ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            📦 My Orders ({orders.length})
            {hasUnreadOrders && (
              <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full animate-ping"></span>
            )}
            {hasUnreadOrders && (
              <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-bold text-gray-700 mb-4">👤 Personal Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">👤</span>
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="font-medium text-gray-800">{customer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">📧</span>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium text-gray-800">{customer.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-bold text-gray-700 mb-4">📊 Order Statistics</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Orders', value: orders.length, color: 'text-blue-600', emoji: '📦' },
                  { label: 'Delivered', value: orders.filter(o => o.status === 'DELIVERED').length, color: 'text-green-600', emoji: '🚚' },
                  { label: 'Pending', value: orders.filter(o => o.status === 'PENDING').length, color: 'text-yellow-600', emoji: '⏳' },
                  { label: 'Cancelled', value: orders.filter(o => o.status === 'CANCELLED').length, color: 'text-red-600', emoji: '❌' },
                  { label: 'Total Spent', value: `₹${totalSpent}`, color: 'text-purple-600', emoji: '💰' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span>{stat.emoji}</span>
                      <span className="text-sm text-gray-600">{stat.label}</span>
                    </div>
                    <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button onClick={onLogout}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition">
                🚪 Logout
              </button>
              <button onClick={handleDeleteAccount}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition">
                🗑️ Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow">
                <p className="text-5xl mb-4">📭</p>
                <p className="text-gray-500 font-medium">No orders yet!</p>
                <p className="text-gray-400 text-sm mt-1">Start shopping from nearby stores</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl shadow p-4">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-800">Order #{order.id}</p>
                        <p className="text-xs text-gray-500">🏪 {order.shopName || 'Smart Store'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                        {getStatusEmoji(order.status)} {order.status}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span className="text-gray-600">{item.productName} x{item.quantity}</span>
                          <span className="font-medium">₹{item.subtotal}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        <span>{order.deliveryType === 'HOME_DELIVERY' ? '🚚 Home Delivery' : '🏪 Pickup'}</span>
                        <span className="mx-2">•</span>
                        <span>💳 {order.paymentMethod}</span>
                      </div>
                      <span className="font-bold text-green-600">₹{order.totalAmount}</span>
                    </div>

                  {/* Delivery Address */}
                    {order.deliveryAddress && (
                      <div className="mt-2 text-xs text-gray-400 flex items-start gap-1">
                        <span>📍</span>
                        <span>{order.deliveryAddress}</span>
                      </div>
                    )}

                    {/* Cancelled notice — shows who cancelled and the reason */}
                    {order.status === 'CANCELLED' && (() => {
                      const byShop = order.cancelReason?.startsWith('SHOPKEEPER:');
                      const reason = byShop
                        ? order.cancelReason.replace('SHOPKEEPER:', '')
                        : order.cancelReason;
                      return (
                        <div className={`mt-3 pt-3 border-t border-gray-100 rounded-xl p-3 ${byShop ? 'bg-orange-50' : 'bg-red-50'}`}>
                          <p className={`text-xs font-bold ${byShop ? 'text-orange-700' : 'text-red-600'}`}>
                            {byShop ? '🏪 Cancelled by Shopkeeper' : '❌ You cancelled this order'}
                          </p>
                          {reason && (
                            <p className={`text-xs mt-1 ${byShop ? 'text-orange-600' : 'text-red-500'}`}>
                              💬 Reason: "{reason}"
                            </p>
                          )}
                          {byShop && (
                            <p className="text-xs text-orange-400 mt-1">
                              A refund will be issued if you paid online.
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Cancel Button — only for cancellable statuses */}
                    {CANCELLABLE.includes(order.status) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => { setCancelModal({ orderId: order.id, shopName: order.shopName, amount: order.totalAmount }); setCancelReason(''); setCancelMsg(''); }}
                          className="w-full text-sm text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-400 font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-2">
                          ❌ Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cancel Order Modal ───────────────────────────────────────────── */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCancelModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 text-lg mb-1">❌ Cancel Order #{cancelModal.orderId}</h3>
            <p className="text-sm text-gray-500 mb-4">🏪 {cancelModal.shopName} • ₹{cancelModal.amount}</p>

            <p className="text-sm font-semibold text-gray-700 mb-3">Why are you cancelling?</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {CANCEL_REASONS.map(r => (
                <button key={r.label}
                  onClick={() => setCancelReason(r.label)}
                  className={`text-sm py-2 px-3 rounded-xl border font-medium transition-all ${
                    cancelReason === r.label
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
                  }`}>
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="✏️ Other reason (type here)…"
              value={CANCEL_REASONS.some(r => r.label === cancelReason) ? '' : cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 mb-3"
            />

            {cancelMsg && (
              <p className={`text-sm text-center mb-3 font-medium ${
                cancelMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'
              }`}>{cancelMsg}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={!cancelReason.trim() || cancelling}
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-1">
                {cancelling ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '❌'}
                {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;