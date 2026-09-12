import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import logoPengayoman from '../assets/logo_pilihan_fitur/logo_pengayoman_new.png';
import { navigateTo } from '../utils/navigation';
import { ShieldCheck, Target, HeartHandshake, MapPin, Building2, CheckCircle2, Clock, Lock, Sparkles, MessageSquare, Scale } from 'lucide-react';
import './AboutUs.css';

const AboutUs = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="about-page-wrapper">
      <Navbar />

      {/* Hero Header Section */}
      <header className="about-hero-section">
        <div className="container">
          <div className="about-hero-content">
            <span className="about-pretitle">TENTANG PT. BITHINKS DIGITAL TEKNOLOGI</span>
            <h1 className="about-main-title">
              Teknologi Omnichannel &amp; Manajemen Ritel yang Transparan, Handal, dan Membumi.
            </h1>
            <p className="about-hero-subtitle">
              Kami membangun Bithinks untuk mempermudah operasional bisnis ritel dan e-commerce di Indonesia — tanpa janji manis yang berlebihan, tanpa biaya tersembunyi, dan mengutamakan kepercayaan jangka panjang.
            </p>
          </div>
        </div>
      </header>

      {/* Trust Highlights Strip */}
      <section className="trust-highlights-strip">
        <div className="container">
          <div className="trust-grid-4">
            <div className="trust-card-item">
              <div className="trust-icon-box indigo">
                <Building2 size={24} color="#4F46E5" />
              </div>
              <div className="trust-text">
                <h3>Badan Hukum Resmi</h3>
                <p>Terdaftar di Kemenkumham RI sebagai PT. Bithinks Digital Teknologi.</p>
              </div>
            </div>

            <div className="trust-card-item">
              <div className="trust-icon-box emerald">
                <ShieldCheck size={24} color="#10B981" />
              </div>
              <div className="trust-text">
                <h3>Transparan &amp; Jujur</h3>
                <p>Top-up saldo pesanan Rp 250 / pesanan tanpa masa kadaluarsa (tidak hangus).</p>
              </div>
            </div>

            <div className="trust-card-item">
              <div className="trust-icon-box amber">
                <Clock size={24} color="#D97706" />
              </div>
              <div className="trust-text">
                <h3>Customer Support 24/7</h3>
                <p>Tim dukungan responsif yang siap membantu kendala operasional Anda nonstop.</p>
              </div>
            </div>

            <div className="trust-card-item">
              <div className="trust-icon-box blue">
                <Lock size={24} color="#2563EB" />
              </div>
              <div className="trust-text">
                <h3>Keamanan Data UU PDP</h3>
                <p>Data bisnis dan transaksi Anda 100% milik Anda &amp; dilindungi enkripsi SSL.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Story & Values */}
      <main className="about-main-content">
        <div className="container">
          
          {/* Section 1: Siapa Kami (Tanpa Overclaim) */}
          <section className="about-story-block">
            <div className="story-grid">
              <div className="story-text-col">
                <div className="badge-tag">SIAPA KAMI</div>
                <h2>Membangun Solusi Operasional Ritel dengan Fakta, Bukan Overclaim</h2>
                <p className="story-paragraph">
                  <strong>PT. Bithinks Digital Teknologi</strong> didirikan dengan semangat untuk menyelesaikan masalah riil yang dihadapi oleh para pengusaha, pebisnis online, dan UMKM di Indonesia: kompleksitas dalam mengelola banyak toko marketplace, sinkronisasi stok yang sering tidak akurat, cetak resi massal yang memakan waktu, serta perhitungan laporan keuangan yang membingungkan.
                </p>
                <p className="story-paragraph">
                  Kami tidak mengklaim sebagai platform terhebat di dunia. Fokus utama kami adalah menghadirkan sistem perangkat lunak yang <strong>stabil, mudah digunakan, transparan dari segi biaya, dan benar-benar membantu produktivitas harian tim Anda.</strong>
                </p>
              </div>

              <div className="story-badge-card">
                <div className="gov-verification-box">
                  <div className="gov-logo-frame">
                    <img src={logoPengayoman} alt="Kemenkumham RI" className="gov-logo-img" />
                  </div>
                  <div className="gov-info-text">
                    <span className="gov-status">ENTITY TERVERIFIKASI RESMI</span>
                    <h3 className="gov-company-title">PT. BITHINKS DIGITAL TEKNOLOGI</h3>
                    <p className="gov-legal-desc">
                      Perusahaan teknologi perangkat lunak berbadan hukum sah di bawah Republik Indonesia.
                    </p>
                  </div>
                </div>

                <div className="office-address-box">
                  <MapPin size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong className="address-city-title">Alamat Operasional &amp; Kantor Resmi:</strong>
                    <p className="address-full-text">
                      JL Pleret, Desa/Kelurahan Malangjiwan, Kec. Colomadu, Kab. Karanganyar, Provinsi Jawa Tengah, 57177
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Prinsip Utama Kepercayaan (Our Core Values) */}
          <section className="about-values-section">
            <div className="section-title-center">
              <span className="pre-label">PRINSIP UTAMA KAMI</span>
              <h2>Mengapa Pebisnis Mempercayakan Operasionalnya pada Bithinks?</h2>
              <p className="sub-desc">
                Kepercayaan dibentuk dari konsistensi, kejujuran, dan bukti nyata dalam mendampingi pertumbuhan bisnis Anda.
              </p>
            </div>

            <div className="values-grid-3">
              <div className="value-card">
                <div className="val-icon-header">
                  <HeartHandshake size={28} color="#4F46E5" />
                  <h3>1. Kejujuran Biaya (No Hidden Fee)</h3>
                </div>
                <p>
                  Kami menolak praktik biaya tersembunyi. Skema perhitungan saldo pesanan Bithinks sebesar Rp 250 / pesanan dijelaskan secara terbuka dari awal. Kuota saldo yang Anda beli <strong>tidak memiliki tanggal kadaluarsa</strong> dan tidak akan hangus.
                </p>
              </div>

              <div className="value-card">
                <div className="val-icon-header">
                  <Scale size={28} color="#10B981" />
                  <h3>2. Keamanan &amp; Kerahasiaan Data</h3>
                </div>
                <p>
                  Data produk, data pelanggan, dan omset toko Anda adalah aset paling berharga milik Anda. Bithinks tidak pernah dan tidak akan pernah menjual atau membagikan data bisnis Anda kepada pihak ketiga untuk kepentingan komersial.
                </p>
              </div>

              <div className="value-card">
                <div className="val-icon-header">
                  <MessageSquare size={28} color="#2563EB" />
                  <h3>3. Dukungan Manusia 24/7</h3>
                </div>
                <p>
                  Saat terjadi kendala di lapangan, Anda tidak akan ditinggalkan sendiri bersama robot otomatis. Tim Customer Support Bithinks siap mendampingi Anda 24 jam sehari, 7 hari seminggu melalui WhatsApp dan Live Chat.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Ekosistem Aplikasi Bithinks */}
          <section className="about-ecosystem-section">
            <div className="ecosystem-box-wrapper">
              <div className="ecosystem-header">
                <Sparkles size={24} color="#818CF8" />
                <h2>Ekosistem Perangkat Lunak Bithinks</h2>
                <p>Satu platform terintegrasi yang tumbuh menyesuaikan skala bisnis Anda.</p>
              </div>

              <div className="apps-pill-grid">
                <div className="app-pill-item">
                  <span className="app-pill-title">BitOmni</span>
                  <span className="app-pill-desc">Omnichannel Sync &amp; Bulk Shipping Label</span>
                </div>
                <div className="app-pill-item">
                  <span className="app-pill-title">BitOne</span>
                  <span className="app-pill-desc">All-in-one Business Operating System</span>
                </div>
                <div className="app-pill-item">
                  <span className="app-pill-title">BitFine</span>
                  <span className="app-pill-desc">Laporan Keuangan &amp; Rekonsilasi Omset</span>
                </div>
                <div className="app-pill-item">
                  <span className="app-pill-title">BitPos</span>
                  <span className="app-pill-desc">Kasir Penjualan Ritel Offline</span>
                </div>
                <div className="app-pill-item">
                  <span className="app-pill-title">BitTeam</span>
                  <span className="app-pill-desc">Manajemen Karyawan &amp; Absensi</span>
                </div>
                <div className="app-pill-item">
                  <span className="app-pill-title">BitDev</span>
                  <span className="app-pill-desc">Custom Software Solution</span>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="about-cta-section">
            <div className="cta-card">
              <h2>Siap Mengoptimalkan Operasional Toko Anda?</h2>
              <p>Mulai dengan konsultasi gratis bersama tim spesialis kami tanpa komitmen apapun.</p>
              <div className="cta-btn-group">
                <a href="https://wa.me/6285156297948" target="_blank" rel="noopener noreferrer" className="cta-btn primary">
                  Konsultasi Gratis via WhatsApp
                </a>
                <button onClick={() => navigateTo('/terms')} className="cta-btn secondary">
                  Baca Syarat &amp; Ketentuan
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>

      <FloatingWhatsApp />
      <Footer />
    </div>
  );
};

export default AboutUs;
