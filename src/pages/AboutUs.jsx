import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import logoPengayoman from '../assets/logo_pilihan_fitur/logo_pengayoman_new.png';
import bitOmniLogo from '../assets/logo_pilihan_fitur/bithinks_omnichannel_logo-removebg-preview.png';
import resiSkuMockup from '../assets/logo_pilihan_fitur/resi_sku_mockup.png';
import trackingAuditMockup from '../assets/logo_pilihan_fitur/tracking_audit_mockup.png';
import { navigateTo } from '../utils/navigation';
import { ShieldCheck, MapPin, ArrowUpRight, CheckCircle, RefreshCw, Printer, Layers, Truck, DollarSign, MessageCircle, Building2 } from 'lucide-react';
import './AboutUs.css';

const AboutUs = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="about-page-wrapper">
      <Navbar />

      {/* Hero Banner Header matching Jubelio reference design */}
      <header className="about-hero-banner">
        <div className="about-hero-container">
          <div className="about-hero-grid">
            
            {/* Left Narrative Column */}
            <div className="about-hero-text">
              <span className="about-pretitle">PT. BITHINKS DIGITAL TEKNOLOGI</span>
              <h1 className="about-main-title">TENTANG BITHINKS OMNICHANNEL</h1>
              <p className="about-hero-subtitle">
                Sistem manajemen ritel &amp; platform omnichannel terpercaya di Indonesia — dikembangkan dengan transparansi skema biaya, keandalan operasional, dan perlindungan data yang kuat.
              </p>

              <div className="about-hero-actions">
                <a href="https://wa.me/6285156297948" target="_blank" rel="noopener noreferrer" className="btn-consult-wa">
                  <MessageCircle size={18} /> Hubungi Tim Bithinks
                </a>
                <button onClick={() => navigateTo('/terms')} className="btn-terms-link">
                  Syarat &amp; Ketentuan <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            {/* Right 3D Paper Stack Graphic Header Illustration */}
            <div className="about-hero-illustration">
              <div className="about-3d-paper-stack">
                <div className="about-paper paper-1">
                  <div className="paper-line long"></div>
                  <div className="paper-line medium"></div>
                  <div className="paper-line short"></div>
                  <div className="paper-line long"></div>
                </div>
                <div className="about-paper paper-2">
                  <div className="paper-line long"></div>
                  <div className="paper-line medium"></div>
                  <div className="paper-line short"></div>
                </div>
                <div className="about-paper paper-3">
                  <div className="paper-icon-badge">
                    <img src={logoPengayoman} alt="Kemenkumham RI" className="paper-gov-img" />
                  </div>
                  <div className="paper-line long"></div>
                  <div className="paper-line short"></div>
                  <div className="paper-status-tag">TERDAFTAR RESMI KEMENKUMHAM</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 4 Pillars Trust Grid (Crisp Numeric Stat Bar) */}
      <section className="pillars-trust-bar">
        <div className="container">
          <div className="pillars-grid-4">
            
            <div className="pillar-item">
              <span className="pillar-num">01</span>
              <h4>Badan Hukum Sah</h4>
              <p>Terdaftar resmi di Kemenkumham RI sebagai PT. Bithinks Digital Teknologi.</p>
            </div>

            <div className="pillar-item">
              <span className="pillar-num">02</span>
              <h4>Harga Transparan</h4>
              <p>Top-up saldo pesanan Rp 250 / pesanan. Kuota tidak memiliki masa kadaluarsa (tidak pernah hangus).</p>
            </div>

            <div className="pillar-item">
              <span className="pillar-num">03</span>
              <h4>Keamanan Data UU PDP</h4>
              <p>Data inventori dan omset toko 100% milik Anda. Dilindungi enkripsi SSL 256-bit.</p>
            </div>

            <div className="pillar-item">
              <span className="pillar-num">04</span>
              <h4>Support Manusia 24/7</h4>
              <p>Dukungan teknis responsif yang siap membantu kendala operasional Anda kapan saja.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Story & Mission Section */}
      <main className="about-main-section">
        <div className="container">
          
          <div className="story-split-container">
            <div className="story-editorial-text">
              <span className="section-kicker">FILOSOFI KAMI</span>
              <h2>Fokus Pada Solusi Nyata Operasional, Bukan Janji Berlebihan</h2>
              
              <p>
                Bithinks lahir dari pengamatan langsung terhadap tantangan nyata para seller dan pemilik usaha di Indonesia: kebingungan dalam menyinkronkan stok di berbagai marketplace, proses cetak resi pengiriman yang lambat dan berisiko salah kirim, serta biaya langganan bulanan yang membengkak tanpa kepastian.
              </p>

              <p>
                Kami tidak mengklaim sebagai platform terbesar atau terhebat. Komitmen kami sederhana dan jelas: menghadirkan sistem omnichannel yang <strong>stabil, mudah dioperasikan, memiliki biaya yang jujur, serta mendampingi bisnis Anda secara berkelanjutan.</strong>
              </p>

              <div className="principles-checklist">
                <div className="check-item">
                  <CheckCircle size={18} color="#10B981" />
                  <span>Tanpa biaya tersembunyi atau potongan komisi siluman.</span>
                </div>
                <div className="check-item">
                  <CheckCircle size={18} color="#10B981" />
                  <span>Integrasi resmi API marketplace (Shopee, Tokopedia, TikTok Shop, Lazada, Blibli).</span>
                </div>
                <div className="check-item">
                  <CheckCircle size={18} color="#10B981" />
                  <span>Dukungan penuh tim Customer Support 24 jam nonstop.</span>
                </div>
              </div>
            </div>

            <div className="story-highlight-box">
              <div className="legal-verification-card-box">
                <div className="card-gov-badge-header">
                  <div className="gov-logo-frame">
                    <img src={logoPengayoman} alt="Kemenkumham RI" className="gov-logo-img" />
                  </div>
                  <div>
                    <span className="gov-status-tag">VERIFIKASI RESMI KEMENKUMHAM RI</span>
                    <h3 className="gov-company-title">PT. BITHINKS DIGITAL TEKNOLOGI</h3>
                  </div>
                </div>

                <div className="card-specs-list">
                  <div className="spec-row">
                    <span className="spec-label">Bentuk Usaha:</span>
                    <span className="spec-value">Perseroan Terbatas (PT)</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Kantor Operasional:</span>
                    <span className="spec-value">Solo, Jawa Tengah</span>
                  </div>
                </div>

                <div className="card-office-address">
                  <MapPin size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p>
                    JL Pleret, Desa/Kelurahan Malangjiwan, Kec. Colomadu, Kab. Karanganyar, Jawa Tengah, 57177
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Bithinks Omnichannel Feature Showcase Section */}
          <div className="omni-deepdive-section">
            <div className="omni-intro-header">
              <div className="omni-badge-tag">
                <img src={bitOmniLogo} alt="Bithinks Omnichannel" className="omni-badge-logo" />
                <span>SOLUSI UTAMA BITHINKS OMNICHANNEL</span>
              </div>
              <h2>Kemampuan Utama Bithinks Omnichannel untuk Bisnis Anda</h2>
              <p>Satu layar terpusat untuk memproses pesanan, mengelola stok, dan mengawasi pengiriman toko online Anda.</p>
            </div>

            {/* Feature 1: Cetak Resi Massal & Sync SKU */}
            <div className="omni-feature-row">
              <div className="omni-feature-text">
                <div className="feature-icon-badge">
                  <Printer size={24} color="#FF6B00" />
                </div>
                <h3>Cetak Resi Massal 1-Klik &amp; Sync SKU Marketplace</h3>
                <p>
                  Terima, proses, atur pickup kurir, dan cetak resi pengiriman otomatis &amp; massal dari semua toko dalam satu layar terpusat, serta kelola katalog Master SKU sekali atur ke seluruh toko online.
                </p>
                <ul className="omni-feature-list">
                  <li>Proses ratusan pesanan tanpa perlu login seller center bergantian.</li>
                  <li>Kelola Master SKU &amp; sync harga/deskripsi sekali atur.</li>
                  <li>Cetak label pengiriman otomatis presisi dengan ukuran thermal printer.</li>
                </ul>
              </div>
              <div className="omni-feature-mockup">
                <img src={resiSkuMockup} alt="Cetak Resi Massal & Sync SKU Marketplace" className="mockup-img" />
              </div>
            </div>

            {/* Feature 2: Tracking Audit & Sinkronisasi Stok */}
            <div className="omni-feature-row reverse">
              <div className="omni-feature-text">
                <div className="feature-icon-badge">
                  <RefreshCw size={24} color="#10B981" />
                </div>
                <h3>Sinkronisasi Stok Real-Time &amp; Tracking Audit Retur</h3>
                <p>
                  Setiap kali pesanan baru masuk di salah satu toko (Shopee/Tokopedia/TikTok Shop/Lazada/Blibli), stok barang di toko lain otomatis terpotong secara real-time untuk mencegah <em>overselling</em>.
                </p>
                <ul className="omni-feature-list">
                  <li>Audit retur barang dan pelacakan status kurir ekspedisi transparan.</li>
                  <li>Peringatan otomatis saat stok di gudang mencapai batas minimum.</li>
                  <li>Pencatatan riwayat perubahan stok yang tidak dapat dimanipulasi.</li>
                </ul>
              </div>
              <div className="omni-feature-mockup">
                <img src={trackingAuditMockup} alt="Tracking Audit & Sinkronisasi Stok Realtime" className="mockup-img" />
              </div>
            </div>

            {/* Feature Cards Grid (Transparent Pricing & Integration) */}
            <div className="omni-cards-grid">
              <div className="omni-spec-card">
                <div className="card-icon-box">
                  <DollarSign size={24} color="#059669" />
                </div>
                <h4>Top-Up Saldo Transparan Rp 250 / Pesanan</h4>
                <p>
                  Perhitungan kuota transparan per pesanan yang berhasil diproses. Saldo kuota tidak memiliki tanggal kadaluarsa dan <strong>tidak pernah hangus</strong>.
                </p>
              </div>

              <div className="omni-spec-card">
                <div className="card-icon-box">
                  <Layers size={24} color="#2563EB" />
                </div>
                <h4>Integrasi Resmi API Marketplace</h4>
                <p>
                  Terhubung secara sah melalui API resmi ke Shopee, Tokopedia, TikTok Shop, Lazada, dan Blibli untuk keamanan dan stabilitas pertukaran data.
                </p>
              </div>

              <div className="omni-spec-card">
                <div className="card-icon-box">
                  <Truck size={24} color="#D97706" />
                </div>
                <h4>Dukungan Kurir Logistik Indonesia</h4>
                <p>
                  Mendukung pembuatan resi otomatis dan pemanggilan pickup kurir ekspedisi terkemuka di Indonesia (J&amp;T, JNE, SiCepat, Anteraja, Shopee Express, GoSend, GrabExpress).
                </p>
              </div>
            </div>

          </div>

          {/* Final Call to Action */}
          <div className="about-cta-banner">
            <div className="cta-banner-content">
              <h2>Siap Mengoptimalkan Toko Online Anda Bersama Bithinks Omnichannel?</h2>
              <p>Konsultasikan kebutuhan integrasi toko dan manajemen pesanan Anda secara gratis bersama tim teknis kami.</p>
              <div className="cta-action-buttons">
                <a href="https://wa.me/6285156297948" target="_blank" rel="noopener noreferrer" className="cta-btn-main">
                  Konsultasi Gratis via WhatsApp (0851-5629-7948)
                </a>
              </div>
            </div>
          </div>

        </div>
      </main>

      <FloatingWhatsApp />
      <Footer />
    </div>
  );
};

export default AboutUs;
