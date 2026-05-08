import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import axios from 'axios';

const Cart = ({ cart, setCart, customer, selectedShop, onOrderPlaced }) => {
  const [step, setStep] = useState('cart');
  const [form, setForm] = useState({
    phone: '',
    address: '',
    street: '',
    city: '',
    pincode: '',
    paymentMethod: 'CASH',
    deliveryType: 'HOME_DELIVERY',
    latitude: null,
    longitude: null
  });
  const [addressType, setAddressType] = useState('live');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [orderError, setOrderError] = useState('');
  const [deliveryBreakdown, setDeliveryBreakdown] = useState(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const savedAddresses = [
    { icon: '🏠', label: 'Home', full: 'H-2, Maharashtra Housing Board, Laxmi Nagar, Parvati Paytha, Pune', lat: 18.4949, lng: 73.8466 },
    { icon: '🏢', label: 'Work', full: 'MIT Academy of Engineering, Alandi Road, Dehu Road, Pune', lat: 18.6745, lng: 73.8901 },
    { icon: '👨‍👩‍👧', label: 'Parents', full: 'Sector 12, Kharghar, Navi Mumbai', lat: 19.0434, lng: 73.0645 }
  ];

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const itemsTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryCharge = deliveryBreakdown?.deliveryCharge || 0;
  const grandTotal = itemsTotal + (form.deliveryType === 'HOME_DELIVERY' ? deliveryCharge : 0);

  // Calculate delivery charge when location is captured
  useEffect(() => {
    if (form.latitude && form.longitude && form.deliveryType === 'HOME_DELIVERY') {
      calculateDeliveryCharge();
    }
  }, [form.latitude, form.longitude, form.deliveryType, selectedShop]);

  const calculateDeliveryCharge = async () => {
    try {
      const res = await api.post('/api/orders/delivery-charge', {
        shopLat: Number(selectedShop?.latitude || 18.5204),
        shopLng: Number(selectedShop?.longitude || 73.8567),
        custLat: Number(form.latitude),
        custLng: Number(form.longitude)
      });
      setDeliveryBreakdown(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(item =>
      item.id === productId
        ? { ...item, qty: Math.max(0, item.qty + delta) }
        : item
    ).filter(item => item.qty > 0));
  };

  const getLocation = () => {
    setLocationStatus('📍 Getting location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }));
          setLocationStatus('✅ Location captured!');
        },
        () => setLocationStatus('❌ Location access denied')
      );
    } else {
      setLocationStatus('❌ Geolocation not supported');
    }
  };

  const getFullAddress = () => {
    if (addressType === 'manual') {
      return [form.address, form.street, form.city, form.pincode]
        .filter(Boolean).join(', ');
    }
    return form.address;
  };

  const geocodeManualAddress = async () => {
    const fullAddress = getFullAddress();
    if (!fullAddress) return;
    
    setLocationStatus('📍 Verifying address...');
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`);
      if (res.data && res.data.length > 0) {
        setForm(prev => ({
          ...prev,
          latitude: parseFloat(res.data[0].lat),
          longitude: parseFloat(res.data[0].lon)
        }));
        setLocationStatus('✅ Address verified!');
      } else {
        setLocationStatus('❌ Address not found on map. Try adding City/Pincode.');
      }
    } catch (err) {
      setLocationStatus('❌ Error verifying address');
    }
  };

  // Load Razorpay checkout script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (form.paymentMethod === 'RAZORPAY') {
      await handleRazorpayPayment();
    } else {
      finalizeOrder();
    }
  };

  const handleRazorpayPayment = async () => {
    setRazorpayLoading(true);
    setOrderError('');

    // 1. Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setOrderError('❌ Failed to load Razorpay. Check your internet connection.');
      setRazorpayLoading(false);
      return;
    }

    // 2. Create Razorpay order on backend
    let razorpayOrder;
    try {
      const amountInPaise = Math.round(grandTotal * 100); // ₹ → paise
      const res = await api.post('/api/payment/create-order', {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `smartstore_${customer.id}_${Date.now()}`
      });
      razorpayOrder = res.data;
    } catch (err) {
      setOrderError('❌ Could not initiate payment. Try again.');
      setRazorpayLoading(false);
      return;
    }

    setRazorpayLoading(false);

    // 3. Open Razorpay Checkout modal
    const options = {
      key: razorpayOrder.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: selectedShop?.shopName || 'SmartStore',
      description: `Order from ${selectedShop?.shopName}`,
      order_id: razorpayOrder.orderId,
      prefill: {
        name: customer.name,
        contact: form.phone,
      },
      theme: { color: '#4F46E5' },
      modal: {
        ondismiss: () => {
          setOrderError('⚠️ Payment cancelled. Your order was not placed.');
        }
      },
      handler: async (response) => {
        // 4. Verify signature on backend
        try {
          await api.post('/api/payment/verify', {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature
          });
          // 5. Payment verified → place SmartStore order
          await finalizeOrder({
            razorpayOrderId: response.razorpay_order_id,
            paymentStatus:   'PAID'
          });
        } catch (err) {
          setOrderError('❌ Payment verification failed. Contact support.');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      setOrderError(`❌ Payment failed: ${response.error.description}`);
    });
    rzp.open();
  };

  const finalizeOrder = async (paymentMeta = {}) => {
    setLoading(true);
    setOrderError('');
    try {
      const orderData = {
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: form.phone,
        shopId: selectedShop?.id,
        shopName: selectedShop?.shopName,
        totalAmount: itemsTotal,
        deliveryCharge: form.deliveryType === 'HOME_DELIVERY' ? deliveryCharge : 0,
        distanceKm: deliveryBreakdown?.distanceKm || 0,
        paymentMethod: form.paymentMethod,
        deliveryType: form.deliveryType,
        deliveryAddress: getFullAddress(),
        deliveryLatitude: form.latitude || 0,
        deliveryLongitude: form.longitude || 0,
        razorpayOrderId: paymentMeta.razorpayOrderId || null,
        paymentStatus:   paymentMeta.paymentStatus   || (form.paymentMethod === 'CASH' ? 'PENDING' : 'PAID'),
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.qty,
          price: item.price,
          subtotal: item.price * item.qty
        }))
      };

      const res = await api.post('/api/orders/place', orderData);
      setOrderId(res.data.id);
      setStep('success');
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || '❌ Failed to place order';
      setOrderError(errMsg);
    }
    setLoading(false);
  };

  // Success Page
  if (step === 'success') {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <div className="bg-white rounded-2xl shadow p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Order Placed!</h2>
          <p className="text-gray-500 mb-2">Order #{orderId}</p>
          <p className="text-gray-600 mb-4">
            {form.deliveryType === 'HOME_DELIVERY'
              ? '🚚 Your order will be delivered soon!'
              : '🏪 Your order is ready for pickup!'}
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-4 text-left">
            <p className="text-blue-700 font-medium text-sm mb-2">📱 What happens next?</p>
            {form.deliveryType === 'HOME_DELIVERY' ? (
              <>
                <p className="text-blue-600 text-xs">1. Shopkeeper will confirm your order</p>
                <p className="text-blue-600 text-xs">2. You'll receive a delivery OTP on email</p>
                <p className="text-blue-600 text-xs">3. Share OTP with delivery boy at doorstep</p>
                <p className="text-blue-600 text-xs">4. OTP verified → Order delivered ✅</p>
              </>
            ) : (
              <>
                <p className="text-blue-600 text-xs">1. Shopkeeper is notified to prepare your order</p>
                {form.paymentMethod === 'RAZORPAY'
                  ? <p className="text-blue-600 text-xs">2. ✅ Payment confirmed via Razorpay — just come pick it up!</p>
                  : <p className="text-blue-600 text-xs">2. Bring ₹{itemsTotal} cash when you visit the shop</p>
                }
                <p className="text-blue-600 text-xs">3. Go to {selectedShop?.shopName} to collect your order</p>
              </>
            )}
          </div>

          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Items Total</span>
              <span className="font-medium">₹{itemsTotal}</span>
            </div>
            {deliveryCharge > 0 && form.deliveryType === 'HOME_DELIVERY' && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Delivery Charge</span>
                <span className="font-medium">₹{deliveryCharge}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-green-700 border-t pt-2">
              <span>Grand Total</span>
              <span>₹{grandTotal}</span>
            </div>
            <p className="text-green-600 text-xs mt-1">Payment: {form.paymentMethod}</p>
          </div>

          <button onClick={() => { setCart([]); onOrderPlaced(); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Checkout Page
  if (step === 'checkout') {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep('cart')}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg text-sm">
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-gray-800">📋 Checkout</h2>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <h3 className="font-bold text-gray-700 mb-3">🛒 Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm py-2 border-b last:border-0">
              <span className="text-gray-600">{item.name} x{item.qty}</span>
              <span className="font-medium">₹{item.price * item.qty}</span>
            </div>
          ))}
          <div className="mt-3 pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Items Total</span>
              <span>₹{itemsTotal}</span>
            </div>
            {form.deliveryType === 'HOME_DELIVERY' && deliveryBreakdown && (
              <div className="bg-blue-50 rounded-xl p-3 mt-2">
                <p className="text-xs font-bold text-blue-700 mb-2">🚴 Delivery Charge</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Distance</span>
                    <span>{deliveryBreakdown.distanceKm} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Base fare</span>
                    <span>₹{deliveryBreakdown.baseFare}</span>
                  </div>
                  {deliveryBreakdown.distanceKm > deliveryBreakdown.freeDistance && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Extra ({(deliveryBreakdown.distanceKm - deliveryBreakdown.freeDistance).toFixed(1)} km × ₹{deliveryBreakdown.pricePerKm})
                      </span>
                      <span>₹{Math.round((deliveryBreakdown.distanceKm - deliveryBreakdown.freeDistance) * deliveryBreakdown.pricePerKm)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-blue-700 border-t pt-1">
                    <span>Delivery Charge</span>
                    <span>₹{deliveryBreakdown.deliveryCharge}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between font-bold text-green-600 text-base border-t pt-2 mt-2">
              <span>Grand Total</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h3 className="font-bold text-gray-700">📦 Delivery Details</h3>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
            <input type="text" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="Enter phone number" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
          </div>

          {/* Delivery Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button"
                onClick={() => setForm({...form, deliveryType: 'HOME_DELIVERY'})}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition ${
                  form.deliveryType === 'HOME_DELIVERY'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'}`}>
                🚚 Home Delivery
              </button>
              <button type="button"
                onClick={() => { setForm({...form, deliveryType: 'PICKUP'}); setDeliveryBreakdown(null); }}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition ${
                  form.deliveryType === 'PICKUP'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'}`}>
                🏪 Pickup
              </button>
            </div>
          </div>

          {/* Address Section */}
          {form.deliveryType === 'HOME_DELIVERY' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Delivery Address</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {['live', 'manual', 'saved'].map(type => (
                  <button key={type} type="button"
                    onClick={() => {
                      setAddressType(type);
                      setLocationStatus('');
                      // Reset delivery charge when switching address type
                      if (type === 'manual') setDeliveryBreakdown(null);
                    }}
                    className={`p-2 rounded-xl border-2 text-xs font-medium transition ${
                      addressType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600'}`}>
                    {type === 'live' ? '📍 Live' : type === 'manual' ? '✏️ Type' : '🏠 Saved'}
                  </button>
                ))}
              </div>

              {/* Live Location */}
              {addressType === 'live' && (
                <div>
                  <button type="button" onClick={getLocation}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-3 rounded-lg transition text-sm border border-blue-200">
                    📍 Share My Live Location
                  </button>
                  {locationStatus && (
                    <p className={`text-xs mt-1 text-center font-medium ${
                      locationStatus.includes('✅') ? 'text-green-600' :
                      locationStatus.includes('❌') ? 'text-red-500' : 'text-blue-500'}`}>
                      {locationStatus}
                    </p>
                  )}
                  {form.latitude && (
                    <div className="mt-2 bg-green-50 p-2 rounded-lg text-center">
                      <p className="text-xs text-green-600 font-medium">✅ Location captured!</p>
                      <p className="text-xs text-gray-400">
                        📌 {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                      </p>
                    </div>
                  )}
                  <input type="text" value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                    placeholder="Add landmark (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm mt-2" />
                </div>
              )}

              {/* Manual Address */}
              {addressType === 'manual' && (
                <div className="space-y-2">
                  <input type="text" value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                    placeholder="House/Flat No, Building Name" required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                  <input type="text" value={form.street}
                    onChange={e => setForm({...form, street: e.target.value})}
                    placeholder="Street, Area, Locality"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={form.city}
                      onChange={e => setForm({...form, city: e.target.value})}
                      placeholder="City"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                    <input type="text" value={form.pincode}
                      onChange={e => setForm({...form, pincode: e.target.value})}
                      placeholder="Pincode"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                  </div>
                  <button type="button" onClick={geocodeManualAddress}
                    className="w-full mt-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 rounded-lg transition text-sm border border-blue-200">
                    Verify Address & Calculate Delivery
                  </button>
                  {locationStatus && addressType === 'manual' && (
                    <p className={`text-xs mt-1 text-center font-medium ${
                      locationStatus.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                      {locationStatus}
                    </p>
                  )}
                </div>
              )}

              {/* Saved Addresses */}
              {addressType === 'saved' && (
                <div className="space-y-2">
                  {savedAddresses.map((addr, index) => (
                    <div key={index}
                      onClick={() => {
                        setForm({...form, address: addr.full, latitude: addr.lat, longitude: addr.lng});
                      }}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                        form.address === addr.full
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{addr.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-700">{addr.label}</p>
                          <p className="text-xs text-gray-500">{addr.full}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setAddressType('manual')}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-500 transition">
                    + Add New Address
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button"
                onClick={() => setForm({...form, paymentMethod: 'CASH'})}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition ${
                  form.paymentMethod === 'CASH'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600'}`}>
                💵 Cash on Delivery
              </button>
              <button type="button"
                onClick={() => setForm({...form, paymentMethod: 'RAZORPAY'})}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition flex flex-col items-center gap-1 ${
                  form.paymentMethod === 'RAZORPAY'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'}`}>
                <span className="text-base">💳</span>
                <span>Pay Online</span>
                <span className="text-xs opacity-70">Card · UPI · Netbanking</span>
              </button>
            </div>
            {form.paymentMethod === 'RAZORPAY' && (
              <div className="mt-2 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100 flex items-center gap-2">
                <span className="text-blue-500 text-sm">🔒</span>
                <p className="text-blue-600 text-xs">Secure payment via Razorpay — supports UPI, Cards, Netbanking & Wallets</p>
              </div>
            )}
          </div>

          {/* OTP Info — only for home delivery */}
          {form.deliveryType === 'HOME_DELIVERY' && (
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
              <p className="text-yellow-700 text-xs font-medium">🔐 OTP Delivery Verification</p>
              <p className="text-yellow-600 text-xs mt-1">
                After shopkeeper confirms, you'll receive a delivery OTP on your email.
                Share this with the delivery boy only when you receive your order.
              </p>
            </div>
          )}

          {/* Pickup info */}
          {form.deliveryType === 'PICKUP' && (
            <div className="bg-green-50 rounded-xl p-3 border border-green-200">
              <p className="text-green-700 text-xs font-medium">🏪 Pickup Order</p>
              <p className="text-green-600 text-xs mt-1">
                {form.paymentMethod === 'ONLINE'
                  ? '✅ Pay online now → Shopkeeper is notified to prepare your order → Come collect!'
                  : '💵 Shopkeeper will be notified to prepare your order → Come to the shop and pay ₹' + itemsTotal + ' cash.'}
              </p>
            </div>
          )}

          {/* Error */}
          {orderError && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm font-medium text-center">
              ❌ {orderError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || razorpayLoading || (form.deliveryType === 'HOME_DELIVERY' && !deliveryBreakdown)}
            className={`w-full font-bold py-3 rounded-xl transition ${
              (form.deliveryType === 'HOME_DELIVERY' && !deliveryBreakdown)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : form.paymentMethod === 'RAZORPAY'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
            }`}>
            {razorpayLoading ? '⏳ Opening Payment...' :
             loading ? '⏳ Placing Order...' :
             (form.deliveryType === 'HOME_DELIVERY' && !deliveryBreakdown) ? '⚠️ Please Verify Delivery Address First' :
             form.deliveryType === 'PICKUP' && form.paymentMethod === 'CASH' ? `🏪 Place Pickup Order • ₹${itemsTotal} (Pay at Shop)` :
             form.paymentMethod === 'RAZORPAY' ? `🔒 Pay ₹${grandTotal} via Razorpay` :
             `✅ Place Order • ₹${grandTotal}`}
          </button>
        </form>

        {/* Razorpay Loading Overlay */}
        {razorpayLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-700 font-semibold">Opening Razorpay...</p>
              <p className="text-gray-400 text-sm">Please wait</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Cart Page
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🛒 Your Cart</h2>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
          {totalItems} items
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-gray-500 font-medium">Your cart is empty!</p>
          <p className="text-gray-400 text-sm mt-1">Add products from nearby shops</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                <div className="text-3xl bg-gray-50 p-2 rounded-lg">
                  {item.category === 'dairy' ? '🥛' :
                   item.category === 'food' ? '🍱' :
                   item.category === 'beverages' ? '🥤' :
                   item.category === 'snacks' ? '🍿' : '📦'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                  <p className="text-green-600 font-bold">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full font-bold text-gray-600 flex items-center justify-center">
                    -
                  </button>
                  <span className="w-8 text-center font-bold">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}
                    className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-full font-bold text-blue-600 flex items-center justify-center">
                    +
                  </button>
                </div>
                <p className="font-bold text-gray-700 w-16 text-right">
                  ₹{item.price * item.qty}
                </p>
              </div>
            ))}
          </div>

          {/* Bill Summary */}
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-3">🧾 Bill Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items ({totalItems})</span>
                <span>₹{itemsTotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="text-green-600">Calculated at checkout</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-green-600">₹{itemsTotal}</span>
              </div>
            </div>
          </div>

          <button onClick={() => setStep('checkout')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition text-lg">
            Proceed to Checkout →
          </button>
        </>
      )}
    </div>
  );
};

export default Cart;