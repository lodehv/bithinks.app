import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import { navigateTo } from '../utils/navigation';
import { ShieldCheck, Lock, Eye, FileText, Database, Server, ChevronRight, UserCheck, KeyRound } from 'lucide-react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
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
    <div className="privacy-page-wrapper">
      <Navbar />

      {/* Hero Banner Header matching Jubelio reference design */}
      <header className="privacy-hero-banner">
        <div className="privacy-hero-container">
          <div className="privacy-hero-grid">
            <div className="privacy-hero-text">
              <span className="privacy-pretitle">KEBIJAKAN PRIVASI BITHINKS OMNICHANNEL</span>
              <h1 className="privacy-main-title">KEBIJAKAN PRIVASI BITHINKS</h1>
              <p className="privacy-hero-subtitle">
                Komitmen perlindungan, keamanan, dan kerahasiaan data pribadi serta data bisnis Anda di seluruh ekosistem layanan PT. Bithinks Digital Teknologi.
              </p>
            </div>

            <div className="privacy-hero-illustration">
              <div className="privacy-3d-shield-stack">
                <div className="privacy-paper paper-1">
                  <div className="paper-line long"></div>
                  <div className="paper-line medium"></div>
                  <div className="paper-line short"></div>
                </div>
                <div className="privacy-paper paper-2">
                  <div className="paper-line long"></div>
                  <div className="paper-line medium"></div>
                </div>
                <div className="privacy-paper paper-3">
                  <div className="paper-icon-badge">
                    <ShieldCheck size={32} color="#10B981" />
                  </div>
                  <div className="paper-line long"></div>
                  <div className="paper-line short"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sticky Navigation & Legal Text */}
      <main className="privacy-content-container">
        <div className="container">
          <div className="privacy-layout-grid">
            
            {/* Left Sticky Navigation Menu */}
            <aside className="privacy-sidebar-nav">
              <div className="privacy-sidebar-box">
                <h4 className="sidebar-title">Daftar Isi Kebijakan</h4>
                <ul className="sidebar-link-list">
                  <li>
                    <button onClick={() => scrollToSection('prakata')}>
                      <ChevronRight size={14} /> Umum &amp; Komitmen PDP
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('pengumpulan')}>
                      <ChevronRight size={14} /> 1. Data yang Dikumpulkan
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('penggunaan')}>
                      <ChevronRight size={14} /> 2. Penggunaan Informasi
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('pengungkapan')}>
                      <ChevronRight size={14} /> 3. Pengungkapan Data
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('keamanan')}>
                      <ChevronRight size={14} /> 4. Keamanan &amp; Enkripsi
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('retensi')}>
                      <ChevronRight size={14} /> 5. Retensi &amp; Penyimpanan
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('hak-pengguna')}>
                      <ChevronRight size={14} /> 6. Hak Pemilik Data
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('perubahan')}>
                      <ChevronRight size={14} /> 7. Perubahan Kebijakan
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('kontak')}>
                      <ChevronRight size={14} /> 8. Hubungi Kami
                    </button>
                  </li>
                </ul>
              </div>
            </aside>

            {/* Right Main Legal Text Body */}
            <article className="privacy-article-body">
              
              {/* PRAKATA */}
              <section id="prakata" className="privacy-section-block">
                <div className="section-badge-header">
                  <FileText size={20} color="#4F46E5" />
                  <h2>Umum &amp; Komitmen Perlindungan Data</h2>
                </div>
                <p className="legal-intro-text">
                  <strong>PT. Bithinks Digital Teknologi ("Bithinks")</strong> menghargai kerahasiaan dan privasi setiap informasi pribadi serta data transaksi bisnis milik Pelanggan (<strong>"Anda"</strong>). Kebijakan Privasi ini menjelaskan bagaimana Bithinks mengumpulkan, mengelola, menyimpan, mengintegrasikan, dan melindungi Informasi Pribadi dan Data Bisnis Anda saat menggunakan platform sistem manajemen ritel dan omnichannel Bithinks (<strong>"Layanan"</strong>) melalui situs resmi <code>https://bithinks.com</code> maupun aplikasi Bithinks.
                </p>
                <p className="legal-intro-text">
                  Bithinks tunduk dan patuh pada <strong>Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)</strong> serta peraturan perundang-undangan terkait di Indonesia. Dengan mendaftar atau menggunakan Layanan Bithinks, Anda menyetujui pengumpulan dan penggunaan informasi sesuai dengan Kebijakan Privasi ini.
                </p>
              </section>

              {/* 1. DATA YANG DIKUMPULKAN */}
              <section id="pengumpulan" className="privacy-section-block">
                <div className="section-badge-header">
                  <Database size={20} color="#4F46E5" />
                  <h2>1. Informasi Data yang Kami Kumpulkan</h2>
                </div>
                <p>
                  Untuk memberikan layanan integrasi toko online dan manajemen toko omnichannel yang optimal, Bithinks mengumpulkan informasi berikut:
                </p>
                <ul className="legal-definitions-list">
                  <li>
                    <strong>Informasi Identitas &amp; Pendaftaran:</strong> Nama lengkap, alamat email, nomor telepon/WhatsApp, nama perusahaan, serta alamat operasional usaha yang dimasukkan saat pembuatan akun.
                  </li>
                  <li>
                    <strong>Informasi Toko &amp; Integrasi Marketplace:</strong> Token akses OAuth API toko marketplace (Shopee, Tokopedia, TikTok Shop, Lazada, Blibli), nama toko online, URL toko, rincian katalog produk, harga, stok inventori gudang, dan gambar produk.
                  </li>
                  <li>
                    <strong>Informasi Pesanan &amp; Transaksi:</strong> Rincian nomor pesanan, nama dan alamat penerima paket, nomor resi pengiriman, status pembayaran, serta nilai transaksi yang disinkronisasikan dari saluran penjualan.
                  </li>
                  <li>
                    <strong>Informasi Perangkat &amp; Teknis:</strong> Alamat IP (Internet Protocol), jenis peramban (browser), sistem operasi, log aktivitas pengguna di dalam sistem Bithinks, dan data *cookies* sesi login.
                  </li>
                </ul>
              </section>

              {/* 2. PENGGUNAAN INFORMASI */}
              <section id="penggunaan" className="privacy-section-block">
                <div className="section-badge-header">
                  <UserCheck size={20} color="#4F46E5" />
                  <h2>2. Penggunaan Informasi Data</h2>
                </div>
                <p>
                  Informasi yang dikumpulkan oleh PT. Bithinks Digital Teknologi digunakan khusus untuk tujuan operasional berikut:
                </p>
                <ol className="legal-ordered-list">
                  <li>Menyediakan, mengoperasikan, dan menjaga keandalan ekosistem Bithinks Omnichannel.</li>
                  <li>Menyinkronkan stok barang secara real-time di seluruh toko online terhubung untuk mencegah *overselling*.</li>
                  <li>Memproses pesanan masuk, mencetak label/resi pengiriman massal (bulk shipping label), serta memfasilitasi penjemputan (pickup) oleh kurir logistik.</li>
                  <li>Menyusun laporan keuangan, analisis penjualan, dan rekonsilasi omset toko milik Anda.</li>
                  <li>Memberikan dukungan teknis dan layanan pelanggan (Customer Support 24/7) dalam menangani kendala operasional.</li>
                  <li>Mengirimkan notifikasi penting mengenai pembaruan sistem, fitur baru, dan informasi penagihan berlangganan.</li>
                </ol>
              </section>

              {/* 3. PENGUNGKAPAN DATA */}
              <section id="pengungkapan" className="privacy-section-block">
                <div className="section-badge-header">
                  <Eye size={20} color="#4F46E5" />
                  <h2>3. Pengungkapan Data Kepada Pihak Ketiga</h2>
                </div>
                <p>
                  <strong>PT. Bithinks Digital Teknologi TIDAK PERNAH menjual, menyewakan, atau memperdagangkan Data Pribadi dan Data Bisnis Anda kepada pihak ketiga manapun untuk kepentingan komersial.</strong>
                </p>
                <p>
                  Data Anda hanya dapat dipertukarkan dengan pihak ketiga dalam kondisi terbatas sebagai berikut:
                </p>
                <ol className="legal-ordered-list">
                  <li>
                    <strong>Mitra Saluran Penjualan &amp; Ekspedisi:</strong> Mengirimkan informasi transaksi kepada platform marketplace (Shopee, Tokopedia, dll) dan mitra kurir logistik demi terlaksananya proses pengolahan dan pengiriman pesanan Anda.
                  </li>
                  <li>
                    <strong>Mitra Gerbang Pembayaran (Payment Gateway):</strong> Memproses transaksi top-up kuota atau pembayaran biaya berlangganan secara aman.
                  </li>
                  <li>
                    <strong>Kewajiban Hukum:</strong> Apabila diwajibkan oleh hukum, peraturan perundang-undangan yang berlaku, atau perintah pengadilan instansi pemerintah Republik Indonesia yang sah.
                  </li>
                </ol>
              </section>

              {/* 4. KEAMANAN & ENKRIPSI */}
              <section id="keamanan" className="privacy-section-block">
                <div className="section-badge-header">
                  <Lock size={20} color="#10B981" />
                  <h2>4. Keamanan &amp; Enkripsi Data</h2>
                </div>
                <p>
                  Keamanan data bisnis Anda adalah prioritas tertinggi Bithinks. Kami menerapkan standar teknis dan manajerial tingkat tinggi untuk melindungi data dari akses tanpa hak, pengubahan, pengungkapan, atau perusakan yang tidak sah:
                </p>
                <ul className="legal-definitions-list">
                  <li>
                    <strong>Enkripsi SSL/TLS 256-bit:</strong> Seluruh komunikasi data antara peramban Anda dan server Bithinks dilindungi enkripsi standar industri.
                  </li>
                  <li>
                    <strong>Infrastruktur Cloud Aman:</strong> Data disimpan pada pusat data (data center) berkualitas tinggi dengan proteksi firewall ketat, deteksi intrusi, dan backup berkala.
                  </li>
                  <li>
                    <strong>Kontrol Akses Terbatas:</strong> Hanya personel Bithinks berwenang yang memiliki akses operasional terbatas untuk tujuan layanan dan pemeliharaan teknis.
                  </li>
                </ul>
              </section>

              {/* 5. RETENSI & PENYIMPANAN */}
              <section id="retensi" className="privacy-section-block">
                <div className="section-badge-header">
                  <Server size={20} color="#4F46E5" />
                  <h2>5. Penyimpanan &amp; Retensi Data</h2>
                </div>
                <p>
                  PT. Bithinks Digital Teknologi menyimpan Data Anda selama akun Anda aktif atau selama diperlukan untuk menyediakan Layanan. Apabila Anda memutuskan untuk berhenti berlangganan atau menutup akun, Bithinks akan menghapus atau menganonimkan Data Anda sesuai ketentuan hukum yang berlaku, kecuali data tertentu yang wajib disimpan untuk keperluan pembukuan audit keuangan dan kewajiban hukum.
                </p>
              </section>

              {/* 6. HAK PEMILIK DATA */}
              <section id="hak-pengguna" className="privacy-section-block">
                <div className="section-badge-header">
                  <KeyRound size={20} color="#4F46E5" />
                  <h2>6. Hak-Hak Pemilik Data (Sesuai UU PDP)</h2>
                </div>
                <p>
                  Sebagai pemilik data yang sah, Anda memiliki hak-hak berikut terkait informasi Anda:
                </p>
                <ol className="legal-ordered-list">
                  <li>Hak untuk mengakses dan meminta salinan data pribadi yang tersimpan di sistem Bithinks.</li>
                  <li>Hak untuk memperbarui atau mengoreksi data yang tidak akurat atau tidak lengkap.</li>
                  <li>Hak untuk menghapus atau menarik kembali persetujuan pemrosesan data pribadi (dengan mengabaikan konsekuensi penghentian akses Layanan).</li>
                </ol>
              </section>

              {/* 7. PERUBAHAN KEBIJAKAN */}
              <section id="perubahan" className="privacy-section-block">
                <div className="section-badge-header">
                  <ShieldCheck size={20} color="#4F46E5" />
                  <h2>7. Perubahan Kebijakan Privasi</h2>
                </div>
                <p>
                  Bithinks dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu untuk menyesuaikan dengan perubahan layanan atau regulasi hukum. Setiap pembaruan akan dipublikasikan pada halaman ini. Anda disarankan untuk memeriksa Kebijakan Privasi ini secara berkala.
                </p>
              </section>

              {/* 8. KONTAK */}
              <section id="kontak" className="privacy-section-block">
                <div className="section-badge-header">
                  <FileText size={20} color="#4F46E5" />
                  <h2>8. Hubungi Kami / Data Protection Officer</h2>
                </div>
                <p>
                  Jika Anda memiliki pertanyaan, saran, atau keluhan terkait Kebijakan Privasi ini atau pemrosesan Data Anda oleh PT. Bithinks Digital Teknologi, Anda dapat menghubungi tim kami melalui:
                </p>
                <div className="privacy-contact-card">
                  <p><strong>PT. Bithinks Digital Teknologi</strong></p>
                  <p>Alamat: JL Pleret, Desa/Kelurahan Malangjiwan, Kec. Colomadu, Kab. Karanganyar, Jawa Tengah, 57177</p>
                  <p>Email Support: <code>bithinksdigital@gmail.com</code></p>
                  <p>WhatsApp Support: <code>+62 851 5629 7948</code></p>
                </div>
              </section>

              {/* Bottom Back Button */}
              <div className="privacy-bottom-action">
                <button className="privacy-back-home-btn" onClick={() => navigateTo('/')}>
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

export default PrivacyPolicy;
