import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const MonitorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/admin/orders');
      // Sort orders by most recent
      const sorted = response.data.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
      setOrders(sorted);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'OUT_FOR_DELIVERY': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACCEPTED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  if (loading) return <div className="text-center p-12 text-slate-500 font-bold animate-pulse">Loading Orders...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Monitor Orders & Payments</h2>
        <p className="text-slate-500 font-medium">Real-time tracking of all platform transactions</p>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/60 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="p-5 font-bold text-slate-600">Order ID</th>
                <th className="p-5 font-bold text-slate-600">Shop</th>
                <th className="p-5 font-bold text-slate-600">Customer</th>
                <th className="p-5 font-bold text-slate-600">Amount</th>
                <th className="p-5 font-bold text-slate-600">Payment</th>
                <th className="p-5 font-bold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-white/40 transition">
                  <td className="p-5 font-bold text-slate-500">#{order.id}</td>
                  <td className="p-5 font-bold text-slate-800">{order.shopName}</td>
                  <td className="p-5 font-medium text-slate-600">{order.customerName}</td>
                  <td className="p-5 font-black text-emerald-600">₹{order.totalAmount?.toFixed(2)}</td>
                  <td className="p-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                      {order.paymentMethod || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonitorOrders;
