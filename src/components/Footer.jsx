import React from 'react';
import './Footer.css';
import logoPengayoman from '../assets/logo_pilihan_fitur/logo_pengayoman_new.png';

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
              <p className="office-city">Jakarta</p>
              <p className="office-address">
                Sampoerna Strategic Square North Tower Lt. 16, Jl. Jend. Sudirman Kav 45-46, Karet Semanggi, Kota Administrasi Jakarta Selatan.
              </p>
            </div>

            <div className="footer-office-block">
              <p className="office-city">Surabaya</p>
              <p className="office-address">
                Jl. Ahmad Yani No.88, Ketintang, Kec. Gayungan, Surabaya, Jawa Timur
              </p>
            </div>

            <div className="footer-info-section">
              <h4 className="info-section-header">Layanan Pengaduan Konsumen BITHINKS</h4>
              <p className="info-section-text">Email : support@bithinks.com</p>
            </div>

            <div className="footer-info-section">
              <h4 className="info-section-header">
                Direktorat Jendral Perlindungan Konsumen dan Tertib Niaga Kementerian Perdagangan RI
              </h4>
              <p className="info-section-text">Whatsapp: +62 853 1111 1010</p>
            </div>

            {/* Social Media Icons */}
            <div className="footer-social-links">
              <a href="https://www.instagram.com/bithinks/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Kebijakan Kami & Kemenkumham Badge */}
          <div className="footer-col-nav">
            <h4>Kebijakan Kami</h4>
            <ul className="footer-link-list">
              <li><a href="/terms">Syarat &amp; Ketentuan</a></li>
              <li><a href="/privacy">Privasi &amp; Keamanan Data</a></li>
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
              <li><a href="https://wa.me/628113000676" target="_blank" rel="noopener noreferrer">Hubungi Kami</a></li>
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
