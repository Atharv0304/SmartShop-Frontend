import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ManageRestaurants = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await api.get('/api/admin/shops');
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this shop?')) {
      try {
        await api.delete(`/api/admin/shops/${id}`);
        fetchShops();
      } catch (error) {
        console.error('Error deleting shop:', error);
        alert('Failed to delete shop');
      }
    }
  };

  if (loading) return <div className="text-center p-12 text-slate-500 font-bold animate-pulse">Loading Shops...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manage Shops</h2>
        <p className="text-slate-500 font-medium">View and control registered businesses on the platform</p>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/60 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="p-5 font-bold text-slate-600">ID</th>
                <th className="p-5 font-bold text-slate-600">Shop Name</th>
                <th className="p-5 font-bold text-slate-600">Owner</th>
                <th className="p-5 font-bold text-slate-600">Category</th>
                <th className="p-5 font-bold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shops.map(shop => (
                <tr key={shop.id} 
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setSelectedShop(shop)}
                >
                  <td className="p-5 font-medium text-slate-500">#{shop.id}</td>
                  <td className="p-5 font-bold text-slate-800">{shop.shopName}</td>
                  <td className="p-5 font-medium text-slate-600">
                    {shop.ownerName}<br/>
                    <span className="text-sm text-slate-400">{shop.email}</span>
                  </td>
                  <td className="p-5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                      {shop.category}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(shop.id);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2 px-4 rounded-xl text-sm transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">
                    No shops found on the platform.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedShop && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-up">
            <button 
              onClick={() => setSelectedShop(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition font-bold"
            >
              ✕
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                🏪
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-slate-800">{selectedShop.shopName}</h3>
                <p className="text-indigo-600 font-bold text-sm bg-indigo-50 inline-block px-3 py-1 rounded-full mt-2">
                  {selectedShop.category}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Owner</label>
                  <p className="text-slate-800 font-bold mt-1">{selectedShop.ownerName}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</label>
                  <p className="text-slate-800 font-medium mt-1">{selectedShop.email}</p>
                  <p className="text-slate-800 font-medium">{selectedShop.phone}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operating Hours</label>
                  <p className="text-slate-800 font-medium mt-1">{selectedShop.openTime} - {selectedShop.closeTime}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">UPI ID</label>
                  <p className="text-slate-800 font-medium mt-1">{selectedShop.upiId || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registration Date</label>
                  <p className="text-slate-800 font-medium mt-1">
                    {selectedShop.createdAt ? new Date(selectedShop.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Address</label>
              <p className="text-slate-800 font-medium leading-relaxed">{selectedShop.address}</p>
              <div className="flex gap-4 mt-4 text-xs font-bold text-slate-500 bg-white inline-flex px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <span>📍 Lat: {selectedShop.latitude}</span>
                <span className="w-px bg-slate-200"></span>
                <span>Lng: {selectedShop.longitude}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRestaurants;
