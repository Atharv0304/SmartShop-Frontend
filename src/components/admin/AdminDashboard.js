import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-12 text-slate-500 font-bold animate-pulse">Loading Analytics...</div>;
  if (!stats) return <div className="text-center p-12 text-red-500 font-bold">Failed to load analytics</div>;

  const statCards = [
    { title: 'Total Revenue', value: `₹${stats.totalRevenue?.toFixed(2)}`, icon: '💰', color: 'from-emerald-400 to-teal-500' },
    { title: 'Total Orders', value: stats.totalOrders, icon: '📦', color: 'from-blue-400 to-indigo-500' },
    { title: 'Active Shops', value: stats.totalShops, icon: '🏪', color: 'from-purple-400 to-fuchsia-500' },
    { title: 'Customers', value: stats.totalCustomers, icon: '👥', color: 'from-amber-400 to-orange-500' },
    { title: 'Delivery Partners', value: stats.totalDeliveryPartners, icon: '🚴', color: 'from-rose-400 to-red-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Overview</h2>
        <p className="text-slate-500 font-medium">Real-time metrics and platform health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="glass p-6 rounded-3xl border border-white/60 shadow-lg hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700`} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-slate-500 font-bold">{stat.title}</span>
              <span className="text-3xl">{stat.icon}</span>
            </div>
            <div className="text-4xl font-black text-slate-800 relative z-10">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      
      <div className="glass p-8 rounded-3xl border border-white/60 shadow-lg mt-8 text-center">
        <div className="text-5xl mb-4">🚀</div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Platform is Running Smoothly</h3>
        <p className="text-slate-500">All systems are operational. No critical issues detected.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
