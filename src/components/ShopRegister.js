import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../utils/api';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map click
const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const ShopRegister = ({ shopkeeper }) => {
  const [shop, setShop] = useState({
    shopName: shopkeeper?.shopName || '',
    ownerName: shopkeeper?.name || '',
    email: shopkeeper?.email || '',
    phone: '',
    upiId: '',
    address: '',
    category: '',
    openTime: '',
    closeTime: '',
    latitude: 18.5204,
    longitude: 73.8567
  });

  const [marker, setMarker] = useState({
    lat: 18.5204,
    lng: 73.8567
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingShop, setExistingShop] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const res = await api.get('/api/shops/all');
        const myShop = res.data.find(s => s.email === shopkeeper?.email);
        if (myShop) {
          setExistingShop(myShop);
        }
      } catch (err) {
        console.error(err);
      }
      setChecking(false);
    };
    if (shopkeeper?.email) {
      checkRegistration();
    } else {
      setChecking(false);
    }
  }, [shopkeeper]);

  const handleChange = (e) => {
    setShop({ ...shop, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = (lat, lng) => {
    setMarker({ lat, lng });
    setShop(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMarker({ lat, lng });
        setShop(prev => ({ ...prev, latitude: lat, longitude: lng }));
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/shops/register', shop);
      setMessage('✅ Shop registered successfully!');
      setError('');
    } catch (err) {
      setError('❌ Error registering shop. Try again.');
      setMessage('');
    }
    setLoading(false);
  };

  if (checking) {
    return <div className="text-center p-10 font-bold text-gray-500">⏳ Loading shop details...</div>;
  }

  if (existingShop) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-green-700">🏪 My Shop Details</h2>
              <p className="text-gray-500 text-sm mt-1">Your registered shop profile</p>
            </div>
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm">
              ✅ Registered
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="bg-green-50 p-6 border-b border-green-100">
              <h3 className="text-3xl font-extrabold text-gray-800 mb-2">
                {existingShop.shopName}
              </h3>
              <p className="text-green-700 font-medium capitalize mb-4">
                🏷️ {existingShop.category} Store
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-xs font-bold mb-1">👤 OWNER</p>
                  <p className="font-medium">{existingShop.ownerName}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-xs font-bold mb-1">📞 CONTACT</p>
                  <p className="font-medium">{existingShop.phone}</p>
                  <p className="text-gray-500 text-xs mt-1">{existingShop.email}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-xs font-bold mb-1">🕒 TIMINGS</p>
                  <p className="font-medium">{existingShop.openTime} to {existingShop.closeTime}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-xs font-bold mb-1">💳 UPI ID</p>
                  <p className="font-medium">{existingShop.upiId}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 col-span-2">
                  <p className="text-gray-500 text-xs font-bold mb-1">📍 ADDRESS</p>
                  <p className="font-medium">{existingShop.address}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm font-bold text-gray-700 mb-3 ml-2">🗺️ Shop Location</p>
              <MapContainer
                center={[existingShop.latitude, existingShop.longitude]}
                zoom={16}
                scrollWheelZoom={false}
                style={{ height: '300px', width: '100%', borderRadius: '12px' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={[existingShop.latitude, existingShop.longitude]} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-green-700">🏪 Register Your Shop</h2>
          <p className="text-gray-500 text-sm mt-1">
            Fill in your shop details and pin your location on the map
          </p>
        </div>

        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 text-center font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-center font-medium">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Shop Name & Owner */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Name</label>
                <input type="text" name="shopName" value={shop.shopName} onChange={handleChange}
                  placeholder="Enter shop name" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Owner Name</label>
                <input type="text" name="ownerName" value={shop.ownerName} onChange={handleChange}
                  placeholder="Enter owner name" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={shop.email} onChange={handleChange}
                  placeholder="Enter email" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input type="text" name="phone" value={shop.phone} onChange={handleChange}
                  placeholder="Enter phone number" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
            </div>

            {/* Payment & Address */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Shop UPI ID</label>
                <input type="text" name="upiId" value={shop.upiId} onChange={handleChange}
                  placeholder="e.g. 9876543210@ybl" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input type="text" name="address" value={shop.address} onChange={handleChange}
                  placeholder="Enter full address" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
            </div>

            {/* Category & Timings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select name="category" value={shop.category} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm bg-white">
                  <option value="">Select</option>
                  <option value="grocery">Grocery</option>
                  <option value="medical">Medical</option>
                  <option value="bakery">Bakery</option>
                  <option value="dairy">Dairy</option>
                  <option value="general">General Store</option>
                  <option value="vegetables">Vegetables</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Open Time</label>
                <input type="time" name="openTime" value={shop.openTime} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Close Time</label>
                <input type="time" name="closeTime" value={shop.closeTime} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
            </div>

            {/* Map */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Pin Your Shop Location
                <span className="text-gray-400 font-normal ml-2">(Click on map to set location)</span>
              </label>

              <MapContainer
                center={[marker.lat, marker.lng]}
                zoom={14}
                style={{ height: '350px', width: '100%', borderRadius: '12px' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <LocationPicker onLocationSelect={handleLocationSelect} />
                <Marker position={[marker.lat, marker.lng]} />
              </MapContainer>

              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>📍 Lat: {shop.latitude.toFixed(6)}</span>
                <span>📍 Lng: {shop.longitude.toFixed(6)}</span>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200">
              {loading ? '⏳ Registering...' : '🏪 Register Shop'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShopRegister;