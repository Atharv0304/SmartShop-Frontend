import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AddProduct = ({ shopkeeper }) => {
  const [product, setProduct] = useState({
    name: '',
    barcode: '',
    category: '',
    expiryDate: '',
    quantity: '',
    price: ''
  });

  const [isRegistered, setIsRegistered] = useState(false);
  const [checking, setChecking] = useState(true);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productPayload = {
        ...product,
        shopkeeperEmail: shopkeeper.email
      };
      await api.post('/api/products/add', productPayload);
      setMessage('✅ Product added: ' + product.name);
      setError('');
      setProduct({
        name: '', barcode: '', category: '',
        expiryDate: '', quantity: '', price: ''
      });
    } catch (err) {
      setError('❌ Error adding product. Check if server is running.');
      setMessage('');
    }
  };

  useEffect(() => {
    api.get('/api/shops/all')
      .then(res => {
        const myShop = res.data.find(s => s.email === shopkeeper?.email);
        setIsRegistered(!!myShop);
        setChecking(false);
      })
      .catch(err => {
        console.error(err);
        setChecking(false);
      });
  }, [shopkeeper]);

  if (checking) {
    return <div className="text-center p-10 font-bold text-gray-500">⏳ Checking shop status...</div>;
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center border-t-4 border-red-500">
          <p className="text-5xl mb-4">🏪</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Shop Not Registered</h2>
          <p className="text-gray-500 text-sm mb-6">
            You must register your shop before you can start adding products to your inventory.
          </p>
          <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg">
            Go to the "My Shop" tab to register.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-green-100 p-3 rounded-full mr-3">🛒</div>
          <h2 className="text-2xl font-bold text-green-700">Add New Product</h2>
        </div>

        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 text-center font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
            <input type="text" name="name" value={product.name} onChange={handleChange}
              placeholder="Enter product name" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Barcode Number</label>
            <input type="text" name="barcode" value={product.barcode} onChange={handleChange}
              placeholder="Enter barcode number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select name="category" value={product.category} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm bg-white">
              <option value="">Select Category</option>
              <option value="food">Food</option>
              <option value="beverages">Beverages</option>
              <option value="snacks">Snacks</option>
              <option value="dairy">Dairy</option>
              <option value="household">Household</option>
              <option value="personal care">Personal Care</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
            <input type="date" name="expiryDate" value={product.expiryDate} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
              <input type="number" name="quantity" value={product.quantity} onChange={handleChange}
                placeholder="0" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
              <input type="number" name="price" value={product.price} onChange={handleChange}
                placeholder="0.00" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
            </div>
          </div>

          <button type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200 mt-2">
            + Add Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;