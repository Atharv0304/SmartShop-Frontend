import axios from 'axios';

const api = axios.create({
  baseURL: 'https://smartshop-backend-64zl.onrender.com'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || 
                localStorage.getItem('customerToken') || 
                localStorage.getItem('deliveryToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear all auth data if token is invalid or user is deleted
      localStorage.clear();
      window.location.reload(); // Force reload to show the login screen
    }
    return Promise.reject(error);
  }
);

export default api;