import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Coins, 
  ShoppingBag, 
  Store, 
  FileSignature, 
  Megaphone, 
  Boxes, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './CoreModules.css';

gsap.registerPlugin(ScrollTrigger);

const CoreModules = () => {
  const { t } = useAppContext();
  const sectionRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance
      gsap.fromTo('.modules-header',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.modules-header',
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );

      // Staggered grid card entrance
      gsap.fromTo('.module-card',
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );

      // Subtle slow floating orbs in background
      gsap.to('.module-bg-orb-1', {
        x: '30px',
        y: '-30px',
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      gsap.to('.module-bg-orb-2', {
        x: '-25px',
        y: '25px',
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleCardClick = (targetAppId) => {
    // Dispatch the custom event to update AppSelector's active state
    if (targetAppId) {
      const event = new CustomEvent('select-bithinks-app', { detail: targetAppId });
      window.dispatchEvent(event);
    }
    
    // Smooth scroll to the AppSelector section immediately below
    const targetSection = document.getElementById('app-selector');
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Fetch translation blocks gracefully, fallback to beautiful Indonesian defaults
  const m = t.features?.coreModules || {
    title: "Modul Inti Bithinks OS",
    subtitle: "Layanan ERP modular yang terintegrasi secara dinamis untuk mengelola segala aspek operasional bisnis Anda.",
    hrmTitle: "HRM",
    hrmDesc: "Manajemen Karyawan, Gaji & Absensi",
    wmsTitle: "Warehouse Management System",
    wmsDesc: "Kontrol Stok Multi-gudang & Inventori",
    omsTitle: "Order Management System",
    omsDesc: "Otomasi Siklus Pesanan & Lacak Resi",
    financeTitle: "Finance",
    financeDesc: "Analisis Arus Kas, Billing & Profit",
    marketplaceTitle: "Integrasi Marketplace",
    marketplaceDesc: "Sinkronisasi Otomatis Toko Online & E-commerce",
    storeTitle: "Manajemen Toko",
    storeDesc: "Kelola Cabang Retail & Gerai Fisik",
    procurementTitle: "Manajemen Pengadaan",
    procurementDesc: "Pembelian Supplier, PO & Supplier Hub",
    promoTitle: "Manajemen Promosi",
    promoDesc: "Diskon Otomatis, Voucher & Promo Konten",
    productTitle: "Master Produk",
    productDesc: "Katalog Produk Tunggal & Varian SKU",
    analyticsTitle: "Analitik Penjualan",
    analyticsDesc: "Visualisasi Laporan Penjualan & Performa Toko"
  };

  const modulesData = [
    {
      title: m.hrmTitle,
      desc: m.hrmDesc,
      icon: <Users size={28} />,
      color: '#10B981', // Emerald
      glowColor: 'rgba(16, 185, 129, 0.12)',
      targetAppId: 'bitteam'
    },
    {
      title: m.wmsTitle,
      desc: m.wmsDesc,
      icon: <Package size={28} />,
      color: '#0066FF', // Blue
      glowColor: 'rgba(0, 102, 255, 0.12)',
      targetAppId: 'bitone'
    },
    {
      title: m.omsTitle,
      desc: m.omsDesc,
      icon: <ShoppingCart size={28} />,
      color: '#8B5CF6', // Purple
      glowColor: 'rgba(139, 92, 246, 0.12)',
      targetAppId: 'bitomni'
    },
    {
      title: m.financeTitle,
      desc: m.financeDesc,
      icon: <Coins size={28} />,
      color: '#3B82F6', // Ocean
      glowColor: 'rgba(59, 130, 246, 0.12)',
      targetAppId: 'bitfine'
    },
    {
      title: m.marketplaceTitle,
      desc: m.marketplaceDesc,
      icon: <ShoppingBag size={28} />,
      color: '#FF6B00', // Orange
      glowColor: 'rgba(255, 107, 0, 0.12)',
      targetAppId: 'bitomni'
    },
    {
      title: m.storeTitle,
      desc: m.storeDesc,
      icon: <Store size={28} />,
      color: '#EC4899', // Pink
      glowColor: 'rgba(236, 72, 153, 0.12)',
      targetAppId: 'bitpos'
    },
    {
      title: m.procurementTitle,
      desc: m.procurementDesc,
      icon: <FileSignature size={28} />,
      color: '#F59E0B', // Gold
      glowColor: 'rgba(245, 158, 11, 0.12)',
      targetAppId: 'bitone'
    },
    {
      title: m.promoTitle,
      desc: m.promoDesc,
      icon: <Megaphone size={28} />,
      color: '#EF4444', // Red
      glowColor: 'rgba(239, 68, 68, 0.12)',
      targetAppId: 'bitomni'
    },
    {
      title: m.productTitle,
      desc: m.productDesc,
      icon: <Boxes size={28} />,
      color: '#06B6D4', // Teal Cyan
      glowColor: 'rgba(6, 182, 212, 0.12)',
      targetAppId: 'bitone'
    },
    {
      title: m.analyticsTitle,
      desc: m.analyticsDesc,
      icon: <TrendingUp size={28} />,
      color: '#10B981', // Mint Green
      glowColor: 'rgba(16, 185, 129, 0.12)',
      targetAppId: 'bitfine'
    },
  ];

  return (
    <section className="core-modules-section" id="modules" ref={sectionRef}>
      {/* High-end floating ambient blurred orbs */}
      <div className="module-bg-orb-1"></div>
      <div className="module-bg-orb-2"></div>
      
      <div className="container">
        <div className="modules-header">
          <span className="modules-pretitle">BITHINKS OS INTERFACE</span>
          <h2 className="modules-title">{m.title}</h2>
          <p className="modules-subtitle">{m.subtitle}</p>
        </div>

        <div className="modules-grid" ref={gridRef}>
          {modulesData.map((item, idx) => (
            <div 
              className="module-card" 
              key={idx}
              onClick={() => handleCardClick(item.targetAppId)}
              style={{
                '--hover-color': item.color,
                '--hover-glow': item.glowColor
              }}
            >
              {/* Card Ambient Glow Spot */}
              <div className="card-glow-spot"></div>

              {/* Glowing Icon Wrapper */}
              <div 
                className="module-icon-wrapper" 
                style={{ 
                  color: item.color, 
                  backgroundColor: `${item.color}0A`,
                  borderColor: `${item.color}25`
                }}
              >
                {item.icon}
              </div>

              {/* Card Main Info */}
              <div className="module-info">
                <h4 className="module-card-title">{item.title}</h4>
                <p className="module-card-desc">{item.desc}</p>
              </div>

              {/* Micro-Interaction Indicator at Bottom Right */}
              <div className="module-explore-btn" style={{ color: item.color }}>
                <span className="explore-text">Eksplor</span>
                <ArrowRight size={14} className="explore-arrow" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreModules;
