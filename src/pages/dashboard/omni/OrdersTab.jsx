import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, SlidersHorizontal, Download, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import OrderCard from "./OrderCard";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";
import "./ProductMaster.css";
import "./OmniModule.css";

const PLATFORMS = [
  { id: "shopee", label: "Shopee", logo: shopeeLogo },
  { id: "tiktok", label: "TikTok Shop", logo: tiktokLogo },
];

const isUnpaid = (o) => /unpaid/i.test(o.channelStatus || "");
const STATUS_TABS = [
  { id: "all",     label: "Semua Pesanan", match: () => true,                                     count: false },
  { id: "unpaid",  label: "Belum Dibayar", match: (o) => isUnpaid(o),                              count: true  },
  { id: "baru",    label: "Pesanan Baru",  match: (o) => o.status === "baru" && !isUnpaid(o),      count: true  },
  { id: "dikemas", label: "Siap Dikirim",  match: (o) => o.status === "dikemas",                   count: true  },
  { id: "dikirim", label: "Dikirim",       match: (o) => o.status === "dikirim",                   count: true  },
  { id: "selesai", label: "Selesai",       match: (o) => o.status === "selesai",                   count: false },
  { id: "batal",   label: "Pembatalan",    match: (o) => o.status === "batal",                     count: false },
  { id: "return",  label: "Pengembalian",  match: () => false,                                     count: false },
];

// Sub-tab per tab utama. Sub-tab pertama menampung isi; `count` = tampilkan badge angka.
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

export default function OrdersTab({ locked, onRequirePayment }) {
  const [orders, setOrders] = useState(null);
  const [tab, setTab]       = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [from, setFrom]     = useState("");
  const [to, setTo]         = useState("");
  const [perPage, setPerPage] = useState(50);
  const [page, setPage]     = useState(1);
  const [subTab, setSubTab] = useState("perlu"); // sub-tab "Siap Dikirim"
  const [channels, setChannels] = useState(() => new Set()); // filter platform
  const [filterOpen, setFilterOpen] = useState(false);
  const [busy, setBusy]     = useState(null);

  const toggleChannel = (id) =>
    setChannels((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const load = () => { setOrders(null); omniApi.listOrders().then(setOrders).catch(() => setOrders([])); };
  useEffect(load, []);

  const changeStatus = async (id, status) => {
    if (locked) return onRequirePayment?.();
    setBusy(id);
    try { await omniApi.updateOrderStatus(id, status); load(); }
    catch (err) { if (isPaymentRequired(err)) onRequirePayment?.(); }
    finally { setBusy(null); }
  };

  const all = orders ?? [];
  // Filter platform (multi-select) diterapkan lebih dulu → memengaruhi hitungan tab & daftar.
  const base = useMemo(() => (channels.size ? all.filter((o) => channels.has(o.channel)) : all), [all, channels]);
  const counts = useMemo(() => {
    const c = {};
    STATUS_TABS.forEach((t) => { c[t.id] = base.filter(t.match).length; });
    return c;
  }, [base]);

  const filtered = useMemo(() => {
    const active = STATUS_TABS.find((t) => t.id === tab) ?? STATUS_TABS[0];
    let list = base.filter(active.match);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((o) =>
      (o.externalOrderNo || "").toLowerCase().includes(q) ||
      (o.recipientName || o.customerName || "").toLowerCase().includes(q));
    if (from) { const f = new Date(from); list = list.filter((o) => new Date(o.orderedAt) >= f); }
    if (to)   { const t = new Date(to); t.setHours(23, 59, 59, 999); list = list.filter((o) => new Date(o.orderedAt) <= t); }
    // Sub-tab: hanya sub-tab pertama yang berisi (sub-status belum dilacak).
    const st = SUBTABS[tab];
    if (st && subTab !== st.tabs[0].id) list = [];
    return [...list].sort((a, b) => {
      if (sortBy === "oldest")     return new Date(a.orderedAt) - new Date(b.orderedAt);
      if (sortBy === "total_high") return b.total - a.total;
      if (sortBy === "total_low")  return a.total - b.total;
      return new Date(b.orderedAt) - new Date(a.orderedAt);
    });
  }, [base, tab, search, from, to, sortBy, subTab]);

  useEffect(() => { setPage(1); }, [tab, search, from, to, sortBy, perPage, subTab, channels]);
  useEffect(() => { const st = SUBTABS[tab]; if (st) setSubTab(st.tabs[0].id); }, [tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageNow = Math.min(page, totalPages);
  const paged = filtered.slice((pageNow - 1) * perPage, pageNow * perPage);

  const download = () => {
    const rows = [["No. Pesanan", "Tanggal", "Channel", "Pelanggan", "Status", "Total"],
      ...filtered.map((o) => [o.externalOrderNo, new Date(o.orderedAt).toLocaleString("id-ID"), o.channel, o.recipientName || o.customerName || "", o.status, o.total])];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "pesanan.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="pm-page">
      <div className="pm-head">
        <h1 className="pm-title">Pesanan</h1>
        <div className="pm-head-actions">
          <button className="pm-btn pm-btn-outline" onClick={download} disabled={!all.length}>
            <Download size={16} /> Unduh <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Tabs status */}
      <div className="pm-tabs po-tabs">
        {STATUS_TABS.map((t) => (
          <button key={t.id} className={`pm-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}{t.count && <span className="pm-tab-count">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="pm-toolbar po-toolbar">
        <div className="po-searchgroup">
          <span className="po-field-select">No. Pesanan <ChevronDown size={14} /></span>
          <span className="po-search"><Search size={17} /><input placeholder="Cari nomor pesanan" value={search} onChange={(e) => setSearch(e.target.value)} /></span>
        </div>
        <div className="pm-sort">
          <button className="pm-btn pm-btn-outline" onClick={() => setSortOpen((o) => !o)}>Urutkan <ChevronDown size={14} /></button>
          {sortOpen && (
            <div className="pm-sort-menu">
              {SORTS.map((s) => (
                <div key={s.id} className={`pm-sort-opt ${sortBy === s.id ? "active" : ""}`} onClick={() => { setSortBy(s.id); setSortOpen(false); }}>{s.label}</div>
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
          <button className={`pm-btn pm-btn-outline ${channels.size ? "po-filter-btn-active" : ""}`} onClick={() => setFilterOpen((o) => !o)}>
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

      {/* Sub-bar: pilih semua + pagination */}
      <div className="po-subbar">
        <label className="po-selectall"><input type="checkbox" disabled /> Pilih Semua</label>
        <div className="po-pagination">
          <button disabled={pageNow <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
          <span className="po-page-cur">{pageNow}</span>
          <button disabled={pageNow >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></button>
          <span className="po-perpage">Per halaman
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
              {PER_PAGE.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </span>
        </div>
      </div>

      {/* Sub-tab per tab (Siap Dikirim / Dikirim) */}
      {SUBTABS[tab] && (
        <div className="po-subtabs">
          <div className="po-subtabs-list">
            {SUBTABS[tab].tabs.map((s, i) => (
              <button key={s.id} className={`po-subtab ${subTab === s.id ? "active" : ""}`} onClick={() => setSubTab(s.id)}>
                {s.label}{s.count ? ` (${i === 0 ? counts[tab] : 0})` : ""}
              </button>
            ))}
          </div>
          {SUBTABS[tab].action && <button className="pm-btn pm-btn-outline">{SUBTABS[tab].action}</button>}
        </div>
      )}

      {/* List / empty */}
      {orders === null ? (
        <div className="pm-state">Memuat pesanan…</div>
      ) : paged.length === 0 ? (
        <div className="po-empty">
          <div className="po-empty-illust"><Search size={40} strokeWidth={2.2} /></div>
          <h3>Tidak ada pesanan yang ditemukan</h3>
          <p>Coba ubah filter atau pencarian.</p>
        </div>
      ) : (
        <div className="ord-list po-list">
          {paged.map((o) => <OrderCard key={o.id} order={o} onChangeStatus={changeStatus} busy={busy === o.id} />)}
        </div>
      )}
    </div>
  );
}
