import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xl font-extrabold tracking-tight ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`}>
              Smart<span className="text-emerald-600">Store</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">How it Works</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">Testimonials</a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <a href="/shopkeeper" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors px-3 py-2">
              Shopkeeper
            </a>
            <a href="/delivery" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors px-3 py-2">
              Delivery Partner
            </a>
            <a href="/customer" className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Start Shopping
            </a>
          </div>

          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl py-4 px-6 flex flex-col space-y-4">
          <a href="#features" className="text-base font-medium text-gray-600">Features</a>
          <a href="#how-it-works" className="text-base font-medium text-gray-600">How it Works</a>
          <a href="#testimonials" className="text-base font-medium text-gray-600">Testimonials</a>
          <div className="h-px bg-gray-100 my-2"></div>
          <a href="/shopkeeper" className="text-left text-base font-medium text-gray-700 py-2">Shopkeeper Login</a>
          <a href="/delivery" className="text-left text-base font-medium text-gray-700 py-2">Delivery Partner</a>
          <a href="/customer" className="bg-emerald-600 text-white text-base font-medium px-5 py-3 rounded-xl text-center">Start Shopping</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
