import React from 'react';
import './Footer.css';
import logoPengayoman from '../assets/logo_pilihan_fitur/logo_pengayoman_new.png';
import { navigateTo } from '../utils/navigation';

const Footer = () => {
  return (
    <footer className="footer-white" id="about">
      <div className="container">
        
        {/* Top Header Logo */}
        <div className="footer-brand-header">
          <div className="footer-brand-logo">
            <img src="/bithinks.png" alt="Bithinks Logo" className="footer-logo-img" />
            <span className="footer-brand-name">bithinks</span>
          </div>
        </div>

        {/* Main Grid Columns Layout */}
        <div className="footer-main-grid">
          
          {/* Column 1: Company Info & Customer Complaint Service */}
          <div className="footer-col-company">
            <h3 className="footer-company-name">PT. Bithinks Digital Teknologi</h3>
            
            <div className="footer-office-block">
              <p className="office-city">Solo</p>
              <p className="office-address">
                JL Pleret, Desa/Kelurahan Malangjiwan, Kec. Colomadu, Kab. Karanganyar, Provinsi Jawa Tengah, 57177
              </p>
            </div>

            <div className="footer-info-section">
              <h4 className="info-section-header">Layanan Pengaduan Konsumen BITHINKS</h4>
              <p className="info-section-text">Email : bithinksdigital@gmail.com</p>
            </div>

            {/* Social Media Icons */}
            <div className="footer-social-links">
              <a href="https://www.instagram.com/bithinks.id/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/bithinks/posts/?feedView=all" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Kebijakan Kami & Kemenkumham Badge */}
          <div className="footer-col-nav">
            <h4>Kebijakan Kami</h4>
            <ul className="footer-link-list">
              <li>
                <a 
                  href="/terms" 
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/terms');
                  }}
                >
                  Syarat &amp; Ketentuan
                </a>
              </li>
              <li>
                <a 
                  href="/privacy" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    navigateTo('/privacy'); 
                  }}
                >
                  Privasi &amp; Keamanan Data
                </a>
              </li>
            </ul>

            {/* Kemenkumham Verified Badge */}
            <div className="kemenkumham-logo-slot">
              <div className="kemenkumham-badge-box">
                <div className="kemenkumham-logo-wrapper">
                  <img src={logoPengayoman} alt="Logo Pengayoman Kemenkumham RI" className="kemenkumham-img" />
                </div>
                <div className="kemenkumham-badge-text">
                  <span className="gov-tag">TERDAFTAR &amp; TERVERIFIKASI</span>
                  <strong className="gov-name">KEMENKUMHAM RI</strong>
                  <span className="gov-sub">Kementerian Hukum dan Hak Asasi Manusia</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Perusahaan */}
          <div className="footer-col-nav">
            <h4>Perusahaan</h4>
            <ul className="footer-link-list">
              <li><a href="#about">Tentang Bithinks</a></li>
              <li><a href="#promo">Event &amp; Promo</a></li>
              <li><a href="#career">Karir</a></li>
              <li><a href="https://wa.me/6285156297948" target="_blank" rel="noopener noreferrer">Hubungi Kami</a></li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div className="footer-col-nav">
            <h4>Resources</h4>
            <ul className="footer-link-list">
              <li><a href="#help">Bantuan</a></li>
              <li><a href="#api">Dokumentasi API</a></li>
              <li><a href="#whitepaper">E-book dan Whitepaper</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <p>© 2026 PT. Bithinks Digital Teknologi. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
