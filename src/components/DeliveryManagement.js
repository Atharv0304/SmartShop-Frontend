import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const DeliveryManagement = ({ shopkeeper }) => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [selectedBoy, setSelectedBoy] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState(null);
  const [debugLog, setDebugLog] = useState('');

  useEffect(() => {
    if (shopkeeper) {
      fetchShopAndConnections();
      const interval = setInterval(() => {
        fetchShopAndConnections();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [shopkeeper]);

  const fetchShopAndConnections = async () => {
    try {
      // 1. Get Shop
      const shopsRes = await api.get('/api/shops/all');
      const myShop = shopsRes.data.find(s => s.email === shopkeeper.email);
      if (!myShop) return;
      setShopId(myShop.id);

      // 2. Get Connections for Shop
      const connRes = await api.get(`/api/connections/shop/${myShop.id}`);
      const connections = connRes.data;

      // 3. Get All Delivery Boys
      const boysRes = await api.get('/api/delivery/all');
      const allBoys = boysRes.data;

      // 4. Merge (Only show boys that requested connection)
      const shopDeliveryBoys = connections.map(conn => {
        const boy = allBoys.find(b => Number(b.id) === Number(conn.deliveryBoyId));
        return {
          ...(boy || {}), // Spread all properties from the delivery boy
          id: conn.deliveryBoyId,
          name: boy ? boy.name : (conn.deliveryBoyName || 'Unknown Rider'),
          phone: boy ? boy.phone : 'N/A',
          vehicleType: boy ? boy.vehicleType : 'N/A',
          vehicleNumber: boy ? boy.vehicleNumber : 'N/A',
          rating: boy ? boy.rating : 0,
          totalDeliveries: boy ? boy.totalDeliveries : 0,
          connectionId: conn.id,
          status: conn.status,
          requestedAt: conn.requestedAt
        };
      });

      setDebugLog(`Found shop: ${myShop.id}, connections: ${connections.length}, allBoys: ${allBoys.length}`);
      setDeliveryBoys(shopDeliveryBoys);
    } catch (err) {
      setDebugLog(`Error: ${err.message}`);
      console.error(err);
    }
    setLoading(false);
  };

  const handleApprove = async (connectionId) => {
    try {
      await api.put(`/api/connections/approve/${connectionId}`);
      fetchShopAndConnections();
      if (selectedBoy?.connectionId === connectionId) {
        setSelectedBoy(prev => ({...prev, status: 'APPROVED'}));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (connectionId) => {
    try {
      await api.put(`/api/connections/reject/${connectionId}`);
      fetchShopAndConnections();
      if (selectedBoy?.connectionId === connectionId) {
        setSelectedBoy(prev => ({...prev, status: 'REJECTED'}));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      case 'PENDING': return '⏳';
      default: return '📋';
    }
  };

  const filteredBoys = filter === 'ALL'
    ? deliveryBoys
    : deliveryBoys.filter(b => b.status === filter);

  const stats = {
    total: deliveryBoys.length,
    pending: deliveryBoys.filter(b => b.status === 'PENDING').length,
    approved: deliveryBoys.filter(b => b.status === 'APPROVED').length,
    rejected: deliveryBoys.filter(b => b.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🚴 Delivery Boy Management</h2>
          <p className="text-gray-500 text-sm mt-1">Approve or reject delivery partner applications</p>
          {debugLog && <p className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded">{debugLog}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center border-l-4 border-blue-500">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total Applications</p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow p-4 text-center border-l-4 border-yellow-500">
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-yellow-600 mt-1">⏳ Pending</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow p-4 text-center border-l-4 border-green-500">
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-green-600 mt-1">✅ Approved</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow p-4 text-center border-l-4 border-red-500">
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-red-600 mt-1">❌ Rejected</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
            <button key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {getStatusEmoji(status)} {status}
              <span className="ml-1 text-xs">
                ({status === 'ALL' ? stats.total :
                  status === 'PENDING' ? stats.pending :
                  status === 'APPROVED' ? stats.approved :
                  stats.rejected})
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Delivery Boys List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : filteredBoys.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl text-gray-400">
                <p className="text-3xl mb-2">🚴</p>
                <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} applications!</p>
              </div>
            ) : (
              filteredBoys.map(boy => (
                <div key={boy.id}
                  onClick={() => setSelectedBoy(boy)}
                  className={`bg-white rounded-xl shadow p-4 cursor-pointer transition border-2 ${
                    selectedBoy?.id === boy.id
                      ? 'border-green-500'
                      : 'border-transparent hover:border-gray-200'}`}>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                        🚴
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{boy.name}</p>
                        <p className="text-xs text-gray-500">{boy.email}</p>
                        <p className="text-xs text-gray-500">📞 {boy.phone}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(boy.status)}`}>
                      {getStatusEmoji(boy.status)} {boy.status}
                    </span>
                  </div>

                  {/* Vehicle Info */}
                  <div className="flex gap-3 mt-3 text-xs text-gray-500">
                    <span>
                      {boy.vehicleType === 'BIKE' ? '🏍️' :
                       boy.vehicleType === 'SCOOTER' ? '🛵' : '🚲'}
                      {boy.vehicleType}
                    </span>
                    <span>🔢 {boy.vehicleNumber}</span>
                    <span>📋 {boy.licenseNumber}</span>
                  </div>

                  {/* Email Verified Badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      boy.emailVerified
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'}`}>
                      {boy.emailVerified ? '✅ Email Verified' : '❌ Email Not Verified'}
                    </span>
                    <span className="text-xs text-gray-400">Age: {boy.age}</span>
                  </div>

                  {/* Action Buttons */}
                  {boy.status === 'PENDING' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApprove(boy.connectionId); }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-2 rounded-lg font-medium transition">
                        ✅ Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReject(boy.connectionId); }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-2 rounded-lg font-medium transition">
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {boy.status === 'APPROVED' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReject(boy.connectionId); }}
                      className="w-full mt-3 bg-red-100 hover:bg-red-200 text-red-600 text-xs py-2 rounded-lg font-medium transition">
                      ❌ Revoke Approval
                    </button>
                  )}
                  {boy.status === 'REJECTED' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(boy.connectionId); }}
                      className="w-full mt-3 bg-green-100 hover:bg-green-200 text-green-600 text-xs py-2 rounded-lg font-medium transition">
                      ✅ Re-Approve
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div>
            {selectedBoy ? (
              <div className="bg-white rounded-2xl shadow p-6 sticky top-6">

                {/* Profile Header */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">
                    🚴
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedBoy.name}</h3>
                  <p className="text-gray-500 text-sm">{selectedBoy.email}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(selectedBoy.status)}`}>
                    {getStatusEmoji(selectedBoy.status)} {selectedBoy.status}
                  </span>
                </div>

                {/* Personal Info */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">👤 Personal Information</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Phone', value: selectedBoy.phone },
                      { label: 'Age', value: `${selectedBoy.age} years` },
                      { label: 'Gender', value: selectedBoy.gender },
                      { label: 'City', value: selectedBoy.city },
                      { label: 'Pincode', value: selectedBoy.pincode },
                      { label: 'Email Verified', value: selectedBoy.emailVerified ? '✅ Yes' : '❌ No' },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-sm font-medium text-gray-700">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400">📍 Address</p>
                  <p className="text-sm text-gray-700">{selectedBoy.address}, {selectedBoy.city} - {selectedBoy.pincode}</p>
                </div>

                {/* Vehicle Info */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">🏍️ Vehicle Information</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Vehicle Type', value: selectedBoy.vehicleType },
                      { label: 'Vehicle Number', value: selectedBoy.vehicleNumber },
                      { label: 'Brand', value: selectedBoy.vehicleBrand },
                      { label: 'Model', value: selectedBoy.vehicleModel },
                      { label: 'Year', value: selectedBoy.vehicleYear },
                      { label: 'License No', value: selectedBoy.licenseNumber },
                      { label: 'License Expiry', value: selectedBoy.licenseExpiry },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-sm font-medium text-gray-700">{item.value || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">📄 Documents</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Aadhar Number</p>
                      <p className="text-sm font-medium text-gray-700">
                        {selectedBoy.aadharNumber?.replace(/(\d{4})/g, '$1 ').trim()}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">PAN Number</p>
                      <p className="text-sm font-medium text-gray-700">
                        {selectedBoy.panNumber || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {selectedBoy.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleApprove(selectedBoy.connectionId)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
                        ✅ Approve Application
                      </button>
                      <button onClick={() => handleReject(selectedBoy.connectionId)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition">
                        ❌ Reject Application
                      </button>
                    </>
                  )}
                  {selectedBoy.status === 'APPROVED' && (
                    <div className="space-y-2">
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-green-700 font-medium">✅ This partner is approved and active!</p>
                      </div>
                      <button onClick={() => handleReject(selectedBoy.connectionId)}
                        className="w-full bg-red-100 hover:bg-red-200 text-red-600 font-bold py-3 rounded-xl transition">
                        ❌ Revoke Approval
                      </button>
                    </div>
                  )}
                  {selectedBoy.status === 'REJECTED' && (
                    <div className="space-y-2">
                      <div className="bg-red-50 rounded-xl p-3 text-center">
                        <p className="text-red-600 font-medium">❌ This application was rejected</p>
                      </div>
                      <button onClick={() => handleApprove(selectedBoy.connectionId)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition">
                        ✅ Re-Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">👆</p>
                <p>Click on a delivery boy to see full details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManagement;