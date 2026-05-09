import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../utils/api';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const OrderManagement = ({ shopkeeper }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [showShopOtpModal, setShowShopOtpModal] = useState(false);
  const [currentShopOtp, setCurrentShopOtp] = useState('');
  const [currentOtpOrderId, setCurrentOtpOrderId] = useState(null);
  const [pickupOtpInputs, setPickupOtpInputs] = useState({});
  // Shopkeeper cancel modal state
  const [shopCancelModal, setShopCancelModal] = useState(null); // { orderId, shopId, customerName }
  const [shopCancelReason, setShopCancelReason] = useState('');
  const [shopCancelling, setShopCancelling] = useState(false);

  const SHOP_CANCEL_REASONS = [
    { emoji: '📦', label: 'Item out of stock' },
    { emoji: '🏪', label: 'Shop is closing early' },
    { emoji: '💰', label: 'Price changed' },
    { emoji: '📍', label: 'Cannot deliver to area' },
    { emoji: '⚠️', label: 'Technical issue' },
  ];

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    if (!shopkeeper?.email) return;
    try {
      // First find the shop's actual ID
      const shopsRes = await api.get('/api/shops/all');
      const shop = shopsRes.data.find(s => s.email === shopkeeper.email);
      
      if (!shop) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const res = await api.get(`/api/orders/shop/${shop.id}`);
      // Sort orders by the most recent action/timestamp so newly updated orders go to the top
      const sortedOrders = res.data.sort((a, b) => {
        const getTime = (order) => Math.max(
          ...[
            order.orderTime, 
            order.confirmedTime, 
            order.readyTime, 
            order.assignedTime, 
            order.pickedTime, 
            order.outForDeliveryTime, 
            order.deliveredTime
          ]
          .filter(Boolean)
          .map(t => new Date(t).getTime())
        );
        return getTime(b) - getTime(a);
      });
      setOrders(sortedOrders);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const confirmOrder = async (orderId) => {
    try {
      await api.put(`/api/orders/confirm/${orderId}`);
      fetchOrders();
      showNotif('✅ Order confirmed! Customer notified.');
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Error';
      showNotif('❌ ' + errMsg);
    }
  };

  const startPreparing = async (orderId) => {
    try {
      await api.put(`/api/orders/status/${orderId}`, { status: 'PREPARING' });
      fetchOrders();
      showNotif('👨‍🍳 Order is being prepared!');
    } catch (err) {
      showNotif('❌ Error');
    }
  };

  const markOrderReady = async (orderId, order) => {
    try {
      await api.put(`/api/orders/ready/${orderId}`);
      fetchOrders();
      if (order?.deliveryType === 'PICKUP') {
        showNotif('✅ Order ready! Customer notified to come pick up.');
      } else {
        showNotif('✅ Order ready! All delivery boys notified. Check Shop OTP below.');
        setCurrentOtpOrderId(orderId);
        setShowShopOtpModal(true);
      }
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Error';
      showNotif('❌ ' + errMsg);
    }
  };

  const verifyPickupOtp = async (orderId, otp) => {
    try {
      await api.post('/api/orders/verify-delivery-otp', { orderId, otp });
      fetchOrders();
      showNotif('🎉 Pickup OTP verified! Order completed.');
      setPickupOtpInputs(prev => ({ ...prev, [orderId]: { otp: '', error: '' } }));
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string'
        ? err.response.data : err.response?.data?.message || 'Invalid OTP!';
      setPickupOtpInputs(prev => ({ ...prev, [orderId]: { ...prev[orderId], error: errMsg } }));
    }
  };

  const openShopCancelModal = (e, order, shopId) => {
    e.stopPropagation();
    setShopCancelModal({ orderId: order.id, shopId, customerName: order.customerName, shopName: order.shopName });
    setShopCancelReason('');
  };

  const confirmShopCancel = async () => {
    if (!shopCancelReason.trim()) return;
    setShopCancelling(true);
    try {
      await api.put(
        `/api/orders/cancel-by-shop/${shopCancelModal.orderId}?shopId=${shopCancelModal.shopId}&reason=${encodeURIComponent(shopCancelReason)}`
      );
      showNotif('❌ Order cancelled. Customer has been notified.');
      fetchOrders();
      setShopCancelModal(null);
      setShopCancelReason('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to cancel order.';
      showNotif('❌ ' + msg);
    }
    setShopCancelling(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'CONFIRMED': 'bg-blue-100 text-blue-700',
      'PREPARING': 'bg-orange-100 text-orange-700',
      'LOOKING_FOR_DELIVERY': 'bg-indigo-100 text-indigo-700',
      'DELIVERY_ACCEPTED': 'bg-purple-100 text-purple-700',
      'PICKED': 'bg-cyan-100 text-cyan-700',
      'OUT_FOR_DELIVERY': 'bg-teal-100 text-teal-700',
      'DELIVERED': 'bg-green-100 text-green-700',
      'READY_FOR_PICKUP': 'bg-emerald-100 text-emerald-700',
      'CANCELLED': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusEmoji = (status) => {
    const emojis = {
      'PENDING': '⏳',
      'CONFIRMED': '✅',
      'PREPARING': '👨‍🍳',
      'LOOKING_FOR_DELIVERY': '🔍',
      'DELIVERY_ACCEPTED': '🚴',
      'PICKED': '📦',
      'OUT_FOR_DELIVERY': '🛵',
      'DELIVERED': '🎉',
      'READY_FOR_PICKUP': '🏪',
      'CANCELLED': '❌',
    };
    return emojis[status] || '📋';
  };

  const allStatuses = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING',
    'LOOKING_FOR_DELIVERY', 'DELIVERY_ACCEPTED', 'PICKED',
    'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED'];

  const canRetryDelivery = (order) => {
    if (order.status !== 'LOOKING_FOR_DELIVERY') return false;
    const timeToUse = order.readyTime || order.orderTime;
    if (!timeToUse) return true;
    const elapsedMs = Date.now() - new Date(timeToUse).getTime();
    return elapsedMs >= 5 * 60 * 1000;
  };

  const filteredOrders = filter === 'ALL'
    ? orders : orders.filter(o => o.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    active: orders.filter(o => ['LOOKING_FOR_DELIVERY',
      'DELIVERY_ACCEPTED', 'PICKED'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    revenue: orders.filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 max-w-sm">
            {notification}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📋 Order Management</h2>
          <p className="text-gray-500 text-sm mt-1">
            Complete order flow with OTP verification
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-800', bg: 'bg-white' },
            { label: '⏳ Pending', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: '👨‍🍳 Preparing', value: stats.preparing, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: '🚴 Active', value: stats.active, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: '🎉 Delivered', value: stats.delivered, color: 'text-green-600', bg: 'bg-green-50' },
            { label: '💰 Revenue', value: `₹${stats.revenue}`, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl shadow p-3 text-center`}>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {allStatuses.map(status => (
            <button key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {getStatusEmoji(status)} {status.replace(/_/g, ' ')}
              {status !== 'ALL' && (
                <span className="ml-1">
                  ({orders.filter(o => o.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Orders List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Loading orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p>No orders found!</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white rounded-xl shadow p-4 cursor-pointer transition border-2 ${
                    selectedOrder?.id === order.id
                      ? 'border-green-500'
                      : 'border-transparent hover:border-gray-200'}`}>

                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-800">
                        Order #{order.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        👤 {order.customerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        📞 {order.customerPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        getStatusColor(order.status)}`}>
                        {getStatusEmoji(order.status)}{' '}
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-green-600 font-bold mt-1">
                        ₹{order.totalAmount}
                      </p>
                      {order.deliveryCharge > 0 && (
                        <p className="text-xs text-blue-500">
                          +₹{order.deliveryCharge} delivery
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Badges */}
                  {order.deliveryOtp && (
                    <div className={`text-xs px-2 py-1 rounded-lg mb-2 ${
                      order.otpVerified
                        ? 'bg-green-50 text-green-600'
                        : 'bg-yellow-50 text-yellow-600'}`}>
                      {order.otpVerified
                        ? '🔓 Delivery OTP Verified'
                        : '🔐 Customer has Delivery OTP'}
                    </div>
                  )}
                  {order.shopOtp && (
                    <div className={`text-xs px-2 py-1 rounded-lg mb-2 ${
                      order.shopOtpVerified
                        ? 'bg-green-50 text-green-600'
                        : 'bg-blue-50 text-blue-600'}`}>
                      {order.shopOtpVerified
                        ? '✅ Shop OTP Verified — Order Picked'
                        : '🏪 Shop OTP Active'}
                    </div>
                  )}

                  {/* Delivery Boy */}
                  {order.deliveryBoyName && (
                    <div className="bg-purple-50 rounded-lg p-2 mb-2">
                      <p className="text-xs text-purple-700 font-medium">
                        🚴 {order.deliveryBoyName} •{' '}
                        {order.deliveryBoyPhone} •{' '}
                        {order.deliveryBoyVehicle}
                      </p>
                    </div>
                  )}

                  {order.distanceKm > 0 && (
                    <p className="text-xs text-gray-400 mb-2">
                      📍 {order.distanceKm} km away
                    </p>
                  )}

                  <div className="text-xs text-gray-400 flex gap-3 border-t pt-2 mb-3">
                    <span>
                      {order.deliveryType === 'HOME_DELIVERY'
                        ? '🚚 Home' : '🏪 Pickup'}
                    </span>
                    <span>💳 {order.paymentMethod}</span>
                    <span>{order.items?.length || 0} items</span>
                  </div>

                  {/* Items to Prepare */}
                  {order.items && order.items.length > 0 && (
                    <div className="bg-yellow-50 p-2 rounded-lg mb-3 border border-yellow-100">
                      <p className="text-xs font-bold text-yellow-800 mb-1">🛒 Products to Prepare:</p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-700 flex justify-between">
                            <span>• {item.productName}</span>
                            <span className="font-bold">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {order.status === 'PENDING' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={(e) => {
                          e.stopPropagation();
                          confirmOrder(order.id);
                        }}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 rounded-lg font-medium">
                          {order.deliveryType === 'PICKUP' ? '✅ Confirm Pickup Order' : '✅ Confirm + Send OTP'}
                        </button>
                        <button onClick={(e) => openShopCancelModal(e, order, order.shopId)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs py-2 rounded-lg">
                          ❌ Cancel
                        </button>
                      </div>
                    )}

                    {/* ── CANCELLED BANNER — shows who cancelled and why ── */}
                    {order.status === 'CANCELLED' && (() => {
                      const byShop = order.cancelReason?.startsWith('SHOPKEEPER:');
                      const reason = byShop
                        ? order.cancelReason.replace('SHOPKEEPER:', '')
                        : order.cancelReason;
                      return (
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                          <p className="text-red-700 font-bold text-sm">
                            {byShop ? '🏪 Cancelled by You (Shop)' : '❌ Cancelled by Customer'}
                          </p>
                          <p className="text-red-500 text-xs mt-1">
                            {byShop
                              ? 'You cancelled this order.'
                              : `👤 ${order.customerName} cancelled this order.`}
                          </p>
                          {reason && (
                            <p className="text-red-600 text-xs mt-1.5 bg-red-100 rounded-lg px-2 py-1 font-medium">
                              💬 Reason: "{reason}"
                            </p>
                          )}
                          <p className="text-red-400 text-xs mt-1.5">No further action needed.</p>
                        </div>
                      );
                    })()}

                    {order.status === 'CONFIRMED' && (
                      <button onClick={(e) => {
                        e.stopPropagation();
                        startPreparing(order.id);
                      }}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs py-2 rounded-lg font-medium">
                        👨‍🍳 Start Preparing
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button onClick={(e) => {
                        e.stopPropagation();
                        markOrderReady(order.id, order);
                      }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white text-xs py-2 rounded-lg font-medium">
                        {order.deliveryType === 'PICKUP'
                          ? '🏪 Mark Ready for Pickup → Notify Customer'
                          : '✅ Order Ready → Find Delivery Boy'}
                      </button>
                    )}

                    {order.status === 'READY_FOR_PICKUP' && (() => {
                      const otpState = pickupOtpInputs[order.id] || { otp: '', error: '' };
                      const setOtp = (val) => setPickupOtpInputs(prev => ({
                        ...prev, [order.id]: { otp: val, error: '' }
                      }));
                      return (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3" onClick={e => e.stopPropagation()}>
                          <p className="text-emerald-800 text-xs font-bold text-center mb-1">🏪 Customer is here to collect</p>
                          {order.paymentMethod === 'CASH' && (
                            <p className="text-orange-600 text-xs text-center mb-2 font-medium">💵 Collect ₹{order.totalAmount} cash first</p>
                          )}
                          {order.paymentMethod === 'ONLINE' && (
                            <p className="text-green-600 text-xs text-center mb-2 font-medium">✅ Already paid online</p>
                          )}

                          <p className="text-gray-600 text-xs text-center mb-2">Ask customer for their <strong>Pickup OTP</strong></p>

                          {/* OTP boxes */}
                          <div className="flex justify-center gap-2 mb-2">
                            {[0,1,2,3].map(i => (
                              <div key={i} className={`w-10 h-12 border-2 rounded-xl flex items-center justify-center text-xl font-black transition-colors ${
                                otpState.otp[i] ? 'border-emerald-500 bg-white text-gray-900' : 'border-gray-300 text-gray-300'
                              }`}>
                                {otpState.otp[i] || '·'}
                              </div>
                            ))}
                          </div>

                          {otpState.error && (
                            <p className="text-red-500 text-xs text-center mb-2 font-medium">❌ {otpState.error}</p>
                          )}

                          {/* Numpad */}
                          <div className="grid grid-cols-3 gap-1.5 mb-2">
                            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((key, i) => (
                              <button key={i} type="button"
                                onClick={() => {
                                  if (key === '⌫') setOtp(otpState.otp.slice(0, -1));
                                  else if (key !== '' && otpState.otp.length < 4) setOtp(otpState.otp + key);
                                }}
                                className={`py-2 rounded-lg text-sm font-bold transition ${
                                  key === '⌫' ? 'bg-red-100 text-red-600 hover:bg-red-200' :
                                  key === ''   ? '' :
                                  'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                {key}
                              </button>
                            ))}
                          </div>

                          <button
                            disabled={otpState.otp.length !== 4}
                            onClick={() => verifyPickupOtp(order.id, otpState.otp)}
                            className={`w-full py-2 rounded-lg text-xs font-bold text-white transition ${
                              otpState.otp.length === 4
                                ? 'bg-emerald-500 hover:bg-emerald-600 shadow'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}>
                            ✅ Verify OTP & Complete Pickup
                          </button>
                        </div>
                      );
                    })()}

                    {order.status === 'LOOKING_FOR_DELIVERY' && (
                      <div className="space-y-2">
                        <div className="w-full bg-indigo-100 text-indigo-700 text-xs py-2 rounded-lg text-center animate-pulse font-medium">
                          🔍 Looking for delivery boy...
                        </div>
                        {canRetryDelivery(order) && (
                          <button onClick={(e) => {
                            e.stopPropagation();
                            markOrderReady(order.id, order);
                          }}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs py-2 rounded-lg font-medium shadow-sm transition">
                            🔄 Find Again (5m passed)
                          </button>
                        )}
                      </div>
                    )}

                    {order.status === 'DELIVERY_ACCEPTED' && (
                      <div className="space-y-2">
                        <div className="bg-purple-50 text-purple-700 text-xs py-2 rounded-lg text-center">
                          🚴 Delivery boy heading to your shop
                        </div>
                        <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-3 text-center">
                          <p className="text-xs text-blue-600 font-bold mb-1">
                            🔐 Shop OTP — Show to delivery boy
                          </p>
                          <p className="text-2xl text-blue-800 font-extrabold tracking-widest mt-2">
                            {order.shopOtp || 'Waiting...'}
                          </p>
                        </div>
                      </div>
                    )}

                    {order.status === 'PICKED' && (
                      <div className="bg-cyan-50 text-cyan-700 text-xs py-2 rounded-lg text-center font-medium">
                        🛵 Order on the way to customer
                      </div>
                    )}

                    {order.status === 'DELIVERED' && (
                      <div className="bg-green-50 text-green-700 text-xs py-2 rounded-lg text-center font-medium">
                        🎉 Order delivered successfully!
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Detail Panel */}
          <div>
            {selectedOrder ? (
              <div className="bg-white rounded-2xl shadow p-6 sticky top-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Order #{selectedOrder.id}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    getStatusColor(selectedOrder.status)}`}>
                    {getStatusEmoji(selectedOrder.status)}{' '}
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Flow Steps */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-3">
                    📋 Order Flow
                  </p>
                  <div className="space-y-2">
                    {[
                      { status: 'PENDING', label: 'Order Placed', done: true },
                      { status: 'CONFIRMED', label: 'Confirmed + OTP Sent',
                        done: ['CONFIRMED','PREPARING','LOOKING_FOR_DELIVERY',
                          'DELIVERY_ACCEPTED','PICKED','DELIVERED']
                          .includes(selectedOrder.status) },
                      { status: 'PREPARING', label: 'Preparing Order',
                        done: ['PREPARING','LOOKING_FOR_DELIVERY',
                          'DELIVERY_ACCEPTED','PICKED','DELIVERED']
                          .includes(selectedOrder.status) },
                      { status: 'LOOKING_FOR_DELIVERY',
                        label: 'Looking for Delivery Boy',
                        done: ['DELIVERY_ACCEPTED','PICKED','DELIVERED']
                          .includes(selectedOrder.status) },
                      { status: 'DELIVERY_ACCEPTED',
                        label: 'Delivery Boy Accepted',
                        done: ['PICKED','DELIVERED']
                          .includes(selectedOrder.status) },
                      { status: 'PICKED', label: 'Order Picked from Shop',
                        done: ['DELIVERED'].includes(selectedOrder.status) },
                      { status: 'DELIVERED', label: 'Delivered to Customer',
                        done: selectedOrder.status === 'DELIVERED' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                          step.done
                            ? 'bg-green-500 text-white'
                            : selectedOrder.status === step.status
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-400'}`}>
                          {step.done ? '✓' : i + 1}
                        </div>
                        <p className={`text-sm ${
                          step.done ? 'text-green-700 font-medium' :
                          selectedOrder.status === step.status
                            ? 'text-blue-700 font-medium'
                            : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                {[
                  { label: 'Ordered', time: selectedOrder.orderTime },
                  { label: 'Confirmed', time: selectedOrder.confirmedTime },
                  { label: 'Assigned', time: selectedOrder.assignedTime },
                  { label: 'Picked', time: selectedOrder.pickedTime },
                  { label: 'Delivered', time: selectedOrder.deliveredTime },
                ].some(t => t.time) && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <p className="text-xs font-bold text-gray-600 mb-2">
                      ⏱️ Timeline
                    </p>
                    {[
                      { label: 'Ordered', time: selectedOrder.orderTime },
                      { label: 'Confirmed', time: selectedOrder.confirmedTime },
                      { label: 'Assigned', time: selectedOrder.assignedTime },
                      { label: 'Picked', time: selectedOrder.pickedTime },
                      { label: 'Delivered', time: selectedOrder.deliveredTime },
                    ].filter(t => t.time).map(t => (
                      <div key={t.label}
                        className="flex justify-between text-xs py-0.5">
                        <span className="text-gray-500">{t.label}</span>
                        <span className="text-gray-700 font-medium">
                          {new Date(t.time).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">
                    👤 Customer
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.customerName}
                  </p>
                  <p className="text-sm text-gray-600">
                    📞 {selectedOrder.customerPhone}
                  </p>
                  {selectedOrder.deliveryAddress && (
                    <p className="text-sm text-gray-500">
                      📍 {selectedOrder.deliveryAddress}
                    </p>
                  )}
                </div>

                {/* Delivery Partner */}
                {selectedOrder.deliveryBoyName && (
                  <div className="bg-purple-50 rounded-xl p-3 mb-4">
                    <p className="text-sm font-bold text-purple-700 mb-2">
                      🚴 Delivery Partner
                    </p>
                    <p className="text-sm text-purple-600">
                      {selectedOrder.deliveryBoyName}
                    </p>
                    <p className="text-sm text-purple-600">
                      📞 {selectedOrder.deliveryBoyPhone}
                    </p>
                    <p className="text-sm text-purple-600">
                      🏍️ {selectedOrder.deliveryBoyVehicle}
                    </p>
                  </div>
                )}

                {/* OTP Status */}
                <div className="space-y-2 mb-4">
                  <div className={`rounded-xl p-3 ${
                    selectedOrder.shopOtpVerified
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50'}`}>
                    <p className="text-xs font-bold text-gray-600">
                      🏪 Shop OTP (for delivery boy to collect order)
                    </p>
                    <p className={`text-sm mt-1 ${
                      selectedOrder.shopOtpVerified
                        ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedOrder.shopOtpVerified
                        ? '✅ Verified — Order collected by delivery boy'
                        : selectedOrder.shopOtp
                        ? '⏳ Waiting for delivery boy to arrive'
                        : 'Not generated yet'}
                    </p>
                  </div>

                  <div className={`rounded-xl p-3 ${
                    selectedOrder.otpVerified
                      ? 'bg-green-50 border border-green-200'
                      : selectedOrder.deliveryOtp
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-gray-50'}`}>
                    <p className="text-xs font-bold text-gray-600">
                      🔐 Delivery OTP (customer gives to delivery boy)
                    </p>
                    <p className={`text-sm mt-1 ${
                      selectedOrder.otpVerified
                        ? 'text-green-600'
                        : selectedOrder.deliveryOtp
                        ? 'text-yellow-600'
                        : 'text-gray-500'}`}>
                      {selectedOrder.otpVerified
                        ? '✅ Verified — Delivery confirmed!'
                        : selectedOrder.deliveryOtp
                        ? '⏳ Customer has OTP in notifications'
                        : 'Not generated yet'}
                    </p>
                    {selectedOrder.otpRetryCount > 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        Failed attempts: {selectedOrder.otpRetryCount}/3
                      </p>
                    )}
                  </div>
                </div>

                {/* Cancelled notice — shows who cancelled */}
                {selectedOrder.status === 'CANCELLED' && (() => {
                  const byShop = selectedOrder.cancelReason?.startsWith('SHOPKEEPER:');
                  const reason = byShop
                    ? selectedOrder.cancelReason.replace('SHOPKEEPER:', '')
                    : selectedOrder.cancelReason;
                  return (
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4">
                      <p className="text-red-700 font-bold text-sm mb-1">
                        {byShop ? '🏪 Cancelled by You (Shopkeeper)' : '❌ Cancelled by Customer'}
                      </p>
                      <p className="text-red-600 text-sm">
                        {byShop
                          ? 'You cancelled this order.'
                          : <><strong>{selectedOrder.customerName}</strong> cancelled this order.</>}
                      </p>
                      {reason && (
                        <div className="mt-2 bg-red-100 rounded-lg px-3 py-2">
                          <p className="text-xs text-red-500 font-semibold">Reason:</p>
                          <p className="text-sm text-red-700 font-bold mt-0.5">💬 "{reason}"</p>
                        </div>
                      )}
                      <p className="text-red-400 text-xs mt-2">No further action needed.</p>
                    </div>
                  );
                })()}

                {/* Pricing */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">
                    💰 Pricing
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Items</span>
                      <span>₹{selectedOrder.totalAmount}</span>
                    </div>
                    {selectedOrder.distanceKm > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Distance</span>
                        <span>{selectedOrder.distanceKm} km</span>
                      </div>
                    )}
                    {selectedOrder.deliveryCharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery</span>
                        <span>₹{selectedOrder.deliveryCharge}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-green-600 border-t pt-1">
                      <span>Grand Total</span>
                      <span>
                        ₹{selectedOrder.totalAmount +
                          (selectedOrder.deliveryCharge || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">
                    🛒 Items
                  </p>
                  {selectedOrder.items?.map(item => (
                    <div key={item.id}
                      className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span className="text-gray-600">
                        {item.productName} x{item.quantity}
                      </span>
                      <span className="font-medium">₹{item.subtotal}</span>
                    </div>
                  ))}
                </div>

                {/* Map */}
                {selectedOrder.deliveryLatitude > 0 &&
                 selectedOrder.deliveryLongitude > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-700 mb-2">
                      📍 Customer Location
                    </p>
                    <MapContainer
                      center={[selectedOrder.deliveryLatitude,
                        selectedOrder.deliveryLongitude]}
                      zoom={15}
                      style={{ height: '180px', width: '100%',
                        borderRadius: '12px' }}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors' />
                      <Marker
                        position={[selectedOrder.deliveryLatitude,
                          selectedOrder.deliveryLongitude]}
                        icon={customerIcon}>
                        <Popup>📍 {selectedOrder.customerName}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">👆</p>
                <p>Click on an order to see details</p>
              </div>
            )}
        </div>
      </div>
    </div>

      {/* ── Shopkeeper Cancel Reason Modal ───────────────────── */}
      {shopCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShopCancelModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 text-lg mb-1">🏪 Cancel Order #{shopCancelModal.orderId}</h3>
            <p className="text-sm text-gray-500 mb-4">👤 Customer: {shopCancelModal.customerName}</p>

            <p className="text-sm font-semibold text-gray-700 mb-3">Why are you cancelling?</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {SHOP_CANCEL_REASONS.map(r => (
                <button key={r.label}
                  onClick={() => setShopCancelReason(r.label)}
                  className={`text-sm py-2 px-3 rounded-xl border font-medium transition-all ${
                    shopCancelReason === r.label
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
              value={SHOP_CANCEL_REASONS.some(r => r.label === shopCancelReason) ? '' : shopCancelReason}
              onChange={e => setShopCancelReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 mb-4"
            />

            <div className="flex gap-3">
              <button onClick={() => setShopCancelModal(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">
                Keep Order
              </button>
              <button
                onClick={confirmShopCancel}
                disabled={!shopCancelReason.trim() || shopCancelling}
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-1">
                {shopCancelling
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : '❌'}
                {shopCancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
