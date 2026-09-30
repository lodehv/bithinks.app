import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import { navigateTo } from '../utils/navigation';
import { ShieldCheck, FileText, CheckCircle2, ChevronRight, Scale, Lock, Server, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import './TermsConditions.css';

const TermsConditions = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="terms-page-wrapper">
      <Navbar />

      {/* Hero Banner Header matching Jubelio reference design */}
      <header className="terms-hero-banner">
        <div className="terms-hero-container">
          <div className="terms-hero-grid">
            <div className="terms-hero-text">
              <div className="hero-breadcrumb-wrapper">
                <button className="page-back-breadcrumb" onClick={() => navigateTo('/bitomni')}>
                  <ArrowLeft size={14} /> <span>Kembali ke Bithinks Omnichannel</span>
                </button>
              </div>
              <span className="terms-pretitle">SYARAT &amp; KETENTUAN BITHINKS OMNICHANNEL</span>
              <h1 className="terms-main-title">SYARAT &amp; KETENTUAN BITHINKS</h1>
              <p className="terms-hero-subtitle">
                Aturan resmi dan kesepakatan penggunaan seluruh ekosistem layanan PT. Bithinks Digital Teknologi.
              </p>
            </div>

            <div className="terms-hero-illustration">
              <div className="terms-3d-paper-stack">
                <div className="terms-paper paper-1">
                  <div className="paper-line long"></div>
                  <div className="paper-line medium"></div>
                  <div className="paper-line short"></div>
                  <div className="paper-line long"></div>
                </div>
                <div className="terms-paper paper-2">
                  <div className="paper-line long"></div>
                  <div className="paper-line medium"></div>
                  <div className="paper-line short"></div>
                </div>
                <div className="terms-paper paper-3">
                  <div className="paper-icon-badge">
                    <ShieldCheck size={28} color="#4F46E5" />
                  </div>
                  <div className="paper-line long"></div>
                  <div className="paper-line medium"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sticky Navigation & Legal Text */}
      <main className="terms-content-container">
        <div className="container">
          <div className="terms-layout-grid">
            
            {/* Left Sticky Navigation Menu */}
            <aside className="terms-sidebar-nav">
              <div className="terms-sidebar-box">
                <h4 className="sidebar-title">Daftar Isi Perjanjian</h4>
                <ul className="sidebar-link-list">
                  <li>
                    <button onClick={() => scrollToSection('umum')}>
                      <ChevronRight size={14} /> Umum &amp; Definisi
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('istilah')}>
                      <ChevronRight size={14} /> 1. Istilah dan Pengertian
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('penggunaan')}>
                      <ChevronRight size={14} /> 2. Penggunaan Software
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('ketersediaan')}>
                      <ChevronRight size={14} /> 3. Ketersediaan Layanan
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('sla')}>
                      <ChevronRight size={14} /> 4. Tingkatan Layanan (SLA)
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('hak-kami')}>
                      <ChevronRight size={14} /> 5. Hak Bithinks
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('pembayaran')}>
                      <ChevronRight size={14} /> 6. Pembayaran &amp; Top-Up
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('keamanan')}>
                      <ChevronRight size={14} /> 7. Keamanan Data
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('hukum')}>
                      <ChevronRight size={14} /> 8. Hukum &amp; Sengketa
                    </button>
                  </li>
                </ul>
              </div>
            </aside>

            {/* Right Main Legal Text Body */}
            <article className="terms-article-body">
              
              {/* UMUM */}
              <section id="umum" className="terms-section-block">
                <div className="section-badge-header">
                  <FileText size={20} color="#4F46E5" />
                  <h2>Ketentuan Umum</h2>
                </div>
                <p className="legal-intro-text">
                  <strong>PT. Bithinks Digital Teknologi ("Bithinks")</strong> adalah perusahaan penyedia platform perangkat lunak sistem manajemen ritel dan integrasi omnichannel yang berkedudukan di Indonesia. Bithinks memberikan solusi manajemen omnichannel untuk meningkatkan efisiensi operasional, sinkronisasi stok real-time, cetak resi massal, dan pelaporan keuangan komprehensif bagi bisnis online dan offline Anda (<strong>"Layanan"</strong>) yang dapat diakses melalui situs resmi di <code>https://bithinks.com</code> atau aplikasi Bithinks (<strong>"Website"</strong>).
                </p>
                <ol className="legal-ordered-list">
                  <li>
                    Layanan Bithinks Omnichannel dapat terus dikembangkan dan diperbarui dari waktu ke waktu berdasarkan masukan pengguna serta perkembangan teknologi. Syarat dan Ketentuan ini berlaku bagi seluruh fitur dan layanan yang disediakan.
                  </li>
                  <li>
                    Syarat dan Ketentuan ini mengikat kesepakatan dan kesepahaman hukum yang sah antara PT. Bithinks Digital Teknologi ("Bithinks") dan perorangan maupun entitas bisnis yang terdaftar untuk menggunakan Jasa ("Pelanggan" / "Klien").
                  </li>
                  <li>
                    Dengan mendaftar, mengakses, atau menggunakan layanan Bithinks Omnichannel, Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui seluruh Syarat &amp; Ketentuan ini serta memiliki wewenang sah untuk bertindak atas nama akun bisnis yang terdaftar.
                  </li>
                  <li>
                    Bithinks berhak untuk mengubah Syarat &amp; Ketentuan ini kapan saja. Perubahan mulai berlaku efektif sejak dipublikasikan di Website Bithinks. Pelanggan disarankan untuk memeriksa halaman ini secara berkala.
                  </li>
                </ol>
              </section>

              {/* 1. ISTILAH DAN PENGERTIAN */}
              <section id="istilah" className="terms-section-block">
                <div className="section-badge-header">
                  <Scale size={20} color="#4F46E5" />
                  <h2>1. Istilah dan Pengertian</h2>
                </div>
                <ul className="legal-definitions-list">
                  <li>
                    <strong>Perjanjian:</strong> Syarat &amp; Ketentuan penggunaan layanan ini beserta seluruh lampiran resminya.
                  </li>
                  <li>
                    <strong>Biaya Berlangganan / Top-Up:</strong> Biaya yang dibayarkan oleh Pelanggan untuk kuota pemrosesan pesanan atau paket berlangganan sesuai tarif resmi yang berlaku di Website Bithinks.
                  </li>
                  <li>
                    <strong>Informasi Rahasia:</strong> Segala informasi data transaksi, keuangan, daftar produk, dan kredensial akun yang dipertukarkan antara Pelanggan dan Bithinks yang bersifat rahasia dan tidak diperuntukkan bagi publik.
                  </li>
                  <li>
                    <strong>Data Pelanggan:</strong> Seluruh data pesanan, inventori gudang, data toko marketplace (Shopee, Tokopedia, TikTok Shop, Lazada, Blibli), dan identitas bisnis yang dimasukkan ke dalam sistem Bithinks.
                  </li>
                  <li>
                    <strong>API (Application Programming Interface):</strong> Antarmuka pemrograman aplikasi yang digunakan untuk menghubungkan sistem Bithinks dengan platform pihak ketiga seperti saluran marketplace, kurir logistik, dan sistem kasir POS.
                  </li>
                  <li>
                    <strong>WMS (Warehouse Management System):</strong> Modul manajemen gudang Bithinks untuk pengelolaan stok fisik, stok siap jual, dan audit retur barang.
                  </li>
                  <li>
                    <strong>Pengguna Diundang:</strong> Setiap staf, admin, atau anggota tim yang diberikan hak akses oleh Pelanggan untuk mengoperasikan sistem Bithinks.
                  </li>
                </ul>
              </section>

              {/* 2. PENGGUNAAN SOFTWARE */}
              <section id="penggunaan" className="terms-section-block">
                <div className="section-badge-header">
                  <CheckCircle2 size={20} color="#4F46E5" />
                  <h2>2. Penggunaan Perangkat Lunak</h2>
                </div>
                <p>
                  Bithinks memberikan hak lisensi non-eksklusif dan tidak dapat dipindahtangankan kepada Anda untuk mengakses dan menggunakan sistem Bithinks Omnichannel sesuai dengan jenis paket yang dipilih. Anda mengakui dan menyetujui bahwa:
                </p>
                <ol className="legal-ordered-list">
                  <li>Pelanggan bertanggung jawab penuh atas penentuan hak akses, peran, dan wewenang yang diberikan kepada Pengguna Diundang (admin/staf).</li>
                  <li>Pelanggan bertanggung jawab atas seluruh aktivitas dan transaksi yang dilakukan melalui akun milik Pelanggan.</li>
                  <li>Pelanggan wajib menjaga kerahasiaan kata sandi, token API, dan kunci kredensial akun untuk mencegah akses tanpa hak oleh pihak lain.</li>
                </ol>
              </section>

              {/* 3. KETERSEDIAAN LAYANAN */}
              <section id="ketersediaan" className="terms-section-block">
                <div className="section-badge-header">
                  <Clock size={20} color="#4F46E5" />
                  <h2>3. Ketersediaan Layanan &amp; Dukungan Customer Service</h2>
                </div>
                <p>
                  PT. Bithinks Digital Teknologi menyediakan layanan dukungan pelanggan (Customer Support) untuk membantu pertanyaan operasional dan kendala teknis dengan jam operasional resmi sebagai berikut:
                </p>
                <div className="terms-hours-card">
                  <div className="hours-row">
                    <span className="day-label">Dukungan Customer Support &amp; Live Chat:</span>
                    <span className="time-value">24 Jam / 7 Hari (Nonstop)</span>
                  </div>
                </div>
              </section>

              {/* 4. TINGKATAN LAYANAN (SLA) */}
              <section id="sla" className="terms-section-block">
                <div className="section-badge-header">
                  <Server size={20} color="#4F46E5" />
                  <h2>4. Tingkatan Layanan &amp; Komitmen Uptime (SLA)</h2>
                </div>
                <p>
                  Kategori pelanggan dibagi berdasarkan volume kuota pesanan bulanan dan fasilitas pendampingan yang diberikan sebagai berikut:
                </p>

                <div className="terms-table-wrapper">
                  <table className="terms-sla-table">
                    <thead>
                      <tr>
                        <th>Tingkatan</th>
                        <th>Kriteria Volume Pesanan</th>
                        <th>Fasilitas Utama &amp; SLA Uptime</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="tier-badge platinum">Platinum</span></td>
                        <td>Pesanan ≥ 50.000 kuota/bulan</td>
                        <td>Akses Dedicated Account Manager, Uptime Server minimal <strong>99%</strong> per tahun.</td>
                      </tr>
                      <tr>
                        <td><span className="tier-badge gold">Gold</span></td>
                        <td>Pesanan 10.000 – 50.000 kuota/bulan</td>
                        <td>Akses Prioritas Live Support Chat, Uptime Server minimal <strong>98%</strong> per tahun.</td>
                      </tr>
                      <tr>
                        <td><span className="tier-badge silver">Silver</span></td>
                        <td>Pesanan &lt; 10.000 kuota/bulan</td>
                        <td>Akses Standar Live Support Chat, Uptime Server minimal <strong>97%</strong> per tahun.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="table-note-text">
                  *Tingkat downtime 1–3% per tahun dapat dialokasikan untuk pemeliharaan rutin (scheduled maintenance) dan peningkatan keamanan infrastruktur cloud.
                </p>
              </section>

              {/* 5. HAK BITHINKS */}
              <section id="hak-kami" className="terms-section-block">
                <div className="section-badge-header">
                  <AlertTriangle size={20} color="#EF4444" />
                  <h2>5. Hak PT. Bithinks Digital Teknologi</h2>
                </div>
                <p>
                  Bithinks berhak secara sah tanpa pemberitahuan atau persetujuan terlebih dahulu untuk:
                </p>
                <ol className="legal-ordered-list">
                  <li>
                    Membatasi, menangguhkan, atau menghentikan akses akun yang terbukti melanggar hukum Republik Indonesia (seperti perdagangan barang terlarang, judi online, penipuan, barang ilegal, atau pelanggaran HAKI).
                  </li>
                  <li>
                    Melakukan update, penyesuaian fitur, atau perbaikan infrastruktur teknis demi menjaga stabilitas dan performa sistem Bithinks Omnichannel.
                  </li>
                </ol>
              </section>

              {/* 6. PEMBAYARAN & TOP-UP */}
              <section id="pembayaran" className="terms-section-block">
                <div className="section-badge-header">
                  <Lock size={20} color="#4F46E5" />
                  <h2>6. Ketentuan Pembayaran &amp; Top-Up Saldo</h2>
                </div>
                <ol className="legal-ordered-list">
                  <li>Skema Top-Up Pesanan Bithinks menggunakan perhitungan transparan Rp 250 / pesanan tanpa biaya bulanan tersembunyi.</li>
                  <li>Saldo kuota pesanan yang telah dibeli <strong>tidak pernah hangus</strong> dan dapat digunakan kapan saja sampai kuota terpakai habis.</li>
                  <li>Seluruh pembayaran yang telah diproses bersifat final dan tidak dapat dikembalikan (non-refundable).</li>
                </ol>
              </section>

              {/* 7. KEAMANAN DATA */}
              <section id="keamanan" className="terms-section-block">
                <div className="section-badge-header">
                  <ShieldCheck size={20} color="#10B981" />
                  <h2>7. Kerahasiaan &amp; Keamanan Data</h2>
                </div>
                <p>
                  PT. Bithinks Digital Teknologi berkomitmen melindungi kerahasiaan data usaha dan data pribadi Pelanggan sesuai Undang-Undang Perlindungan Data Pribadi (UU PDP) Republik Indonesia. Data Pelanggan tidak akan dijual atau dibagikan kepada pihak ketiga tanpa izin sah Pelanggan.
                </p>
              </section>

              {/* 8. HUKUM & SENGKETA */}
              <section id="hukum" className="terms-section-block">
                <div className="section-badge-header">
                  <Scale size={20} color="#4F46E5" />
                  <h2>8. Hukum yang Berlaku &amp; Penyelesaian Sengketa</h2>
                </div>
                <p>
                  Syarat dan Ketentuan ini diatur oleh dan ditafsirkan berdasarkan hukum Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan terlebih dahulu secara musyawarah untuk mufakat, atau melalui jalur hukum di pengadilan Republik Indonesia.
                </p>
              </section>

              {/* Bottom Back Button */}
              <div className="terms-bottom-action">
                <button className="terms-back-home-btn" onClick={() => navigateTo('/')}>
                  Kembali ke Beranda Bithinks
                </button>
              </div>

            </article>

          </div>
        </div>
      </main>

      <FloatingWhatsApp />
      <Footer />
    </div>
  );
};

export default TermsConditions;
