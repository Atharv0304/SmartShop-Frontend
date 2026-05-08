import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import CustomerMain from './CustomerMain';
import DeliveryMain from './DeliveryMain';
import LandingPage from './components/landing/LandingPage';
import AdminMain from './AdminMain';

const root = ReactDOM.createRoot(document.getElementById('root'));

const path = window.location.pathname;

root.render(
  <React.StrictMode>
    {path === '/' ? <LandingPage /> :
     path === '/shopkeeper' ? <App /> :
     path === '/customer' ? <CustomerMain /> :
     path === '/delivery' ? <DeliveryMain /> :
     path === '/admin' ? <AdminMain /> :
     <LandingPage />}
  </React.StrictMode>
);