import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Features.css';
import { ShoppingCart, Users, DollarSign, Package, CheckCircle2, Zap, Store } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

gsap.registerPlugin(ScrollTrigger);

const Features = () => {
  const containerRef = useRef(null);
  const { t } = useAppContext();

  const features = [
    {
      id: 'pos',
      module: 'Bithinks POS',
      logoIcon: <ShoppingCart color="#F59E0B" />, 
      title: t.features.posTitle,
      description: t.features.posDesc,
      buttonText: t.features.posBtn,
      buttonColor: '#F59E0B',
      tags: t.features.posTags,
      mockup: (
        <>
          <div className="mock-ui mock-base">
            <div className="skel-header">
              <div className="skel-avatar" style={{ background: '#FDE68A' }}></div>
              <div className="skel-title"></div>
            </div>
            <div className="skel-line"></div>
            <div className="skel-line short"></div>
            <div className="skel-line"></div>
          </div>
          <div className="mock-ui mock-float-1" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <CheckCircle2 color="#10B981" size={20} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Transaksi #INV-001 Sukses</span>
            </div>
            <div className="skel-line"></div>
          </div>
          <div className="mock-ui mock-float-2" style={{ padding: '16px', background: '#FEF3C7' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#D97706' }}>Total: Rp 2.500.000</span>
          </div>
        </>
      )
    },
    {
      id: 'hrm',
      module: 'Bithinks HRM',
      logoIcon: <Users color="#10B981" />,
      title: t.features.hrmTitle,
      description: t.features.hrmDesc,
      buttonText: t.features.hrmBtn,
      buttonColor: '#10B981',
      tags: t.features.hrmTags,
      mockup: (
        <>
          <div className="mock-ui mock-base">
            <div className="skel-header">
              <div className="skel-avatar"></div>
              <div className="skel-title" style={{ width: '60%' }}></div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: '#D1FAE5', borderRadius: '8px' }}></div>
              <div style={{ width: '40px', height: '40px', background: '#D1FAE5', borderRadius: '8px' }}></div>
            </div>
          </div>
          <div className="mock-ui mock-float-1" style={{ right: '5%', top: '30%' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Kehadiran Hari Ini: 98%</span>
            <div style={{ marginTop: '8px', height: '6px', background: '#10B981', width: '100%', borderRadius: '4px' }}></div>
          </div>
        </>
      )
    },
    {
      id: 'finance',
      module: 'Bithinks FINANCE',
      logoIcon: <DollarSign color="#3B82F6" />,
      title: t.features.financeTitle,
      description: t.features.financeDesc,
      buttonText: t.features.financeBtn,
      buttonColor: '#3B82F6',
      tags: t.features.financeTags,
      mockup: (
        <>
          <div className="mock-ui mock-base">
            <div className="skel-header">
              <h4 style={{ margin: 0 }}>Cashflow Chart</h4>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px', marginTop: '20px' }}>
              <div style={{ width: '15%', height: '40%', background: '#EFF6FF', borderRadius: '4px' }}></div>
              <div style={{ width: '15%', height: '70%', background: '#93C5FD', borderRadius: '4px' }}></div>
              <div style={{ width: '15%', height: '50%', background: '#EFF6FF', borderRadius: '4px' }}></div>
              <div style={{ width: '15%', height: '90%', background: '#3B82F6', borderRadius: '4px' }}></div>
            </div>
          </div>
          <div className="mock-ui mock-float-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Net Profit</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>+ 24%</span>
            </div>
            <h3 style={{ margin: '8px 0 0', fontSize: '1.5rem' }}>Rp 128M</h3>
          </div>
        </>
      )
    },
    {
      id: 'wms',
      module: 'Bithinks WMS',
      logoIcon: <Package color="#8B5CF6" />,
      title: t.features.wmsTitle,
      description: t.features.wmsDesc,
      buttonText: t.features.wmsBtn,
      buttonColor: '#8B5CF6',
      tags: t.features.wmsTags,
      mockup: (
        <>
           <div className="mock-ui mock-base">
            <div className="skel-header">
               <div className="skel-title" style={{ width: '30%' }}></div>
            </div>
            <div className="skel-line"></div>
            <div className="skel-line short"></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '16px' }}>
                <div style={{ height: '40px', background: '#EDE9FE', borderRadius: '8px' }}></div>
                <div style={{ height: '40px', background: '#EDE9FE', borderRadius: '8px' }}></div>
                <div style={{ height: '40px', background: '#C4B5FD', borderRadius: '8px' }}></div>
            </div>
          </div>
          <div className="mock-ui mock-float-1" style={{ top: '10%' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tugas Picking</span>
              <div style={{ marginTop: '8px', background: '#F3F4F6', padding: '8px', borderRadius: '8px', fontSize: '12px' }}>
                  Lokasi: Rak A-02-1<br/>
                  Qty: 5 Pcs
              </div>
          </div>
        </>
      )
    },
    {
      id: 'places',
      module: 'Bithinks Places',
      logoIcon: <Store color="#EC4899" />,
      title: t.features.placesTitle,
      description: t.features.placesDesc,
      buttonText: t.features.placesBtn,
      buttonColor: '#EC4899',
      tags: t.features.placesTags,
      mockup: (
        <>
          {/* Base card — daftar order */}
          <div className="mock-ui mock-base">
            <div className="skel-header">
              <div className="skel-avatar" style={{ background: '#FCE7F3' }}></div>
              <div className="skel-title" style={{ width: '50%' }}></div>
            </div>
            {/* Marketplace logo row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {/* Shopee */}
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EE4D2D', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(238,77,45,0.3)', flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" width="22" height="22" fill="none"><path d="M50 18C43.4 18 38 23.1 38 29.4c0 1.2.2 2.4.5 3.5H28.5C26 32.9 24 34.8 24 37.2l3.2 36.2C27.5 75.8 29.3 77 31.3 77h37.4c2 0 3.8-1.2 4.1-3.6L76 37.2c0-2.4-2-4.3-4.5-4.3H61.5c.3-1.1.5-2.3.5-3.5C62 23.1 56.6 18 50 18zm0 5c4.1 0 7.5 3.1 7.5 7 0 1.2-.3 2.4-.9 3.4H43.4c-.6-1-1-2.2-1-3.4.1-3.9 3.5-7 7.6-7zm-8 28.5c1.4 0 2.5 1.1 2.5 2.5S43.4 56.5 42 56.5s-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5zm16 0c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5z" fill="white"/></svg>
              </div>
              {/* Tokopedia */}
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#03AC0E', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(3,172,14,0.3)', flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" width="22" height="22" fill="none"><path d="M50 20C33.4 20 20 33.4 20 50s13.4 30 30 30 30-13.4 30-30S66.6 20 50 20zm0 8c3.9 0 7 3.1 7 7s-3.1 7-7 7-7-3.1-7-7 3.1-7 7-7zm0 44c-8.3 0-15.7-4.2-20-10.6.1-6.6 13.3-10.2 20-10.2s19.9 3.6 20 10.2C65.7 67.8 58.3 72 50 72z" fill="white"/></svg>
              </div>
              {/* TikTok Shop */}
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#010101', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.25)', flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" width="22" height="22" fill="none"><path d="M67.5 30.2c-3.5-.4-6.6-2.2-8.8-4.9V57c0 7.2-5.8 13-13 13s-13-5.8-13-13 5.8-13 13-13c.7 0 1.4.1 2 .2V36c-.7-.1-1.3-.1-2-.1-12.1 0-22 9.9-22 22s9.9 22 22 22 22-9.9 22-22V42.7c3.3 2.2 7.2 3.5 11.5 3.5v-9.6c-4.5-.1-9.1-2.8-11.7-6.4z" fill="white"/></svg>
              </div>
            </div>
            <div className="skel-line"></div>
            <div className="skel-line short"></div>
          </div>

          {/* Float card — TikTok Shop order */}
          <div className="mock-ui mock-float-1" style={{ right: '-5%', top: '18%', padding: '14px 18px', minWidth: '170px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#010101', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" width="14" height="14" fill="none"><path d="M67.5 30.2c-3.5-.4-6.6-2.2-8.8-4.9V57c0 7.2-5.8 13-13 13s-13-5.8-13-13 5.8-13 13-13c.7 0 1.4.1 2 .2V36c-.7-.1-1.3-.1-2-.1-12.1 0-22 9.9-22 22s9.9 22 22 22 22-9.9 22-22V42.7c3.3 2.2 7.2 3.5 11.5 3.5v-9.6c-4.5-.1-9.1-2.8-11.7-6.4z" fill="white"/></svg>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111' }}>TikTok Shop</span>
            </div>
            <div style={{ color: '#10B981', fontWeight: 800, fontSize: '1rem' }}>+ 12 Order Baru</div>
          </div>

          {/* Float card — Shopee order */}
          <div className="mock-ui mock-float-2" style={{ left: '5%', bottom: '10%', padding: '14px 18px', minWidth: '170px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#EE4D2D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" width="14" height="14" fill="none"><path d="M50 18C43.4 18 38 23.1 38 29.4c0 1.2.2 2.4.5 3.5H28.5C26 32.9 24 34.8 24 37.2l3.2 36.2C27.5 75.8 29.3 77 31.3 77h37.4c2 0 3.8-1.2 4.1-3.6L76 37.2c0-2.4-2-4.3-4.5-4.3H61.5c.3-1.1.5-2.3.5-3.5C62 23.1 56.6 18 50 18zm0 5c4.1 0 7.5 3.1 7.5 7 0 1.2-.3 2.4-.9 3.4H43.4c-.6-1-1-2.2-1-3.4.1-3.9 3.5-7 7.6-7zm-8 28.5c1.4 0 2.5 1.1 2.5 2.5S43.4 56.5 42 56.5s-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5zm16 0c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5z" fill="white"/></svg>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111' }}>Shopee</span>
            </div>
            <div style={{ color: '#10B981', fontWeight: 800, fontSize: '1rem' }}>+ 8 Order Baru</div>
          </div>
        </>
      )
    }
  ];

  useEffect(() => {
    const cards = gsap.utils.toArray('.feature-large-card');
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      ScrollTrigger.create({
        trigger: card,
        start: "block start",
        endTrigger: cards[i + 1],
        end: "top 20%",
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.to(card, {
            scale: 1 - (progress * 0.05),
            filter: `brightness(${1 - (progress * 0.15)})`,
            duration: 0.1,
            overwrite: 'auto'
          });
        }
      });
    });
  }, []);

  return (
    <section className="features-section" id="features">
      <div className="container">
        <div className="features-header">
          <span className="features-pretitle">{t.features.pretitle}</span>
          <h2 className="features-title">{t.features.title}</h2>
          <p>{t.features.subtitle}</p>
        </div>

        <div className="features-stack" ref={containerRef}>
          {features.map((feat, idx) => (
            <div className="feature-large-card" key={idx}>
              <div className="feature-content">
                <div className="feature-badge">
                  {feat.logoIcon}
                  <span>{feat.module}</span>
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.description}</p>
                <button className="feature-btn" style={{ backgroundColor: feat.buttonColor }}>
                  {feat.buttonText}
                </button>
                <div className="feature-tags">
                  {feat.tags.map((tag, tIdx) => (
                    <span className="feature-tag" key={tIdx}>
                      <Zap size={14} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="feature-mockup">
                 {feat.mockup}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
