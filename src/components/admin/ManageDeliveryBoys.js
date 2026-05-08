import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ManageDeliveryBoys = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDB, setSelectedDB] = useState(null);

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const fetchDeliveryBoys = async () => {
    try {
      const response = await api.get('/api/admin/delivery-boys');
      setDeliveryBoys(response.data);
    } catch (error) {
      console.error('Error fetching delivery boys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this delivery partner?')) {
      try {
        await api.delete(`/api/admin/delivery-boys/${id}`);
        fetchDeliveryBoys();
      } catch (error) {
        console.error('Error deleting delivery partner:', error);
        alert('Failed to delete delivery partner');
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/admin/delivery-boys/${id}/approve`);
      if (selectedDB && selectedDB.id === id) {
          setSelectedDB({...selectedDB, isApproved: true, status: 'APPROVED'});
      }
      fetchDeliveryBoys();
    } catch (error) {
      console.error('Error approving delivery partner:', error);
      alert('Failed to approve delivery partner');
    }
  };

  if (loading) return <div className="text-center p-12 text-slate-500 font-bold animate-pulse">Loading Delivery Partners...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manage Delivery Partners</h2>
        <p className="text-slate-500 font-medium">View and verify logistics personnel</p>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/60 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="p-5 font-bold text-slate-600">ID</th>
                <th className="p-5 font-bold text-slate-600">Name</th>
                <th className="p-5 font-bold text-slate-600">Vehicle</th>
                <th className="p-5 font-bold text-slate-600">Status</th>
                <th className="p-5 font-bold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveryBoys.map(db => (
                <tr key={db.id} 
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setSelectedDB(db)}
                >
                  <td className="p-5 font-medium text-slate-500">#{db.id}</td>
                  <td className="p-5 font-bold text-slate-800">
                    {db.name}<br/>
                    <span className="text-sm font-medium text-slate-400">{db.phone}</span>
                  </td>
                  <td className="p-5 font-medium text-slate-600">
                    {db.vehicleType} <br/>
                    <span className="text-sm text-slate-400">{db.vehicleNumber}</span>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${db.isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {db.status || (db.isApproved ? 'APPROVED' : 'PENDING')}
                    </span>
                  </td>
                  <td className="p-5 text-right space-x-2">
                    {!db.isApproved && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleApprove(db.id); }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold py-2 px-4 rounded-xl text-sm transition"
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(db.id); }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2 px-4 rounded-xl text-sm transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {deliveryBoys.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">
                    No delivery partners found on the platform.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDB && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-up">
            <button 
              onClick={() => setSelectedDB(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition font-bold"
            >
              ✕
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-rose-100 to-orange-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                🚴
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-slate-800">{selectedDB.name}</h3>
                <p className={`font-bold text-sm inline-block px-3 py-1 rounded-full mt-2 ${selectedDB.isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {selectedDB.status || (selectedDB.isApproved ? 'APPROVED' : 'PENDING')}
                </p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 mb-6">
              <div className="mb-4">
                <p className="text-sm font-bold text-slate-700 mb-2">👤 Personal Information</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Phone', value: selectedDB.phone },
                    { label: 'Age', value: `${selectedDB.age} years` },
                    { label: 'Gender', value: selectedDB.gender },
                    { label: 'City', value: selectedDB.city },
                    { label: 'Pincode', value: selectedDB.pincode },
                    { label: 'Email Verified', value: selectedDB.emailVerified ? '✅ Yes' : '❌ No' },
                    { label: 'Total Earnings', value: `₹${selectedDB.totalEarnings || 0}` },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-medium text-slate-700">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-slate-400">📍 Address</p>
                <p className="text-sm text-slate-700">{selectedDB.address}, {selectedDB.city} - {selectedDB.pincode}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-bold text-slate-700 mb-2">🏍️ Vehicle Information</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Vehicle Type', value: selectedDB.vehicleType },
                    { label: 'Vehicle Number', value: selectedDB.vehicleNumber },
                    { label: 'Brand', value: selectedDB.vehicleBrand },
                    { label: 'Model', value: selectedDB.vehicleModel },
                    { label: 'Year', value: selectedDB.vehicleYear },
                    { label: 'License No', value: selectedDB.licenseNumber },
                    { label: 'License Expiry', value: selectedDB.licenseExpiry },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-medium text-slate-700">{item.value || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-bold text-slate-700 mb-2">📄 Documents</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Aadhar Number</p>
                    <p className="text-sm font-medium text-slate-700">
                      {selectedDB.aadharNumber?.replace(/(\d{4})/g, '$1 ').trim() || 'Not Uploaded'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">PAN Number</p>
                    <p className="text-sm font-medium text-slate-700">
                      {selectedDB.panNumber || 'Not Uploaded'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {!selectedDB.isApproved && (
                <button 
                  onClick={() => handleApprove(selectedDB.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  Approve Documents
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDeliveryBoys;
