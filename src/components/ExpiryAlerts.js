import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ExpiryAlerts = ({ shopkeeper }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (shopkeeper?.email) {
      api.get(`/api/products/shopkeeper/${shopkeeper.email}`)
        .then(res => setProducts(res.data))
        .catch(err => console.error(err));
    }
  }, [shopkeeper]);

  const today = new Date();

  const expired = products.filter(p =>
    Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24)) < 0);

  const expiring7 = products.filter(p => {
    const diff = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  });

  const expiring30 = products.filter(p => {
    const diff = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
    return diff > 7 && diff <= 30;
  });

  const AlertCard = ({ product, type }) => {
    const diff = Math.ceil((new Date(product.expiryDate) - today) / (1000 * 60 * 60 * 24));
    const styles = {
      expired: { bg: 'bg-red-50 border-red-300', badge: 'bg-red-500 text-white', text: 'text-red-700', label: '❌ EXPIRED' },
      week: { bg: 'bg-orange-50 border-orange-300', badge: 'bg-orange-500 text-white', text: 'text-orange-700', label: `⚠️ ${diff} days left` },
      month: { bg: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-500 text-white', text: 'text-yellow-700', label: `🕐 ${diff} days left` }
    };
    const s = styles[type];
    return (
      <div className={`border rounded-xl p-4 ${s.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            {product.category === 'dairy' ? '🥛' :
             product.category === 'food' ? '🍱' :
             product.category === 'beverages' ? '🥤' :
             product.category === 'snacks' ? '🍿' :
             product.category === 'household' ? '🏠' : '📦'}
          </div>
          <div>
            <p className={`font-bold text-base ${s.text}`}>{product.name}</p>
            <p className="text-gray-500 text-xs capitalize">{product.category} • Qty: {product.quantity} • ₹{product.price}</p>
            <p className="text-gray-400 text-xs mt-1">Expiry: {product.expiryDate}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.badge}`}>{s.label}</span>
      </div>
    );
  };

  const Section = ({ title, items, type, emptyMsg }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-lg font-bold text-gray-700">{title}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white
          ${type === 'expired' ? 'bg-red-500' : type === 'week' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-gray-400 text-sm">
          ✅ {emptyMsg}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(p => <AlertCard key={p.id} product={p} type={type} />)}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🔔 Expiry Alerts</h2>
          <p className="text-gray-500 text-sm mt-1">Monitor products that need attention</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-red-500 text-white rounded-2xl p-4 text-center shadow">
            <p className="text-3xl font-bold">{expired.length}</p>
            <p className="text-sm mt-1">Expired</p>
          </div>
          <div className="bg-orange-500 text-white rounded-2xl p-4 text-center shadow">
            <p className="text-3xl font-bold">{expiring7.length}</p>
            <p className="text-sm mt-1">Within 7 Days</p>
          </div>
          <div className="bg-yellow-500 text-white rounded-2xl p-4 text-center shadow">
            <p className="text-3xl font-bold">{expiring30.length}</p>
            <p className="text-sm mt-1">Within 30 Days</p>
          </div>
        </div>
        <Section title="❌ Expired Products" items={expired} type="expired" emptyMsg="No expired products!" />
        <Section title="⚠️ Expiring Within 7 Days" items={expiring7} type="week" emptyMsg="No products expiring within 7 days!" />
        <Section title="🕐 Expiring Within 30 Days" items={expiring30} type="month" emptyMsg="No products expiring within 30 days!" />
      </div>
    </div>
  );
};

export default ExpiryAlerts;