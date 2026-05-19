import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import SupportedBy from '../components/SupportedBy';
import Features from '../components/Features';
import Footer from '../components/Footer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import FloatingWhatsApp from '../components/FloatingWhatsApp';

gsap.registerPlugin(ScrollTrigger);

function Home() {
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    <div className="app-container">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <SupportedBy />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

export default Home;
