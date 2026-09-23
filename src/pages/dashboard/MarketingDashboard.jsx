import { useState, useEffect, Fragment } from "react";
import { omniApi } from "../../utils/omniApi";
import { teksRibuan, bacaRibuan } from "../../utils/angka";
import PanelRetur from "./retur/PanelRetur";
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
// Dua tahap retur, ditulis sekali supaya judul dan keterangannya tidak bisa
// berbeda antara kartu, daftar, dan pengelompokan di bawahnya.
// RETUR di layar ini berarti: apa pun yang sudah KELUAR GUDANG lalu berbalik —
// retur dari pembeli maupun pembatalan sesudah barang dikirim. Marketplace
// memecahnya jadi dua nama, tapi nasib barangnya sama dan pemilik toko
// menghitungnya sebagai satu hal.
//
// Pembatalan SEBELUM dikirim tidak pernah ikut: barangnya tidak berangkat, jadi
// tidak ada yang harus kembali.
const TAHAP_RETUR = [
  {
    kunci: 'diJalan',
    judul: 'RETUR DI JALAN',
    catatan: 'sudah keluar gudang, belum kembali',
    keterangan: 'Retur pembeli dan pembatalan sesudah dikirim — barangnya belum tercatat kembali',
  },
  {
    kunci: 'sampai',
    judul: 'RETUR SELESAI',
    catatan: 'sudah kembali ke gudang',
    keterangan: 'Muara dari kartu pertama: barang sudah sampai di gudang, stok naik',
  },
  {
    kunci: 'periodeLalu',
    judul: 'BELUM SELESAI DARI PERIODE LALU',
    catatan: 'pesanan bulan lain, masih menggantung',
    keterangan: 'Retur dan pembatalan atas pesanan periode sebelumnya yang sampai kini belum kembali',
  },
];

// EMPAT TAHAP PERJALANAN PESANAN — keputusan pemilik toko 14 September 2026.
// Ditulis sekali di sini supaya urutan, nama, dan artinya tidak pernah berbeda
// antara kartu dan panel rinciannya.
// TIGA TAHAP TERBUKA — posisi hari ini, tanpa tanggal. Pesanan masuk lalu
// keluar lagi, jadi angkanya bergerak naik-turun dan masuk akal tanpa periode.
const TAHAP_POSISI = [
  { kunci: 'belumDikirim', judul: 'BELUM DIKIRIM', catatan: 'masih di gudang, masih bisa batal' },
  { kunci: 'diJalan', judul: 'UANG DI JALAN', catatan: 'sudah keluar gudang, belum sampai' },
  { kunci: 'berisikoBatal', judul: 'BERISIKO BATAL', catatan: 'ada permintaan batal, belum final', utama: true },
];

// Tahap terminal, dipisah dari deret panah dan MENGIKUTI tanggal.
//
// Dua alasan, keduanya dari data. Tanpa batas tanggal ia cuma menumpuk
// selamanya — terukur 14 September 2026: Rp 2.110.302.219 dari 28.510 pesanan,
// angka yang tidak bisa dipakai memutuskan apa pun.
//
// Dan panah berarti "pesanan berpindah ke kotak sebelahnya". Begitu tiga kartu
// kiri berisi semua bulan sementara kartu ini hanya bulan terpilih, panah itu
// berbohong: pesanan yang di jalan sejak Agustus tidak akan pernah muncul di
// kartu September.
const TAHAP_SELESAI = {
  kunci: 'selesai', judul: 'SELESAI KE TANGAN PEMBELI', catatan: 'sudah diterima pembeli',
};

// Keempatnya untuk mencari judul panel. Sejak tahap terminal dipisah dari deret,
// mencarinya di TAHAP_POSISI saja membuat panelnya berjudul "Posisi" — terlihat
// di layar 15 September 2026.
const SEMUA_TAHAP_POSISI = [...TAHAP_POSISI, TAHAP_SELESAI];

// Tanggal hari ini menurut WIB, bukan menurut jam mesin pemakainya.
// Backend membatasi harinya di WIB (lib/waktu/wib.ts); kalau sisi ini memakai
// zona laptop, batas rentangnya bisa meleset satu hari untuk pemakai di luar WIB.
function tanggalWib(mundurHari = 0) {
  const wib = new Date(Date.now() + 7 * 3600_000 - mundurHari * 86_400_000);
  return wib.toISOString().slice(0, 10);
}

/**
 * Tanggal 1 bulan berjalan, WIB.
 *
 * RENTANG BAWAAN: 1 sampai hari ini, bukan hari ini saja.
 *
 * Bawaan lama satu hari, dan pada rentang itu separuh halaman selalu nol —
 * bukan karena rusak, melainkan karena pertanyaannya tidak bisa dijawab dalam
 * sehari. Diukur di produksi 15 September 2026:
 *
 *   rentang 15 Sep saja  → selesai ke tangan pembeli Rp 0, 0 pesanan
 *   rentang 1–15 Sep     → Rp 256.261.747, 3.686 pesanan
 *
 * Pesanan yang dibuat hari ini mustahil sudah sampai ke pembeli — rata-rata 8–9
 * hari — jadi kartu itu nol tiap kali halaman dibuka. Hal yang sama menimpa
 * kedua kartu retur. Pemilik toko menabraknya tiga kali sebelum sebabnya
 * ketahuan, dan tiap kali terbaca seperti data hilang.
 *
 * Bulan berjalan juga yang dia pakai saat bicara: "omset bulan ini sekian, dari
 * situ yang diretur berapa".
 */
function awalBulanWib() {
  return `${tanggalWib(0).slice(0, 7)}-01`;
}

/**
 * Perubahan terhadap periode sebelumnya.
 *
 * Arahnya dibaca berbeda tergantung angkanya: omset naik itu kabar baik, beban
 * naik tidak. `naikBaik` yang menentukan warnanya, bukan tanda angkanya.
 *
 * null berarti periode sebelumnya bernilai nol — kenaikan "dari nol" tidak
 * punya persentase yang bermakna, jadi barisnya tidak ditulis sama sekali
 * alih-alih menulis 100% yang menyesatkan.
 */
/** Persen dalam penulisan Indonesia: koma, dua angka di belakang. */
function persen(nilai) {
  return `${nilai.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function Beda({ nilai, naikBaik = false }) {
  if (nilai === null || nilai === undefined) return null;
  const naik = nilai > 0;
  const baik = naikBaik ? naik : !naik;
  return (
    <div className={`arus-beda${nilai === 0 ? '' : baik ? ' arus-beda-baik' : ' arus-beda-buruk'}`}>
      {nilai === 0 ? '—' : `${naik ? '↑' : '↓'} ${persen(Math.abs(nilai))}`}
      <span className="arus-beda-kata">vs periode sebelumnya</span>
    </div>
  );
}

/** Satu ubin angka. Label di atas, angka besar, lalu satu baris keterangan. */
function Ubin({ label, nilai, catatan, beda, naikBaik, nada }) {
  return (
    <div className="arus-ubin">
      <span className="arus-label">{label}</span>
      <div className={`arus-nilai arus-nilai-ubin${nada ? ` arus-nada-${nada}` : ''}`}>{nilai}</div>
      {catatan ? <div className="arus-catatan">{catatan}</div> : <Beda nilai={beda} naikBaik={naikBaik} />}
    </div>
  );
}

export default function MarketingDashboard() {
  // ─── Filter States ────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState(() => awalBulanWib());
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

  // "Atur Ulang" mengembalikan ke keadaan bawaan — termasuk rentang bulan
  // berjalan.
  // Dikosongkan sama sekali justru bukan "bersih", melainkan diam-diam menarik
  // seluruh riwayat: kebalikan dari yang diharapkan orang saat menekan tombol ini.
  const clearAllFilters = () => {
    setStartDate(awalBulanWib());
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

  // Muat awal memakai rentang bawaan BULAN BERJALAN (lihat awalBulanWib di
  // atas), bukan seluruh riwayat dan bukan pula hari ini saja.
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
  const totalOmsetPerkiraan = t.omsetPerkiraan ?? 0; // pipeline + terkonfirmasi + berisiko
  const totalRetur          = t.retur          ?? 0;

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

  // ─── RETUR: DUA TAHAP, BUKAN SATU ANGKA ────────────────────────────────────
  //
  // Kartu lama berisi `retur + dibatalkan` dijumlahkan jadi satu. Sensus
  // produksi 11 September 2026: 1.232 pembatalan berbanding 42 retur — jadi
  // kartu bernama RETUR sebenarnya menampilkan pembatalan, dan retur yang
  // sesungguhnya tenggelam di dalamnya.
  //
  // Sekarang dipecah mengikuti perjalanan barangnya:
  //   di jalan → barang belum kembali (diajukan, disetujui, dikirim pembeli)
  //   sampai   → barang di gudang, stok sudah naik
  //
  // Keputusan pemilik toko 11 September 2026: tahap "diajukan" dan "disetujui"
  // ikut DI JALAN, dan pembatalan sebelum barang dikirim tidak dihitung sebagai
  // retur sama sekali.
  const returTahap = stats?.retur ?? null;
  // Nama platform ditulis sekali di sini. Server mengirim kunci mentahnya
  // (`shopee`), layar menampilkan nama resminya.
  const NAMA_PLATFORM = { shopee: 'Shopee', tiktok: 'TikTok' };
  const returDiJalan = returTahap?.diJalan ?? { nilai: 0, pesanan: 0 };
  const returSampai = returTahap?.sampai ?? { nilai: 0, pesanan: 0 };
  // Server belum tentu mengirimnya. Selama belum, kartu lama dipertahankan —
  // dua kartu bernilai nol akan terbaca sebagai "tidak ada retur", padahal
  // yang benar "belum diketahui", dan keduanya bukan hal yang sama.
  const adaTahapRetur = returTahap !== null;
  const daftarRetur = Array.isArray(returTahap?.daftar) ? returTahap.daftar : [];
  const returTotal = returTahap?.total ?? { nilai: 0, pesanan: 0 };
  // Kartu ketiga: pesanan periode SEBELUMNYA yang barangnya belum kembali.
  // Menggeser periode tidak boleh membuat barang yang menggantung lenyap.
  const returPeriodeLalu = returTahap?.periodeLalu ?? { nilai: 0, pesanan: 0 };

  // ── PANEL RINCIAN ─────────────────────────────────────────────────────────
  // Kedua tahap adalah TOMBOL: menekannya membuka panel berisi saringan
  // platform & toko, ringkasan, lalu tabel pesanannya.
  //
  // Versi sebelumnya menempelkan rinciannya langsung di bawah ringkasan, dan
  // seluruh daftar tampil sekaligus — pada data sungguhan 22 baris dalam satu
  // layar. Halaman laporan jadi terbaca bercecer justru oleh bagian yang paling
  // jarang dibutuhkan. Sekarang: ringkasan di halaman, rincian saat diminta.
  const [panelTahap, setPanelTahap] = useState(null);
  // Panel yang sama dipakai zona Posisi Uang: pertanyaannya identik — "pesanan
  // mana saja?" — jadi bentuk jawabannya tidak perlu dua macam.
  const [panelPosisi, setPanelPosisi] = useState(null);

  const barisPanel = panelTahap
    ? daftarRetur.filter((r) => r.kartu === panelTahap)
    : [];

  // Baris posisi diubah ke bentuk yang sama dengan baris retur. Marketplace
  // tidak memberi alasan, resi balik, maupun linimasa untuk pesanan yang masih
  // berjalan — kolomnya dibiarkan kosong, dan panel menuliskannya sebagai garis
  // pendek, bukan sel kosong yang terbaca seperti kerusakan tampilan.
  const barisPosisi = panelPosisi
    ? (posisi?.daftar ?? [])
      .filter((o) => o.kartu === panelPosisi)
      .map((o) => ({
        id: o.id,
        pesanan: o.pesanan,
        channel: NAMA_PLATFORM[o.channel] ?? o.channel,
        toko: o.toko,
        item: '',
        nominal: o.nominal,
        alasan: null,
        alasanAsli: null,
        status: o.status,
        resi: null,
        diamHari: null,
        uangSaja: false,
        jejak: [],
      }))
    : [];


  // ─── CAKUPAN BEBAN — peringatannya dihapus 11 September 2026 ──────────────
  // Layar pernah memuat spanduk "Laba di bawah ini masih terlalu besar" yang
  // menyebut persentase cakupan dan jarak sinkronisasi terakhir. Keputusan
  // pemilik toko: dihapus.
  //
  // Server MASIH mengirim `cakupan_beban`, dan angkanya masih benar. Yang
  // hilang cuma tempat menampilkannya; kalau kelak perlu ditampilkan lagi,
  // datanya sudah ada tanpa perlu menyentuh backend.

  const povOmset = pov?.omset?.nilai ?? 0;

  /**
   * Porsi sebuah beban terhadap omset periode yang sama.
   *
   * Ditulis dengan koma seperti seluruh angka lain di halaman ini. Titik dan
   * koma bercampur dalam satu zona membuat pembacanya berhenti sejenak tiap
   * kali — dan di zona berisi tujuh angka, berhenti tujuh kali.
   */
  const persenDariOmset = (nilai) =>
    povOmset > 0 ? `${persen((nilai / povOmset) * 100)}` : '—';

  // Persentase terhadap omset periode yang SAMA. Tanpa ini, Rp 413.246 tidak
  // berarti apa-apa; dengan 0,07% pemilik toko langsung tahu retur bukan
  // masalah bulan ini. Pembaginya POV omset, bukan omset perkiraan — sumbu
  // keduanya sama, tanggal pesanan dibuat.
  const returPersen = povOmset > 0 ? (returTotal.nilai / povOmset) * 100 : null;
  const omsetSetelahRetur = povOmset - returTotal.nilai;

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
              Setiap pesanan tepat di <b>satu</b> tahap · tiga tahap kiri adalah{' '}
              <b>posisi hari ini</b>, tanpa tanggal · yang kanan{' '}
              <b>mengikuti periode terpilih</b> · keduanya mengikuti pilihan platform &amp; toko
            </span>
          </div>

          {/* EMPAT TAHAP PERJALANAN PESANAN, keputusan pemilik toko 14 September
              2026. Dua tahap terakhir dulu tentang kapan UANGNYA dilepas
              marketplace ("menunggu / selesai rekonsiliasi"). Yang dia tanyakan
              tiap hari berbeda: di mana PESANANNYA sekarang.

              "Berisiko batal" sebelumnya dibuang dari zona ini sama sekali, dan
              itu yang paling merugikan — justru pesanan itulah yang masih bisa
              diselamatkan kalau dilihat hari ini.

              Semuanya TOMBOL: menekannya memunculkan nomor pesanannya. */}
          <div className="tahap-uang">
            {TAHAP_POSISI.map(({ kunci, judul, catatan, utama }, urut) => {
              const isi = posisi[kunci] ?? { nilai: 0, pesanan: 0 };
              const bisaDibuka = (isi.pesanan ?? 0) > 0;
              return (
                <Fragment key={kunci}>
                  {urut > 0 && <div className="tahap-panah">→</div>}
                  <button
                    type="button"
                    className={`tahap${utama ? ' tahap-utama' : ''}`}
                    onClick={() => bisaDibuka && setPanelPosisi(kunci)}
                    disabled={!bisaDibuka}
                  >
                    <span className="tahap-label">{judul}</span>
                    <div className={`block-value${utama ? ' text-purple' : ''}`}>
                      {formatRupiah(isi.nilai ?? 0)}
                    </div>
                    <div className="tahap-note">
                      {isi.pesanan ?? 0} pesanan · {catatan}
                      <span className="tanda-dasar">KOTOR</span>
                    </div>
                    {bisaDibuka && <div className="retur-ajakan">Lihat nomor pesanan</div>}
                  </button>
                </Fragment>
              );
            })}
          </div>

          {/* TAHAP TERMINAL — dipisah, dan sengaja tanpa panah dari tahap di
              kiri. Lihat alasannya di TAHAP_SELESAI. */}
          {(() => {
            const isi = posisi[TAHAP_SELESAI.kunci] ?? { nilai: 0, pesanan: 0 };
            const bisaDibuka = (isi.pesanan ?? 0) > 0;
            return (
              <div className="posisi-terminal">
                <div className="posisi-terminal-garis" />
                <button
                  type="button"
                  className="tahap tahap-selesai"
                  onClick={() => bisaDibuka && setPanelPosisi(TAHAP_SELESAI.kunci)}
                  disabled={!bisaDibuka}
                >
                  <span className="tahap-label">
                    {TAHAP_SELESAI.judul}
                    <span className="tahap-periode">periode ini</span>
                  </span>
                  <div className="block-value">{formatRupiah(isi.nilai ?? 0)}</div>
                  <div className="tahap-note">
                    {isi.pesanan ?? 0} pesanan · {TAHAP_SELESAI.catatan}
                    <span className="tanda-dasar">KOTOR</span>
                  </div>
                  {bisaDibuka && <div className="retur-ajakan">Lihat nomor pesanan</div>}
                </button>
              </div>
            );
          })()}

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
              Seluruhnya bersandar pada sumbu yang sama, <b>tanggal pesanan dibuat</b> ·
              pembandingnya jendela sama panjang tepat sebelum rentang ini
            </span>
          </div>

          {/* KERANJANG ANGKA PERIODE — tata letak diminta pemilik toko
              23 September 2026, mengikuti satu referensi yang dia berikan.

              Kolom pertama berdiri sendiri karena ia satu-satunya angka yang
              punya ASAL-USUL: omset kotor dikurangi retur. Enam ubin di
              kanannya adalah angka tunggal, jadi mereka berbaris rata.

              Warna memakai token semantik Atlassian, bukan palet referensinya:
              hasil memakai `success`, beban memakai `danger`, sisanya netral.
              Referensinya memberi warna berbeda pada HPP — di sini HPP tetap
              beban, dan memberinya warna keempat cuma menambah kosakata tanpa
              menambah arti. */}
          <div className="arus-kisi">
            <div className="arus-utama">
              <span className="arus-label">TOTAL OMSET</span>
              <div className="arus-nilai">{formatRupiah(povOmset)}</div>
              <Beda nilai={pov.sebelumnya?.bedaOmset ?? null} naikBaik />

              <div className="arus-asal">
                <div className="arus-asal-baris">
                  <span>Omset Kotor</span>
                  <b>{formatRupiah(t.omsetKotor ?? 0)}</b>
                </div>
                <div className="arus-asal-baris arus-asal-kurang">
                  <span>Retur</span>
                  <b>− {formatRupiah(returTotal.nilai)}</b>
                </div>
                {/* Pintu ke rinciannya, bukan angka baru: retur sudah punya
                    zonanya sendiri di bawah, dan mengulang isinya di sini
                    berarti menulis angka yang sama dua kali. */}
                <button
                  type="button"
                  className="arus-tautan"
                  onClick={() => setPanelTahap('diJalan')}
                  disabled={returTotal.pesanan === 0}
                >
                  Lihat detail retur →
                </button>
              </div>
            </div>

            <div className="arus-ubin-kisi">
              <Ubin
                label="TOTAL PROFIT"
                nilai={formatRupiah(pov.laba?.nilai ?? 0)}
                nada="hasil"
                catatan={`${persen(pov.laba?.margin ?? 0)} dari omset`}
              />
              <Ubin
                label="TOTAL PESANAN"
                nilai={(pov.omset?.pesanan ?? 0).toLocaleString('id-ID')}
                beda={pov.sebelumnya?.bedaPesanan ?? null}
                naikBaik
              />
              <Ubin
                label="TOTAL PRODUK"
                nilai={`${(pov.omset?.produk ?? 0).toLocaleString('id-ID')} pcs`}
                beda={pov.sebelumnya?.bedaProduk ?? null}
                naikBaik
              />
              <Ubin
                label="TOTAL BIAYA IKLAN"
                nilai={formatRupiah(pov.beban?.iklan ?? 0)}
                nada="beban"
                catatan={`${persenDariOmset(pov.beban?.iklan ?? 0)} dari omset`}
              />
              <Ubin
                label="TOTAL BIAYA PLATFORM"
                nilai={formatRupiah(pov.beban?.platform ?? 0)}
                nada="beban"
                catatan={`${persenDariOmset(pov.beban?.platform ?? 0)} dari omset`}
              />
              <Ubin
                label="TOTAL HPP"
                nilai={formatRupiah(pov.beban?.cogs ?? 0)}
                nada="beban"
                catatan={`${persenDariOmset(pov.beban?.cogs ?? 0)} dari omset`}
              />
            </div>
          </div>

        </div>
      )}

      {/* ─── Zona Retur ─── */}
      <div className="marketing-summary-wrapper satu-kartu">
        
        {/* Card 1: RETUR — dipecah jadi dua tahap.

            Kartu lama berisi `retur + dibatalkan` dijumlahkan jadi satu. Diukur
            di produksi 11 September 2026: 1.232 pembatalan berbanding 42 retur,
            jadi kartu bernama RETUR sebenarnya menampilkan pembatalan dan retur
            yang dinamainya tenggelam di dalamnya. Pembatalan sebelum barang
            dikirim bukan retur dan tidak lagi ikut di sini.

            OMSET KOTOR ikut pindah keluar: zona ini tentang barang yang
            dikembalikan, bukan tentang asal-usul omset. */}
        <div className="summary-card">
          <div className="summary-card-header">
            <h4>Retur</h4>
            <span className="summary-card-subtitle">
              Barang yang dikembalikan pembeli · dihitung atas{' '}
              <b>pesanan pada periode ini</b> · mengikuti pilihan platform &amp; toko
            </span>
          </div>

          {/* ANGKA UTAMA — pertanyaan pemilik toko, dijawab satu baris:
              "omset bulan ini sekian, dari situ yang diretur berapa".

              Persentasenya yang membuat rupiahnya berarti. Rp 413.246 sendirian
              tidak bisa dinilai; 0,07% dari omset langsung menjawab "besar atau
              tidak". Dan "omset setelah retur" ditulis di sini, di tempat ia
              lahir — bukan diulang di zona Arus, karena angka ditulis sekali. */}
          {adaTahapRetur && (
            <div className="retur-utama">
              <div className="retur-utama-angka blok-pengurang-nilai">
                - {formatRupiah(returTotal.nilai)}
              </div>
              <div className="retur-utama-catatan">
                {returTotal.pesanan} pesanan
                {returPersen !== null && <> · <b>{returPersen.toFixed(2)}%</b> dari omset</>}
              </div>
              {returPersen !== null && (
                <div className="retur-utama-sisa">
                  Omset setelah retur <b>{formatRupiah(omsetSetelahRetur)}</b>
                </div>
              )}
            </div>
          )}

          {/* Kedua tahap adalah TOMBOL. Menekannya membuka panel rincian:
              saringan platform & toko, ringkasan, lalu tabel pesanannya —
              bentuk yang diminta pemilik toko 11 September 2026.

              Rinciannya TIDAK lagi menempel di halaman. Pada data sungguhan itu
              22 baris sekaligus, dan halaman laporan terbaca bercecer justru
              oleh bagian yang paling jarang dibutuhkan. */}
          <div className="retur-kolom retur-kolom-tiga">
            {TAHAP_RETUR.map(({ kunci, judul, catatan, keterangan }) => {
              const ringkas = kunci === 'diJalan' ? returDiJalan
                : kunci === 'sampai' ? returSampai
                  : returPeriodeLalu;
              const bisaDibuka = adaTahapRetur && ringkas.pesanan > 0;
              return (
                <button
                  type="button"
                  key={kunci}
                  className="retur-tahap"
                  onClick={() => bisaDibuka && setPanelTahap(kunci)}
                  disabled={!bisaDibuka}
                  title={keterangan}
                >
                  <div className="retur-tahap-kepala">
                    <span className="block-category">{judul}</span>
                    <ChevronDown size={14} className="retur-panah retur-panah-kanan" />
                  </div>
                  {/* Garis pendek, bukan Rp 0. Nol berarti "tidak ada retur";
                      yang benar saat server belum mengirim datanya adalah
                      "belum diketahui", dan keduanya bukan hal yang sama. */}
                  <div className="block-value blok-pengurang-nilai">
                    {adaTahapRetur ? `- ${formatRupiah(ringkas.nilai)}` : '—'}
                  </div>
                  <div className="block-subtext">
                    {adaTahapRetur ? `${ringkas.pesanan} pesanan · ${catatan}` : 'Menunggu data dari server'}
                  </div>
                  {/* Keterangan ditulis di kartunya, bukan disembunyikan di
                      tooltip: tiga kartu yang bunyinya mirip harus bisa
                      dibedakan tanpa mengarahkan kursor ke masing-masing. */}
                  <div className="retur-tahap-arti">{keterangan}</div>
                  {bisaDibuka && <div className="retur-ajakan">Lihat nomor pesanan</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 1b: BEBAN PLATFORM — zona sendiri.
            Bukan pengurang omset, jadi tidak boleh sebaris dengan pengurang. */}
        <div className="summary-card">
          <div className="summary-card-header">
            <h4>Beban Platform</h4>
            <span className="summary-card-subtitle">
              Komisi &amp; potongan marketplace · bukan bagian dari hitungan omset di atas
            </span>
          </div>
          <div className="beban-baris clickable-block" onClick={() => setShowFeeModal(true)}>
            <div>
              <div className="block-value hover-underline">{formatRupiah(totalFees)}</div>
              <div className="block-subtext">
                {totalOmsetPerkiraan > 0
                  ? `${((totalFees / totalOmsetPerkiraan) * 100).toFixed(1)}% dari omset · `
                  : ''}
                <span className="kpi-action-purple">(rincian per platform)</span>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* ─── Tren Penjualan Harian ─── */}
      <div className="marketing-chart-card trend-chart-card">
        <div className="chart-card-header trend-header">
          <div className="header-title-group">
            <TrendingUp size={16} className="text-purple" />
            <h3>Tren Penjualan Harian</h3>
          </div>
          <div className="trend-legend">
            <span className="trend-legend-item"><span className="trend-dot" style={{ background: "#1868DB" }}></span>Omset</span>
            <span className="trend-legend-item"><span className="trend-dot" style={{ background: "#1F845A" }}></span>Diterima</span>
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
                    <stop offset="0%" stopColor="#1868DB" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#1868DB" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {yTicks.map((v, i) => {
                  const y = py(v);
                  return (
                    <g key={i}>
                      <line x1={V.l} y1={y} x2={V.w - V.r} y2={y} stroke="#DDDEE1" strokeWidth="1" />
                      <text x={V.l - 12} y={y + 4} textAnchor="end" fontSize="12.5" fill="#8C8F97" className="trend-axis-num">{formatAxis(v)}</text>
                    </g>
                  );
                })}

                <path d={areaPath()} fill="url(#omsetFill)" />
                <path d={linePath("diterima")} fill="none" stroke="#1F845A" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <path d={linePath("omset")} fill="none" stroke="#1868DB" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

                {trendData.length <= 14 && trendData.map((d, i) => (
                  <g key={i}>
                    <circle cx={px(i)} cy={py(d.diterima)} r="3" fill="#fff" stroke="#1F845A" strokeWidth="2" />
                    <circle cx={px(i)} cy={py(d.omset)} r="3" fill="#fff" stroke="#1868DB" strokeWidth="2" />
                  </g>
                ))}

                {trendData.map((d, i) => (
                  (i % xLabelEvery === 0 || i === trendData.length - 1) && (
                    <text key={i} x={px(i)} y={V.h - 18} textAnchor="middle" fontSize="12.5" fill="#6B6E76">{fmtDate(d.date)}</text>
                  )
                ))}

                {hoverIdx != null && trendData[hoverIdx] && (
                  <>
                    <line x1={px(hoverIdx)} y1={V.t} x2={px(hoverIdx)} y2={py(0)} stroke="#B7B9BE" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx={px(hoverIdx)} cy={py(trendData[hoverIdx].omset)} r="5" fill="#fff" stroke="#1868DB" strokeWidth="2.5" />
                    <circle cx={px(hoverIdx)} cy={py(trendData[hoverIdx].diterima)} r="5" fill="#fff" stroke="#1F845A" strokeWidth="2.5" />
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
                  <div className="tt-row"><span className="trend-dot" style={{ background: "#1868DB" }}></span><span className="tt-name">Omset</span><b>{formatRupiah(trendData[hoverIdx].omset)}</b></div>
                  <div className="tt-row"><span className="trend-dot" style={{ background: "#1F845A" }}></span><span className="tt-name">Diterima</span><b>{formatRupiah(trendData[hoverIdx].diterima)}</b></div>
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
                  stroke="#F0F1F2" 
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
                      stroke="#292A2E"
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
                      stroke="#CFE1FD"
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
                      stroke="#8C8F97"
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
                      stroke="#8FB8F6"
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
                      stroke="#1868DB"
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
                    stroke="#DDDEE1"
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
                <div className="legend-color-dot" style={{ backgroundColor: "#1868DB" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Net Profit</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalProfit)} ({hasData ? profitPct.toFixed(1) + "%" : "—"})
                  </span>
                </div>
              </div>
              
              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#8FB8F6" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Beban Platform</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalFees)} ({hasData ? feesPct.toFixed(1) + "%" : "—"})
                  </span>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#CFE1FD" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Biaya Iklan</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalIklan)} ({hasData ? adSpendPct.toFixed(1) + "%" : "—"})
                  </span>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#8C8F97" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Beban Retur</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalRetur)} ({hasData ? returPct.toFixed(1) + "%" : "—"})
                  </span>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#292A2E" }}></div>
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

      {panelPosisi && (
        <PanelRetur
          judul={SEMUA_TAHAP_POSISI.find((t) => t.kunci === panelPosisi)?.judul ?? 'Posisi'}
          keterangan={SEMUA_TAHAP_POSISI.find((t) => t.kunci === panelPosisi)?.catatan ?? ''}
          baris={barisPosisi}
          ringkasan={posisi?.[panelPosisi] ?? null}
          onTutup={() => setPanelPosisi(null)}
        />
      )}

      {panelTahap && (
        <PanelRetur
          judul={TAHAP_RETUR.find((t) => t.kunci === panelTahap)?.judul ?? 'Retur'}
          keterangan={TAHAP_RETUR.find((t) => t.kunci === panelTahap)?.keterangan ?? ''}
          baris={barisPanel}
          ringkasan={returTahap?.[panelTahap] ?? null}
          onTutup={() => setPanelTahap(null)}
        />
      )}

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
                    <td className="ledger-td-desc" colSpan={3} style={{ textAlign: "center", color: "#8C8F97", padding: "24px 0" }}>
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
                          <td className="ledger-td-desc" colSpan={2} style={{ fontStyle: "italic", color: "#1F845A" }}>
                            Sudah settlement (riil) — {g.final_orders + g.preliminary_orders} order
                          </td>
                          <td className="text-right" style={{ color: "#1F845A" }}>{formatRupiah(riilTotal)}</td>
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
                          <td className="ledger-td-desc" colSpan={2} style={{ fontStyle: "italic", color: "#BD5B00" }}>
                            Belum settlement (perkiraan) — {g.estimated_orders} order
                          </td>
                          <td className="text-right" style={{ color: "#BD5B00" }}>{formatRupiah(estTotal)}</td>
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
