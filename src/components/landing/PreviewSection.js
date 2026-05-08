import React from 'react';
import { ShoppingCart, CheckCircle, Clock } from 'lucide-react';

const PreviewSection = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-teal-50 rounded-3xl transform -rotate-3 scale-105"></div>
            
            <div className="relative bg-white rounded-3xl shadow-xl shadow-gray-200 border border-gray-100 p-6 md:p-8 transform hover:scale-[1.02] transition-transform duration-500">
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Recent Orders</h4>
                  <p className="text-sm text-gray-500">Real-time updates</p>
                </div>
                <button className="text-emerald-600 text-sm font-bold bg-emerald-50 px-4 py-2 rounded-lg">View All</button>
              </div>

              <div className="space-y-4">
                {[
                  { id: '#4021', user: 'Sarah M.', status: 'Delivered', time: '2 mins ago', icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
                  { id: '#4022', user: 'John D.', status: 'On the way', time: '15 mins ago', icon: <Clock className="w-5 h-5 text-amber-500" /> },
                  { id: '#4023', user: 'Alex K.', status: 'Processing', time: '1 hour ago', icon: <ShoppingCart className="w-5 h-5 text-blue-500" /> }
                ].map((order, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {order.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{order.id} - {order.user}</p>
                        <p className="text-xs text-gray-500">{order.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                      order.status === 'On the way' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-emerald-600 font-bold tracking-wide uppercase text-sm mb-3">Interactive Dashboard</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Manage everything in one place</h3>
            <p className="text-lg text-gray-600 mb-8">
              Our professional-grade dashboard gives you complete visibility into your operations. Monitor orders, assign deliveries, and track revenue seamlessly.
            </p>
            
            <ul className="space-y-4 mb-10 text-left max-w-md mx-auto lg:mx-0">
              {['Real-time order synchronization', 'Automated delivery partner matching', 'Comprehensive analytics and reporting'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-700">
                  <div className="bg-emerald-100 p-1 rounded-full">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <a href="/shopkeeper" className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:-translate-y-1 w-full sm:w-auto inline-block text-center">
              Explore Dashboard
            </a>
          </div>

        </div>

      </div>
    </section>
  );
};

export default PreviewSection;
