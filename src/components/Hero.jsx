import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './Hero.css';
import { ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import heroImage from '../assets/hero-image.jpg';

const Hero = () => {
  const contentRef = useRef(null);
  const { t } = useAppContext();

  useEffect(() => {
    // Initial entrance animation
    const ctx = gsap.context(() => {
      gsap.from('.hero-bg-image', { scale: 1.05, opacity: 0, duration: 1.5, ease: 'power3.out' });
      gsap.from('.hero-badge', { y: -20, opacity: 0, duration: 0.8, delay: 0.3, ease: 'power3.out' });
      gsap.from('.hero-title', { y: 40, opacity: 0, duration: 1, delay: 0.5, ease: 'power3.out' });
      gsap.from('.hero-desc', { y: 20, opacity: 0, duration: 1, delay: 0.7, ease: 'power3.out' });
      gsap.from('.hero-actions', { y: 20, opacity: 0, duration: 1, delay: 0.8, ease: 'power3.out' });
    }, contentRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero-section" ref={contentRef}>
      <div className="hero-bg-accent"></div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className="hero-content-split">
          {/* Left Side: Text */}
          <div className="hero-text-side">
            <div className="hero-badge">{t.hero.badge}</div>
            <h1 className="hero-title">
              {t.hero.title1} <br />
              <span>{t.hero.titleHighlight}</span>
            </h1>
            <p className="hero-desc">
              {t.hero.desc}
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => window.location.href='/login'}>
                {t.hero.loginBtn} <ArrowRight size={20} style={{ marginLeft: '8px' }} />
              </button>
              <button className="btn btn-outline" onClick={() => window.location.href='/register'}>
                {t.navbar.register}
              </button>
            </div>
          </div>
          
          {/* Right Side: Image */}
          <div className="hero-image-side">
            <div className="hero-image-wrapper">
              <div className="hero-blob-bg"></div>
              <img src={heroImage} alt="Bithinks Dashboard" className="hero-main-img" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
