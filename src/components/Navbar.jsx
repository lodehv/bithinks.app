import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { useAppContext } from '../context/AppContext';
import { Globe, Menu, X } from 'lucide-react';
import { navigateTo } from '../utils/navigation';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { lang, theme, t, toggleLang, toggleTheme } = useAppContext();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        {/* Logo */}
        <a href="/bitomni" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigateTo('/bitomni'); }}>
          <div className="brand-logo-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            <img src="/bithinks.png" alt="Logo Bithinks" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '10px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.5px', marginTop: '3px', textTransform: 'lowercase' }}>bithinks</span>
          </div>
          <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', letterSpacing: '1px' }}>BETA</span>
        </a>

        {/* Nav Links */}
        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>

          <a 
            href="/about" 
            className="navbar-link" 
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
              navigateTo('/about');
            }}
          >
            Tentang Bithinks
          </a>
          <a 
            href="/terms" 
            className="navbar-link" 
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
              navigateTo('/terms');
            }}
          >
            Syarat &amp; Ketentuan
          </a>
          <a 
            href="/privacy" 
            className="navbar-link" 
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
              navigateTo('/privacy');
            }}
          >
            Privasi &amp; Keamanan Data
          </a>
          <a href="/login" className="navbar-link mobile-only-link" onClick={() => setIsMobileMenuOpen(false)}>Login</a>
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
