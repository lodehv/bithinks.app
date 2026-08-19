import { useEffect, useState } from "react";
import { Search, ChevronDown, SlidersHorizontal, Download, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import { useDaftarPesanan } from "./useDaftarPesanan";
import AntreanCetak from "./AntreanCetak";
import OrderCard from "./OrderCard";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";
import "./OrdersPage.css";
import "./OmniModule.css";

// ─────────────────────────────────────────────────────────────────────────────
// Halaman Pesanan.
//
// Ditulis ulang 17 Agustus 2026. Yang berubah bukan tampilannya, melainkan
// siapa yang mengerjakan apa. Dulu berkas ini menyaring, menghitung badge,
// mengurutkan, dan memenggal halaman sendiri — semuanya di atas 200 pesanan
// terbaru yang dikirim server. Setiap angka yang tampil karena itu salah, dan
// selalu lebih kecil: tab "Siap Dikirim" menunjukkan sekitar 190 padahal
// isinya 1.074.
//
// Sekarang semua itu dikerjakan server, dan berkas ini hanya menampilkan.
// Aturan tiap tab pun tidak lagi tinggal di sini; ia ada di
// backend/lib/pesanan/saringan.ts, satu tempat saja, supaya angka di badge dan
// isi daftarnya tidak bisa bercerita berbeda.
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "shopee", label: "Shopee", logo: shopeeLogo },
  { id: "tiktok", label: "TikTok Shop", logo: tiktokLogo },
];

// Hanya label dan urutan. Arti tiap tab ada di server.
const STATUS_TABS = [
  { id: "all",     label: "Semua Pesanan", count: false },
  { id: "unpaid",  label: "Belum Dibayar", count: true  },
  { id: "baru",    label: "Pesanan Baru",  count: true  },
  { id: "dikemas", label: "Siap Dikirim",  count: true  },
  { id: "dikirim", label: "Dikirim",       count: true  },
  { id: "selesai", label: "Selesai",       count: false },
  { id: "batal",   label: "Pembatalan",    count: false },
  { id: "return",  label: "Pengembalian",  count: false },
];

// Sub-tab per tab utama. Sub-tab pertama menampung isi; sisanya masih kosong
// karena sub-statusnya memang belum dilacak — perilaku ini sengaja dibiarkan
// apa adanya, mengisinya adalah pekerjaan fitur cetak resi, bukan perbaikan ini.
const SUBTABS = {
  dikemas: { action: "Cocokkan Pesanan", tabs: [
    { id: "perlu",    label: "Perlu diproses", count: true },
    { id: "diproses", label: "Diproses",       count: true },
    { id: "telah",    label: "Telah diproses", count: true },
  ] },
  dikirim: { tabs: [
    { id: "dalam",    label: "Dalam Pengiriman", count: true },
    { id: "terkirim", label: "Telah Dikirim",    count: true },
    { id: "gagal",    label: "Pengiriman Gagal", count: true },
  ] },
  batal: { tabs: [
    { id: "pembatalan",  label: "Pembatalan",                         count: false },
    { id: "gagal_perlu", label: "Pengiriman Gagal - Perlu Diproses",  count: true  },
    { id: "gagal_telah", label: "Pengiriman Gagal - Telah Diproses",  count: false },
  ] },
};

const SORTS = [
  { id: "newest",     label: "Terbaru" },
  { id: "oldest",     label: "Terlama" },
  { id: "total_high", label: "Total tertinggi" },
  { id: "total_low",  label: "Total terendah" },
];

const PER_PAGE = [25, 50, 100];

/** Galat unduhan datang sebagai Blob, bukan JSON — pesannya harus dibongkar dulu. */
async function pesanGalatUnduh(err) {
  try {
    const teks = await err?.response?.data?.text?.();
    return JSON.parse(teks)?.error?.message ?? "Unduhan gagal.";
  } catch {
    return "Unduhan gagal.";
  }
}

export default function OrdersTab({ locked, onRequirePayment, tabAwal }) {
  // `tabAwal` datang dari pintasan di halaman depan: menekan kartu
  // "Siap dicetak" harus mendarat tepat di tumpukan itu, bukan di daftar semua
  // pesanan yang lalu harus disaring ulang manual.
  const [tab, setTab]       = useState(tabAwal ?? "all");
  const [search, setSearch] = useState("");
  const [sort, setSort]     = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [from, setFrom]     = useState("");
  const [to, setTo]         = useState("");
  const [perPage, setPerPage] = useState(50);
  const [page, setPage]     = useState(1);
  const [subTab, setSubTab] = useState("perlu");
  const [channels, setChannels] = useState(() => new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [busy, setBusy]     = useState(null);
  // Cara melihat tab "Siap Dikirim": daftar pesanan seperti biasa, atau antrean
  // cetak yang dikelompokkan per SKU. Bawaannya tetap daftar — tampilan lama
  // tidak berubah bagi yang sudah terbiasa.
  const [tampilan, setTampilan] = useState("daftar");
  const [mengunduh, setMengunduh] = useState(false);
  const [galatUnduh, setGalatUnduh] = useState(null);

  const { orders, counts, meta, pertamaKali, memuat, muatUlang } =
    useDaftarPesanan({ tab, page, perPage, sort, search, from, to, channels });

  const toggleChannel = (id) =>
    setChannels((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Balik ke halaman 1 setiap kali penyaringnya berubah. Tanpa ini, seseorang
  // yang sedang di halaman 9 lalu mempersempit filter akan mendarat di halaman
  // kosong dan mengira pesanannya hilang.
  // Pintasan yang ditekan berkali-kali harus tetap berpindah tab, bukan cuma
  // yang pertama — komponennya tidak dibongkar-pasang di antara klik.
  useEffect(() => { if (tabAwal) setTab(tabAwal); }, [tabAwal]);

  useEffect(() => { setPage(1); }, [tab, search, from, to, sort, perPage, subTab, channels]);
  useEffect(() => { const st = SUBTABS[tab]; if (st) setSubTab(st.tabs[0].id); }, [tab]);
  useEffect(() => { setTampilan("daftar"); }, [tab]);

  const changeStatus = async (id, status) => {
    if (locked) return onRequirePayment?.();
    setBusy(id);
    try { await omniApi.updateOrderStatus(id, status); muatUlang(); }
    catch (err) { if (isPaymentRequired(err)) onRequirePayment?.(); }
    finally { setBusy(null); }
  };

  // Sub-tab selain yang pertama belum punya isi (lihat catatan di SUBTABS).
  const st = SUBTABS[tab];
  const subTabKosong = Boolean(st) && subTab !== st.tabs[0].id;
  const daftar = subTabKosong ? [] : orders;

  const unduh = async () => {
    setMengunduh(true);
    setGalatUnduh(null);
    try {
      const p = { tab, sort };
      if (search.trim()) p.search = search.trim();
      if (from) p.from = from;
      if (to) p.to = to;
      if (channels.size) p.channel = [...channels].join(",");

      const blob = await omniApi.downloadOrdersCsv(p);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `pesanan-${tab}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setGalatUnduh(await pesanGalatUnduh(err));
    } finally {
      setMengunduh(false);
    }
  };

  return (
    <div className="op-page">
      <div className="op-head">
        <h1 className="op-title">Pesanan</h1>
        <div className="op-head-actions">
          <button className="op-btn op-btn-outline" onClick={unduh} disabled={mengunduh || meta.total === 0}>
            <Download size={16} /> {mengunduh ? "Menyiapkan…" : "Unduh"} <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {galatUnduh && <div className="op-state" role="alert">{galatUnduh}</div>}

      {/* Tabs status. Angkanya datang dari server — jumlah sebenarnya, bukan
          hasil menyaring daftar yang sedang tampil. */}
      <div className="op-tabs po-tabs">
        {STATUS_TABS.map((t) => (
          <button key={t.id} className={`op-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}{t.count && <span className="op-tab-count">{counts[t.id] ?? 0}</span>}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="op-toolbar po-toolbar">
        <div className="po-searchgroup">
          <span className="po-field-select">No. Pesanan <ChevronDown size={14} /></span>
          <span className="po-search"><Search size={17} /><input placeholder="Cari nomor pesanan atau nama" value={search} onChange={(e) => setSearch(e.target.value)} /></span>
        </div>
        <div className="op-sort">
          <button className="op-btn op-btn-outline" onClick={() => setSortOpen((o) => !o)}>Urutkan <ChevronDown size={14} /></button>
          {sortOpen && (
            <div className="op-sort-menu">
              {SORTS.map((s) => (
                <div key={s.id} className={`op-sort-opt ${sort === s.id ? "active" : ""}`} onClick={() => { setSort(s.id); setSortOpen(false); }}>{s.label}</div>
              ))}
            </div>
          )}
        </div>
        <div className="po-daterange">
          <Calendar size={15} />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Dari" />
          <span>–</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Sampai" />
        </div>
        <div className="po-filter">
          <button className={`op-btn op-btn-outline ${channels.size ? "po-filter-btn-active" : ""}`} onClick={() => setFilterOpen((o) => !o)}>
            <SlidersHorizontal size={15} /> Filter{channels.size > 0 && <span className="po-filter-badge">{channels.size}</span>}
          </button>
          {filterOpen && (
            <>
              <div className="po-filter-backdrop" onClick={() => setFilterOpen(false)} />
              <div className="po-filter-panel">
                <div className="po-filter-head">
                  <span>Platform</span>
                  {channels.size > 0 && <button className="po-filter-reset" onClick={() => setChannels(new Set())}>Reset</button>}
                </div>
                {PLATFORMS.map((p) => (
                  <label key={p.id} className="po-filter-opt">
                    <input type="checkbox" checked={channels.has(p.id)} onChange={() => toggleChannel(p.id)} />
                    <span className="po-filter-logo"><img src={p.logo} alt={p.label} /></span>
                    <span className="po-filter-label">{p.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pemilih tampilan — hanya di tab "Siap Dikirim", karena hanya di situ
          ada antrean cetak. Ditaruh sebelum sub-bar supaya pagination tidak
          muncul saat antrean cetak yang sedang dilihat (ia tidak berhalaman:
          daftar kerja harus terlihat utuh). */}
      {tab === "dikemas" && (
        /* Tab bergaris bawah, bukan pil berkotak. Ini perpindahan TAMPILAN
           halaman — tingkat paling atas — jadi ia harus digambar berbeda dari
           tombol beruas dan chip saringan di bawahnya. Kalau semuanya digambar
           sebagai kotak sudut bulat, tidak ada yang menuntun mata. */
        <div style={{ display: "flex", gap: 20, margin: "12px 0 0", borderBottom: "1px solid #E5E7EB" }}>
          {[["daftar", "Daftar Pesanan"], ["antrean", "Antrean Cetak per SKU"]].map(([id, label]) => (
            <button key={id} onClick={() => setTampilan(id)} style={{
              padding: "0 0 10px", border: "none", background: "none", cursor: "pointer",
              fontSize: 14, fontFamily: "inherit",
              fontWeight: tampilan === id ? 600 : 500,
              color: tampilan === id ? "#111827" : "#6B7280",
              boxShadow: tampilan === id ? "inset 0 -2px 0 #4F46E5" : "none",
            }}>{label}</button>
          ))}
        </div>
      )}

      {tab === "dikemas" && tampilan === "antrean" ? <AntreanCetak /> : <>

      {/* Sub-bar: pilih semua + pagination.
          Nomor halaman ditulis "3 / 21", bukan "3" saja. Angka tunggal tidak
          memberi tahu masih ada berapa lagi di belakang — dan pesanan yang
          tidak diketahui keberadaannya adalah pesanan yang tidak dikerjakan. */}
      <div className="po-subbar">
        <label className="po-selectall"><input type="checkbox" disabled /> Pilih Semua</label>
        <div className="po-pagination">
          <button disabled={meta.page <= 1 || memuat} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
          <span className="po-page-cur">{meta.page} / {meta.totalPages}</span>
          <button disabled={meta.page >= meta.totalPages || memuat} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></button>
          <span className="po-perpage">Per halaman
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
              {PER_PAGE.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </span>
        </div>
      </div>

      {/* Sub-tab per tab (Siap Dikirim / Dikirim / Pembatalan) */}
      {st && (
        <div className="po-subtabs">
          <div className="po-subtabs-list">
            {st.tabs.map((s, i) => (
              <button key={s.id} className={`po-subtab ${subTab === s.id ? "active" : ""}`} onClick={() => setSubTab(s.id)}>
                {s.label}{s.count ? ` (${i === 0 ? counts[tab] ?? 0 : 0})` : ""}
              </button>
            ))}
          </div>
          {st.action && <button className="op-btn op-btn-outline">{st.action}</button>}
        </div>
      )}

      {/* List / empty */}
      {pertamaKali ? (
        <div className="op-state">Memuat pesanan…</div>
      ) : daftar.length === 0 ? (
        <div className="po-empty">
          <div className="po-empty-illust"><Search size={40} strokeWidth={2.2} /></div>
          <h3>Tidak ada pesanan yang ditemukan</h3>
          <p>Coba ubah filter atau pencarian.</p>
        </div>
      ) : (
        <div className="ord-list po-list" style={memuat ? { opacity: 0.55 } : undefined}>
          {daftar.map((o) => <OrderCard key={o.id} order={o} onChangeStatus={changeStatus} busy={busy === o.id} />)}
        </div>
      )}

      </>}
    </div>
  );
}
