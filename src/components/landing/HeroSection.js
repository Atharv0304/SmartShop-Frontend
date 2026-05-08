import React from 'react';
import { ArrowRight, Play, ShoppingBag } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-gray-50 to-white"></div>
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-emerald-200/40 to-teal-100/40 blur-3xl opacity-50 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-6 shadow-sm animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Smart Delivery Platform v2.0
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1] animate-slide-up" style={{animationDelay: '100ms'}}>
              The modern way to <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                shop & deliver
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 animate-slide-up" style={{animationDelay: '200ms'}}>
              Connect seamlessly with local stores. Enjoy lightning-fast deliveries and effortless inventory management in one unified ecosystem.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-slide-up" style={{animationDelay: '300ms'}}>
              <a href="/customer" className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 hover:-translate-y-1 group">
                Start Exploring
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-800 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-md border border-gray-100 hover:-translate-y-1 group">
                <div className="bg-emerald-100 p-1 rounded-full text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                  <Play className="w-4 h-4 ml-0.5" />
                </div>
                See how it works
              </a>
            </div>
          </div>

          <div className="flex-1 w-full max-w-2xl lg:max-w-none relative animate-fade-in" style={{animationDelay: '400ms'}}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/10 border border-gray-200/50 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="absolute top-0 w-full h-10 bg-gray-100 flex items-center px-4 gap-2 border-b border-gray-200">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1661956602116-aa6865609028?q=80&w=2000&auto=format&fit=crop" 
                alt="App Dashboard Preview" 
                className="w-full h-auto object-cover mt-10 object-top min-h-[400px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent"></div>
            </div>
            
            {/* Floating UI Element */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-4 animate-float">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">New Order #421</p>
                <p className="text-xs text-emerald-600 font-medium">Delivered in 15 mins</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
