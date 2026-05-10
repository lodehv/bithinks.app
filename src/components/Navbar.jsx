import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { useAppContext } from '../context/AppContext';
import { Sun, Moon, Globe } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { lang, theme, t, toggleLang, toggleTheme } = useAppContext();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <a href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img src="/bithinks.jpeg" alt="Logo Bithinks" style={{ height: '40px', borderRadius: '4px' }} />
          <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', letterSpacing: '1px' }}>BETA</span>
        </a>
        
        <div className="navbar-links">
          <a href="#features" className="navbar-link">{t.navbar.product}</a>
          <a href="#about" className="navbar-link">{t.navbar.about}</a>
          <a href="#pricing" className="navbar-link">{t.navbar.pricing}</a>
        </div>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={toggleTheme} className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={toggleLang} className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--color-text)' }}>
            <Globe size={18} /> {lang.toUpperCase()}
          </button>
          
          <a href="/login" className="navbar-link" style={{ fontWeight: 600 }}>{t.navbar.login}</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
