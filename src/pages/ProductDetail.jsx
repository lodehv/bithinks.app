import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import { navigateTo } from '../utils/navigation';
import { PLANS, PERIODS, rupiah } from '../data/plans';
import gsap from 'gsap';
import './ProductDetail.css';

// Import Icons
import {
  ArrowLeft, ArrowRight, Zap, CheckCircle2, TrendingUp, Shield, BarChart3,
  Layers, Package, Users, Cpu, FileText, Smartphone, RefreshCw, Landmark,
  Calendar, CheckSquare, Clock, Globe, Settings, Terminal, Check, Flame
} from 'lucide-react';

// Import Mockup Images (Matching AppSelector.jsx)
import bitOneLogo from '../assets/logo_pilihan_fitur/bitone_logo-removebg-preview.png';
import bitOmniLogo from '../assets/logo_pilihan_fitur/bithinks_omnichannel_logo-removebg-preview.png';
import bithinksHeroPage from '../assets/bithinks_hero_page.png';
import bitFineLogo from '../assets/logo_pilihan_fitur/bit_finance_logo-removebg-preview.png';
import bitPosLogo from '../assets/logo_pilihan_fitur/bithinks_pos_logo_v2-removebg-preview.png';
import bitTeamLogo from '../assets/logo_pilihan_fitur/bithinks_hrm_logo-removebg-preview.png';
import bitDevLogo from '../assets/logo_pilihan_fitur/bithinks_dev_logo-removebg-preview.png';


import bitOneMockup from '../assets/logo_pilihan_fitur/bitone_mockup.png';
import financeMockup from '../assets/logo_pilihan_fitur/finance_mockup.png';
import posMockup from '../assets/logo_pilihan_fitur/pos_mockup.png';
import hrmMockup from '../assets/logo_pilihan_fitur/hrm_mockup.png';

const productsData = {
  bitone: {
    name: "Bithinks One [BitOne]",
    badgeText: "BitOne",
    tagline: "ERP & ALL-IN-ONE SYSTEM",
    headline: "Satu Platform ERP Terpadu untuk Jalankan Seluruh Divisi Bisnis Anda",
    description: "Lupakan kerumitan mengelola spreadsheet manual atau sistem yang terpisah-pisah. Bithinks One menghubungkan penjualan, manajemen inventori, keuangan, tim HR, hingga POS di satu tempat secara otomatis. Nikmati visibilitas bisnis 360 derajat untuk pengambilan keputusan yang cepat dan tepat.",
    color: "#0066FF",
    bgColor: "rgba(0, 102, 255, 0.04)",
    glowColor: "rgba(0, 102, 255, 0.15)",
    logo: bitOneLogo,
    mockupType: "erp",
    stats: [
      { value: "+180%", label: "Efisiensi Operasional" },
      { value: "10x", label: "Pelaporan Lebih Cepat" },
      { value: "0%", label: "Selisih Data Antar Divisi" }
    ],
    features: [
      {
        icon: <Layers color="#0066FF" size={24} />,
        title: "Integrasi Ujung-ke-Ujung",
        desc: "Setiap transaksi POS atau penjualan online otomatis memotong stok gudang, mencatat pendapatan di modul keuangan, dan memperbarui performa sales."
      },
      {
        icon: <BarChart3 color="#0066FF" size={24} />,
        title: "Laporan Konsolidasi Otomatis",
        desc: "Dapatkan dasbor analitik real-time yang merangkum laba kotor, perputaran kas, performa karyawan, dan tingkat kepuasan pelanggan secara instan."
      },
      {
        icon: <Package color="#0066FF" size={24} />,
        title: "Manajemen Gudang Cerdas",
        desc: "Pantau siklus barang dari supplier, kelola multi-gudang (multi-warehouse), set batas stok minimum, hingga otomatisasi reorder barang."
      },
      {
        icon: <Cpu color="#0066FF" size={24} />,
        title: "Modular & Skalabel",
        desc: "Mulai dengan modul dasar yang Anda butuhkan hari ini. Tambahkan modul POS, CRM, atau Payroll seiring berkembangnya usaha Anda tanpa migrasi data."
      }
    ],
    whyUs: [
      "Visibilitas bisnis 100% transparan bagi founder / direktur secara real-time.",
      "Mereduksi biaya operasional bulanan hingga 40% akibat efisiensi lisensi software terpisah.",
      "Didukung oleh infrastruktur cloud dengan proteksi data kelas enterprise."
    ]
  },
  bitomni: {
    name: "Bithinks Omnichannel [BitOmni]",
    badgeText: "BitOmni",
    tagline: "SINKRONISASI & ANALITIK MULTI-TOKO",
    headline: "Omzet, Profit, & Stok Semua Toko dalam Satu Dashboard Real-Time",
    description: "BitOmni menarik data penjualan Shopee & TikTok Shop Anda jadi satu laporan yang bisa dipercaya. Lihat profit bersih setelah potongan biaya platform, jaga stok tetap sinkron agar tak over-selling, dan proses semua pesanan tanpa bolak-balik buka seller center.",
    color: "#4F46E5",
    bgColor: "rgba(99, 102, 241, 0.06)",
    glowColor: "rgba(99, 102, 241, 0.18)",
    logo: bitOmniLogo,
    mockupType: "omni",
    stats: [
      { value: "Real-Time", label: "Laporan Omzet & Profit Bersih" },
      { value: "0", label: "Selisih Stok Antar Marketplace" },
      { value: "−80%", label: "Waktu Kelola Pesanan & Stok" }
    ],
    features: [
      {
        icon: <BarChart3 color="#4F46E5" size={24} />,
        title: "Analitik Omzet & Profit Bersih",
        desc: "Lihat omzet tiap toko, potongan biaya platform, dan profit bersih Anda yang sebenarnya — bukan sekadar penjualan kotor. Ketahui produk mana yang benar-benar cuan."
      },
      {
        icon: <RefreshCw color="#4F46E5" size={24} />,
        title: "Sinkronisasi Stok Real-Time",
        desc: "Begitu produk laku di satu toko, stok di Shopee, TikTok Shop, dan gudang fisik Anda ikut terpotong saat itu juga. Bebas dari over-selling dan komplain pembeli."
      },
      {
        icon: <CheckSquare color="#4F46E5" size={24} />,
        title: "Manajemen Pesanan Terpusat",
        desc: "Terima, proses, atur pickup kurir, dan cetak label pengiriman ratusan pesanan dari semua toko dalam satu layar — tanpa buka seller center satu per satu."
      },
      {
        icon: <Layers color="#4F46E5" size={24} />,
        title: "Katalog Master Sekali Atur",
        desc: "Kelola satu katalog produk, lalu tayangkan ke semua marketplace sekaligus. Ubah harga dan deskripsi secara massal tanpa input ulang di tiap toko."
      }
    ],
    whyUs: [
      "Tahu profit bersih asli tiap toko setelah semua potongan biaya platform, bukan cuma omzet kotor.",
      "Stok selalu sinkron di semua marketplace — cegah over-selling yang bikin poin toko kena penalti.",
      "Hemat waktu admin: kelola pesanan & stok semua toko dari satu tempat, tanpa login bergantian."
    ],
    ctaTitle: "Siap Naikkan Penjualan Semua Toko Marketplace Kamu?",
    ctaDesc: "Kelola stok, pesanan, sampai laporan omzet & profit semua toko dari satu tempat. Manajemen multi-toko yang lengkap bikin bisnis jalan tanpa ribet — kamu tinggal fokus jualan dan scale up."
  },
  bitfine: {
    name: "Bithinks Finance [BitFine]",
    badgeText: "BitFine",
    tagline: "FINANCIAL & REPORTING ENGINE",
    headline: "Laporan Keuangan Profesional & Arus Kas Akurat yang Terkalkulasi Otomatis",
    description: "Kendalikan penuh profitabilitas bisnis Anda tanpa butuh latar belakang akuntansi yang rumit. BitFine mengumpulkan semua data transaksi dari kasir retail dan marketplace, lalu menyulapnya menjadi laporan Laba Rugi, Neraca Keuangan, dan Arus Kas (Cash Flow) terstandarisasi PSAK secara instan.",
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.04)",
    glowColor: "rgba(59, 130, 246, 0.15)",
    logo: bitFineLogo,
    mockupType: "finance",
    stats: [
      { value: "100%", label: "Otomatisasi Laporan Laba Rugi" },
      { value: "0%", label: "Tingkat Kesalahan Pembukuan" },
      { value: "15+", label: "Metrik Analisis Keuangan Siap Pakai" }
    ],
    features: [
      {
        icon: <FileText color="#3B82F6" size={24} />,
        title: "Laporan Keuangan Siap Saji",
        desc: "Rilis laporan Neraca Keuangan, Laba Rugi, Cash Flow, dan Perubahan Modal secara berkala hanya dengan sekali klik."
      },
      {
        icon: <Landmark color="#3B82F6" size={24} />,
        title: "Rekonsiliasi Bank Otomatis",
        desc: "Sambungkan akun bank bisnis Anda, lalu biarkan AI kami mencocokkan mutasi rekening bank dengan catatan transaksi internal secara otomatis."
      },
      {
        icon: <TrendingUp color="#3B82F6" size={24} />,
        title: "Manajemen Anggaran & Biaya",
        desc: "Set budget per departemen, pantau pengeluaran operasional perusahaan secara real-time, dan deteksi pemborosan kas sejak dini."
      },
      {
        icon: <Shield color="#3B82F6" size={24} />,
        title: "Audit Trail & Keamanan Data",
        desc: "Setiap edit data keuangan tercatat lengkap dengan log user, waktu, dan perubahan nilai untuk mencegah manipulasi data internal."
      }
    ],
    whyUs: [
      "Standarisasi laporan keuangan baku yang siap diajukan untuk modal kerja perbankan atau investor.",
      "Efisiensi biaya menyewa akuntan eksternal ratusan juta rupiah per tahun.",
      "Integrasi langsung dengan tagihan modul purchasing dan POS retail."
    ]
  },
  bitpos: {
    name: "Bithinks POS [BitPos]",
    badgeText: "BitPos",
    tagline: "SMART POINT OF SALE SYSTEM",
    headline: "Kasir Pintar Super Cepat yang Terintegrasi Gudang & Keuangan",
    description: "BitPos memberikan pengalaman bertransaksi offline yang kilat, menyenangkan, dan aman. Didesain khusus untuk ritel modern, F&B, dan grosir, sistem POS kami mendukung berbagai integrasi perangkat keras kasir, metode pembayaran non-tunai, serta sistem offline-mode yang handal saat internet padam.",
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.04)",
    glowColor: "rgba(236, 72, 153, 0.15)",
    logo: bitPosLogo,
    mockupType: "pos",
    stats: [
      { value: "< 2 Detik", label: "Proses Pembayaran Transaksi" },
      { value: "100%", label: "Pembayaran QRIS & E-Wallet" },
      { value: "Offline", label: "Tetap Berfungsi Tanpa Internet" }
    ],
    features: [
      {
        icon: <Smartphone color="#EC4899" size={24} />,
        title: "UI Kasir Intuitif & Cepat",
        desc: "Staff kasir Anda dapat dilatih dalam waktu kurang dari 10 menit. Mendukung pencarian produk instan, scan barcode, dan edit keranjang."
      },
      {
        icon: <Zap color="#EC4899" size={24} />,
        title: "Integrasi Gudang & Multi-Outlet",
        desc: "Setiap transaksi POS otomatis mengurangi stok di gudang outlet terkait. Pantau penjualan seluruh cabang langsung dari HP Anda."
      },
      {
        icon: <Landmark color="#EC4899" size={24} />,
        title: "QRIS Dinamis & Multi-Payment",
        desc: "Generate kode QRIS otomatis di layar kasir, terima kartu debit/kredit, e-wallet (GoPay, OVO, ShopeePay), hingga uang tunai."
      },
      {
        icon: <RefreshCw color="#EC4899" size={24} />,
        title: "Offline-Mode Cerdas",
        desc: "Koneksi internet bermasalah? Kasir tetap dapat melayani penjualan dan mencetak struk belanja. Data akan disinkronkan ke cloud saat online."
      }
    ],
    whyUs: [
      "Integrasi langsung tanpa jeda dengan sistem keuangan BitFine untuk kalkulasi pajak dan pembukuan harian.",
      "Manajemen komisi sales dan hak akses staff kasir yang sangat granular.",
      "Kompatibel dengan printer struk bluetooth/LAN, barcode scanner, dan cash drawer."
    ]
  },
  bitteam: {
    name: "Bithinks Team [BitTeam]",
    badgeText: "BitTeam",
    tagline: "HUMAN RESOURCE & PAYROLL",
    headline: "Kelola Absensi Online, Manajemen Karyawan, & Payroll Tanpa Ribet",
    description: "Sederhanakan seluruh alur administrasi HRD perusahaan Anda. BitTeam mengotomatiskan pengelolaan database karyawan, absensi digital berbasis GPS dan deteksi wajah, pengajuan cuti, klaim expense (reimbursement), hingga perhitungan slip gaji bulanan lengkap dengan pajak PPh 21 dan BPJS Kesehatan/Ketenagakerjaan.",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.04)",
    glowColor: "rgba(16, 185, 129, 0.15)",
    logo: bitTeamLogo,
    mockupType: "team",
    stats: [
      { value: "90%", label: "Efisiensi Waktu Payroll Bulanan" },
      { value: "Anti-Cheat", label: "Absensi Valid dengan GPS & Selfie" },
      { value: "1 Klik", label: "Perhitungan Gaji Lengkap" }
    ],
    features: [
      {
        icon: <Users color="#10B981" size={24} />,
        title: "Absensi GPS & Deteksi Selfie",
        desc: "Karyawan melakukan absensi mandiri lewat smartphone. Sistem mendeteksi lokasi GPS dan wajah selfie secara akurat untuk memvalidasi presensi."
      },
      {
        icon: <Calendar color="#10B981" size={24} />,
        title: "Manajemen Cuti, Lembur, & Shift",
        desc: "Pengajuan dan persetujuan cuti, lembur, serta perubahan shift karyawan dikelola terpusat lewat sistem tanpa dokumen fisik."
      },
      {
        icon: <FileText color="#10B981" size={24} />,
        title: "Payroll & Pajak Otomatis",
        desc: "Hitung gaji bersih karyawan, tunjangan, potongan absensi/lembur, iuran BPJS, dan PPh 21 secara akurat dan otomatis."
      },
      {
        icon: <Clock color="#10B981" size={24} />,
        title: "Reimbursement Digital",
        desc: "Staff cukup memotret nota pengeluaran dan mengunggahnya ke aplikasi. Approval berjenjang diselesaikan langsung oleh manajemen."
      }
    ],
    whyUs: [
      "Transparansi slip gaji bagi seluruh karyawan melalui portal mandiri karyawan.",
      "Menghemat puluhan jam kerja divisi HRD dalam melakukan rekap absensi dan payroll manual di Excel.",
      "Kepatuhan regulasi perhitungan pajak PPh 21 terbaru dari Direktorat Jenderal Pajak."
    ]
  },
  bitdev: {
    name: "Bithinks Customize [BitDev]",
    badgeText: "BitDev",
    tagline: "MODULAR CUSTOM SYSTEM",
    headline: "Bangun Sistem Kustom Sesuai Alur Unik Bisnis Perusahaan Anda",
    description: "Jika bisnis Anda memiliki alur kerja, integrasi, dan aturan operasional yang sangat unik yang tidak bisa diakomodasi oleh software SaaS standar di pasar, BitDev adalah jawabannya. Kami membangun modul tambahan khusus yang berjalan selaras di atas fondasi ekosistem Bithinks yang super stabil.",
    color: "#4B5563",
    bgColor: "rgba(75, 85, 99, 0.04)",
    glowColor: "rgba(75, 85, 99, 0.15)",
    logo: bitDevLogo,
    mockupType: "custom",
    stats: [
      { value: "100%", label: "Kesesuaian Alur Operasional" },
      { value: "3x", label: "Lebih Cepat dari Build From Scratch" },
      { value: "Premium", label: "Arsitektur Skala Enterprise" }
    ],
    features: [
      {
        icon: <Terminal color="#4B5563" size={24} />,
        title: "Pengembangan Modul Kustom",
        desc: "Ubah alur kerja, buat laporan kustom, tambahkan database spesifik, atau buat visualisasi dasbor khusus yang unik bagi bisnis Anda."
      },
      {
        icon: <Settings color="#4B5563" size={24} />,
        title: "Integrasi API & Legacy Software",
        desc: "Hubungkan ekosistem Bithinks Anda dengan sistem ERP warisan perusahaan (SAP, Oracle), gerbang pembayaran kustom, atau kurir logistik khusus."
      },
      {
        icon: <Globe color="#4B5563" size={24} />,
        title: "Developer Profesional Pendamping",
        desc: "Proses pembangunan didampingi oleh tim Software Architect & Developer ahli kami, mulai dari fase requirement gathering hingga launching."
      },
      {
        icon: <Shield color="#4B5563" size={24} />,
        title: "Keamanan Khusus & Server Dedicated",
        desc: "Nikmati opsi deployment di server dedicated / on-premise dengan protokol enkripsi berlapis sesuai standar kepatuhan regulasi korporasi."
      }
    ],
    whyUs: [
      "Menghemat waktu dan budget hingga 70% dibanding mendesain ulang arsitektur sistem dari nol.",
      "Sistem kustom terjamin berjalan sinkron 100% dengan modul POS, Finance, dan Gudang bawaan Bithinks.",
      "Layanan dukungan teknis prioritas SLA tinggi (High SLA Service Level Agreement) 24/7."
    ]
  }
};

const ProductDetail = ({ appId }) => {
  const product = productsData[appId] || productsData.bitone;
  const containerRef = useRef(null);
  const [period, setPeriod] = useState(PERIODS[0]);

  useEffect(() => {
    // Scroll instantly to top on render
    window.scrollTo({ top: 0, behavior: 'instant' });

    const ctx = gsap.context(() => {
      // 1. Entrance animation for Left Header Title & Elements
      gsap.fromTo('.p-detail-tagline', 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
      
      gsap.fromTo('.p-detail-title', 
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: 'power3.out' }
      );
      
      gsap.fromTo('.p-detail-desc', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
      );

      gsap.fromTo('.p-detail-actions', 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power3.out' }
      );

      // 2. Entrance for Hero Mockup on the right
      gsap.fromTo('.p-detail-hero-mockup', 
        { scale: 0.95, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 1.2, delay: 0.25, ease: 'power4.out' }
      );

      // 3. Stagger entrance for statistics badges
      gsap.fromTo('.p-detail-stat-card', 
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, delay: 0.45, stagger: 0.1, ease: 'back.out(1.2)' }
      );

      // 4. Stagger entrance for key features
      gsap.fromTo('.p-feature-grid-card',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.p-features-showcase-section',
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );

      // 5. Stagger entrance for "Why Us" list
      gsap.fromTo('.p-why-li',
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.p-why-choose-section',
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );

      // 6. Fade-in CTA Box
      gsap.fromTo('.p-cta-box-wrapper',
        { scale: 0.96, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.p-cta-box-wrapper',
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [appId]);

  return (
    <div className={`app-container${appId === 'bitomni' ? ' ds-omni' : ''}`} ref={containerRef}>
      <Navbar />
      
      <main className="p-detail-main-layout">
        
        {/* SECTION 1: Product Detail Hero */}
        <section className="p-detail-hero-section" style={{ '--theme-bg': product.bgColor }}>
          <div className="p-detail-bg-accent" style={{ '--theme-glow': product.glowColor }}></div>
          
          <div className="container">
            {/* Back to Home Button */}
            <button className="p-detail-back-btn" onClick={() => navigateTo('/')}>
              <ArrowLeft size={16} /> <span>Kembali ke Beranda</span>
            </button>

            <div className="p-detail-hero-grid">
              
              {/* Left Info Column */}
              <div className="p-detail-hero-left">
                <div className="p-detail-badge-strip">
                  <div className="p-detail-logo-box">
                    <img src={product.logo} alt={product.name} />
                  </div>
                  <span className="p-detail-tagline" style={{ color: product.color }}>{product.tagline}</span>
                </div>
                
                <h1 className="p-detail-title">{product.headline}</h1>
                <p className="p-detail-desc">{product.description}</p>
                
                <div className="p-detail-actions">
                  <button 
                    className="p-btn-primary" 
                    style={{ backgroundColor: product.color }}
                    onClick={() => navigateTo('/register')}
                  >
                    <span>Coba {product.badgeText} Gratis</span>
                    <ArrowRight size={16} />
                  </button>
                  <button 
                    className="p-btn-secondary"
                    onClick={() => window.open('https://wa.me/628113000676?text=Halo%20Bithinks,%20saya%20ingin%20tanya%20mengenai%20fitur%20' + product.name, '_blank')}
                  >
                    Hubungi Sales
                  </button>
                </div>

                {/* Staggered Stats row */}
                <div className="p-detail-stats-row">
                  {product.stats.map((stat, i) => (
                    <div className="p-detail-stat-card" key={i} style={{ borderLeftColor: product.color }}>
                      <div className="p-detail-stat-value" style={{ color: product.color }}>{stat.value}</div>
                      <div className="p-detail-stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Mockup Representation Column */}
              <div className="p-detail-hero-right">
                <div className={`p-detail-hero-mockup${product.mockupType === 'omni' ? ' omni-hero' : ''}`} style={{ '--theme-color': product.color }}>
                  
                  {/* Decorative grid lines */}
                  <div className="p-detail-mockup-grid"></div>

                  {/* Dynamic Mockup Presentation */}
                  {product.mockupType === 'erp' && (
                    <img src={bitOneMockup} alt="Bithinks One ERP Mockup" className="p-mockup-img" />
                  )}

                  {product.mockupType === 'finance' && (
                    <img src={financeMockup} alt="Bithinks Finance Mockup" className="p-mockup-img" />
                  )}

                  {product.mockupType === 'pos' && (
                    <img src={posMockup} alt="Bithinks POS Cashier Mockup" className="p-mockup-img" />
                  )}

                  {product.mockupType === 'team' && (
                    <img src={hrmMockup} alt="Bithinks HRM Team Directory Mockup" className="p-mockup-img" />
                  )}

                  {product.mockupType === 'custom' && (
                    <div className="p-mockup-custom-ide">
                      <div className="ide-window-header">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                        <span className="ide-file-tab">bithinks-custom-logic.js</span>
                      </div>
                      <div className="ide-window-code">
                        <pre>
                          <code>
{`// Bithinks Custom API Engine
const bithinksEngine = require('@bithinks/core');

module.exports = async function customWorkflow(ctx) {
  const { cart, customer, db } = ctx;
  
  // Custom automated loyalty pipeline
  if (customer.tier === 'VIP') {
    await db.orders.applyDiscount(cart.id, 0.15);
    await db.inventory.reserveStock(cart.items);
    await db.notifications.sendWhatsApp(customer.phone, {
      template: 'vip_order_confirmed'
    });
  }
};`}
                          </code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {product.mockupType === 'omni' && (
                    <img src={bithinksHeroPage} alt="Dashboard BitOmni — ringkasan semua toko" className="p-mockup-img" />
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 2: Key Features Grid */}
        <section className="p-features-showcase-section">
          <div className="container">
            <div className="p-section-header">
              <span className="p-pretitle" style={{ color: product.color }}>FITUR ANDALAN</span>
              <h2 className="p-section-title">Apa yang Bisa Dilakukan {product.badgeText}?</h2>
              <p className="p-section-subtitle">
                Setiap detail alur fitur dirancang matang untuk mempercepat pertumbuhan bisnis Anda dan mengeliminasi proses manual.
              </p>
            </div>

            <div className="p-features-showcase-grid">
              {product.features.map((feat, idx) => (
                <div className="p-feature-grid-card" key={idx}>
                  <div className="p-feature-grid-icon-box" style={{ backgroundColor: product.bgColor }}>
                    {feat.icon}
                  </div>
                  <h3>{feat.title}</h3>
                  <p>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: Why Choose Us */}
        <section className="p-why-choose-section">
          <div className="container">
            <div className="p-why-grid-layout">
              <div className="p-why-left-text">
                <span className="p-pretitle" style={{ color: product.color }}>KEUNGGULAN UTAMA</span>
                <h2 className="p-section-title">Kenapa Harus Memilih {product.badgeText}?</h2>
                <p className="p-why-subtitle-desc">
                  Dibandingkan aplikasi kasir atau software pencatatan standar, {product.badgeText} memberikan keandalan kelas atas dan kemudahan integrasi total di bawah ekosistem Bithinks.
                </p>

                <ul className="p-why-ul">
                  {product.whyUs.map((liText, idx) => (
                    <li className="p-why-li" key={idx}>
                      <div className="p-li-icon-box" style={{ background: product.color }}>
                        <CheckCircle2 size={16} color="#FFFFFF" />
                      </div>
                      <span className="p-li-text">{liText}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-why-right-visual">
                <div className="p-why-visual-glass" style={{ '--glow-color': product.glowColor }}>
                  <div className="p-visual-header">
                    <Shield size={28} style={{ color: product.color }} />
                    <h4>Standar Keamanan Internasional</h4>
                  </div>
                  <p>
                    Data bisnis Anda adalah aset terpenting. Kami menjamin enkripsi database berlapis 256-bit SSL, backup otomatis harian, dan ketersediaan server (uptime guarantee) sebesar 99.9%.
                  </p>
                  
                  {/* Visual checklist mockup */}
                  <div className="p-why-visual-bullets">
                    <div className="bullet-row">
                      <Zap size={14} style={{ color: product.color }} />
                      <span>Server Cloud Latency Rendah (&lt;50ms)</span>
                    </div>
                    <div className="bullet-row">
                      <Zap size={14} style={{ color: product.color }} />
                      <span>Enkripsi Database End-to-End</span>
                    </div>
                    <div className="bullet-row">
                      <Zap size={14} style={{ color: product.color }} />
                      <span>Data Recovery Instan & Backup Otomatis</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3.5: Pricing (khusus BitOmni) */}
        {appId === 'bitomni' && (
          <section className="pp-section">
            <div className="container">
              <div className="p-section-header">
                <span className="p-pretitle" style={{ color: product.color }}>HARGA BERLANGGANAN</span>
                <h2 className="p-section-title">Pilih Paket Sesuai Skala Toko Anda</h2>
                <p className="p-section-subtitle">
                  Mulai gratis, upgrade kapan saja. Semua paket sudah termasuk sinkronisasi stok &amp; laporan multi-toko.
                </p>
              </div>

              <div className="pp-toggle">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    className={`pp-toggle-btn ${period.key === p.key ? 'active' : ''}`}
                    onClick={() => setPeriod(p)}
                  >
                    {p.save && <span className="pp-toggle-badge">{p.save}</span>}
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="pp-grid">
                {PLANS.map((plan) => {
                  const Icon = plan.icon;
                  const isFree = plan.price === 0;
                  const monthly = plan.price * (1 - period.disc);
                  return (
                    <div key={plan.key} className={`pp-card ${plan.highlighted ? 'featured' : ''}`}>
                      {plan.badge && (
                        <span className="pp-badge"><Flame size={12} /> {plan.badge}</span>
                      )}
                      <div className="pp-icon">
                        {isFree ? <span className="pp-icon-free">FREE</span> : <Icon size={24} />}
                      </div>
                      <div className="pp-name">{plan.name}</div>
                      <div className="pp-desc">{plan.desc}</div>
                      <div className="pp-price-block">
                        {isFree ? (
                          <div className="pp-price">Gratis <span className="pp-per">/ bln</span></div>
                        ) : (
                          <>
                            <div className="pp-price">{rupiah(monthly)} <span className="pp-per">/ bln</span></div>
                            <div className="pp-note">*Harga termasuk PPN 11%</div>
                          </>
                        )}
                      </div>
                      <ul className="pp-features">
                        {plan.features.map((f) => (
                          <li key={f}><span className="pp-check"><Check size={12} strokeWidth={3} /></span>{f}</li>
                        ))}
                      </ul>
                      <button className="pp-btn" onClick={() => navigateTo('/register')}>
                        {isFree ? 'Mulai Gratis' : 'Pilih Paket'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: High Impact Bottom CTA */}
        <section className="p-cta-bottom-section">
          <div className="container">
            <div className="p-cta-box-wrapper" style={{ backgroundColor: product.color }}>
              <div className="p-cta-content">
                <h2>{product.ctaTitle || `Siap Scale Up Bisnis Anda Bersama ${product.badgeText}?`}</h2>
                <p>
                  {product.ctaDesc || "Gabung bersama ribuan UMKM dan korporasi Indonesia lainnya yang telah mendigitalisasi operasionalnya secara cerdas bersama Bithinks."}
                </p>
                <div className="p-cta-action-row">
                  <button className="p-cta-btn-white" onClick={() => navigateTo('/register')}>
                    Coba Gratis
                  </button>
                  <button 
                    className="p-cta-btn-outline"
                    onClick={() => window.open('https://wa.me/628113000676?text=Halo%20Bithinks,%20saya%20tertarik%20dengan%20' + product.name, '_blank')}
                  >
                    Konsultasi Kustom
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default ProductDetail;
