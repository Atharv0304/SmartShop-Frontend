import React from 'react';
import { Package, Zap, ShieldCheck, MapPin } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    iconBg: 'bg-amber-100',
    title: 'Lightning Fast Delivery',
    description: 'Real-time routing and smart assignments ensure orders reach customers in record time.'
  },
  {
    icon: <Package className="w-6 h-6 text-emerald-500" />,
    iconBg: 'bg-emerald-100',
    title: 'Smart Inventory',
    description: 'Keep track of your products effortlessly with our intuitive management dashboard.'
  },
  {
    icon: <MapPin className="w-6 h-6 text-indigo-500" />,
    iconBg: 'bg-indigo-100',
    title: 'Live Tracking',
    description: 'Customers and shopkeepers can track deliveries in real-time with map integration.'
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-rose-500" />,
    iconBg: 'bg-rose-100',
    title: 'Secure OTP Verification',
    description: 'Ensure deliveries go to the right person with our robust 4-digit OTP system.'
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-emerald-600 font-bold tracking-wide uppercase text-sm mb-3">Powerful Features</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Everything you need to scale</h3>
          <p className="text-gray-600 text-lg">
            SmartStore provides a complete ecosystem for local commerce. Manage orders, track deliveries, and satisfy customers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
