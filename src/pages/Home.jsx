import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import SupportedBy from '../components/SupportedBy';
import Features from '../components/Features';
import CustomServices from '../components/CustomServices';
import Footer from '../components/Footer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
        <CustomServices />
        <SupportedBy />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
