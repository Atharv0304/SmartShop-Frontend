import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ProductList = ({ shopkeeper }) => {
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    if (shopkeeper?.email) fetchProducts();
  }, [shopkeeper]);

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/api/products/shopkeeper/${shopkeeper.email}`);
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/api/products/delete/${id}`);
        fetchProducts();
      } catch (err) {
        console.error('Error deleting product');
      }
    }
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/api/products/update/${editProduct.id}`, editProduct);
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Error updating product');
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
    if (diffDays <= 7) return { label: `${diffDays}d left`, color: 'bg-orange-100 text-orange-700' };
    if (diffDays <= 30) return { label: `${diffDays}d left`, color: 'bg-yellow-100 text-yellow-700' };
    return { label: `${diffDays}d left`, color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-700">📦 Product Inventory</h2>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            Total: {products.length} products
          </span>
        </div>

        <div className="flex gap-4 mb-4 text-xs">
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded">Expired</span>
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">Within 7 days</span>
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Within 30 days</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Good</span>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Barcode</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Expiry</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Qty</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">No products found!</td>
                </tr>
              ) : (
                products.map((p, index) => {
                  const status = getExpiryStatus(p.expiryDate);
                  return (
                    <tr key={p.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.barcode || '-'}</td>
                      <td className="px-4 py-3 capitalize text-gray-600">{p.category}</td>
                      <td className="px-4 py-3 text-gray-600">{p.expiryDate}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.quantity}</td>
                      <td className="px-4 py-3 text-gray-600">₹{p.price}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => setEditProduct({...p})}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium">
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium">
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-green-700 mb-4">✏️ Edit Product</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                <input type="text" value={editProduct.name}
                  onChange={e => setEditProduct({...editProduct, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Barcode</label>
                <input type="text" value={editProduct.barcode}
                  onChange={e => setEditProduct({...editProduct, barcode: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select value={editProduct.category}
                  onChange={e => setEditProduct({...editProduct, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm bg-white">
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
                <input type="date" value={editProduct.expiryDate}
                  onChange={e => setEditProduct({...editProduct, expiryDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                  <input type="number" value={editProduct.quantity}
                    onChange={e => setEditProduct({...editProduct, quantity: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" value={editProduct.price}
                    onChange={e => setEditProduct({...editProduct, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleEditSave}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition">
                💾 Save Changes
              </button>
              <button onClick={() => setEditProduct(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded-lg transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;