import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Code, MessageCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './CustomServices.css';

gsap.registerPlugin(ScrollTrigger);

const CustomServices = () => {
  const { t } = useAppContext();

  useEffect(() => {
    gsap.fromTo('.custom-services-content',
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.custom-services-section',
          start: 'top 80%',
        }
      }
    );
  }, []);

  return (
    <section className="custom-services-section">
      <div className="container">
        <div className="custom-services-card custom-services-content">
          <div className="custom-services-icon">
            <Code size={40} color="#1D4ED8" />
          </div>
          <span className="custom-services-pretitle">{t.customServices.pretitle}</span>
          <h2 className="custom-services-title">{t.customServices.title}</h2>
          <p className="custom-services-desc">
            {t.customServices.desc}
          </p>
          <a href="https://wa.me/6287823439210?text=Halo%20Bithinks,%20saya%20tertarik%20dengan%20layanan%20pembuatan%20aplikasi%20custom" target="_blank" rel="noopener noreferrer" className="custom-services-btn">
            <MessageCircle size={20} />
            {t.customServices.btn}
          </a>
        </div>
      </div>
    </section>
  );
};

export default CustomServices;
