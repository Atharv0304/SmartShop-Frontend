import React, { useState } from 'react';
import AddProduct from './components/AddProduct';
import ProductList from './components/ProductList';
import Dashboard from './components/Dashboard';
import ExpiryAlerts from './components/ExpiryAlerts';
import Login from './components/Login';
import ShopRegister from './components/ShopRegister';
import OrderManagement from './components/OrderManagement';
import DeliveryManagement from './components/DeliveryManagement';
import ShopkeeperProfile from './components/ShopkeeperProfile';
import ChatBot from './components/customer/ChatBot';

function App() {
  const [shopkeeper, setShopkeeper] = useState(() => {
    const saved = localStorage.getItem('shopkeeper');
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = useState('dashboard');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    if (!shopkeeper) return;

    const fetchPendingOrders = async () => {
      try {
        // Fetch all shops to find this shopkeeper's shop ID
        const shopsRes = await fetch('https://smartshop-backend-64zl.onrender.com/api/shops/all');
        const shops = await shopsRes.json();
        const myShop = shops.find(s => s.email === shopkeeper.email);
        
        if (myShop) {
          const res = await fetch(`https://smartshop-backend-64zl.onrender.com/api/orders/shop/${myShop.id}`);
          const orders = await res.json();
          const pending = orders.filter(o => o.status === 'PENDING').length;
          setPendingOrdersCount(pending);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 15000);
    return () => clearInterval(interval);
  }, [shopkeeper]);

  const handleLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('shopkeeper', JSON.stringify(data));
    setShopkeeper(data);
    setPage('dashboard');
  };

  const handleUpdate = (updatedData) => {
    const newData = { ...shopkeeper, ...updatedData };
    localStorage.setItem('shopkeeper', JSON.stringify(newData));
    setShopkeeper(newData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('shopkeeper');
    setShopkeeper(null);
  };

  if (!shopkeeper) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-2xl font-extrabold text-gradient flex items-center gap-2">
          <span>🛒</span> Smart Store <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md ml-2 border border-emerald-200">Shopkeeper</span>
        </h1>
        <div className="flex gap-2 bg-gray-100/50 p-1 rounded-xl border border-gray-200/50 overflow-x-auto hide-scrollbar">
          <button onClick={() => setPage('dashboard')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'dashboard' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            🏠 Dashboard
          </button>
          <button onClick={() => setPage('list')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'list' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            📦 Inventory
          </button>
          <button onClick={() => setPage('add')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'add' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            ➕ Add Product
          </button>
          <button onClick={() => setPage('alerts')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'alerts' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            🔔 Alerts
          </button>
          <button onClick={() => setPage('shop')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'shop' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            🏪 My Shop
          </button>
          <button onClick={() => setPage('orders')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap relative ${page === 'orders' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            📋 Orders
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm animate-pulse">
                {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
              </span>
            )}
          </button>
          <button onClick={() => setPage('delivery')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'delivery' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            🚴 Delivery
          </button>
          <button onClick={() => setPage('profile')}
            className={`px-4 py-2 rounded-lg font-bold transition text-sm whitespace-nowrap ${page === 'profile' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
            👤 Profile
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-700 hidden md:block">
            👤 {shopkeeper.name}
          </span>
          <button onClick={handleLogout}
            className="bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition border border-gray-200 hover:border-rose-200">
            Logout
          </button>
        </div>
      </nav>

      {page === 'dashboard' && <Dashboard shopkeeper={shopkeeper} />}
      {page === 'list' && <ProductList shopkeeper={shopkeeper} />}
      {page === 'add' && <AddProduct shopkeeper={shopkeeper} />}
      {page === 'alerts' && <ExpiryAlerts shopkeeper={shopkeeper} />}
      {page === 'shop' && <ShopRegister shopkeeper={shopkeeper} />}
      {page === 'orders' && <OrderManagement shopkeeper={shopkeeper} />}
      {page === 'delivery' && <DeliveryManagement shopkeeper={shopkeeper} />}
      {page === 'profile' && <ShopkeeperProfile shopkeeper={shopkeeper} onUpdate={handleUpdate} onLogout={handleLogout} />}

      {/* AI Chatbot */}
      <ChatBot role="SHOPKEEPER" />
    </div>
  );
}

export default App;