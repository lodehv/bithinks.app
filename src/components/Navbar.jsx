import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { useAppContext } from '../context/AppContext';
import { 
  Sun, Moon, Globe, ChevronDown, 
  Package, Layers, Store, ShoppingCart, Tag, BarChart2, 
  Calculator, Wallet, Users, Briefcase, Code, Menu, X
} from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        
        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div 
            className="navbar-dropdown-wrapper" 
            onMouseEnter={() => setShowProductMenu(true)}
            onMouseLeave={() => setShowProductMenu(false)}
          >
            <a href="#features" className="navbar-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => { e.preventDefault(); setShowProductMenu(!showProductMenu); }}>
              {t.navbar.product}
              <ChevronDown size={16} style={{ transform: showProductMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
            </a>
            
            <div className={`mega-menu ${showProductMenu ? 'show' : ''}`}>
              <div className="mega-menu-content">
                {/* Bithinks One Column */}
                <div className="mega-menu-col" style={{ flex: 1.2 }}>
                  <span className="mega-menu-label">{t.megaMenu.onePretitle}</span>
                  <div className="mega-menu-list">
                    <div className="mega-menu-item one-card">
                      <div className="m-icon one-icon"><Briefcase size={24} color="#FFF" /></div>
                      <div>
                        <h4>{t.megaMenu.oneTitle}</h4>
                        <p>{t.megaMenu.oneDesc}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Omnichannel Column */}
                <div className="mega-menu-col mega-menu-divider" style={{ flex: 2 }}>
                  <span className="mega-menu-label">{t.megaMenu.pretitle}</span>
                  <div className="mega-menu-grid">
                    <div className="mega-menu-item">
                      <div className="m-icon" style={{ background: '#EFF6FF' }}><Package size={20} color="#2563EB" /></div>
                      <div>
                        <h4>{t.megaMenu.omni1Title}</h4>
                        <p>{t.megaMenu.omni1Desc}</p>
                      </div>
                    </div>
                    <div className="mega-menu-item">
                      <div className="m-icon" style={{ background: '#FFFBEB' }}><ShoppingCart size={20} color="#D97706" /></div>
                      <div>
                        <h4>{t.megaMenu.omni4Title}</h4>
                        <p>{t.megaMenu.omni4Desc}</p>
                      </div>
                    </div>
                    <div className="mega-menu-item">
                      <div className="m-icon" style={{ background: '#F5F3FF' }}><Layers size={20} color="#7C3AED" /></div>
                      <div>
                        <h4>{t.megaMenu.omni2Title}</h4>
                        <p>{t.megaMenu.omni2Desc}</p>
                      </div>
                    </div>
                    <div className="mega-menu-item">
                      <div className="m-icon" style={{ background: '#FDF2F8' }}><Tag size={20} color="#DB2777" /></div>
                      <div>
                        <h4>{t.megaMenu.omni5Title}</h4>
                        <p>{t.megaMenu.omni5Desc}</p>
                      </div>
                    </div>
                    <div className="mega-menu-item">
                      <div className="m-icon" style={{ background: '#ECFDF5' }}><Store size={20} color="#059669" /></div>
                      <div>
                        <h4>{t.megaMenu.omni3Title}</h4>
                        <p>{t.megaMenu.omni3Desc}</p>
                      </div>
                    </div>
                    <div className="mega-menu-item">
                      <div className="m-icon" style={{ background: '#ECFEFF' }}><BarChart2 size={20} color="#0891B2" /></div>
                      <div>
                        <h4>{t.megaMenu.omni6Title}</h4>
                        <p>{t.megaMenu.omni6Desc}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Features Column */}
                <div className="mega-menu-col mega-menu-divider" style={{ flex: 1.2 }}>
                  <span className="mega-menu-label">{t.megaMenu.otherPretitle}</span>
                  <div className="mega-menu-list">
                    <div className="mega-menu-item">
                      <div className="m-icon" style={{ background: '#FFFBEB' }}><Calculator size={20} color="#F59E0B" /></div>
                      <div>
                        <h4>{t.megaMenu.posTitle}</h4>
                        <p>{t.megaMenu.posDesc}</p>
                      </div>
                    </div>
                    <div className="mega-menu-item">
                      <div className="m-icon" style={{ background: '#EFF6FF' }}><Wallet size={20} color="#3B82F6" /></div>
                      <div>
                        <h4>{t.megaMenu.financeTitle}</h4>
                        <p>{t.megaMenu.financeDesc}</p>
                      </div>
                    </div>
                    <div className="mega-menu-item">
                      <div className="m-icon" style={{ background: '#ECFDF5' }}><Users size={20} color="#10B981" /></div>
                      <div>
                        <h4>{t.megaMenu.hrmTitle}</h4>
                        <p>{t.megaMenu.hrmDesc}</p>
                      </div>
                    </div>
                    <div className="mega-menu-item">
                      <div className="m-icon" style={{ background: '#F3F4F6' }}><Code size={20} color="#4B5563" /></div>
                      <div>
                        <h4>{t.megaMenu.customTitle}</h4>
                        <p>{t.megaMenu.customDesc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <a href="#about" className="navbar-link" onClick={() => setIsMobileMenuOpen(false)}>{t.navbar.about}</a>
          <a href="#pricing" className="navbar-link" onClick={() => setIsMobileMenuOpen(false)}>{t.navbar.pricing}</a>
          <a href="/login" className="navbar-link mobile-only-link" onClick={() => setIsMobileMenuOpen(false)}>{t.navbar.login}</a>
        </div>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={toggleTheme} className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
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
