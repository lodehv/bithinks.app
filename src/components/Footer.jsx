import React from 'react';
import './Footer.css';
import { useAppContext } from '../context/AppContext';

const Footer = () => {
  const { t } = useAppContext();
  return (
    <footer className="footer" id="about">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo-text">Bithinks</span>
            <p>{t.footer.desc}</p>
            <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
              <a href="https://www.instagram.com/bithinks/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-light)', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-light)'}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>{t.footer.col1}</h4>
              <ul>
                <li><a href="#">{t.footer.c1l1}</a></li>
                <li><a href="#">{t.footer.c1l2}</a></li>
                <li><a href="#">{t.footer.c1l3}</a></li>
                <li><a href="#">{t.footer.c1l4}</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>{t.footer.col2}</h4>
              <ul>
                <li><a href="#">{t.footer.c2l1}</a></li>
                <li><a href="#">{t.footer.c2l2}</a></li>
                <li><a href="#">{t.footer.c2l3}</a></li>
                <li><a href="#">{t.footer.c2l4}</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>{t.footer.col3}</h4>
              <ul>
                <li><a href="#">{t.footer.c3l1}</a></li>
                <li><a href="#">{t.footer.c3l2}</a></li>
                <li><a href="#">{t.footer.c3l3}</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>{t.footer.copyright}</p>
          <div className="footer-socials">
            <span>{t.footer.madeWith}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
