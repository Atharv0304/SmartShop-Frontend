import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const SalesAnalytics = ({ shopkeeper }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopkeeper?.email) {
      api.get(`/api/shopkeeper/analytics/${shopkeeper.email}`)
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [shopkeeper]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!data || data.totalOrders === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 text-center border border-white shadow-xl mt-6">
        <h3 className="text-xl font-bold text-gray-700">No Sales Data Yet</h3>
        <p className="text-gray-500 mt-2">Complete some orders to see your analytics here.</p>
      </div>
    );
  }

  // Formatting for Daily Revenue
  const revenueDates = Object.keys(data.dailyRevenue).sort();
  const maxRevenue = Math.max(...Object.values(data.dailyRevenue), 1);

  // Formatting for Peak Hours
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxOrdersHour = Math.max(...Object.values(data.peakOrderHours), 1);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📈</span>
        <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Sales Analytics</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-5 shadow-lg text-white transform hover:-translate-y-1 transition-all duration-300">
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
          <p className="text-3xl font-black mt-1">₹{data.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl p-5 shadow-lg text-white transform hover:-translate-y-1 transition-all duration-300">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Total Orders</p>
          <p className="text-3xl font-black mt-1">{data.totalOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-5 shadow-lg text-white transform hover:-translate-y-1 transition-all duration-300">
          <p className="text-purple-100 text-xs font-bold uppercase tracking-wider">Total Customers</p>
          <p className="text-3xl font-black mt-1">{data.customerRetention?.totalCustomers || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-5 shadow-lg text-white transform hover:-translate-y-1 transition-all duration-300">
          <p className="text-orange-100 text-xs font-bold uppercase tracking-wider">Repeat Customers</p>
          <p className="text-3xl font-black mt-1">{data.customerRetention?.repeatCustomers || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Bar Chart */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Daily Revenue</h3>
          <div className="h-64 flex items-end gap-2 overflow-x-auto hide-scrollbar pb-2">
            {revenueDates.map(date => {
              const val = data.dailyRevenue[date];
              const heightPct = (val / maxRevenue) * 100;
              return (
                <div key={date} className="flex flex-col items-center flex-shrink-0 group">
                  <div className="text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity mb-2">₹{val}</div>
                  <div 
                    className="w-10 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-t-lg transition-all duration-500 group-hover:from-emerald-400 group-hover:to-teal-200" 
                    style={{ height: `${heightPct}%`, minHeight: '10%' }}
                  ></div>
                  <div className="text-[10px] text-gray-400 mt-2 rotate-45 origin-left font-medium">
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
            {revenueDates.length === 0 && <p className="text-gray-400 m-auto">No recent revenue data.</p>}
          </div>
        </div>

        {/* Peak Order Hours Line/Bar Chart */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Peak Order Hours</h3>
          <div className="h-64 flex items-end justify-between gap-1 pb-2">
            {hours.map(hour => {
              const count = data.peakOrderHours[hour] || 0;
              const heightPct = (count / maxOrdersHour) * 100;
              return (
                <div key={hour} className="flex flex-col items-center flex-1 group">
                  <div className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity mb-2 absolute -mt-6">{count}</div>
                  <div 
                    className="w-full bg-indigo-100 rounded-t-md relative overflow-hidden transition-all duration-300 group-hover:bg-indigo-200"
                    style={{ height: `${heightPct}%`, minHeight: count > 0 ? '5%' : '0%' }}
                  >
                    <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-md" style={{ height: '100%' }}></div>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-2">
                    {hour % 12 === 0 ? 12 : hour % 12}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Best Selling Products */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white">
        <h3 className="text-lg font-bold text-gray-800 mb-6">🏆 Best Selling Products</h3>
        <div className="space-y-4">
          {data.bestSellingProducts && data.bestSellingProducts.map((product, index) => (
            <div key={index} className="flex items-center gap-4 group">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                #{index + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-gray-700">{product.name}</span>
                  <span className="text-sm font-bold text-gray-500">{product.quantity} sold</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2.5 rounded-full transform origin-left transition-transform duration-1000 ease-out" 
                    style={{ width: `${(product.quantity / (data.bestSellingProducts[0]?.quantity || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          {(!data.bestSellingProducts || data.bestSellingProducts.length === 0) && (
            <p className="text-gray-400">No products sold yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;
