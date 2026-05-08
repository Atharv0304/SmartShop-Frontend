import React, { useState } from 'react';
import CustomerLogin from './components/customer/CustomerLogin';
import CustomerApp from './components/customer/CustomerApp';

function CustomerMain() {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem('customer');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (data) => {
    localStorage.setItem('customerToken', data.token);
    localStorage.setItem('customer', JSON.stringify(data));
    setCustomer(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
    setCustomer(null);
  };

  if (!customer) {
    return <CustomerLogin onLogin={handleLogin} />;
  }

  return <CustomerApp customer={customer} onLogout={handleLogout} />;
}

export default CustomerMain;