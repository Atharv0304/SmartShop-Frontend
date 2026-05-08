import React, { useState } from 'react';
import DeliveryRegister from './components/delivery/DeliveryRegister';
import DeliveryDashboard from './components/delivery/DeliveryDashboard';

function DeliveryMain() {
  const [deliveryBoy, setDeliveryBoy] = useState(() => {
    const saved = localStorage.getItem('deliveryBoy');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (data) => {
    localStorage.setItem('deliveryToken', data.token);
    localStorage.setItem('deliveryBoy', JSON.stringify(data));
    setDeliveryBoy(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('deliveryToken');
    localStorage.removeItem('deliveryBoy');
    setDeliveryBoy(null);
  };

  if (!deliveryBoy) {
    return <DeliveryRegister onLogin={handleLogin} />;
  }

  return <DeliveryDashboard deliveryBoy={deliveryBoy} onLogout={handleLogout} />;
}

export default DeliveryMain;