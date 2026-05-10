import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './Hero.css';
import { ArrowRight, BarChart2, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Hero = () => {
  const contentRef = useRef(null);
  const { t } = useAppContext();

  useEffect(() => {
    // Initial entrance animation
    const ctx = gsap.context(() => {
      gsap.from('.hero-badge', { y: -20, opacity: 0, duration: 0.8, ease: 'power3.out' });
      gsap.from('.hero-title', { y: 40, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out' });
      gsap.from('.hero-desc', { y: 20, opacity: 0, duration: 1, delay: 0.4, ease: 'power3.out' });
      gsap.from('.hero-actions', { y: 20, opacity: 0, duration: 1, delay: 0.5, ease: 'power3.out' });
      
      // Floating animation for decorative elements
      gsap.from('.float-1', {
        x: -50, opacity: 0, rotation: -25, duration: 1.5, delay: 0.6, ease: 'back.out(1.7)'
      });
      gsap.from('.float-2', {
        x: 50, opacity: 0, rotation: 25, duration: 1.5, delay: 0.8, ease: 'back.out(1.7)'
      });

      // Continuous floating
      gsap.to('.float-1', {
        y: '-=20', rotation: '-=5', duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut'
      });
      gsap.to('.float-2', {
        y: '+=20', rotation: '+=5', duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut'
      });
    }, contentRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero-section" ref={contentRef}>
      <div className="hero-bg-accent"></div>
      <div className="hero-bg-accent-2"></div>
      
      <div className="floating-element float-1">
        <Users size={48} color="var(--color-primary-dark)" />
      </div>
      <div className="floating-element float-2">
        <BarChart2 size={48} color="var(--color-primary-dark)" />
      </div>

      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">{t.hero.badge}</div>
          <h1 className="hero-title">
            {t.hero.title1} <br />
            <span>{t.hero.titleHighlight}</span>
          </h1>
          <p className="hero-desc">{t.hero.desc}</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => window.location.href='/login'}>
              {t.hero.loginBtn} <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </button>
            <button className="btn btn-outline" onClick={() => window.location.href='/register'}>
              {t.navbar.register}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
