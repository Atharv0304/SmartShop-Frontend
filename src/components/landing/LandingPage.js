import React, { useEffect } from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import HowItWorks from './HowItWorks';
import PreviewSection from './PreviewSection';
import Testimonials from './Testimonials';
import Footer from './Footer';

const LandingPage = () => {
  // Add smooth scrolling behavior for anchors
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <PreviewSection />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default LandingPage;
