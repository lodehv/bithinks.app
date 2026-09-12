import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import logoPengayoman from '../assets/logo_pilihan_fitur/logo_pengayoman_new.png';
import { navigateTo } from '../utils/navigation';
import { ShieldCheck, MapPin, Building2, Clock, Lock, ArrowUpRight, CheckCircle, Sparkles, MessageCircle } from 'lucide-react';
import './AboutUs.css';

// Product logos
import bitOneLogo from '../assets/logo_pilihan_fitur/bitone_logo-removebg-preview.png';
import bitOmniLogo from '../assets/logo_pilihan_fitur/bithinks_omnichannel_logo-removebg-preview.png';
import bitFineLogo from '../assets/logo_pilihan_fitur/bit_finance_logo-removebg-preview.png';
import bitPosLogo from '../assets/logo_pilihan_fitur/bithinks_pos_logo_v2-removebg-preview.png';
import bitTeamLogo from '../assets/logo_pilihan_fitur/bithinks_hrm_logo-removebg-preview.png';
import bitDevLogo from '../assets/logo_pilihan_fitur/bithinks_dev_logo-removebg-preview.png';

const APPS = [
  { id: 'bitomni', title: 'Bithinks Omnichannel', logo: bitOmniLogo, color: '#FF6B00', tag: 'BitOmni', desc: 'Sinkronisasi stok real-time & cetak resi pengiriman massal 1-klik dari seluruh toko online.' },
  { id: 'bitone', title: 'Bithinks One', logo: bitOneLogo, color: '#0066FF', tag: 'BitOne', desc: 'Sistem operasi terpadu untuk mengelola seluruh divisi bisnis dalam 1 dashboard.' },
  { id: 'bitfine', title: 'Bithinks Finance', logo: bitFineLogo, color: '#3B82F6', tag: 'BitFine', desc: 'Laporan keuangan terintegrasi & rekonsilasi omset dari semua saluran penjualan.' },
  { id: 'bitpos', title: 'Bithinks POS', logo: bitPosLogo, color: '#EC4899', tag: 'BitPos', desc: 'Manajemen kasir dan penjualan ritel toko fisik offline secara akurat.' },
  { id: 'bitteam', title: 'Bithinks Team', logo: bitTeamLogo, color: '#10B981', tag: 'BitTeam', desc: 'Manajemen data karyawan, absensi, dan skema penggajian terorganisir.' },
  { id: 'bitdev', title: 'Bithinks Customize', logo: bitDevLogo, color: '#4B5563', tag: 'BitDev', desc: 'Pengembangan fitur dan perangkat lunak kustom sesuai kebutuhan spesifik bisnis Anda.' },
];

const AboutUs = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="about-page-wrapper">
      <Navbar />

      {/* Hero Header Area - Clean Editorial Light Theme */}
      <header className="about-hero-clean">
        <div className="container">
          <div className="about-hero-grid">
            
            {/* Left Narrative Column */}
            <div className="about-hero-left">
              <div className="company-badge-pill">
                <span className="dot-active"></span>
                <span>PT. BITHINKS DIGITAL TEKNOLOGI</span>
              </div>

              <h1 className="about-hero-heading">
                Keandalan Sistem Ritel &amp; Omnichannel. Transparan Tanpa Biaya Tersembunyi.
              </h1>

              <p className="about-hero-body">
                Kami membangun Bithinks untuk membantu para pebisnis online dan UMKM di Indonesia mengelola toko dengan efisien — didukung legalitas entitas resmi, transparansi skema biaya, dan komitmen perlindungan data yang kuat.
              </p>

              <div className="about-hero-actions">
                <a href="https://wa.me/6285156297948" target="_blank" rel="noopener noreferrer" className="btn-consult-wa">
                  <MessageCircle size={18} /> Hubungi Tim Bithinks
                </a>
                <button onClick={() => navigateTo('/terms')} className="btn-terms-link">
                  Syarat &amp; Ketentuan Respon <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Official Verification Card */}
            <div className="about-hero-right">
              <div className="official-legal-card">
                
                {/* Header Tag */}
                <div className="legal-card-header">
                  <div className="kemenkumham-mini-logo">
                    <img src={logoPengayoman} alt="Kemenkumham RI" className="mini-logo-img" />
                  </div>
                  <div>
                    <span className="legal-tag-badge">TERDAFTAR &amp; TERVERIFIKASI</span>
                    <h4 className="legal-entity-name">PT. BITHINKS DIGITAL TEKNOLOGI</h4>
                  </div>
                </div>

                <div className="legal-divider"></div>

                {/* Legal Meta Specs */}
                <div className="legal-specs-list">
                  <div className="spec-row">
                    <span className="spec-label">Bentuk Badan Hukum:</span>
                    <span className="spec-value">Perseroan Terbatas (PT)</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Pengesahan Pemerintah:</span>
                    <span className="spec-value">Kementerian Hukum &amp; HAM RI</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Sektor Usaha:</span>
                    <span className="spec-value">Pengembangan Perangkat Lunak Ritel &amp; Omnichannel</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Dukungan CS:</span>
                    <span className="spec-value highlight-green">24 Jam / 7 Hari Nonstop</span>
                  </div>
                </div>

                {/* Physical Location Box */}
                <div className="office-location-card">
                  <MapPin size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span className="location-city-tag">Kantor Operasional Solo:</span>
                    <p className="location-address-text">
                      JL Pleret, Desa/Kelurahan Malangjiwan, Kec. Colomadu, Kab. Karanganyar, Jawa Tengah, 57177
                    </p>
                  </div>
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
                Kami tidak mengklaim sebagai platform terbesar atau terhebat. Komitmen kami sederhana dan jelas: menghadirkan sistem omnichannel dan manajemen ritel yang <strong>stabil, mudah dioperasikan, memiliki biaya yang jujur, serta mendampingi bisnis Anda secara berkelanjutan.</strong>
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
              <div className="quote-box">
                <p className="quote-text">
                  "Kepercayaan dari para pengusaha dan seller tidak dibangun dengan klaim yang muluk-muluk, melainkan dari keandalan sistem harian dan pelayanan yang selalu ada saat dibutuhkan."
                </p>
                <span className="quote-author">— PT. Bithinks Digital Teknologi</span>
              </div>
            </div>
          </div>

          {/* Product Ecosystem Section */}
          <div className="ecosystem-section">
            <div className="ecosystem-intro">
              <span className="section-kicker">EKOSISTEM BITHINKS</span>
              <h2>Aplikasi Terintegrasi Sesuai Skala Bisnis Anda</h2>
              <p>Pilih modul perangkat lunak yang sesuai dengan kebutuhan operasional toko Anda hari ini.</p>
            </div>

            <div className="apps-grid-3">
              {APPS.map((app) => (
                <div 
                  key={app.id} 
                  className="app-card-item"
                  onClick={() => navigateTo(`/${app.id}`)}
                >
                  <div className="app-card-top">
                    <div className="app-logo-box">
                      <img src={app.logo} alt={app.title} className="app-logo-img" />
                    </div>
                    <span className="app-badge-tag" style={{ color: app.color, background: `${app.color}15` }}>
                      {app.tag}
                    </span>
                  </div>

                  <h3 className="app-card-title">{app.title}</h3>
                  <p className="app-card-desc">{app.desc}</p>

                  <div className="app-card-footer">
                    <span>Pelajari Fitur</span>
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final Call to Action */}
          <div className="about-cta-banner">
            <div className="cta-banner-content">
              <h2>Mulai Kelola Toko Anda Lebih Efisien Hari Ini</h2>
              <p>Konsultasikan kebutuhan manajemen omnichannel dan toko ritel Anda secara gratis bersama tim Bithinks.</p>
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
