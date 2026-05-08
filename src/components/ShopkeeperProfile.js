import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ShopkeeperProfile = ({ shopkeeper, onUpdate, onLogout }) => {
  const [profile, setProfile] = useState({
    name: shopkeeper?.name || '',
    shopName: shopkeeper?.shopName || '',
    email: shopkeeper?.email || '',
    phone: shopkeeper?.phone || '',
    upiId: shopkeeper?.upiId || '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Fetch latest profile
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/shopkeeper/profile/${shopkeeper.email}`);
        setProfile({
          name: res.data.name || '',
          shopName: res.data.shopName || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          upiId: res.data.upiId || ''
        });
      } catch (err) {
        console.error("Failed to fetch profile");
      }
    };
    if (shopkeeper?.email) fetchProfile();
  }, [shopkeeper]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!profile.upiId) {
      setError('❌ UPI ID is mandatory for receiving customer payments.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.put(`/api/shopkeeper/profile/${profile.email}`, profile);
      setMessage('✅ Profile updated successfully!');
      if (onUpdate) onUpdate(res.data);
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Failed to update profile';
      setError('❌ ' + errMsg);
    }
    setLoading(false);
  };

  const handleDeleteRequest = async () => {
    if (!window.confirm("⚠️ Are you sure you want to permanently delete your shopkeeper account? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/shopkeeper/send-delete-otp', { email: profile.email });
      setOtpSent(true);
      setShowDeleteModal(true);
      setMessage('✅ OTP sent to your email for account deletion verification.');
    } catch (err) {
      setError('❌ Failed to send OTP. Please try again.');
    }
    setLoading(false);
  };

  const confirmDeleteAccount = async () => {
    if (!deleteOtp) {
      setError('❌ Please enter the OTP sent to your email.');
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/api/shopkeeper/profile/${profile.email}?otp=${deleteOtp}`);
      alert("Your account has been successfully deleted.");
      if (onLogout) onLogout();
    } catch (err) {
      setError('❌ Failed to delete account. Incorrect or expired OTP.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👤 My Profile</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your personal and payment details</p>
        </div>

        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 font-medium border border-green-200">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span> Personal Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" name="name" value={profile.name} onChange={handleChange} required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Name</label>
                <input type="text" name="shopName" value={profile.shopName} onChange={handleChange} required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input type="email" name="email" value={profile.email} disabled
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-200 text-gray-500 rounded-lg cursor-not-allowed" />
                <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input type="text" name="phone" value={profile.phone} onChange={handleChange} required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
            </div>
          </div>

          {/* Payment Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10" />
            
            <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2 relative z-10">
              <span>💳</span> Payment Settings
            </h3>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4 relative z-10">
              <p className="text-sm text-emerald-800 font-medium mb-1">Why do we need this?</p>
              <p className="text-xs text-emerald-600">
                Your UPI ID is used to generate direct payment QR codes for customers. Money goes directly to your bank account without any platform fees.
              </p>
            </div>

            <div className="relative z-10">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Shopkeeper UPI ID <span className="text-rose-500">*</span>
              </label>
              <input type="text" name="upiId" value={profile.upiId} onChange={handleChange}
                placeholder="e.g. yourname@sbi or 9876543210@ybl" required
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition text-lg font-medium" />
              <p className="text-xs text-gray-500 mt-2">
                Make sure this UPI ID is active. Customers will scan the QR code to pay you directly.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5">
              {loading ? '⏳ Saving Changes...' : '✅ Save Profile'}
            </button>
            <button type="button" onClick={handleDeleteRequest} disabled={loading}
              className="bg-white border-2 border-red-500 hover:bg-red-50 text-red-600 font-bold px-6 py-4 rounded-xl shadow-sm transition-all">
              🗑️ Delete Account
            </button>
          </div>
        </form>
      </div>

      {/* OTP Modal for Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Verify Account Deletion</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please enter the OTP sent to <strong>{profile.email}</strong> to confirm account deletion.
            </p>
            
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={deleteOtp}
              onChange={(e) => setDeleteOtp(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 text-center tracking-widest font-mono text-lg"
              maxLength="6"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={loading || deleteOtp.length < 6}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 transition disabled:opacity-50"
              >
                {loading ? '⏳ Verify...' : '🗑️ Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperProfile;
