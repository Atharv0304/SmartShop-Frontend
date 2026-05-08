import React from 'react';
import { UserPlus, Store, Rocket } from 'lucide-react';

const steps = [
  {
    icon: <UserPlus className="w-8 h-8 text-white" />,
    title: 'Choose Your Role',
    description: 'Whether you are a Shopkeeper, Customer, or Delivery Partner, select the app that fits your needs.',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    icon: <Store className="w-8 h-8 text-white" />,
    title: 'Register & Setup',
    description: 'Quickly create your account. Shopkeepers can add inventory, and customers can add their location.',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    icon: <Rocket className="w-8 h-8 text-white" />,
    title: 'Start Using Platform',
    description: 'Experience seamless ordering, real-time tracking, and lightning-fast deliveries instantly.',
    color: 'from-rose-400 to-orange-500'
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50 relative border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-emerald-600 font-bold tracking-wide uppercase text-sm mb-3">Simple Process</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">How SmartStore Works</h3>
          <p className="text-gray-600 text-lg">
            Get up and running in minutes. Our platform is designed to be intuitive for everyone.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-gray-200 via-emerald-200 to-gray-200 z-0"></div>

          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-tr ${step.color} p-1 shadow-lg shadow-gray-200 mb-8 transform group-hover:-translate-y-2 group-hover:rotate-3 transition-all duration-300`}>
                  <div className="w-full h-full bg-white/20 backdrop-blur-sm rounded-[22px] flex items-center justify-center border border-white/30">
                    {step.icon}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    {index + 1}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3 mt-2">{step.title}</h4>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
