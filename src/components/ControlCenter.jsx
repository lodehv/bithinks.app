import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Package, ShoppingBag, Globe, Receipt, Users, Coins, ShoppingCart } from 'lucide-react';
import './ControlCenter.css';

gsap.registerPlugin(ScrollTrigger);

const ControlCenter = () => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const containerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered entrance animation when the section enters the viewport
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        }
      });

      tl.fromTo('.control-center-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      )
      .fromTo(cardRef.current,
        { opacity: 0, scale: 0.97, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'power4.out' },
        '-=0.4'
      )
      .fromTo('.dashboard-column',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' },
        '-=0.5'
      )
      .fromTo('.pipeline-gutter',
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: 'power2.out' },
        '-=0.6'
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const leftNodes = [
    {
      id: 'marketplaces',
      title: 'Marketplaces',
      desc: 'Integrasi Pasar Digital Terbesar',
      details: 'Shopee, Tokopedia, Lazada, TikTok Shop',
      icon: <ShoppingBag size={22} />,
      triggerActiveFor: ['oms', 'wms', 'finance'],
    },
    {
      id: 'website',
      title: 'Website',
      desc: 'Toko Online Mandiri Terintegrasi',
      details: 'Shopify, WooCommerce, Custom Web',
      icon: <Globe size={22} />,
      triggerActiveFor: ['oms', 'wms', 'finance'],
    },
    {
      id: 'pos',
      title: 'Point of Sale (POS)',
      desc: 'Sistem Kasir Ritel & Toko Offline',
      details: 'Sinkronisasi transaksi offline instan',
      icon: <Receipt size={22} />,
      triggerActiveFor: ['wms', 'finance'],
    },
  ];

  const rightNodes = [
    {
      id: 'wms',
      title: 'Warehouse (WMS)',
      desc: 'Sistem Manajemen Gudang & Stok Terpusat',
      details: 'Sinkronisasi stok real-time antar channel',
      icon: <Package size={22} />,
      triggerActiveFor: ['marketplaces', 'website', 'pos'],
    },
    {
      id: 'oms',
      title: 'Orders (OMS)',
      desc: 'Otomasi Proses Pesanan Multi-channel',
      details: 'Status pelacakan & pesanan instan',
      icon: <ShoppingCart size={22} />,
      triggerActiveFor: ['marketplaces', 'website'],
    },
    {
      id: 'finance',
      title: 'Finance',
      desc: 'Pencatatan Keuangan & Arus Kas Real-time',
      details: 'Tagihan otomatis & analisis keuntungan',
      icon: <Coins size={22} />,
      triggerActiveFor: ['marketplaces', 'website', 'pos'],
    },
    {
      id: 'hr',
      title: 'HR',
      desc: 'Manajemen Karyawan & Otomasi Payroll',
      details: 'Absensi karyawan, shift, & gaji terotomasi',
      icon: <Users size={22} />,
      triggerActiveFor: ['pos'],
    },
  ];

  return (
    <section className="control-center-section" ref={containerRef}>
      <div className="container">
        <h2 className="control-center-title">Satu Pusat Kendali</h2>
        
        {/* Glassmorphic Canvas container */}
        <div className="control-center-card" ref={cardRef}>
          <div className="card-bg-gradient"></div>
          
          <div className="dashboard-grid">
            
            {/* COLUMN 1: SALES CHANNELS */}
            <div className="dashboard-column channels-column">
              <div className="column-header">
                <span className="column-badge">SALES CHANNELS</span>
                <h3 className="column-title">Sumber Penjualan</h3>
              </div>
              
              <div className="column-cards">
                {leftNodes.map((node) => {
                  const isActive = hoveredNode === node.id || (hoveredNode && node.triggerActiveFor?.includes(hoveredNode));
                  return (
                    <div
                      key={node.id}
                      className={`control-card card-left ${isActive ? 'active' : ''}`}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <div className="card-icon-box">{node.icon}</div>
                      <div className="card-info-box">
                        <span className="card-title-text">{node.title}</span>
                        <span className="card-desc-text">{node.desc}</span>
                        <span className="card-details-text">{node.details}</span>
                      </div>
                      <div className="card-status-pill">
                        <span className="status-dot"></span>
                        <span className="status-text">LIVE</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* PIPELINE LEFT GUTTER SVG */}
            <div className="pipeline-gutter left-pipeline">
              <svg className="pipeline-svg" viewBox="0 0 100 380" preserveAspectRatio="none">
                <defs>
                  <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* 3 lines from Left Cards to Center Hub */}
                {/* Hub center height is 190 */}
                {/* Left card heights: card1=55, card2=190, card3=325 */}
                {leftNodes.map((node, index) => {
                  const isActive = hoveredNode === node.id || 
                    (hoveredNode && node.triggerActiveFor?.includes(hoveredNode)) || 
                    hoveredNode === 'hub';
                  const startY = 55 + index * 135;
                  const endY = 190; // Hub center height
                  return (
                    <g key={`left-pipe-${node.id}`}>
                      {/* Base thin line */}
                      <path
                        d={`M 0 ${startY} C 50 ${startY}, 40 ${endY}, 100 ${endY}`}
                        stroke="#0066FF"
                        strokeWidth={isActive ? "2" : "1"}
                        fill="none"
                        opacity={isActive ? "0.8" : "0.15"}
                        className={isActive ? "active-laser-bg" : ""}
                      />
                      {/* Animated running pulse */}
                      {isActive && (
                        <path
                          d={`M 0 ${startY} C 50 ${startY}, 40 ${endY}, 100 ${endY}`}
                          stroke="#00C8FF"
                          strokeWidth="2.5"
                          fill="none"
                          className="active-running-laser"
                          filter="url(#glow-blue)"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* COLUMN 2: CENTRAL NEURAL CORE */}
            <div className="dashboard-column core-column">
              <div className="core-chamber">
                <div className="chamber-grid-bg"></div>
                <div 
                  className={`central-hub ${hoveredNode ? 'hub-active' : ''}`}
                  onMouseEnter={() => setHoveredNode('hub')}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <div className="hub-hexagon-bg"></div>
                  <div className="hub-content">
                    <span className="hub-brand">bithinks</span>
                    <span className="hub-tech">digital</span>
                    <span className="hub-core">teknologi</span>
                  </div>
                </div>
                <div className="chamber-energy-ring"></div>
                <div className="chamber-energy-ring outer-ring"></div>
              </div>
            </div>
            
            {/* PIPELINE RIGHT GUTTER SVG */}
            <div className="pipeline-gutter right-pipeline">
              <svg className="pipeline-svg" viewBox="0 0 100 380" preserveAspectRatio="none">
                {/* 4 lines from Center Hub to Right Cards */}
                {/* Hub center height is 190 */}
                {/* Right card heights: card1=32, card2=137, card3=242, card4=348 */}
                {rightNodes.map((node, index) => {
                  const isActive = hoveredNode === node.id || 
                    (hoveredNode && node.triggerActiveFor?.includes(hoveredNode)) || 
                    hoveredNode === 'hub';
                  const startY = 190; // Hub center height
                  const endY = 32 + index * 105;
                  return (
                    <g key={`right-pipe-${node.id}`}>
                      {/* Base thin line */}
                      <path
                        d={`M 0 ${startY} C 40 ${startY}, 50 ${endY}, 100 ${endY}`}
                        stroke="#0066FF"
                        strokeWidth={isActive ? "2" : "1"}
                        fill="none"
                        opacity={isActive ? "0.8" : "0.15"}
                        className={isActive ? "active-laser-bg" : ""}
                      />
                      {/* Animated running pulse */}
                      {isActive && (
                        <path
                          d={`M 0 ${startY} C 40 ${startY}, 50 ${endY}, 100 ${endY}`}
                          stroke="#00C8FF"
                          strokeWidth="2.5"
                          fill="none"
                          className="active-running-laser"
                          filter="url(#glow-blue)"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* COLUMN 3: BACK-OFFICE OPERATIONS */}
            <div className="dashboard-column ops-column">
              <div className="column-header">
                <span className="column-badge badge-orange">OPERATIONS</span>
                <h3 className="column-title">Proses & Operasional</h3>
              </div>
              
              <div className="column-cards">
                {rightNodes.map((node) => {
                  const isActive = hoveredNode === node.id || (hoveredNode && node.triggerActiveFor?.includes(hoveredNode));
                  return (
                    <div
                      key={node.id}
                      className={`control-card card-right ${isActive ? 'active' : ''}`}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <div className="card-icon-box orange-icon">{node.icon}</div>
                      <div className="card-info-box">
                        <span className="card-title-text">{node.title}</span>
                        <span className="card-desc-text">{node.desc}</span>
                        <span className="card-details-text">{node.details}</span>
                      </div>
                      <div className="card-status-pill">
                        <span className="status-dot"></span>
                        <span className="status-text">SYNCED</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default ControlCenter;
