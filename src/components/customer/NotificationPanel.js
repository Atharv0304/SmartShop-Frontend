import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const NotificationPanel = ({ customer, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get(
        `/api/notifications/${customer.id}/CUSTOMER`
      );
      setNotifications(res.data);
      // Mark all as read
      await api.put(
        `/api/notifications/read-all/${customer.id}/CUSTOMER`
      );
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'ORDER_PLACED': return '🛒';
      case 'ORDER_CONFIRMED': return '✅';
      case 'DELIVERY_ASSIGNED': return '🚴';
      case 'ORDER_DELIVERED': return '🎉';
      case 'STATUS_UPDATE': return '📍';
      default: return '🔔';
    }
  };

  const getNotifColor = (type) => {
    switch (type) {
      case 'ORDER_PLACED': return 'border-blue-400 bg-blue-50';
      case 'ORDER_CONFIRMED': return 'border-green-400 bg-green-50';
      case 'DELIVERY_ASSIGNED': return 'border-purple-400 bg-purple-50';
      case 'ORDER_DELIVERED': return 'border-green-500 bg-green-50';
      case 'STATUS_UPDATE': return 'border-orange-400 bg-orange-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-sm h-full overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between sticky top-0">
          <div>
            <h2 className="text-lg font-bold">🔔 Notifications</h2>
            <p className="text-blue-100 text-xs">
              {notifications.length} notifications
            </p>
          </div>
          <button onClick={onClose}
            className="text-white text-2xl hover:text-blue-200">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🔔</p>
            <p className="text-gray-500">No notifications yet!</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {notifications.map(notif => (
              <div key={notif.id}
                className={`border-l-4 rounded-xl p-4 ${getNotifColor(notif.type)} ${
                  !notif.read ? 'opacity-100' : 'opacity-70'}`}>

                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {getNotifIcon(notif.type)}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">
                      {notif.title}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {notif.message}
                    </p>

                    {/* OTP Display */}
                    {notif.otp && (
                      <div className="mt-3 bg-white rounded-xl p-3 border-2 border-dashed border-green-400">
                        <p className="text-xs text-gray-500 mb-1">
                          🔐 Your Delivery OTP
                        </p>
                        <p className="text-3xl font-bold text-green-600 tracking-widest text-center">
                          {notif.otp}
                        </p>
                        <p className="text-xs text-red-500 text-center mt-1">
                          ⚠️ Share ONLY when delivery arrives
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      {formatTime(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;