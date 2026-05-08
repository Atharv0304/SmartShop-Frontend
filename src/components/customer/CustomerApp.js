import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../../utils/api';
import 'leaflet/dist/leaflet.css';
import SearchProducts from './SearchProducts';
import Cart from './Cart';
import CustomerProfile from './CustomerProfile';
import NotificationPanel from './NotificationPanel';
import ChatBot from './ChatBot';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const shopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
};

const getCategoryImage = (category) => {
  const images = {
    grocery: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=500&h=300&fit=crop',
    dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&h=300&fit=crop',
    bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=300&fit=crop',
    vegetables: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=500&h=300&fit=crop',
    medical: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=500&h=300&fit=crop',
    food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=300&fit=crop',
    snacks: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&h=300&fit=crop',
    beverages: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=300&fit=crop',
    default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=300&fit=crop'
  };
  return images[category?.toLowerCase()] || images.default;
};

const CATEGORIES = [
  { id: 'grocery', name: 'Grocery', icon: '🌾', img: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=150&h=150&fit=crop' },
  { id: 'dairy', name: 'Dairy & Milk', icon: '🥛', img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=150&h=150&fit=crop' },
  { id: 'bakery', name: 'Bakery', icon: '🍞', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&h=150&fit=crop' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥬', img: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=150&h=150&fit=crop' },
  { id: 'medical', name: 'Pharmacy', icon: '💊', img: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=150&h=150&fit=crop' },
  { id: 'snacks', name: 'Snacks', icon: '🍿', img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=150&h=150&fit=crop' },
  { id: 'beverages', name: 'Beverages', icon: '🥤', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&h=150&fit=crop' }
];

const CustomerApp = ({ customer, onLogout }) => {
  const [page, setPage] = useState('home');
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 18.5204, lng: 73.8567 });
  const [cart, setCart] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotif, setToastNotif] = useState(null);
  const [lastSeenNotifId, setLastSeenNotifId] = useState(null);
  // Cross-shop confirm modal: holds the product the user tried to add
  const [switchShopConfirm, setSwitchShopConfirm] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      });
    }
    api.get('/api/shops/all')
      .then(res => setShops(res.data))
      .catch(err => console.error(err));

    fetchUnreadCount();
    // Poll for new notifications every 15 seconds
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get(
        `/api/notifications/${customer.id}/CUSTOMER`
      );
      const allNotifs = res.data;
      const unread = allNotifs.filter(n => !n.read);
      setUnreadCount(unread.length);

      if (unread.length > 0) {
        const latestNotif = unread[0];
        setLastSeenNotifId(prevId => {
          if (prevId && latestNotif.id > prevId) {
            setToastNotif(latestNotif);
            setTimeout(() => setToastNotif(null), 5000);
          }
          return prevId ? Math.max(prevId, latestNotif.id) : latestNotif.id;
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, [customer.id]);

  const addToCart = (product) => {
    // If cart has items from a different shop, show a confirmation modal
    if (cart.length > 0 && cart[0].shopkeeperEmail !== product.shopkeeperEmail) {
      setSwitchShopConfirm(product); // store pending product; modal will handle it
      return;
    }
    doAddToCart(product);
  };

  const doAddToCart = (product) => {
    // Automatically set the active shop if not set (e.g. added from Global Search)
    const productShop = shops.find(s => s.email === product.shopkeeperEmail);
    if (productShop) setSelectedShop(productShop);

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleShopSelect = async (shop) => {
    setSelectedShop(shop);
    try {
      const res = await api.get('/api/products/all');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
    setPage('products');
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const displayProducts = selectedShop 
    ? products.filter(p => p.shopkeeperEmail === selectedShop.email) 
    : products;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Toast Notification */}
      {toastNotif && (
        <div className="fixed top-20 right-6 z-50 animate-slide-up cursor-pointer" onClick={() => setShowNotifications(true)}>
          <div className="bg-white border-l-4 border-blue-500 rounded-xl shadow-2xl p-4 max-w-sm flex gap-3 items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10" />
            <span className="text-2xl mt-1">🔔</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">{toastNotif.title}</p>
              <p className="text-gray-600 text-sm mt-1">{toastNotif.message}</p>
              <p className="text-blue-500 text-xs font-bold mt-2">Click to view details →</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setToastNotif(null); }} className="text-gray-400 hover:text-gray-600 ml-2">✕</button>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel
          customer={customer}
          onClose={() => {
            setShowNotifications(false);
            setUnreadCount(0);
          }}
        />
      )}

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-2xl font-extrabold text-gradient flex items-center gap-2">
          <span>🛍️</span> Smart Store
        </h1>
        <div className="flex gap-2 bg-gray-100/50 p-1 rounded-xl border border-gray-200/50">
          <button onClick={() => setPage('home')}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${page === 'home' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            🗺️ Shops
          </button>
          <button onClick={() => setPage('products')}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${page === 'products' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            🛒 Products
          </button>
          <button onClick={() => setPage('search')}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${page === 'search' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            🔍 Search
          </button>
          <button onClick={() => setPage('cart')}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm relative ${page === 'cart' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            🛒 Cart
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                {totalCartItems}
              </span>
            )}
          </button>
          <button onClick={() => setPage('profile')}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${page === 'profile' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            👤 Profile
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative bg-white/80 hover:bg-white p-2.5 rounded-full transition shadow-sm border border-gray-200">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <span className="text-sm font-semibold text-gray-700 hidden md:block border-l pl-4 border-gray-300">
            Hi, {customer.name}
          </span>
          <button onClick={onLogout}
            className="bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition border border-gray-200 hover:border-rose-200">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      {page === 'home' && (
        <div className="bg-white pb-12">
          {/* Quick Commerce Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-6 relative overflow-hidden shadow-inner">
            <div className="absolute right-0 top-0 opacity-10 text-[200px] leading-none transform translate-x-10 -translate-y-10">🛒</div>
            <div className="max-w-6xl mx-auto relative z-10">
              <p className="text-emerald-100 font-bold mb-1 uppercase tracking-wider text-xs">Delivering to</p>
              <h2 className="text-2xl md:text-3xl font-black mb-8 flex items-center gap-2 drop-shadow-sm">
                📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)} 
                <span className="text-xs bg-white/20 hover:bg-white/30 transition px-3 py-1 rounded-full cursor-pointer ml-2 backdrop-blur-sm">Change</span>
              </h2>
              
              <div className="bg-white rounded-2xl shadow-2xl flex items-center p-2 max-w-3xl text-gray-700 border-4 border-white/20 focus-within:border-white/40 transition-all">
                <span className="text-2xl px-4 opacity-50">🔍</span>
                <input type="text" placeholder="Search 'milk', 'bread' or 'medicine'..." 
                  className="w-full bg-transparent focus:outline-none py-3 text-lg font-medium placeholder-gray-400" 
                  onClick={() => setPage('search')}
                />
                <button onClick={() => setPage('search')} className="bg-emerald-500 hover:bg-emerald-600 transition text-white px-8 py-3 rounded-xl font-bold shadow-md">Search</button>
              </div>
            </div>
          </div>

          {/* Category Carousel */}
          <div className="max-w-6xl mx-auto px-6 py-10 border-b border-gray-100">
            <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">Shop by Category <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-2">Popular</span></h3>
            <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x">
              {CATEGORIES.map(cat => (
                <div key={cat.id} className="flex-shrink-0 text-center cursor-pointer group snap-center" onClick={() => setPage('search')}>
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden mb-3 bg-gray-50 shadow-sm border border-gray-100 group-hover:shadow-lg group-hover:border-emerald-200 transition-all">
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 group-hover:text-emerald-600 transition-colors">{cat.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="shops-section" className="p-6 max-w-6xl mx-auto mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">🗺️ Nearby Shops</h2>
                <p className="text-gray-500 text-sm">Click on a shop marker to view details</p>
              </div>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {shops.length} shops found
              </span>
            </div>

            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={14}
              style={{ height: '450px', width: '100%', borderRadius: '16px' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors' />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-blue-600">📍 Your Location</p>
                    <p className="text-xs text-gray-500">{customer.name}</p>
                  </div>
                </Popup>
              </Marker>
              {shops.map(shop => (
                <Marker key={shop.id}
                  position={[shop.latitude, shop.longitude]}
                  icon={shopIcon}>
                  <Popup>
                    <div className="p-1 min-w-40">
                      <p className="font-bold text-green-700">🏪 {shop.shopName}</p>
                      <p className="text-xs text-gray-500">{shop.address}</p>
                      <p className="text-xs text-gray-500 capitalize">📦 {shop.category}</p>
                      <p className="text-xs text-gray-500">⏰ {shop.openTime} - {shop.closeTime}</p>
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        📍 {calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude)} km away
                      </p>
                      <button onClick={() => handleShopSelect(shop)}
                        className="mt-2 w-full bg-blue-600 text-white text-xs py-1 px-2 rounded">
                        View Products
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {shops.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-3xl mt-8 shadow-inner border border-gray-100">
                <p className="text-6xl mb-4 opacity-50">🏪</p>
                <p className="text-xl font-bold">No shops registered yet!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {shops
                  .map(shop => ({
                    ...shop,
                    distance: parseFloat(calculateDistance(
                      userLocation.lat, userLocation.lng,
                      shop.latitude, shop.longitude))
                  }))
                  .sort((a, b) => a.distance - b.distance)
                  .map(shop => (
                    <div key={shop.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 group hover:-translate-y-1"
                      onClick={() => handleShopSelect(shop)}>
                      <div className="h-40 w-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                        <img src={getCategoryImage(shop.category)} alt={shop.shopName} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                        <span className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur text-emerald-800 text-xs font-bold px-2 py-1 rounded-lg capitalize shadow">
                          {shop.category}
                        </span>
                        <span className="absolute bottom-3 right-3 z-20 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow">
                          📍 {shop.distance} km
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-extrabold text-xl text-gray-800 mb-1 line-clamp-1">{shop.shopName}</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-1">📍 {shop.address}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                            ⏰ {shop.openTime} - {shop.closeTime}
                          </span>
                          <button className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-2 rounded-lg transition">
                            Visit Store →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Page */}
      {page === 'products' && (
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setPage('home')}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg text-sm">
                ← Back
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  🛒 {selectedShop ? selectedShop.shopName : 'All'} Products
                </h2>
                {selectedShop && (
                  <p className="text-xs text-gray-500">
                    📍 {selectedShop.address} • {calculateDistance(
                      userLocation.lat, userLocation.lng,
                      selectedShop.latitude, selectedShop.longitude)} km away
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayProducts.length === 0 ? (
                <p className="text-gray-400 col-span-3 text-center py-8">
                  No products found for this shop!
                </p>
              ) : (
                displayProducts.map(p => {
                  const today = new Date();
                  const diff = Math.ceil(
                    (new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
                  const isExpired = diff < 0;
                  return !isExpired ? (
                    <div key={p.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group hover:-translate-y-1">
                      <div className="h-40 w-full overflow-hidden relative">
                        <img src={getCategoryImage(p.category)} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-gray-800 text-[10px] font-bold px-2 py-1 rounded capitalize shadow-sm">
                          {p.category}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="mb-3">
                          <p className="font-extrabold text-gray-800 text-lg leading-tight line-clamp-2">{p.name}</p>
                          <p className="text-xs font-bold text-gray-400 capitalize mt-1">
                            {p.category}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <span className="text-gray-400 text-xs line-through mr-1">₹{p.price ? Math.round(p.price * 1.2) : 0}</span>
                            <span className="text-gray-900 font-black text-xl block">₹{p.price || 0}</span>
                          </div>
                          <button
                            onClick={() => p.quantity > 0 && addToCart(p)}
                            disabled={p.quantity === 0}
                            className={`px-6 py-2 rounded-xl font-bold transition shadow-sm border border-transparent ${
                              p.quantity === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white'}`}>
                            {p.quantity === 0 ? 'Out' : 'ADD'}
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider pt-3 border-t border-gray-100">
                          <span className={`${
                            p.quantity === 0 ? 'text-red-500' :
                            p.quantity <= 5 ? 'text-orange-500' :
                            'text-emerald-600'}`}>
                            {p.quantity === 0 ? 'Out of Stock' : `Stock: ${p.quantity}`}
                          </span>
                          <span className={`${
                            diff <= 7 ? 'text-orange-500' :
                            diff <= 30 ? 'text-yellow-600' :
                            'text-gray-400'}`}>
                            {Number.isNaN(diff) ? 'Unknown' : `${diff}d left`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })
              )}
            </div>
          </div>
        </div>
      )}

      {page === 'search' && <SearchProducts addToCart={addToCart} />}
      {page === 'cart' && (
        <Cart
          cart={cart}
          setCart={setCart}
          customer={customer}
          selectedShop={selectedShop}
          onOrderPlaced={() => {
            setPage('home');
            fetchUnreadCount();
          }}
        />
      )}
      {page === 'profile' && (
        <CustomerProfile customer={customer} onLogout={onLogout} />
      )}

      {/* AI Chatbot - always visible */}
      <ChatBot role="CUSTOMER" />

      {/* ── Cross-shop Switch Confirmation Modal ──────────────── */}
      {switchShopConfirm && (() => {
        const currentShop = shops.find(s => s.email === cart[0]?.shopkeeperEmail);
        const newShop     = shops.find(s => s.email === switchShopConfirm.shopkeeperEmail);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
               onClick={() => setSwitchShopConfirm(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                 onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-400 p-5 relative">
                <button
                  onClick={() => setSwitchShopConfirm(null)}
                  className="absolute top-3 right-3 text-white/80 hover:text-white text-xl font-bold leading-none">
                  ✕
                </button>
                <span className="text-3xl">🛒</span>
                <h3 className="text-white font-extrabold text-lg mt-1">Switch Shop?</h3>
                <p className="text-white/80 text-xs mt-0.5">You can only buy from one shop at a time.</p>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs text-red-400 font-bold uppercase tracking-wide mb-1">Current Cart</p>
                  <p className="font-bold text-gray-800 text-sm">🏪 {currentShop?.shopName || cart[0]?.shopkeeperEmail}</p>
                  <p className="text-xs text-red-500 mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''} will be removed</p>
                </div>
                <div className="flex items-center justify-center text-gray-400 text-sm">↕</div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xs text-emerald-500 font-bold uppercase tracking-wide mb-1">New Shop</p>
                  <p className="font-bold text-gray-800 text-sm">🏪 {newShop?.shopName || switchShopConfirm.shopkeeperEmail}</p>
                  <p className="text-xs text-emerald-600 mt-1">Adding: <strong>{switchShopConfirm.name}</strong></p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-5 pb-5">
                <button
                  onClick={() => setSwitchShopConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition">
                  No, Keep Cart
                </button>
                <button
                  onClick={() => {
                    setCart([]);                       // clear existing cart
                    doAddToCart(switchShopConfirm);    // add the new product
                    setSwitchShopConfirm(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition shadow-sm">
                  OK, Switch
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CustomerApp;