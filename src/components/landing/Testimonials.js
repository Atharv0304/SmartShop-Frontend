import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Emily Chen',
    role: 'Shop Owner',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    content: 'SmartStore revolutionized how I run my grocery shop. Inventory tracking is effortless, and the delivery network helps me reach more customers.',
  },
  {
    name: 'Michael Rodriguez',
    role: 'Delivery Partner',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
    content: 'The app is incredibly easy to use. The optimized routing saves me time, and the OTP verification ensures I always hand it to the right person.',
  },
  {
    name: 'Sarah Williams',
    role: 'Customer',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
    content: 'I love how fast I get my orders. The live tracking feature is super accurate, and the UI feels just as premium as any big tech app.',
  }
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-emerald-600 font-bold tracking-wide uppercase text-sm mb-3">Wall of Love</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Trusted by Thousands</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 text-lg mb-8 italic">"{testimonial.content}"</p>
              
              <div className="flex items-center gap-4">
                <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
