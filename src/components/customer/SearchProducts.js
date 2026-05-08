import React, { useState } from 'react';
import api from '../../utils/api';

const SearchProducts = ({ addToCart }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/products/search?query=${query}`);
      setResults(res.data);
      setSearched(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const today = new Date();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🔍 Search Products</h2>
          <p className="text-gray-500 text-sm mt-1">Find products available across all shops</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for milk, bread, chips..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-sm" />
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-sm">
            {loading ? '⏳' : '🔍 Search'}
          </button>
        </form>

        {!searched && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Popular searches:</p>
            <div className="flex gap-2 flex-wrap">
              {['Milk', 'Bread', 'Chips', 'Rice', 'Sugar', 'Oil'].map(item => (
                <button key={item} onClick={() => setQuery(item)}
                  className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm hover:bg-blue-100 transition">
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {searched && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Found <span className="font-bold text-blue-600">{results.length}</span> results for
                <span className="font-bold"> "{query}"</span>
              </p>
              {results.length > 0 && (
                <button onClick={() => { setResults([]); setSearched(false); setQuery(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600">
                  Clear results
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow">
                <p className="text-4xl mb-3">😕</p>
                <p className="text-gray-500 font-medium">No products found for "{query}"</p>
                <p className="text-gray-400 text-sm mt-1">Try searching with a different name</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.map(p => {
                  const diff = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
                  const isExpired = diff < 0;
                  return !isExpired ? (
                    <div key={p.id} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                      <div className="text-4xl text-center mb-2 bg-gray-50 py-3 rounded-lg">
                        {p.category === 'dairy' ? '🥛' :
                         p.category === 'food' ? '🍱' :
                         p.category === 'beverages' ? '🥤' :
                         p.category === 'snacks' ? '🍿' :
                         p.category === 'household' ? '🏠' : '📦'}
                      </div>
                      <p className="font-bold text-gray-800 text-center">{p.name}</p>
                      <p className="text-xs text-gray-500 text-center capitalize mb-3">{p.category}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-green-600 font-bold text-lg">₹{p.price}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          p.quantity === 0
                            ? 'bg-red-100 text-red-600'
                            : p.quantity <= 5
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-100 text-gray-400'}`}>
                          {p.quantity === 0 ? '❌ Out of Stock' : `Qty: ${p.quantity}`}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          diff <= 7 ? 'bg-orange-100 text-orange-700' :
                          diff <= 30 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'}`}>
                          {diff}d until expiry
                        </span>
                      </div>
                      <button
                        onClick={() => p.quantity > 0 && addToCart(p)}
                        disabled={p.quantity === 0}
                        className={`mt-3 w-full text-sm py-2 rounded-lg transition ${
                          p.quantity === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                        {p.quantity === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchProducts;