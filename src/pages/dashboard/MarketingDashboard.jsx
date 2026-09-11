import { useState, useEffect, Fragment } from "react";
import { omniApi } from "../../utils/omniApi";
import { teksRibuan, bacaRibuan } from "../../utils/angka";
import { 
  Calendar, Filter, ChevronDown, Check, X, 
  HelpCircle, RefreshCw, BarChart3, DollarSign, 
  TrendingUp, ShoppingCart, Percent
} from "lucide-react";
import "./MarketingDashboard.css";

// ─────────────────────────────────────────────────────────────────────────────
// RENTANG BAWAAN SAAT HALAMAN DIBUKA — HARI INI SAJA, dan DITULIS di kolom
// tanggalnya.
//
// Sebelumnya kedua kolom dibiarkan kosong. Kosong di sini tidak berarti "belum
// dipilih" — di server ia berarti "seluruh pesanan sejak toko tersambung".
// Jadi kolomnya menampilkan "dd/mm/yyyy" sambil diam-diam menarik seluruh
// riwayat, dan orang menunggu tanpa tahu sedang menunggu apa.
//
// Yang diperbaiki bukan cuma lamanya, tapi kejujuran kontrolnya: kolom tanggal
// menyebut persis rentang yang sedang ditampilkan. Mau rentang lain — sebulan,
// setahun, atau seluruh riwayat dengan mengosongkannya — semuanya masih ada,
// cuma tidak lagi jadi keadaan bawaan yang tak terucapkan.
//
// Keputusan pemilik toko 28 Agustus 2026: yang pertama dilihat saat membuka
// halaman adalah HARI INI. Sempat 30 hari sepanjang hari itu juga; diganti
// karena pertanyaan pertama tiap pagi bukan "sebulan ini berapa", melainkan
// "hari ini jalan atau tidak".
//
// Satu hari berarti grafik trennya cuma punya SATU titik. Itu sudah aman:
// `px()` menaruh titik tunggal di tengah alih-alih membagi dengan nol
// (trendData.length - 1). Diperiksa sebelum angka ini diubah.
// ─────────────────────────────────────────────────────────────────────────────
const HARI_BAWAAN = 1;

// Tanggal hari ini menurut WIB, bukan menurut jam mesin pemakainya.
// Backend membatasi harinya di WIB (lib/waktu/wib.ts); kalau sisi ini memakai
// zona laptop, batas rentangnya bisa meleset satu hari untuk pemakai di luar WIB.
function tanggalWib(mundurHari = 0) {
  const wib = new Date(Date.now() + 7 * 3600_000 - mundurHari * 86_400_000);
  return wib.toISOString().slice(0, 10);
}

export default function MarketingDashboard() {
  // ─── Filter States ────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState(() => tanggalWib(HARI_BAWAAN - 1));
  const [endDate, setEndDate] = useState(() => tanggalWib(0));
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  
  // Popover Toggle States
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  // ─── API Data States ──────────────────────────────────────────────────────
  const [stores, setStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [stats, setStats] = useState(null);               // { totals, buckets, meta } dari backend

  // Rincian per toko. Sampai 20 Agustus 2026 nilai ini dibiarkan array kosong
  // dan `setMarketingData` TIDAK PERNAH dipanggil sekali pun — tabelnya
  // mustahil terisi sejak hari pertama. Sekarang datang dari server, memakai
  // partisi omset yang sama dengan totalnya.
  //
  // HARUS di bawah `stats`. Sempat ditaruh di atasnya, dan itu menjatuhkan
  // SELURUH halaman jadi layar putih: `Cannot access '_' before
  // initialization`. Build dan lint dua-duanya hijau — yang begini hanya
  // ketahuan kalau halamannya benar-benar dibuka.
  const marketingData = Array.isArray(stats?.per_toko) ? stats.per_toko : [];
  const [isSubmittingFilters, setIsSubmittingFilters] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  // Biaya iklan yang SEDANG DIKETIK, per toko. Terpisah dari angka tersimpan
  // supaya sel yang sedang disunting tidak ditimpa saat laporan dimuat ulang.
  // Kuncinya storeId; nilainya teks apa adanya, masih berpemisah ribuan.
  const [iklanDraf, setIklanDraf] = useState({});
  const [iklanSimpan, setIklanSimpan] = useState(null); // storeId yang sedang disimpan
  const [iklanGagal, setIklanGagal] = useState(null);   // storeId yang gagal disimpan
  const [hoverIdx, setHoverIdx] = useState(null); // titik tren yang di-hover

  // List of standard platforms
  const PLATFORMS = [
    { id: "shopee", name: "Shopee" },
    { id: "tokopedia", name: "Tokopedia" },
    { id: "tiktok", name: "TikTok Shop" },
    { id: "lazada", name: "Lazada" }
  ];

  // Load stores dynamically from omnichannel configuration
  useEffect(() => {
    setIsLoadingStores(true);
    omniApi.listStores()
      .then((data) => {
        if (Array.isArray(data)) {
          setStores(data);
        }
      })
      .catch((err) => console.error("Gagal memuat toko:", err))
      .finally(() => setIsLoadingStores(false));
  }, []);

  // ─── Multi-Select Handlers ────────────────────────────────────────────────
  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId) 
        : [...prev, platformId]
    );
  };

  const toggleStore = (storeId) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId) 
        : [...prev, storeId]
    );
  };

  // "Atur Ulang" mengembalikan ke keadaan bawaan — termasuk rentang hari ini.
  // Dikosongkan sama sekali justru bukan "bersih", melainkan diam-diam menarik
  // seluruh riwayat: kebalikan dari yang diharapkan orang saat menekan tombol ini.
  const clearAllFilters = () => {
    setStartDate(tanggalWib(HARI_BAWAAN - 1));
    setEndDate(tanggalWib(0));
    setSelectedPlatforms([]);
    setSelectedStores([]);
    setIklanDraf({});
    setIklanGagal(null);
  };

  // ─── Ambil metrik dari backend ─────────────────────────────────────────────
  const fetchStats = (overrides = {}) => {
    setIsSubmittingFilters(true);
    return omniApi
      .getMarketingStats({
        startDate,
        endDate,
        platforms: selectedPlatforms,
        stores: selectedStores,
        granularity: "day",
        ...overrides,
      })
      .then((data) => setStats(data))
      .catch((err) => console.error("Gagal memuat metrik marketing:", err))
      .finally(() => setIsSubmittingFilters(false));
  };

  // ─── Biaya iklan per toko ──────────────────────────────────────────────────
  // Disimpan per toko per HARI. Butir yang lebih kasar tidak bisa dipotong
  // mengikuti rentang mana pun tanpa membagi rata, dan membagi rata berarti
  // mengarang angka yang bukan biaya iklan toko itu.
  //
  // Akibatnya kolomnya hanya bisa disunting saat rentangnya TEPAT SATU HARI.
  // Pada rentang yang lebih panjang angkanya tetap ditampilkan sebagai jumlah,
  // tapi tidak bisa diketik — menerima ketikan di sana berarti kita harus
  // menebak hari mana yang dimaksud.
  const rentangSatuHari = Boolean(startDate) && startDate === endDate;

  const simpanIklan = (storeId, teks) => {
    if (!rentangSatuHari) return;
    setIklanSimpan(storeId);
    setIklanGagal(null);
    return omniApi
      .saveAdSpend({ storeId, date: startDate, amount: bacaRibuan(teks) })
      .then(() => {
        // Draf dilepas supaya sel kembali membaca angka dari server. Selama
        // draf masih ada, layar memperlihatkan yang diketik — bukan yang
        // benar-benar tersimpan.
        setIklanDraf((d) => {
          const salin = { ...d };
          delete salin[storeId];
          return salin;
        });
        return fetchStats();
      })
      .catch((err) => {
        console.error("Gagal menyimpan biaya iklan:", err);
        // Draf SENGAJA dipertahankan. Menghapusnya akan membuat angka yang
        // diketik lenyap tanpa pernah tersimpan, dan layar akan terlihat
        // seperti tidak terjadi apa-apa.
        setIklanGagal(storeId);
      })
      .finally(() => setIklanSimpan(null));
  };

  // Muat awal memakai rentang bawaan HARI INI (lihat HARI_BAWAAN di atas), bukan
  // lagi seluruh riwayat.
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Keadaan memuat ────────────────────────────────────────────────────────
  // `stats === null` berarti jawaban pertama belum pernah datang. Bedanya
  // dengan `isSubmittingFilters` penting: yang satu "belum ada apa-apa", yang
  // satu "sedang diperbarui". Keduanya diberi tanda yang sama di layar, tapi
  // hanya yang pertama yang boleh menahan angka supaya tidak terbaca.
  const belumAdaJawaban = stats === null;
  const sedangMemuat = isSubmittingFilters || belumAdaJawaban;

  const handleApplyFilters = () => {
    fetchStats();
  };

  // ─── Metrik dari backend (acuan: docs/SPEC-dashboard-marketing.md) ──────────
  // Angka status dihitung server-side: bucket order_date + as_of + GMV(diskon seller).
  // Partisi status → Kotor = pipeline+terkonfirmasi+berisiko+retur+dibatalkan (tidak dobel).
  const t = stats?.totals ?? {};
  const totalOmsetKotor     = t.omsetKotor     ?? 0;
  const totalOmsetPerkiraan = t.omsetPerkiraan ?? 0; // pipeline + terkonfirmasi + berisiko
  const totalPipeline       = t.pipeline       ?? 0;
  const totalBerisiko       = t.berisiko       ?? 0;
  const totalRetur          = t.retur          ?? 0;
  const totalDibatalkan     = t.dibatalkan     ?? 0;

  // ─── TIGA SUDUT PANDANG ────────────────────────────────────────────────────
  // Satu himpunan pesanan, tiga pertanyaan yang selama ini dijawab satu angka.
  // Diukur di produksi: pesanan sampai ke pembeli rata-rata 8–9 hari setelah
  // dibuat, dan uangnya cair beberapa hari setelah itu lagi. Karena itu kartu
  // "Terkonfirmasi" pada sumbu tanggal-pesanan berbunyi Rp 0 SETIAP HARI —
  // bukan kerusakan, melainkan aritmetika.
  //
  // Ketiganya BERDIRI SENDIRI dan tidak boleh dijumlahkan: pesanan yang sama
  // muncul di ketiganya pada tanggal yang berbeda-beda.
  const pov = stats?.pov ?? null;

  // ─── POSISI UANG (saldo) ───────────────────────────────────────────────────
  // Sengaja TIDAK mengikuti saringan tanggal — ia menjawab "uang saya SEKARANG
  // di mana", bukan "hari ini terjadi apa". Kalau ikut disaring, pesanan yang
  // dikirim minggu lalu dan masih di jalan hari ini akan hilang dari posisi,
  // padahal justru itu uang yang belum di tangan.
  //
  // Layar WAJIB menyebutkan itu. Kontrol yang diam-diam diabaikan adalah
  // kontrol yang berbohong — pelajaran yang sama dengan kolom tanggal kosong.
  const posisi = stats?.posisi ?? null;

  // ─── CAKUPAN BEBAN — peringatannya dihapus 11 September 2026 ──────────────
  // Layar pernah memuat spanduk "Laba di bawah ini masih terlalu besar" yang
  // menyebut persentase cakupan dan jarak sinkronisasi terakhir. Keputusan
  // pemilik toko: dihapus.
  //
  // Server MASIH mengirim `cakupan_beban`, dan angkanya masih benar. Yang
  // hilang cuma tempat menampilkannya; kalau kelak perlu ditampilkan lagi,
  // datanya sudah ada tanpa perlu menyentuh backend.

  // "Breakdown status" hanya berarti untuk rentang PANJANG. Di rentang satu
  // hari, Pipeline selalu sama persis dengan Omset Perkiraan (pesanan hari ini
  // belum mungkin sampai), jadi ia cuma mengulang angka yang sudah ada di
  // sebelahnya — dan angka yang sama muncul empat kali di satu layar.
  const hariRentang = (() => {
    if (!startDate || !endDate) return 999;
    const a = Date.parse(startDate), b = Date.parse(endDate);
    return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / 86_400_000) + 1 : 999;
  })();
  const rentangPanjang = hariRentang >= 7;
  const povOmset = pov?.omset?.nilai ?? 0;

  // Turunan untuk kartu TUNTAS dan PENERIMAAN ikut dibuang bersama kartunya.
  // Keputusan pemilik toko 29 Agu 2026: zona arus cukup memuat satu hitungan
  // yang bisa dibaca berurutan. Kedua peristiwa itu memang menjawab pertanyaan
  // lain, dan perjalanannya sudah tergambar utuh di Posisi Uang di atas —
  // menampilkannya dua kali cuma mengundang orang menjumlahkannya.
  //
  // Nilainya masih dikirim server; kalau kelak tidak dipakai sama sekali,
  // perhitungannya di route layak ikut dicabut supaya tidak jadi kerja sia-sia
  // pada tiap permintaan.

  // Beban platform (PRD: biaya_api) + rincian per platform (cost_breakdown[]).
  // COGS dulu dipaku nol dengan catatan "menyusul" — catatan itu tertinggal.
  // Perhitungannya (resep SKU x HPP master) sudah lama ada dan dipakai halaman
  // Master Produk; sejak 20 Agustus 2026 laporan ini memakainya juga.
  const totalCogs = stats?.cogs_total ?? 0;
  const totalFees = stats?.biaya_api ?? 0;
  const costBreakdown = Array.isArray(stats?.cost_breakdown) ? stats.cost_breakdown : [];
  // Laba dan margin datang JADI dari server, tidak dihitung ulang di sini.
  // Versi lama menghitungnya sendiri sebagai omset − COGS − beban, TANPA biaya
  // iklan — sementara server mengurangkan iklan juga. Dua rumus untuk angka
  // yang sama, dan yang tampil di layar adalah yang melupakan iklan.
  // Biaya iklan dijumlahkan dari BARIS PER TOKO, bukan dari satu kolom isian.
  // Sumber yang sama dengan yang dipakai tiap barisnya, jadi total dan rincian
  // tidak bisa berselisih.
  const totalIklan = marketingData.reduce((a, b) => a + (b.iklan || 0), 0);
  const totalProfit = stats?.profit ?? (totalOmsetPerkiraan - totalCogs - totalFees - totalIklan);
  const marginPercent = stats?.profit_margin
    ?? (totalOmsetPerkiraan > 0 ? (totalProfit / totalOmsetPerkiraan) * 100 : 0);

  // ── Donat: SATU dasar untuk semua persentase ──
  //
  // Sebelumnya labanya dihitung dari omset PERKIRAAN tapi persentasenya dibagi
  // omset KOTOR. Dua dasar yang berbeda dicampur, jadi potongannya tidak pernah
  // genap 100% — terlihat di layar sebagai 78,7% + 18,7% = 97,4%, dengan 2,6%
  // yang tidak bisa dijelaskan siapa pun.
  //
  // Keputusan pemilik toko 20 Agustus 2026: semuanya memakai omset PERKIRAAN.
  // Omset kotor tetap ditampilkan sebagai angka tersendiri di kartu atas.
  const dasarOmset = totalOmsetPerkiraan;
  const hasData = dasarOmset > 0;
  const pct = (v) => (hasData ? Math.max(0, (v / dasarOmset) * 100) : 0);
  const profitPct = pct(totalProfit);
  const feesPct = pct(totalFees);
  const cogsPct = pct(totalCogs);
  const returPct = pct(totalRetur);

  const radius = 40;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~251.32

  const profitDash = (profitPct / 100) * circumference;
  const feesDash = (feesPct / 100) * circumference;
  const returDash = (returPct / 100) * circumference;
  const cogsDash = (cogsPct / 100) * circumference;

  const profitOffset = 0;
  const feesOffset = -profitDash;
  const returOffset = -(profitDash + feesDash);
  const adSpendPct = pct(totalIklan);
  const adSpendDash = (adSpendPct / 100) * circumference;
  const adSpendOffset = -(profitDash + feesDash + returDash);
  const cogsOffset = -(profitDash + feesDash + returDash + adSpendDash);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Versi ringkas untuk lubang donat, yang lebarnya cuma ~79px. "Rp
  // 1.414.149.566" butuh dua kali itu, jadi selama ini ia dipotong jadi
  // "Rp 1.567.173...." — kehilangan justru digit yang menentukan besarannya.
  // Angka utuhnya tetap ada di kartu KPI di atas dan di baris TOTAL RINGKASAN,
  // dan ikut sebagai `title` saat kursor berhenti di atasnya.
  const formatRupiahRingkas = (val) => {
    const n = Number(val) || 0;
    const tanda = n < 0 ? "-" : "";
    const a = Math.abs(n);
    const [bagi, satuan] =
      a >= 1e12 ? [1e12, " T"] :
      a >= 1e9  ? [1e9,  " M"] :
      a >= 1e6  ? [1e6,  " jt"] :
      a >= 1e3  ? [1e3,  " rb"] : [1, ""];
    const angka = a / bagi;
    const desimal = satuan === "" ? 0 : angka < 10 ? 2 : angka < 100 ? 1 : 0;
    return `${tanda}Rp ${angka.toLocaleString("id-ID", {
      minimumFractionDigits: desimal, maximumFractionDigits: desimal,
    })}${satuan}`;
  };

  // ─── Tren Penjualan Harian (data riil dari buckets backend) ─────────────────
  // 2 seri: Omset (perkiraan) vs Diterima (terkonfirmasi/sudah sampai).
  const trendData = (Array.isArray(stats?.buckets) ? stats.buckets : []).map((b) => ({
    date: b.bucket,
    omset: b.omsetPerkiraan ?? 0,
    diterima: b.terkonfirmasi ?? 0,
  }));
  const hasTrend = trendData.length > 0;

  // Batas atas sumbu Y yang "cantik" (1/2/2.5/5 × 10^k), selalu 0-based.
  const niceCeil = (v) => {
    if (v <= 0) return 1;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * pow;
  };
  const trendMax = niceCeil(Math.max(1, ...trendData.map((d) => Math.max(d.omset, d.diterima))));
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((r) => trendMax * r);

  // Geometri SVG (viewBox 1000×300, skala seragam → tak ada distorsi).
  const V = { w: 1000, h: 300, l: 68, r: 24, t: 18, b: 46 };
  const plotW = V.w - V.l - V.r;
  const plotH = V.h - V.t - V.b;
  const px = (i) => V.l + (trendData.length <= 1 ? plotW / 2 : (i / (trendData.length - 1)) * plotW);
  const py = (v) => V.t + plotH - (v / trendMax) * plotH;
  const linePath = (key) =>
    trendData.map((d, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(d[key]).toFixed(1)}`).join(" ");
  const areaPath = () =>
    hasTrend ? `${linePath("omset")} L ${px(trendData.length - 1).toFixed(1)} ${py(0)} L ${px(0).toFixed(1)} ${py(0)} Z` : "";

  const xLabelEvery = Math.max(1, Math.ceil(trendData.length / 8));
  const formatAxis = (v) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(v % 1e9 === 0 ? 0 : 1)}M`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1)}Jt`;
    if (v >= 1e3) return `${Math.round(v / 1e3)}rb`;
    return `${Math.round(v)}`;
  };
  const fmtDate = (s) => { const [, m, d] = String(s).split("-"); return d ? `${d}/${m}` : s; };

  return (
    <div className={`marketing-dashboard-container${sedangMemuat ? " sedang-memuat" : ""}`}>
      {/* ─── Filter Panel ─── */}
      <div className="marketing-filter-card">
        <div className="filter-header">
          <Filter size={16} />
          <span>Filter Penjualan & Biaya</span>
        </div>
        
        <div className="filter-grid">
          {/* 1. Date range selectors */}
          <div className="filter-item date-range-group">
            <label className="filter-label">Tanggal Mulai</label>
            <div className="date-input-wrapper">
              <Calendar size={14} className="date-icon" />
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="filter-date-input"
              />
            </div>
          </div>

          <div className="filter-item date-range-group">
            <label className="filter-label">Tanggal Selesai</label>
            <div className="date-input-wrapper">
              <Calendar size={14} className="date-icon" />
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="filter-date-input"
              />
            </div>
          </div>

          {/* 2. Platform multi-select */}
          <div className="filter-item popover-wrapper">
            <label className="filter-label">Pilih Platform</label>
            <button 
              className="filter-dropdown-btn"
              onClick={() => { setShowPlatformDropdown(!showPlatformDropdown); setShowStoreDropdown(false); }}
            >
              <span>
                {selectedPlatforms.length === 0 
                  ? "Semua Platform" 
                  : `${selectedPlatforms.length} Terpilih`
                }
              </span>
              <ChevronDown size={14} />
            </button>

            {showPlatformDropdown && (
              <div className="filter-dropdown-popover">
                <div className="popover-header">
                  <span>Pilih Platform</span>
                  <button className="popover-close" onClick={() => setShowPlatformDropdown(false)}>
                    <X size={12} />
                  </button>
                </div>
                <div className="popover-list">
                  {PLATFORMS.map((platform) => {
                    const isChecked = selectedPlatforms.includes(platform.id);
                    return (
                      <label key={platform.id} className="popover-checkbox-row">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => togglePlatform(platform.id)}
                        />
                        <span className="checkbox-custom">
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </span>
                        <span className="popover-checkbox-text">{platform.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Store multi-select */}
          <div className="filter-item popover-wrapper">
            <label className="filter-label">Pilih Toko</label>
            <button 
              className="filter-dropdown-btn"
              onClick={() => { setShowStoreDropdown(!showStoreDropdown); setShowPlatformDropdown(false); }}
            >
              <span>
                {selectedStores.length === 0 
                  ? "Semua Toko" 
                  : `${selectedStores.length} Terpilih`
                }
              </span>
              <ChevronDown size={14} />
            </button>

            {showStoreDropdown && (
              <div className="filter-dropdown-popover">
                <div className="popover-header">
                  <span>Pilih Toko</span>
                  <button className="popover-close" onClick={() => setShowStoreDropdown(false)}>
                    <X size={12} />
                  </button>
                </div>
                <div className="popover-list">
                  {isLoadingStores ? (
                    <div className="popover-loading">Memuat toko...</div>
                  ) : stores.length === 0 ? (
                    <div className="popover-empty">Tidak ada toko terintegrasi</div>
                  ) : (
                    stores.map((store) => {
                      const isChecked = selectedStores.includes(store.id);
                      return (
                        <label key={store.id} className="popover-checkbox-row">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleStore(store.id)}
                          />
                          <span className="checkbox-custom">
                            {isChecked && <Check size={10} strokeWidth={3} />}
                          </span>
                          <span className="popover-checkbox-text">{store.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Biaya Iklan — sekarang diisi PER TOKO di tabel paling bawah.
              Kolom isian tunggal yang dulu ada di sini mengirim angkanya lewat
              URL: tidak tersimpan, hilang tiap muat ulang, dan satu angka untuk
              semua toko sekaligus. Tidak ada yang bisa dijawabnya — "toko mana
              yang iklannya memakan laba" justru pertanyaan utamanya. */}
          <div className="filter-item">
            <label className="filter-label">Biaya Iklan (Ad Spend)</label>
            <div className="iklan-petunjuk">
              <span className="iklan-petunjuk-nilai">{formatRupiah(totalIklan)}</span>
              <span className="iklan-petunjuk-teks">Diisi per toko di tabel bawah</span>
            </div>
          </div>
        </div>

        {/* Action button row */}
        <div className="filter-actions-row">
          <button className="btn-filter-clear" onClick={clearAllFilters}>
            Atur Ulang
          </button>
          <button 
            className="btn-filter-apply" 
            onClick={handleApplyFilters}
            disabled={isSubmittingFilters}
          >
            {isSubmittingFilters ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Terapkan Filter</span>
            )}
          </button>
        </div>
      </div>

      {/* ═══ ZONA 1 — POSISI UANG (SALDO, tanpa tanggal) ═══
          Dipisah tegas dari arus karena pertanyaannya berbeda:
            saldo : "uang saya SEKARANG di mana?"   → tanpa rentang
            arus  : "periode ini terjadi apa?"      → dengan rentang
          Digambar sebagai tahapan, mengikuti perjalanan uang yang sebenarnya. */}
      {posisi && (
        <div className="summary-card">
          <div className="summary-card-header">
            <h4>Posisi Uang — sekarang</h4>
            <span className="summary-card-subtitle">
              Setiap pesanan tepat di <b>satu</b> tahap · saldo, bukan periode ·{' '}
              <b>tidak mengikuti saringan tanggal</b> · mengikuti pilihan platform &amp; toko
            </span>
          </div>

          <div className="tahap-uang">
            <div className="tahap">
              <span className="tahap-label">BELUM DIKIRIM</span>
              <div className="block-value">{formatRupiah(posisi.belumDikirim?.nilai ?? 0)}</div>
              <div className="tahap-note">
                {posisi.belumDikirim?.pesanan ?? 0} pesanan · masih bisa batal
                <span className="tanda-dasar">KOTOR</span>
              </div>
            </div>
            <div className="tahap-panah">→</div>
            <div className="tahap">
              <span className="tahap-label">UANG DI JALAN</span>
              <div className="block-value">{formatRupiah(posisi.diJalan?.nilai ?? 0)}</div>
              <div className="tahap-note">
                {posisi.diJalan?.pesanan ?? 0} pesanan · sudah keluar gudang
                <span className="tanda-dasar">KOTOR</span>
              </div>
            </div>
            <div className="tahap-panah">→</div>
            <div className="tahap tahap-utama">
              <span className="tahap-label">MENUNGGU REKONSILIASI</span>
              <div className="block-value text-purple">{formatRupiah(posisi.menungguCair?.nilai ?? 0)}</div>
              <div className="tahap-note">
                {posisi.menungguCair?.pesanan ?? 0} pesanan · sudah sampai, uang belum dilepas
                <span className="tanda-dasar">KOTOR</span>
              </div>
            </div>
            <div className="tahap-panah">→</div>
            {/* Tahap terakhir: rekonsiliasi selesai, uang sudah di dompet.
                NETO — beban platform sudah dipotong sebelum masuk. */}
            <div className="tahap tahap-selesai">
              <span className="tahap-label">SELESAI REKONSILIASI</span>
              <div className="block-value">{formatRupiah(posisi.sudahCair?.nilai ?? 0)}</div>
              <div className="tahap-note">
                {posisi.sudahCair?.pesanan ?? 0} pesanan · uang sudah di dompet
                <span className="tanda-dasar tanda-neto">NETO</span>
              </div>
            </div>
          </div>

          {/* DI LUAR ketiga tahap, dan sengaja begitu: pembeli belum membayar,
              jadi ini belum uang sama sekali. Tidak dibuang diam-diam —
              yang tidak dihitung harus disebut. Diukur 29 Agu 2026: 5 pesanan
              UNPAID sempat terhitung sebagai "uang yang akan masuk". */}
          {(posisi.belumDibayar?.pesanan ?? 0) > 0 && (
            <div className="posisi-diluar">
              <span className="posisi-diluar-label">DI LUAR HITUNGAN</span>
              <span>
                <b>{formatRupiah(posisi.belumDibayar.nilai)}</b> dari{' '}
                {posisi.belumDibayar.pesanan} pesanan <b>belum dibayar</b> pembeli —
                belum jadi uang, jadi tidak masuk keempat tahap di atas
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══ ZONA 2 — ARUS PERIODE INI (mengikuti saringan tanggal) ═══ */}
      {pov && (
        <div className="summary-card pov-card">
          <div className="summary-card-header">
            <h4>Arus per periode</h4>
            <span className="summary-card-subtitle">
              Dibaca berurutan: <b>omset − beban = laba</b> · ketiganya bersandar pada
              sumbu yang sama, tanggal pesanan dibuat
            </span>
          </div>

          {/* Baris laba-rugi: dibaca berurutan, dengan tanda − dan = di antaranya
              supaya pembaca tahu ketiganya SATU hitungan, bukan tiga angka lepas.
              Ketiganya berdiri di sumbu yang sama (tanggal pesanan) — itulah
              yang membuat pengurangan ini sah. */}
          <div className="laba-rugi-baris">
            <div className="summary-block block-highlighted">
              <div className="block-meta-row">
                <span className="block-category">OMSET</span>
                <DollarSign size={13} className="text-purple" />
              </div>
              <div className="block-value text-purple">{formatRupiah(povOmset)}</div>
              <div className="block-subtext">Penjualan periode ini</div>
              <div className="pov-note">
                Tanpa yang batal sebelum dikirim &amp; belum dibayar
                {(pov.omset?.dikeluarkan?.pesanan ?? 0) > 0 && (
                  <> — <b>{formatRupiah(pov.omset.dikeluarkan.nilai)}</b> dari{' '}
                  {pov.omset.dikeluarkan.pesanan} pesanan dikeluarkan</>
                )}
                {' '}· <span className="tanda-dasar">KOTOR</span>
              </div>
            </div>

            <div className="laba-rugi-tanda">−</div>

            <div className="summary-block">
              <div className="block-meta-row">
                <span className="block-category">BEBAN</span>
                <Percent size={13} className="text-purple" />
              </div>
              <div className="block-value">{formatRupiah(pov.beban?.nilai ?? 0)}</div>
              <div className="block-subtext">Platform + modal barang + iklan</div>
              <div className="pov-note">
                Platform {formatRupiah(pov.beban?.platform ?? 0)} · COGS{' '}
                {formatRupiah(pov.beban?.cogs ?? 0)} · Iklan {formatRupiah(pov.beban?.iklan ?? 0)}
              </div>
            </div>

            <div className="laba-rugi-tanda">=</div>

            <div className="summary-block blok-laba">
              <div className="block-meta-row">
                <span className="block-category">LABA</span>
                <TrendingUp size={13} className="text-purple" />
              </div>
              <div className="block-value">{formatRupiah(pov.laba?.nilai ?? 0)}</div>
              <div className="block-subtext">Margin {pov.laba?.margin ?? 0}%</div>
              <div className="pov-note">Omset dikurangi beban di sebelah kiri</div>
            </div>
          </div>

        </div>
      )}

      {/* ─── Summary Cards Section (Omset Harian & Status Breakdown) ─── */}
      <div className={`marketing-summary-wrapper${rentangPanjang ? "" : " satu-kartu"}`}>
        
        {/* Card 1: Ringkasan Omset Harian */}
        <div className="summary-card">
          <div className="summary-card-header">
            <h4>Asal-usul angka OMSET</h4>
            <span className="summary-card-subtitle">
              Kotor − retur &amp; batal = <b>OMSET</b> di atas · sumbu: tanggal pesanan dibuat
            </span>
          </div>

          <div className="summary-blocks-grid tiga-blok">
            {/* Block 1: Omset Kotor */}
            <div className="summary-block">
              <div className="block-meta-row">
                <span className="block-category">OMSET KOTOR</span>
                <DollarSign size={13} className="text-purple" />
              </div>
              <div className="block-value">{formatRupiah(totalOmsetKotor)}</div>
              <div className="block-subtext">Termasuk retur &amp; batal</div>
            </div>

            {/* Block 2: Retur */}
            <div className="summary-block block-danger-accent">
              <div className="block-meta-row">
                <span className="block-category">RETUR</span>
                <RefreshCw size={13} className="text-purple" />
              </div>
              <div className="block-value">- {formatRupiah(totalRetur + totalDibatalkan)}</div>
              <div className="block-subtext">Pembatalan & retur pesanan</div>
            </div>

            {/* Block 4: Platform Fees */}
            <div className="summary-block clickable-block" onClick={() => setShowFeeModal(true)}>
              <div className="block-meta-row">
                <span className="block-category">BEBAN PLATFORM</span>
                <DollarSign size={13} className="text-purple" />
              </div>
              <div className="block-value hover-underline">{formatRupiah(totalFees)}</div>
              <div className="block-subtext">Komisi platform <span className="kpi-action-purple">(rincian)</span></div>
            </div>
          </div>
        </div>

        {/* Card 2: Status Breakdown — HANYA untuk rentang panjang.
            Di rentang pendek ia mengulang: Pipeline == Omset Perkiraan, dan
            angka yang sama jadi muncul empat kali di satu layar. */}
        {rentangPanjang && (
        <div className="summary-card">
          <div className="summary-card-header">
            <h4>Breakdown status</h4>
            <span className="summary-card-subtitle">Sumbu: tanggal pesanan dibuat · pecahan dari Omset Perkiraan</span>
          </div>

          <div className="summary-blocks-grid">
            {/* Block 3: Pipeline */}
            <div className="summary-block">
              <div className="block-meta-row">
                <span className="block-category">PIPELINE</span>
                <TrendingUp size={13} className="text-purple" />
              </div>
              <div className="block-value">{formatRupiah(totalPipeline)}</div>
              <div className="block-subtext">Masih di jalan — baru, dikemas, dikirim</div>
            </div>

            {/* Block 4: Berisiko */}
            <div className="summary-block">
              <div className="block-meta-row">
                <span className="block-category">BERISIKO</span>
                <HelpCircle size={13} className="text-purple" />
              </div>
              <div className="block-value">{formatRupiah(totalBerisiko)}</div>
              <div className="block-subtext">Ada permintaan batal, belum final</div>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* ─── Tren Penjualan Harian ─── */}
      <div className="marketing-chart-card trend-chart-card">
        <div className="chart-card-header trend-header">
          <div className="header-title-group">
            <TrendingUp size={16} className="text-purple" />
            <h3>Tren Penjualan Harian</h3>
          </div>
          <div className="trend-legend">
            <span className="trend-legend-item"><span className="trend-dot" style={{ background: "#4f46e5" }}></span>Omset</span>
            <span className="trend-legend-item"><span className="trend-dot" style={{ background: "#059669" }}></span>Diterima</span>
          </div>
        </div>

        <div className="trend-plot">
          {/* Urutannya sengaja: MEMUAT diperiksa lebih dulu daripada KOSONG.
              Dibalik, halaman yang sedang menunggu akan menuduh filternya
              tidak menghasilkan apa-apa — padahal server belum menjawab. */}
          {sedangMemuat ? (
            <div className="memuat-panel">
              <div className="memuat-keterangan">
                <RefreshCw size={13} className="spin-icon" />
                <span>Menghitung tren penjualan…</span>
              </div>
              <div className="memuat-baris tinggi" />
              <div className="memuat-baris w-50" />
            </div>
          ) : !hasTrend ? (
            <div className="trend-empty">
              <TrendingUp size={26} className="text-gray" />
              <p>Belum ada data penjualan pada filter ini</p>
            </div>
          ) : (
            <>
              <svg viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid meet" className="trend-svg-v2" onMouseLeave={() => setHoverIdx(null)}>
                <defs>
                  <linearGradient id="omsetFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {yTicks.map((v, i) => {
                  const y = py(v);
                  return (
                    <g key={i}>
                      <line x1={V.l} y1={y} x2={V.w - V.r} y2={y} stroke="#ececeb" strokeWidth="1" />
                      <text x={V.l - 12} y={y + 4} textAnchor="end" fontSize="12.5" fill="#9ca3af" className="trend-axis-num">{formatAxis(v)}</text>
                    </g>
                  );
                })}

                <path d={areaPath()} fill="url(#omsetFill)" />
                <path d={linePath("diterima")} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <path d={linePath("omset")} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

                {trendData.length <= 14 && trendData.map((d, i) => (
                  <g key={i}>
                    <circle cx={px(i)} cy={py(d.diterima)} r="3" fill="#fff" stroke="#059669" strokeWidth="2" />
                    <circle cx={px(i)} cy={py(d.omset)} r="3" fill="#fff" stroke="#4f46e5" strokeWidth="2" />
                  </g>
                ))}

                {trendData.map((d, i) => (
                  (i % xLabelEvery === 0 || i === trendData.length - 1) && (
                    <text key={i} x={px(i)} y={V.h - 18} textAnchor="middle" fontSize="12.5" fill="#6b7280">{fmtDate(d.date)}</text>
                  )
                ))}

                {hoverIdx != null && trendData[hoverIdx] && (
                  <>
                    <line x1={px(hoverIdx)} y1={V.t} x2={px(hoverIdx)} y2={py(0)} stroke="#c7c7c4" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx={px(hoverIdx)} cy={py(trendData[hoverIdx].omset)} r="5" fill="#fff" stroke="#4f46e5" strokeWidth="2.5" />
                    <circle cx={px(hoverIdx)} cy={py(trendData[hoverIdx].diterima)} r="5" fill="#fff" stroke="#059669" strokeWidth="2.5" />
                  </>
                )}

                {trendData.map((d, i) => {
                  const bw = plotW / trendData.length;
                  return <rect key={i} x={V.l + (i / trendData.length) * plotW} y={V.t} width={bw} height={plotH} fill="transparent" onMouseEnter={() => setHoverIdx(i)} />;
                })}
              </svg>

              {hoverIdx != null && (
                <div className="trend-tooltip" style={{ left: `${(px(hoverIdx) / 1000) * 100}%` }}>
                  <div className="tt-date">{fmtDate(trendData[hoverIdx].date)}</div>
                  <div className="tt-row"><span className="trend-dot" style={{ background: "#4f46e5" }}></span><span className="tt-name">Omset</span><b>{formatRupiah(trendData[hoverIdx].omset)}</b></div>
                  <div className="tt-row"><span className="trend-dot" style={{ background: "#059669" }}></span><span className="tt-name">Diterima</span><b>{formatRupiah(trendData[hoverIdx].diterima)}</b></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Platform Breakdown & Profit Chart Section ─── */}
      <div className="marketing-bottom-grid">
        {/* Donat DULU, tabel menyusul — permintaan pemilik toko 21 Agu 2026.
            Ringkasan di atas, rinciannya di bawah: pertanyaan pertama selalu
            "sehat atau tidak", baru sesudahnya "toko mana". Urutan di sini
            adalah urutan DOM, jadi pembaca layar dan pengguna keyboard ikut
            mendapat urutan yang sama. */}
        {/* ─── Donut Chart Card ─── */}
        <div className="marketing-chart-card">
          <div className="chart-card-header">
            <div className="header-title-group">
              <Percent size={16} className="text-purple" />
              <h3>Proporsi & Margin Omset</h3>
            </div>
          </div>

          <div className="chart-card-body">
            <div className="donut-chart-container">
              <svg width="160" height="160" viewBox="0 0 100 100" className="donut-svg">
                {/* Background Ring */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r={radius} 
                  fill="transparent" 
                  stroke="#F3F4F6" 
                  strokeWidth={strokeWidth} 
                />
                
                {hasData ? (
                  <>
                    {/* COGS Segment (Dark Grey/Charcoal) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#111827"
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${cogsDash} ${circumference - cogsDash}`}
                      strokeDashoffset={cogsOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />

                    {/* Ad Spend Segment (Light Indigo/Violet) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#C7C9F9"
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${adSpendDash} ${circumference - adSpendDash}`}
                      strokeDashoffset={adSpendOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />

                    {/* Retur Segment (Slate Gray) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#9CA3AF"
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${returDash} ${circumference - returDash}`}
                      strokeDashoffset={returOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    
                    {/* Platform Fees Segment (Soft Indigo/Light Purple) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#818CF8"
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${feesDash} ${circumference - feesDash}`}
                      strokeDashoffset={feesOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />

                    {/* Net Profit Segment (Brand Purple) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#4F46E5"
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${profitDash} ${circumference - profitDash}`}
                      strokeDashoffset={profitOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </>
                ) : (
                  /* BELUM ADA DATA — cincin datar, tanpa segmen.

                     Sampai 28 Agustus 2026 cabang ini menggambar CINCIN PALSU:
                     lima segmen bernilai tetap (COGS 40%, laba 25%, beban 15%,
                     iklan 12%, retur 8%) yang komentarnya sendiri menyebut
                     dirinya "demo". Artinya setiap kali halaman dibuka — dan
                     selama jawaban server belum datang, itu SELALU — pemilik
                     toko melihat proporsi sebuah bisnis yang tidak pernah ada,
                     lengkap dengan warna dan persentasenya.

                     Grafik tidak boleh menggambar bentuk yang tidak diukurnya.
                     Yang tampil sekarang cuma lingkaran kosong: jujur bahwa
                     belum ada yang bisa digambar. */
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                  />
                )}
              </svg>
              
              {/* Centered text */}
              <div className="donut-center-label">
                {/* Dasarnya HARUS `dasarOmset`, bukan omset kotor. Seluruh
                    irisan cincin di sekeliling angka ini dibagi terhadap omset
                    perkiraan; kalau tengahnya menyebut omset kotor, cincinnya
                    mengaku membagi 1,57 M padahal ia membagi 1,41 M — dan
                    persentase di sebelahnya tidak akan pernah cocok kalau ada
                    yang menghitung ulang. Keputusan pemilik toko 20 Agu 2026:
                    satu dasar saja, omset perkiraan. */}
                <span className="donut-label-title">OMSET PERKIRAAN</span>
                <span className="donut-label-value" title={formatRupiah(dasarOmset)}>
                  {formatRupiahRingkas(dasarOmset)}
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="donut-legend-list">
              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#4F46E5" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Net Profit</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalProfit)} ({hasData ? profitPct.toFixed(1) + "%" : "—"})
                  </span>
                </div>
              </div>
              
              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#818CF8" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Beban Platform</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalFees)} ({hasData ? feesPct.toFixed(1) + "%" : "—"})
                  </span>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#C7C9F9" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Biaya Iklan</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalIklan)} ({hasData ? adSpendPct.toFixed(1) + "%" : "—"})
                  </span>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#9CA3AF" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Beban Retur</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalRetur)} ({hasData ? returPct.toFixed(1) + "%" : "—"})
                  </span>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#111827" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">COGS (HPP)</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalCogs)} ({hasData ? cogsPct.toFixed(1) + "%" : "—"})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="marketing-table-card">
          <div className="table-card-header">
            <div className="header-title-group">
              <BarChart3 size={16} className="text-purple" />
              <h3>Rincian Kinerja Penjualan Platform</h3>
            </div>
            <div className="header-actions">
              <HelpCircle size={14} className="text-gray" title="Metrik rincian dihitung otomatis dari log transaksi sinkronisasi toko." />
            </div>
          </div>

          <div className="table-responsive">
            <table className="marketing-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Nama Toko</th>
                  <th className="text-right">Omset</th>
                  <th className="text-right">COGS (HPP)</th>
                  <th className="text-right">Beban Platform</th>
                  <th className="text-right">Retur</th>
                  <th className="text-right">Biaya Iklan</th>
                  <th className="text-right">Net Profit</th>
                  <th className="text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody>
                {sedangMemuat ? (
                  /* Sama seperti grafik: memuat diperiksa lebih dulu. Kalimat
                     "Tidak Ada Data Transaksi" hanya benar SETELAH server
                     menjawab — sebelum itu ia tuduhan tanpa dasar. */
                  <tr>
                    <td colSpan="9" className="table-empty-row">
                      <div className="memuat-panel">
                        <div className="memuat-keterangan">
                          <RefreshCw size={13} className="spin-icon" />
                          <span>Menyusun rincian per toko…</span>
                        </div>
                        <div className="memuat-baris w-90" />
                        <div className="memuat-baris w-70" />
                        <div className="memuat-baris w-50" />
                      </div>
                    </td>
                  </tr>
                ) : marketingData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="table-empty-row">
                      <div className="empty-state-container">
                        <BarChart3 size={32} className="empty-icon text-gray" />
                        <h4>Tidak Ada Data Transaksi</h4>
                        <p>
                          Filter aktif tidak menghasilkan data. Silakan tentukan rentang tanggal yang sesuai, centang platform/toko, atau hubungkan akun API toko Anda untuk menarik data transaksi riil.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* Laba dan margin datang JADI dari server, tidak dihitung
                     ulang di sini. Dua perhitungan untuk hal yang sama pasti
                     berbeda suatu hari, dan yang di server itulah yang juga
                     dipakai baris total di bawah. */
                  marketingData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-black text-capitalize">{row.channel}</td>
                      <td>{row.storeName}</td>
                      <td className="text-right">{formatRupiah(row.omset)}</td>
                      <td className="text-right">{formatRupiah(row.cogs)}</td>
                      <td className="text-right">{formatRupiah(row.fees)}</td>
                      <td className="text-right text-purple font-semibold">{formatRupiah(row.retur || 0)}</td>
                      {/* Biaya iklan — satu-satunya angka di tabel ini yang
                          diketik pemilik toko, karena tidak ada marketplace yang
                          melaporkannya. Disunting DI TEMPAT: memindahkannya ke
                          jendela terpisah berarti angka toko sebelah hilang dari
                          pandangan justru saat sedang dibandingkan.
                          Isian menampilkan pemisah ribuan sambil diketik; tanpa
                          itu "1500000" harus dihitung digitnya sendiri. */}
                      <td className="text-right sel-iklan">
                        {rentangSatuHari ? (
                          <div className="iklan-isian">
                            <span className="iklan-rp">Rp</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className={`iklan-input${iklanGagal === row.storeId ? " iklan-input-gagal" : ""}`}
                              value={iklanDraf[row.storeId] ?? teksRibuan(row.iklan || 0)}
                              disabled={!row.storeId || iklanSimpan === row.storeId}
                              onChange={(e) =>
                                setIklanDraf((d) => ({
                                  ...d,
                                  [row.storeId]: teksRibuan(bacaRibuan(e.target.value)),
                                }))
                              }
                              onBlur={(e) => {
                                if (iklanDraf[row.storeId] === undefined) return;
                                simpanIklan(row.storeId, e.target.value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                                if (e.key === "Escape") {
                                  setIklanDraf((d) => {
                                    const salin = { ...d };
                                    delete salin[row.storeId];
                                    return salin;
                                  });
                                  setIklanGagal(null);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <span
                            className="text-gray"
                            title="Biaya iklan dicatat per hari. Pilih satu tanggal untuk mengisinya."
                          >
                            {formatRupiah(row.iklan || 0)}
                          </span>
                        )}
                        {iklanGagal === row.storeId && (
                          <div className="iklan-galat">Gagal disimpan — coba lagi</div>
                        )}
                      </td>
                      <td className="text-right font-semibold text-black">{formatRupiah(row.netProfit)}</td>
                      <td className="text-right font-semibold text-purple">{(row.margin ?? 0).toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* Show summary totals row only when data exists */}
              {marketingData.length > 0 && (
                <tfoot>
                  <tr className="summary-total-row">
                    <td colSpan="2" className="font-bold text-black text-left">TOTAL RINGKASAN</td>
                    {/* Omset PERKIRAAN, bukan kotor — supaya jumlah baris di
                        atas benar-benar sama dengan angka ini. Sebelumnya baris
                        memakai satu dasar dan totalnya memakai dasar lain, jadi
                        siapa pun yang menjumlahkan sendiri akan menemukan
                        selisih yang tidak bisa dijelaskan. */}
                    <td className="text-right font-bold text-black">{formatRupiah(totalOmsetPerkiraan)}</td>
                    <td className="text-right font-bold text-black">{formatRupiah(totalCogs)}</td>
                    <td className="text-right font-bold text-black">{formatRupiah(totalFees)}</td>
                    <td className="text-right font-bold text-black">{formatRupiah(totalRetur)}</td>
                    <td className="text-right font-bold text-gray">{formatRupiah(totalIklan)}</td>
                    <td className="text-right font-bold text-purple">{formatRupiah(totalProfit)}</td>
                    <td className="text-right font-bold text-purple">{marginPercent.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* ─── Balance Sheet Ledger Modal ─── */}
      {showFeeModal && (
        <div className="ledger-modal-overlay" onClick={() => setShowFeeModal(false)}>
          <div className="ledger-paper-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ledger-modal-close-btn" onClick={() => setShowFeeModal(false)}>
              <X size={16} />
            </button>

            <div className="ledger-scroll">
            {/* Ledger Header */}
            <div className="ledger-document-header">
              <h2>LAPORAN RINCIAN BEBAN PLATFORM</h2>
              <div className="ledger-doc-meta">
                <div className="meta-row">
                  <span className="meta-label">Entitas:</span>
                  <span className="meta-value">Bithinks Marketing System</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Periode:</span>
                  <span className="meta-value">
                    {startDate && endDate 
                      ? `${startDate} s/d ${endDate}` 
                      : "Semua Periode"
                    }
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Platform Filter:</span>
                  <span className="meta-value text-capitalize">
                    {selectedPlatforms.length === 0 ? "Semua Platform" : selectedPlatforms.join(", ")}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Toko Filter:</span>
                  <span className="meta-value">
                    {selectedStores.length === 0 
                      ? "Semua Toko" 
                      : stores.filter(s => selectedStores.includes(s.id)).map(s => s.name).join(", ")
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <table className="ledger-balance-sheet-table">
              <thead>
                <tr>
                  <th className="ledger-th-desc">DESKRIPSI BEBAN OPERASIONAL</th>
                  <th className="ledger-th-pct text-right">SUMBER</th>
                  <th className="ledger-th-amount text-right">JUMLAH (IDR)</th>
                </tr>
              </thead>
              <tbody>
                {costBreakdown.length === 0 && (
                  <tr>
                    <td className="ledger-td-desc" colSpan={3} style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>
                      Belum ada data beban platform pada filter ini
                    </td>
                  </tr>
                )}

                {costBreakdown.map((g) => {
                  const riilItems = g.items.filter((i) => i.source === "final" || i.source === "preliminary");
                  const estItems = g.items.filter((i) => i.source === "estimated");
                  const riilTotal = riilItems.reduce((a, i) => a + i.amount, 0);
                  const estTotal = estItems.reduce((a, i) => a + i.amount, 0);
                  return (
                    <Fragment key={g.platform}>
                      {/* Header platform */}
                      <tr className="ledger-platform-header">
                        <td className="ledger-td-desc font-bold text-black" colSpan={2}>▸ {g.label}</td>
                        <td className="text-right font-bold text-black">{formatRupiah(g.total)}</td>
                      </tr>

                      {/* Sudah settlement (riil) */}
                      {riilItems.length > 0 && (
                        <tr>
                          <td className="ledger-td-desc" colSpan={2} style={{ fontStyle: "italic", color: "#16a34a" }}>
                            Sudah settlement (riil) — {g.final_orders + g.preliminary_orders} order
                          </td>
                          <td className="text-right" style={{ color: "#16a34a" }}>{formatRupiah(riilTotal)}</td>
                        </tr>
                      )}
                      {riilItems.map((it, idx) => (
                        <tr key={`r-${g.platform}-${idx}`}>
                          <td className="ledger-td-desc" style={{ paddingLeft: 24 }}>{it.label}</td>
                          <td className="text-right text-gray">riil</td>
                          <td className="text-right">{formatRupiah(it.amount)}</td>
                        </tr>
                      ))}

                      {/* Belum settlement (perkiraan) */}
                      {estItems.length > 0 && (
                        <tr>
                          <td className="ledger-td-desc" colSpan={2} style={{ fontStyle: "italic", color: "#d97706" }}>
                            Belum settlement (perkiraan) — {g.estimated_orders} order
                          </td>
                          <td className="text-right" style={{ color: "#d97706" }}>{formatRupiah(estTotal)}</td>
                        </tr>
                      )}
                      {estItems.map((it, idx) => (
                        <tr key={`e-${g.platform}-${idx}`}>
                          <td className="ledger-td-desc" style={{ paddingLeft: 24 }}>{it.label}</td>
                          <td className="text-right text-gray">perkiraan</td>
                          <td className="text-right">{formatRupiah(it.amount)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}

                {/* Ledger Double Underline Total */}
                <tr className="ledger-total-row">
                  <td className="font-bold text-black text-left" colSpan={2}>TOTAL BEBAN PLATFORM</td>
                  <td className="text-right font-bold text-black ledger-double-underline">
                    {formatRupiah(totalFees)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="ledger-footer-stamp">
              <span>DICETAK SECARA OTOMATIS OLEH BITHINKS ERP SYSTEM</span>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
