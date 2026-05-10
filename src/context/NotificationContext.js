import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const BASE_URL = 'https://smartshop-backend-64zl.onrender.com';

// ─── Context ──────────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);

// ─── Helper: fetch with no auth (public endpoints) ───────────────────────────
const fetchPublic = (url) => fetch(BASE_URL + url).then(r => r.json()).catch(() => []);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const NotificationProvider = ({ shopkeeper, children }) => {
  const [badges, setBadges] = useState({
    dashboard: 0,
    inventory: 0,
    addProduct: 0,
    alerts: 0,
    shop: 0,
    orders: 0,
    delivery: 0,
    profile: 0,
  });

  // Clears a specific tab badge when user navigates to it
  const clearBadge = useCallback((tab) => {
    setBadges(prev => ({ ...prev, [tab]: 0 }));
  }, []);

  const fetchBadges = useCallback(async () => {
    if (!shopkeeper?.email) return;

    try {
      // ── 1. Find shopkeeper's shop ──────────────────────────────────
      const shops = await fetchPublic('/api/shops/all');
      const myShop = shops.find(s => s.email === shopkeeper.email);

      let pendingOrders = 0;
      let deliveryUpdates = 0;
      let outOfStockCount = 0;
      let expiryAlertCount = 0;
      let shopUpdates = 0;

      // ── 2. Orders badge: count PENDING orders ──────────────────────
      if (myShop) {
        try {
          const ordersRes = await fetchPublic(`/api/orders/shop/${myShop.id}`);
          const orders = Array.isArray(ordersRes) ? ordersRes : [];
          pendingOrders = orders.filter(o => o.status === 'PENDING').length;

          // Delivery: count orders that are READY (waiting delivery assignment)
          // or OUT_FOR_DELIVERY
          deliveryUpdates = orders.filter(o =>
            o.status === 'READY' || o.status === 'OUT_FOR_DELIVERY'
          ).length;
        } catch (_) {}

        // ── 3. Inventory / Add Product: low-stock & out-of-stock ──────
        try {
          const productsRes = await api.get('/api/products/all');
          const myProducts = (productsRes.data || []).filter(
            p => p.shopkeeperEmail === shopkeeper.email
          );

          // Inventory badge = products with quantity <= 5 (low/out of stock)
          outOfStockCount = myProducts.filter(p => p.quantity <= 5).length;

          // Alerts badge = expiring within 7 days
          const today = new Date();
          expiryAlertCount = myProducts.filter(p => {
            if (!p.expiryDate) return false;
            const diff = Math.ceil(
              (new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24)
            );
            return diff >= 0 && diff <= 7;
          }).length;

          // Add Product badge: pending products (quantity = 0 = out of stock, needs restock)
          // We re-use outOfStockCount here as "action needed"
        } catch (_) {}

        // ── 4. Shop badge: check if shop profile is incomplete ────────
        if (myShop) {
          const missing = ['shopName', 'address', 'category', 'openTime', 'closeTime', 'latitude']
            .filter(k => !myShop[k]).length;
          shopUpdates = missing; // each missing field = 1 update needed
        }
      }

      // ── 5. Profile badge: unread shopkeeper notifications ──────────
      let profileBadge = 0;
      try {
        const notifRes = await api.get(
          `/api/notifications/${shopkeeper.id}/SHOPKEEPER`
        );
        const notifs = Array.isArray(notifRes.data) ? notifRes.data : [];
        profileBadge = notifs.filter(n => !n.read).length;
      } catch (_) {}

      // ── 6. Dashboard badge: sum of everything happening ─────────────
      const dashboardBadge = pendingOrders + expiryAlertCount;

      setBadges({
        dashboard: dashboardBadge,
        inventory: outOfStockCount,
        addProduct: outOfStockCount > 0 ? 1 : 0, // prompt to restock
        alerts: expiryAlertCount,
        shop: shopUpdates,
        orders: pendingOrders,
        delivery: deliveryUpdates,
        profile: profileBadge,
      });
    } catch (err) {
      console.error('[NotificationContext] Error fetching badges:', err);
    }
  }, [shopkeeper]);

  // Initial fetch + 20-second polling
  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 20000);
    return () => clearInterval(interval);
  }, [fetchBadges]);

  return (
    <NotificationContext.Provider value={{ badges, clearBadge, refetch: fetchBadges }}>
      {children}
    </NotificationContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};

export default NotificationContext;
