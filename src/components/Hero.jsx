import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './Hero.css';
import { ArrowRight } from 'lucide-react';
import heroImage from '../assets/hero_bithinks_new.png';

const Hero = () => {
  const contentRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Entrance animation for the main title
      gsap.fromTo('.hero-left-title', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.1, ease: 'power4.out' }
      );

      // 2. Entrance animation for the description text
      gsap.fromTo('.hero-left-desc', 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.25, ease: 'power3.out' }
      );

      // 3. Entrance for the primary blue button
      gsap.fromTo('.btn-pill-cta', 
        { y: 15, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.4, ease: 'power3.out' }
      );

      // 4. Smooth floating entrance for the main illustration
      gsap.fromTo('.hero-main-illustration', 
        { scale: 0.92, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 1.4, delay: 0.3, ease: 'power4.out' }
      );
    }, contentRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero-section" ref={contentRef}>
      <div className="hero-bg-accent"></div>

      <div className="container">
        <div className="hero-content-split">
          
          {/* Left Column: Text and Actions */}
          <div className="hero-left-side">
            <h1 className="hero-left-title">
              Jalankan Bisnis Anda dalam <br />
              <span className="highlight-text">Satu Ekosistem Terintegrasi</span>
            </h1>
            
            <p className="hero-left-desc">
              Bithinks membantu UMKM naik level, mengelola operasional, penjualan, gudang, keuangan, hingga tim dalam satu sistem yang terintegrasi yang scalabel.
            </p>
            
            <div className="hero-left-actions">
              <button className="btn btn-pill-cta" onClick={() => document.getElementById('app-selector')?.scrollIntoView({ behavior: 'smooth' })}>
                <span className="btn-text">Pelajari Lebih Lanjut</span>
                <span className="btn-icon-circle">
                  <ArrowRight size={18} />
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: High-Quality 3D Illustration */}
          <div className="hero-right-side">
            <div className="illustration-wrapper">
              {/* Soft morphing background blob to ground the illustration */}
              <div className="illustration-bg-blob"></div>
              
              <img src={heroImage} alt="Bithinks Ecosystem Overview" className="hero-main-illustration" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;






