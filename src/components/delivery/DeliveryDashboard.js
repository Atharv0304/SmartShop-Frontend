import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OtpVerification from './OtpVerification';
import ChatBot from '../customer/ChatBot';
import { 
  Bike, Home, Bell, Package, Wallet, User, LogOut, MapPin, 
  Phone, ShieldCheck, CheckCircle2, XCircle, Navigation, 
  Clock, AlertTriangle, FileText, ChevronRight, Lock, Store
} from 'lucide-react';

const DeliveryDashboard = ({ deliveryBoy, onLogout }) => {
  const [available, setAvailable] = useState(deliveryBoy.isAvailable || false);
  const [activeTab, setActiveTab] = useState('home');
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showShopOtpModal, setShowShopOtpModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shopOtpOrder, setShopOtpOrder] = useState(null);
  const [shopOtpInput, setShopOtpInput] = useState('');
  const [shopOtpError, setShopOtpError] = useState('');
  const [notification, setNotification] = useState('');
  const [shops, setShops] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [myNotifications, setMyNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const getHeaders = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem('deliveryToken')}`
  }), []);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const fetchMyOrders = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:8070/api/orders/delivery/${deliveryBoy.id}`,
        { headers: getHeaders() }
      );
      setOrders(res.data.sort((a, b) => b.id - a.id));
    } catch (err) { console.error(err); }
  }, [deliveryBoy.id, getHeaders]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:8070/api/orders/requests/${deliveryBoy.id}`,
        { headers: getHeaders() }
      );
      setRequests(res.data.sort((a, b) => b.id - a.id));
    } catch (err) { console.error(err); }
  }, [deliveryBoy.id, getHeaders]);

  const fetchShopsAndConnections = useCallback(async () => {
    try {
      const [shopsRes, connRes] = await Promise.all([
        axios.get('http://localhost:8070/api/shops/all', { headers: getHeaders() }),
        axios.get(`http://localhost:8070/api/connections/delivery/${deliveryBoy.id}`, { headers: getHeaders() })
      ]);
      setShops(shopsRes.data);
      setMyConnections(connRes.data);
    } catch (err) { console.error(err); }
  }, [deliveryBoy.id, getHeaders]);

  const fetchMyNotifications = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:8070/api/notifications/${deliveryBoy.id}/DELIVERY`,
        { headers: getHeaders() }
      );
      setMyNotifications(res.data);
      setUnreadNotifCount(res.data.filter(n => !n.read).length);
    } catch (err) { console.error(err); }
  }, [deliveryBoy.id, getHeaders]);

  useEffect(() => {
    fetchMyOrders();
    fetchRequests();
    fetchShopsAndConnections();
    fetchMyNotifications();
    const interval = setInterval(() => {
      fetchMyOrders();
      fetchRequests();
      fetchShopsAndConnections();
      fetchMyNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchMyOrders, fetchRequests, fetchMyNotifications]);

  const acceptRequest = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:8070/api/orders/accept/${orderId}/${deliveryBoy.id}`,
        {}, { headers: getHeaders() }
      );
      fetchRequests();
      fetchMyOrders();
      showNotif('✅ Order accepted! Proceed to shop.');
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Order already taken!';
      showNotif('❌ ' + errMsg);
    }
  };

  const rejectRequest = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:8070/api/orders/reject/${orderId}/${deliveryBoy.id}`,
        {}, { headers: getHeaders() }
      );
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  const verifyShopOtp = async () => {
    if (shopOtpInput.length !== 4) {
      setShopOtpError('Enter 4 digit OTP');
      return;
    }
    try {
      await axios.post(
        'http://localhost:8070/api/orders/verify-shop-otp',
        { orderId: shopOtpOrder.id, otp: shopOtpInput },
        { headers: getHeaders() }
      );
      setShowShopOtpModal(false);
      setShopOtpInput('');
      setShopOtpError('');
      fetchMyOrders();
      showNotif('✅ Shop OTP verified! Proceed to customer.');
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Invalid OTP!';
      setShopOtpError(errMsg);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(
        `http://localhost:8070/api/orders/status/${orderId}`,
        { status }, { headers: getHeaders() }
      );
      fetchMyOrders();
    } catch (err) { console.error(err); }
  };

  const requestShopConnection = async (shop) => {
    try {
      await axios.post(
        'http://localhost:8070/api/connections/request',
        { shopId: shop.id, shopName: shop.shopName, deliveryBoyId: deliveryBoy.id, deliveryBoyName: deliveryBoy.name },
        { headers: getHeaders() }
      );
      fetchShopsAndConnections();
      showNotif(`✅ Connection request sent to ${shop.shopName}!`);
    } catch (err) {
      showNotif('❌ Request failed or already exists');
    }
  };

  const toggleAvailability = async () => {
    if (!hasApprovedConnection) return;
    try {
      const newStatus = !available;
      await axios.put(
        `http://localhost:8070/api/delivery/availability/${deliveryBoy.id}`,
        { available: newStatus },
        { headers: getHeaders() }
      );
      setAvailable(newStatus);
      
      // Update local storage so it persists on refresh
      const savedBoy = JSON.parse(localStorage.getItem('deliveryBoy') || '{}');
      savedBoy.isAvailable = newStatus;
      localStorage.setItem('deliveryBoy', JSON.stringify(savedBoy));
      
      showNotif(newStatus ? '✅ You are now ONLINE' : '❌ You are now OFFLINE');
    } catch (err) {
      showNotif('❌ Failed to update status');
    }
  };

  const deleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await axios.delete(`http://localhost:8070/api/delivery/profile/${deliveryBoy.id}`, { headers: getHeaders() });
        onLogout();
      } catch (err) {
        showNotif('❌ Failed to delete account');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'DELIVERY_ACCEPTED': 'bg-purple-100 text-purple-700 border-purple-200',
      'PICKED': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'OUT_FOR_DELIVERY': 'bg-blue-100 text-blue-700 border-blue-200',
      'DELIVERED': 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const activeOrders = orders.filter(o =>
    ['DELIVERY_ACCEPTED', 'PICKED', 'OUT_FOR_DELIVERY'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'DELIVERED');
  const totalEarnings = completedOrders
    .reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);

  const hasApprovedConnection = myConnections.some(c => c.status === 'APPROVED');


  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 bg-gray-900 text-white px-4 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in border border-gray-700">
          <Bell className="w-5 h-5 text-orange-400" />
          <p className="font-medium text-sm">{notification}</p>
        </div>
      )}

      {/* Header */}
      <nav className="bg-gray-900 text-white sticky top-0 z-40 px-5 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-gray-400">Rider App</h1>
            <p className="text-base font-bold text-white leading-tight">{deliveryBoy.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
            available ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
            <div className={`w-2 h-2 rounded-full ${available ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            {available ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 px-2 pb-safe">
        <div className="flex justify-between items-center py-2 max-w-md mx-auto">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'requests', icon: Bell, label: 'Requests', badge: requests.length, disabled: !hasApprovedConnection },
            { id: 'orders', icon: Package, label: 'Orders', badge: activeOrders.length, disabled: !hasApprovedConnection },
            { id: 'shops', icon: Store, label: 'Shops' },
            { id: 'notifications', icon: Bell, label: 'Alerts', badge: unreadNotifCount },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map(tab => (
            <button key={tab.id} onClick={() => !tab.disabled && setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 relative transition-all duration-200 ${
                activeTab === tab.id ? 'text-orange-600 scale-105' : tab.disabled ? 'text-gray-300 cursor-not-allowed opacity-50' : 'text-gray-400 hover:text-gray-600'}`}>
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-orange-500/20' : ''}`} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${activeTab === tab.id ? 'text-orange-600' : 'text-gray-500'}`}>{tab.label}</span>
              {tab.badge > 0 && !tab.disabled && (
                <span className="absolute top-1 right-3 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* Stats Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Today's Summary</p>
                  <h2 className="text-2xl font-black">₹{Math.round(totalEarnings)}</h2>
                </div>
                <button onClick={toggleAvailability}
                  className={`relative w-14 h-8 rounded-full transition-colors border-2 ${
                    !hasApprovedConnection ? 'bg-gray-800 border-gray-700 cursor-not-allowed opacity-50' :
                    available ? 'bg-orange-500 border-orange-500' : 'bg-gray-700 border-gray-600'}`}>
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    available && hasApprovedConnection ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 border border-gray-700/50">
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">Trips Done</p>
                  <p className="text-xl font-bold">{completedOrders.length}</p>
                </div>
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 border border-gray-700/50">
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Orders</p>
                  <p className="text-xl font-bold">{orders.length}</p>
                </div>
              </div>
            </div>

            {/* Requests Alert */}
            {requests.length > 0 && (
              <button onClick={() => setActiveTab('requests')}
                className="w-full bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-600 animate-pulse">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-orange-900 font-bold">New Requests</p>
                    <p className="text-orange-700 text-xs font-medium">You have {requests.length} pending requests</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Active Task */}
            {activeOrders.length > 0 && (
              <div>
                <h3 className="text-gray-900 font-black text-lg mb-3 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-orange-500" /> Current Task
                </h3>
                {activeOrders.slice(0, 1).map(order => (
                  <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase mb-2 border ${getStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        <p className="font-black text-gray-900 text-lg">Order #{order.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-black text-xl">₹{order.deliveryCharge || 0}</p>
                        <p className="text-gray-400 text-xs font-bold uppercase">Earn</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-5">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase">Pickup</p>
                          <p className="text-sm font-semibold text-gray-900">{order.shopName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Navigation className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase">Dropoff</p>
                          <p className="text-sm font-semibold text-gray-900">{order.deliveryAddress || order.customerArea || 'Customer Address'}</p>
                        </div>
                      </div>
                    </div>

                    <button onClick={() => setActiveTab('orders')} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                      View Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeOrders.length === 0 && requests.length === 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center mt-6">
                {!hasApprovedConnection ? (
                  <>
                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Store className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">Connect to a Shop</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto mb-4">
                      You are not connected to any shop yet. You need an approved connection to receive orders.
                    </p>
                    <button onClick={() => setActiveTab('shops')} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md">
                      Find Shops
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      {available ? <Navigation className="w-8 h-8 text-orange-500" /> : <Clock className="w-8 h-8 text-gray-400" />}
                    </div>
                    <h3 className="text-lg font-black text-gray-900">{available ? 'Searching for orders...' : "You're Offline"}</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                      {available ? 'Stay near restaurants or supermarkets to get orders faster.' : 'Go online to start receiving delivery requests and earning.'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">New Requests</h2>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No new requests</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Order #{req.orderId}</p>
                      <p className="font-black text-gray-900 text-lg">{req.shopName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-black text-2xl">₹{Math.round(req.deliveryCharge)}</p>
                      <p className="text-gray-400 text-xs font-bold uppercase">Payout</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-700">{req.distanceKm} km trip</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-700">{req.customerArea}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-3 py-2 rounded-xl text-center">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-1">Items</p>
                      <p className="text-lg font-black text-gray-900">₹{req.totalAmount}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => rejectRequest(req.orderId)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-colors">
                      Decline
                    </button>
                    <button onClick={() => acceptRequest(req.orderId)} className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-orange-500/30">
                      Accept Order
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">Active Orders</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No active orders</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 relative overflow-hidden">
                  {order.status === 'DELIVERED' && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="bg-green-100 text-green-700 font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                      <CheckCircle2 className="w-5 h-5" /> Delivered
                    </div>
                  </div>}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase mb-2 border ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <p className="font-black text-gray-900">Order #{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-black text-xl">₹{order.deliveryCharge || 0}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
                      <a href={`tel:${order.customerPhone}`} className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-sm text-gray-600 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      {order.deliveryAddress || 'Address not provided'}
                    </p>
                  </div>

                  {order.status === 'DELIVERY_ACCEPTED' && (
                    <button onClick={() => { setShopOtpOrder(order); setShowShopOtpModal(true); }}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md">
                      <Lock className="w-5 h-5" /> Enter Shop OTP
                    </button>
                  )}
                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <button onClick={() => updateStatus(order.id, 'PICKED')}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md">
                      <Package className="w-5 h-5" /> Mark Picked Up
                    </button>
                  )}
                  {order.status === 'PICKED' && (
                    <div className="space-y-3">
                      {order.paymentMethod === 'CASH' && (
                        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm">Cash on Delivery</p>
                            <p className="text-xs font-medium">Collect exactly ₹{order.totalAmount + (order.deliveryCharge || 0)}</p>
                          </div>
                        </div>
                      )}
                      <button onClick={() => { setSelectedOrder(order); setShowOtpModal(true); }}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md">
                        <CheckCircle2 className="w-5 h-5" /> Enter Customer OTP
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* SHOPS TAB (NEW FEATURE) */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900">Connect Shops</h2>
            <div className="space-y-4">
              {shops.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No shops available on the platform yet.</p>
                </div>
              ) : (
                shops.map(shop => {
                  const connection = myConnections.find(c => c.shopId === shop.id);
                  return (
                    <div key={shop.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                            <Store className="w-6 h-6 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg">{shop.shopName}</p>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {shop.city}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        {!connection ? (
                          <button onClick={() => requestShopConnection(shop)} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md">
                            Send Request
                          </button>
                        ) : connection.status === 'PENDING' ? (
                          <div className="w-full bg-yellow-50 text-yellow-700 font-bold py-3.5 rounded-xl text-center border border-yellow-200">
                            ⏳ Request Pending
                          </div>
                        ) : connection.status === 'APPROVED' ? (
                          <div className="w-full bg-green-50 text-green-700 font-bold py-3.5 rounded-xl text-center border border-green-200">
                            ✅ Connected
                          </div>
                        ) : (
                          <div className="w-full bg-red-50 text-red-700 font-bold py-3.5 rounded-xl text-center border border-red-200">
                            ❌ Request Rejected
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <User className="w-10 h-10 text-white" />
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-gray-900">{deliveryBoy.name}</h2>
              <p className="text-gray-500 font-medium">{deliveryBoy.email}</p>
              <div className="mt-6 flex gap-2">
                <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Rating</p>
                  <p className="font-black text-gray-900 flex items-center justify-center gap-1">
                    4.9 <span className="text-yellow-500">★</span>
                  </p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Deliveries</p>
                  <p className="font-black text-gray-900">{completedOrders.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><FileText className="w-5 h-5"/></div>
                  <span className="font-bold text-gray-900">Vehicle Documents</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Wallet className="w-5 h-5"/></div>
                  <span className="font-bold text-gray-900">Bank Account Details</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={onLogout} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                <LogOut className="w-5 h-5" /> Logout
              </button>
              <button onClick={deleteAccount} className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">🔔 Alerts</h2>
              {unreadNotifCount > 0 && (
                <button
                  onClick={async () => {
                    try {
                      await axios.put(
                        `http://localhost:8070/api/notifications/read-all/${deliveryBoy.id}/DELIVERY`,
                        {}, { headers: getHeaders() }
                      );
                      fetchMyNotifications();
                    } catch(e) {}
                  }}
                  className="text-xs text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200"
                >
                  Mark all read
                </button>
              )}
            </div>
            {myNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No alerts yet</p>
              </div>
            ) : (
              myNotifications.map(notif => (
                <div key={notif.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                    notif.type === 'DELIVERY_DELAY' ? 'border-red-400' :
                    notif.type === 'ORDER_ASSIGNED' ? 'border-orange-400' :
                    'border-gray-300'
                  } ${!notif.read ? 'opacity-100' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{notif.title}</p>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* AI Chatbot for Delivery Boy */}
      <ChatBot role="DELIVERY_BOY" />

      {/* Modals */}
      {showShopOtpModal && shopOtpOrder && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
            <div className="bg-gray-900 p-6 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-black text-white">Enter Shop OTP</h3>
              <p className="text-gray-400 text-sm mt-1">Ask the shopkeeper for the 4-digit code to collect Order #{shopOtpOrder.id}</p>
            </div>
            <div className="p-6 text-center">
              {shopOtpError && <p className="text-red-500 text-sm font-bold mb-4">{shopOtpError}</p>}
              <div className="flex justify-center gap-3 mb-6">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`w-14 h-16 border-2 rounded-2xl flex items-center justify-center text-3xl font-black transition-colors ${shopOtpInput[i] ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-300'}`}>
                    {shopOtpInput[i] || '·'}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((key, i) => (
                  <button key={i} type="button" onClick={() => {
                    if (key === '⌫') setShopOtpInput(p => p.slice(0,-1));
                    else if (key !== '' && shopOtpInput.length < 4) setShopOtpInput(p => p + key);
                    setShopOtpError('');
                  }} className={`py-4 rounded-2xl font-bold text-xl transition-colors ${key === '⌫' ? 'bg-red-50 text-red-500' : key === '' ? '' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                    {key}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowShopOtpModal(false)} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={verifyShopOtp} disabled={shopOtpInput.length !== 4} className={`flex-[2] font-bold py-4 rounded-xl text-white transition-all ${shopOtpInput.length === 4 ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30' : 'bg-gray-300'}`}>Verify OTP</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOtpModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
            <div className="bg-orange-500 p-6 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black">Customer OTP</h3>
              <p className="text-orange-100 text-sm mt-1">Order #{selectedOrder.id} for {selectedOrder.customerName}</p>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
                <p className="text-gray-900 text-sm font-bold flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> Wait!
                </p>
                <p className="text-gray-500 text-xs">Let the customer verify all items before entering the OTP.</p>
              </div>
              <OtpVerification order={selectedOrder} onVerified={() => { setShowOtpModal(false); fetchMyOrders(); showNotif('🎉 Order Delivered Successfully!'); }} />
              <button onClick={() => setShowOtpModal(false)} className="w-full mt-4 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;