import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { useAppContext } from '../context/AppContext';
import { Globe, ChevronDown, ArrowUpRight, Menu, X } from 'lucide-react';
import { navigateTo } from '../utils/navigation';

// Same logo imports as AppSelector — real brand logos in the mega-menu
import bitOneLogo from '../assets/logo_pilihan_fitur/bitone_logo-removebg-preview.png';
import bitOmniLogo from '../assets/logo_pilihan_fitur/bithinks_omnichannel_logo-removebg-preview.png';
import bitFineLogo from '../assets/logo_pilihan_fitur/bit_finance_logo-removebg-preview.png';
import bitPosLogo from '../assets/logo_pilihan_fitur/bithinks_pos_logo_v2-removebg-preview.png';
import bitTeamLogo from '../assets/logo_pilihan_fitur/bithinks_hrm_logo-removebg-preview.png';
import bitDevLogo from '../assets/logo_pilihan_fitur/bithinks_dev_logo-removebg-preview.png';

// All 6 apps — same data as AppSelector.jsx
const APPS = [
  {
    id: 'bitone',
    title: 'Bithinks One',
    badge: 'BitOne',
    logo: bitOneLogo,
    color: '#0066FF',
    bg: 'rgba(0, 102, 255, 0.08)',
    desc: 'Kelola semua divisi hanya dengan 1 aplikasi.',
  },
  {
    id: 'bitomni',
    title: 'Bithinks Omnichannel',
    badge: 'BitOmni',
    logo: bitOmniLogo,
    color: '#FF6B00',
    bg: 'rgba(255, 107, 0, 0.08)',
    desc: 'Kelola stok & pesanan di semua marketplace terintegrasi.',
  },
  {
    id: 'bitfine',
    title: 'Bithinks Finance',
    badge: 'BitFine',
    logo: bitFineLogo,
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.08)',
    desc: 'Laporan keuangan terintegrasi langsung dari semua channel penjualan.',
  },
  {
    id: 'bitpos',
    title: 'Bithinks POS',
    badge: 'BitPos',
    logo: bitPosLogo,
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.08)',
    desc: 'Manajemen Penjualan Offline secara akurat.',
  },
  {
    id: 'bitteam',
    title: 'Bithinks Team',
    badge: 'BitTeam',
    logo: bitTeamLogo,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
    desc: 'Manajemen Data Karyawan, Absensi, dan Penggajian.',
  },
  {
    id: 'bitdev',
    title: 'Bithinks Customize',
    badge: 'BitDev',
    logo: bitDevLogo,
    color: '#4B5563',
    bg: 'rgba(75, 85, 99, 0.08)',
    desc: 'Buat aplikasi sesukamu sesuai bisnismu.',
  },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { lang, theme, t, toggleLang, toggleTheme } = useAppContext();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToApp = (appId) => {
    setShowProductMenu(false);
    setIsMobileMenuOpen(false);
    if (appId) {
      navigateTo(`/${appId}`);
    } else {
      navigateTo('/');
      setTimeout(() => {
        const el = document.getElementById('app-selector');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        {/* Logo */}
        <a href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>
          <img src="/bithinks.jpeg" alt="Logo Bithinks" style={{ height: '64px', borderRadius: '4px' }} />
          <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', letterSpacing: '1px' }}>BETA</span>
        </a>

        {/* Nav Links */}
        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>

          {/* Produk Dropdown */}
          <div
            className="navbar-dropdown-wrapper"
            onMouseEnter={() => setShowProductMenu(true)}
            onMouseLeave={() => setShowProductMenu(false)}
          >
            <a
              href="#app-selector"
              className="navbar-link"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={(e) => { e.preventDefault(); setShowProductMenu(!showProductMenu); }}
            >
              {t.navbar.product}
              <ChevronDown size={16} style={{ transform: showProductMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
            </a>

            {/* ── App Mega Menu ── */}
            <div className={`mega-menu mega-menu-apps ${showProductMenu ? 'show' : ''}`}>

              {/* Header */}
              <div className="mega-apps-header">
                <span className="mega-apps-pretitle">Pilih Aplikasi Sesuai Bisnismu</span>
                <button className="mega-apps-see-all" onClick={() => scrollToApp(null)}>
                  Lihat Semua <ArrowUpRight size={13} />
                </button>
              </div>

              {/* 2 × 3 App Card Grid */}
              <div className="mega-apps-grid">
                {APPS.map((app) => (
                  <button
                    key={app.id}
                    className="mega-app-card"
                    style={{ '--app-color': app.color, '--app-bg': app.bg }}
                    onClick={() => scrollToApp(app.id)}
                  >
                    {/* Logo strip — solid colored band matching app theme */}
                    <div className="mega-app-logo-strip" style={{ background: app.bg }}>
                      <img src={app.logo} alt={app.title} className="mega-app-logo" />
                    </div>

                    {/* Text body */}
                    <div className="mega-app-body">
                      <div className="mega-app-name-row">
                        <span className="mega-app-title">{app.title}</span>
                        <span
                          className="mega-app-badge"
                          style={{ color: app.color, background: app.bg }}
                        >
                          {app.badge}
                        </span>
                      </div>
                      <p className="mega-app-desc">{app.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <a href="#about" className="navbar-link" onClick={() => setIsMobileMenuOpen(false)}>{t.navbar.about}</a>
          <a href="#pricing" className="navbar-link" onClick={() => setIsMobileMenuOpen(false)}>{t.navbar.pricing}</a>
          <a href="/login" className="navbar-link mobile-only-link" onClick={() => setIsMobileMenuOpen(false)}>{t.navbar.login}</a>
        </div>

        {/* Actions */}
        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={toggleLang} className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--color-text)' }}>
            <Globe size={18} /> {lang.toUpperCase()}
          </button>
          <a href="/login" className="navbar-link login-link-desktop" style={{ fontWeight: 600 }}>{t.navbar.login}</a>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
