import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAppContext } from '../context/AppContext';
import { navigateTo } from '../utils/navigation';
import './AppSelector.css';

// Import logos dynamically from source assets (using the newly provided background-removed versions!)
import bitOneLogo from '../assets/logo_pilihan_fitur/bitone_logo-removebg-preview.png';
import bitOmniLogo from '../assets/logo_pilihan_fitur/bithinks_omnichannel_logo-removebg-preview.png';
import bitFineLogo from '../assets/logo_pilihan_fitur/bit_finance_logo-removebg-preview.png';
import bitPosLogo from '../assets/logo_pilihan_fitur/bithinks_pos_logo_v2-removebg-preview.png';
import bitTeamLogo from '../assets/logo_pilihan_fitur/bithinks_hrm_logo-removebg-preview.png';
import bitDevLogo from '../assets/logo_pilihan_fitur/bithinks_dev_logo-removebg-preview.png';

// Import Shopee and TikTok logos for the Omnichannel mockup representation
import shopeeLogo from '../assets/logo_pilihan_fitur/shopee.png';
import tiktokLogo from '../assets/logo_pilihan_fitur/logo_tiktok.jpg';

// Import high-fidelity representative mockups from user-provided assets
import bitOneMockup from '../assets/logo_pilihan_fitur/bitone_mockup.png';
import financeMockup from '../assets/logo_pilihan_fitur/finance_mockup.png';
import posMockup from '../assets/logo_pilihan_fitur/pos_mockup.png';
import hrmMockup from '../assets/logo_pilihan_fitur/hrm_mockup.png';

gsap.registerPlugin(ScrollTrigger);

const AppSelector = () => {
  const { t } = useAppContext();
  const [activeCard, setActiveCard] = useState('bitone');
  const containerRef = useRef(null);
  const cardsWrapperRef = useRef(null);

  useEffect(() => {
    const handleSelectApp = (e) => {
      if (e.detail) {
        setActiveCard(e.detail);
      }
    };
    window.addEventListener('select-bithinks-app', handleSelectApp);
    return () => window.removeEventListener('select-bithinks-app', handleSelectApp);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title reveal
      gsap.fromTo('.app-selector-title',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.app-selector-title',
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );

      // Card row box entrance
      gsap.fromTo('.app-selector-card',
        { opacity: 0, scale: 0.98, y: 40 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.app-selector-card',
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );

      // Staggered cards reveal
      gsap.fromTo('.selector-item-card',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardsWrapperRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Fetch translation strings or default to exact Indonesian reference text
  const sectionTitle = t.features?.appSelector?.title || "Pilih Satu Aplikasi Sesuai Bisnismu";

  const cardsData = [
    {
      id: 'bitone',
      title: "Bithinks One [BitOne]",
      logo: bitOneLogo,
      badgeText: "BitOne",
      badgeColor: '#0066FF',
      glowColor: 'rgba(0, 102, 255, 0.08)',
      desc: "Kelola semua divisi hanya dengan 1 aplikasi.",
      mockupType: 'erp'
    },
    {
      id: 'bitomni',
      title: "Bithinks Omnichannel [BitOmni]",
      logo: bitOmniLogo,
      badgeText: "BitOmni",
      badgeColor: '#FF6B00',
      glowColor: 'rgba(255, 107, 0, 0.08)',
      desc: "Kelola stok & pesanan di semua marketplace terintegrasi.",
      mockupType: 'omni'
    },
    {
      id: 'bitfine',
      title: "Bithinks Finance [BitFine]",
      logo: bitFineLogo,
      badgeText: "BitFine",
      badgeColor: '#3B82F6',
      glowColor: 'rgba(59, 130, 246, 0.08)',
      desc: "Laporan keuangan terintegrasi langsung dari semua channel penjualan.",
      mockupType: 'finance'
    },
    {
      id: 'bitpos',
      title: "Bithinks POS [BitPos]",
      logo: bitPosLogo,
      badgeText: "BitPos",
      badgeColor: '#EC4899',
      glowColor: 'rgba(236, 72, 153, 0.08)',
      desc: "Manajemen Penjualan Offline secara akurat.",
      mockupType: 'pos'
    },
    {
      id: 'bitteam',
      title: "Bithinks Team [BitTeam]",
      logo: bitTeamLogo,
      badgeText: "BitTeam",
      badgeColor: '#10B981',
      glowColor: 'rgba(16, 185, 129, 0.08)',
      desc: "Manajemen Data Karyawan, Absensi, dan Penggajian.",
      mockupType: 'team'
    },
    {
      id: 'bitdev',
      title: "Bithinks Customize [BitDev]",
      logo: bitDevLogo,
      badgeText: "BitDev",
      badgeColor: '#4B5563',
      glowColor: 'rgba(75, 85, 99, 0.08)',
      desc: "Buat aplikasi sesukamu sesuai Bisnismu.",
      mockupType: 'custom'
    },
  ];

  return (
    <section className="app-selector-section" id="app-selector" ref={containerRef}>
      <div className="container">
        <h2 className="app-selector-title">{sectionTitle}</h2>
        
        {/* Main Canvas Card box wrapping 3-column selector grid */}
        <div className="app-selector-card">
          <div className="selector-bg-radial"></div>

          <div className="selector-cards-row" ref={cardsWrapperRef}>
            {cardsData.map((card) => {
              const isActive = activeCard === card.id;
              return (
                <div
                  key={card.id}
                  className={`selector-item-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (isActive) {
                      navigateTo('/' + card.id);
                    } else {
                      setActiveCard(card.id);
                    }
                  }}
                  style={{
                    '--card-theme': card.badgeColor,
                    '--card-glow': card.glowColor
                  }}
                >
                  {/* Top-Left Brand Logo Badge (Komerce style, in the very top-left corner of each card) */}
                  <div className="card-logo-badge">
                    <img 
                      src={card.logo} 
                      alt={card.title} 
                      className="selector-logo-img" 
                    />
                  </div>

                  {/* Upper Mockup Area (Highly informative & prominent) */}
                  <div className="card-mockup-box">
                    {/* Sleek Technical Grid Backdrop for all mockups */}
                    <div className="mockup-bg-shapes">
                      <div className="ske-grid-backdrop"></div>
                    </div>

                    {/* Bithinks One (ERP/All-in-One Dashboard Mockup) */}
                    {card.mockupType === 'erp' && (
                      <img src={bitOneMockup} alt="Bithinks One Mockup" className="mockup-png-img active-mockup" />
                    )}

                    {/* Bithinks Finance (Financial Growth & Bar Charts Mockup) */}
                    {card.mockupType === 'finance' && (
                      <img src={financeMockup} alt="Bithinks Finance Mockup" className="mockup-png-img active-mockup" />
                    )}

                    {/* Bithinks POS (Cashier POS System Mockup) */}
                    {card.mockupType === 'pos' && (
                      <img src={posMockup} alt="Bithinks POS Mockup" className="mockup-png-img active-mockup" />
                    )}

                    {/* Bithinks Team (HRM / Team Directory Mockup) */}
                    {card.mockupType === 'team' && (
                      <img src={hrmMockup} alt="Bithinks Team Mockup" className="mockup-png-img active-mockup" />
                    )}

                    {/* Bithinks Customize (Modular IDE Editor Mockup) */}
                    {card.mockupType === 'custom' && (
                      <div className="mock-custom-skeleton active-mockup">
                        {/* IDE Window */}
                        <div className="dev-editor">
                          <div className="editor-header">
                            <div className="header-dot red"></div>
                            <div className="header-dot yellow"></div>
                            <div className="header-dot green"></div>
                          </div>
                          <div className="editor-code">
                            <div className="code-line keyword" style={{ width: '50%' }}></div>
                            <div className="code-line function" style={{ width: '75%' }}></div>
                            <div className="code-line string" style={{ width: '60%' }}></div>
                          </div>
                        </div>

                        {/* Drag and Drop Visual Modular Blocks */}
                        <div className="dev-block block-orange">
                          <span className="block-label">Custom API</span>
                        </div>
                        <div className="dev-block block-blue">
                          <span className="block-label">Database</span>
                        </div>
                      </div>
                    )}

                    {/* Dedicated Omnichannel Mockup Layer with Full Opacity for Marketplace Representation */}
                    {card.mockupType === 'omni' && (
                      <div className="mock-omni-skeleton animate-omni">
                        {/* Floating Shopee Badge on the left side */}
                        <div className="ske-omni-badge shopee-badge">
                          <img src={shopeeLogo} alt="Shopee" className="ske-omni-logo" />
                        </div>
                        
                        {/* Data flow stream line left */}
                        <div className="ske-omni-flow flow-left">
                          <div className="flow-dot"></div>
                        </div>

                        {/* Central Synchronized Chamber */}
                        <div className="omni-sync-core">
                          <div className="omni-sync-ring"></div>
                          <div className="omni-sync-box">Sync</div>
                        </div>
                        
                        {/* Data flow stream line right */}
                        <div className="ske-omni-flow flow-right">
                          <div className="flow-dot delay"></div>
                        </div>
                        
                        {/* Floating TikTok Badge on the right side */}
                        <div className="ske-omni-badge tiktok-badge">
                          <img src={tiktokLogo} alt="TikTok" className="ske-omni-logo" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Title (Left-aligned & bold) */}
                  <h4 className="selector-card-title">{card.title}</h4>

                  {/* Small decorative indicator */}
                  <div className="selector-indicator-line"></div>

                  {/* Card Description (Left-aligned & descriptive) */}
                  <p className="selector-card-desc">{card.desc}</p>

                  {/* CTA button (visible on active card) */}
                  <button 
                    className="selector-cta-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('/' + card.id);
                    }}
                  >
                    Pelajari Selengkapnya <span>→</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppSelector;
