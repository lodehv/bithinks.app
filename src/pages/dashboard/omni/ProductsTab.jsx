import { useEffect, useMemo, useState } from "react";
import {
  Search, ChevronDown, SlidersHorizontal, Download, Plus, MoreHorizontal,
  Info, ArrowUpDown, PackageOpen, Check, AlertTriangle, RefreshCw, X,
  Calendar, Layers, TrendingUp, DollarSign, Package, Edit3, ShoppingBag, Trash2
} from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import GrafikBatang from "./GrafikBatang";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";
import MarketplaceProductsTab from "./MarketplaceProductsTab";
import "./ProductMaster.css";
import "./OmniModule.css";

const rupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");



export default function ProductsTab({ locked, onRequirePayment }) {
  const [activeTab, setActiveTab] = useState("master"); // master | marketplace
  const [products, setProducts] = useState(null);
  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState("newest");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showForm, setShow]     = useState(false);
  const [editingId, setEditing] = useState(null);
  const [menuFor, setMenuFor]   = useState(null);
  
  // Mobile detail drawer state
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  
  // Filter panel dropdown state
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedStore, setSelectedStore]       = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedUnit, setSelectedUnit]         = useState("all");
  const [selectedStatus, setSelectedStatus]     = useState("active");

  // ── Periode ──
  // Sampai 20 Agustus 2026 "Periode" cuma teks mati di layar: 01 Jun - 07 Jul.
  // Semua angka di halaman ini sebenarnya sepanjang masa, dan tidak ada yang
  // tahu itu. Sekarang ia kendali sungguhan, dan bawaannya 30 hari terakhir —
  // rentang yang berarti untuk operasi harian, bukan total seumur toko.
  const hariWib = (geser = 0) =>
    new Date(Date.now() + 7 * 3600 * 1000 + geser * 86400000).toISOString().slice(0, 10);
  const [dari, setDari]     = useState(() => hariWib(-29));
  const [sampai, setSampai] = useState(() => hariWib(0));

  // Daftar toko SUNGGUHAN, diambil dari toko yang terhubung. Sebelumnya isinya
  // dikarang ("Toko BitOmni") padahal ada 15 toko nyata.
  const [stores, setStores] = useState([]);

  const [form, setForm]         = useState({ name: "", costPrice: "", masterStock: "", category: "", unit: "" });
  const [stats, setStats]       = useState(null);   // dashboard-stats (movement, COGS, kategori, buckets)
  const [chartGran, setChartGran] = useState("day");
  const [saving, setSaving]     = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [note, setNote]         = useState("");
  const [error, setError]       = useState("");

  // Seluruh angka halaman ini — kartu, grafik, donat kategori, Top 5, dan kolom
  // Total Keluar/COGS di tabel — datang dari SATU panggilan ini. Jadi penyaring
  // cukup dikirim sekali, dan tidak ada bagian layar yang tertinggal
  // menampilkan periode lain.
  const loadStats = (g) =>
    omniApi.productDashboardStats({
      granularity: g,
      startDate: dari,
      endDate: sampai,
      channel: selectedPlatform,
      storeId: selectedStore,
    }).then(setStats).catch(() => {});

  const load = () => {
    setProducts(null);
    omniApi.listProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
    omniApi.listStores().then((d) => setStores(Array.isArray(d) ? d : [])).catch(() => {});
    loadStats(chartGran);
  };

  useEffect(load, []);
  // Angka dimuat ulang setiap penyaringnya berubah — itu inti perbaikan ini.
  useEffect(() => { loadStats(chartGran); },
    [chartGran, dari, sampai, selectedPlatform, selectedStore]);

  // Toko yang ditawarkan mengikuti platform yang dipilih. Kalau toko yang
  // sedang aktif tidak ada di platform baru, pilihannya dikembalikan ke "semua"
  // — kalau tidak, layar menampilkan nol dan orang mengira datanya hilang.
  const storesTampil = stores.filter(
    (t) => selectedPlatform === "all" || t.channel === selectedPlatform);
  useEffect(() => {
    if (selectedStore !== "all" && !storesTampil.some((t) => t.id === selectedStore)) {
      setSelectedStore("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatform, stores]);
  const guard = (err) => { if (isPaymentRequired(err)) { onRequirePayment?.(); return true; } return false; };

  // Data REAL: produk master + statistik movement/COGS per master (dari resep SKU).
  const statsByMaster = useMemo(
    () => new Map((stats?.perMaster ?? []).map((m) => [m.masterProductId, m])),
    [stats],
  );
  const all = useMemo(() => (products ?? []).map((p) => {
    const st = statsByMaster.get(p.id);
    return {
      ...p,
      category: p.category ?? null,
      totalKeluar: st?.movementQty ?? 0,
      cogsTotal: st?.cogsTotal ?? 0,
      avgCogs: st?.avgCogs ?? null,
      skuCount: st?.skuCount ?? 0,
      mappedSkus: st?.skus ?? [],
      mchannels: st?.channels ?? [],
    };
  }), [products, statsByMaster]);
  const categories = useMemo(
    () => Array.from(new Set(all.map((p) => p.category || "Umum"))).sort(),
    [all],
  );
  const units = useMemo(
    () => Array.from(new Set(all.map((p) => p.unit || "pcs"))).sort(),
    [all],
  );

  // Sync selected product ID on load
  useEffect(() => {
    if (all.length > 0 && !selectedProductId) {
      setSelectedProductId(all[0].id);
    }
  }, [all, selectedProductId]);

  // Apply filters
  const shown = useMemo(() => {
    let list = [...all];

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => 
        p.name.toLowerCase().includes(q) || 
        (p.sku || "").toLowerCase().includes(q)
      );
    }

    // Platform Filter
    if (selectedPlatform !== "all") {
      list = list.filter(p => {
        const active = p.channels?.map(c => typeof c === "string" ? c : c?.channel) || [];
        return active.includes(selectedPlatform);
      });
    }

    // Category Filter
    if (selectedCategory !== "all") {
      list = list.filter((p) => (p.category || "Umum") === selectedCategory);
    }

    // Unit Filter
    if (selectedUnit !== "all") {
      list = list.filter((p) => (p.unit || "pcs") === selectedUnit);
    }

    // Sort
    return list.sort((a, b) => {
      if (sortBy === "name")  return a.name.localeCompare(b.name);
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "stock") return (b.masterStock || 0) - (a.masterStock || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [all, search, selectedPlatform, selectedCategory, selectedUnit, sortBy]);

  // Find currently selected product object
  const selectedProduct = useMemo(() => {
    return all.find(p => p.id === selectedProductId) || all[0] || null;
  }, [all, selectedProductId]);

  const blankForm = { name: "", costPrice: "", masterStock: "", category: "", unit: "" };
  const openAdd = () => { setEditing(null); setForm(blankForm); setError(""); setShow(true); };
  
  const openEdit = (p) => {
    setMenuFor(null); 
    setEditing(p.id); 
    setError("");
    setForm({
      name: p.name ?? "",
      costPrice: p.costPrice ?? "",
      masterStock: p.masterStock ?? "",
      category: p.category ?? "",
      unit: p.unit ?? "",
    });
    setShow(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    const payload = {
      name: form.name.trim(),
      costPrice: form.costPrice === "" ? null : Number(form.costPrice),
      masterStock: Number(form.masterStock) || 0,
      category: form.category.trim() || null,
      unit: form.unit.trim() || null,
    };
    try {
      if (editingId) await omniApi.updateProduct(editingId, payload);
      else await omniApi.createProduct(payload);
      setForm(blankForm); setShow(false); setEditing(null); load();
    } catch (err) { if (guard(err)) return; setError(err?.response?.data?.error?.message ?? "Gagal menyimpan produk."); }
    finally { setSaving(false); }
  };

  const removeProduct = async (p) => {
    setMenuFor(null);
    if (!window.confirm(`Hapus produk "${p.name}"?`)) return;
    setError("");
    try { await omniApi.deleteProduct(p.id); load(); }
    catch (err) { if (guard(err)) return; setError(err?.response?.data?.error?.message ?? "Gagal menghapus produk."); }
  };

  const sync = async () => {
    setNote(""); setError(""); setSyncing(true);
    try {
      const res = await omniApi.syncStock();
      setNote(`Tersinkron ke ${res.stores} toko · ${res.products} produk diperbarui.`); load();
    } catch (err) { if (guard(err)) return; setError(err?.response?.data?.error?.message ?? "Gagal menyinkronkan stok."); }
    finally { setSyncing(false); }
  };

  const download = () => {
    const rows = [["Nama", "SKU", "Harga", "Stok"], ...all.map((p) => [p.name, p.sku, p.price, p.masterStock])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "produk-master.csv"; a.click(); URL.revokeObjectURL(url);
  };

  // KPI real (dashboard-stats)
  const totalMasterProdukCount = stats?.kpi?.masterCount ?? all.length;
  const totalSkuMarketplaceCount = stats?.kpi?.skuMarketplaceTotal ?? 0;
  const skuMappedCount = stats?.kpi?.skuMapped ?? 0;
  const totalMovementKeluarCount = stats?.totals?.movementQty ?? 0;
  const totalCogsSum = stats?.totals?.cogsTotal ?? 0;
  const hppMissingQty = stats?.totals?.hppMissingQty ?? 0;
  const totalStokTersediaSum = stats?.kpi?.stockPhysical ?? 0;

  // Render marketplace icon chips cleanly
  const renderMarketplaceIcons = (channels = []) => {
    const activeChannels = channels.map(c => typeof c === "string" ? c : c?.channel);
    return (
      <div className="marketplace-icon-chips-row">
        {activeChannels.includes("shopee") && (
          <span className="marketplace-icon-chip border-orange" title="Shopee">
            <img src={shopeeLogo} alt="Shopee" />
          </span>
        )}
        {activeChannels.includes("tiktok") && (
          <span className="marketplace-icon-chip border-black" title="TikTok Shop">
            <img src={tiktokLogo} alt="TikTok Shop" />
          </span>
        )}
        {activeChannels.includes("lazada") && (
          <span className="marketplace-icon-chip border-pink" title="Lazada">
            <span className="initial-avatar bg-pink">L</span>
          </span>
        )}
        {activeChannels.includes("tokopedia") && (
          <span className="marketplace-icon-chip border-green" title="Tokopedia">
            <span className="initial-avatar bg-green">T</span>
          </span>
        )}
      </div>
    );
  };

  // Grafik real dari buckets dashboard-stats
  const chartBuckets = stats?.buckets ?? [];
  const BLN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const fmtBucketLabel = (b) => {
    if (chartGran === "month") { const [y, m] = b.split("-"); return `${BLN[Number(m) - 1]} ${y.slice(2)}`; }
    const parts = b.split("-"); return `${parts[2]}/${parts[1]}`;
  };
  const fmtAxisQty = (v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `${Math.round(v)}`);
  const fmtAxisRp = (v) => (v >= 1e9 ? `${(v / 1e9).toFixed(1)}M` : v >= 1e6 ? `${(v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1)} jt` : v >= 1e3 ? `${Math.round(v / 1e3)}rb` : `${Math.round(v)}`);

  // Label tanggal ditipiskan supaya tidak bertumpuk saat harinya banyak.
  const labelSetiap = Math.max(1, Math.ceil(chartBuckets.length / 8));
  const dataKeluar = chartBuckets.map((b) => ({ label: fmtBucketLabel(b.bucket), nilai: b.movementQty }));
  const dataCogs   = chartBuckets.map((b) => ({ label: fmtBucketLabel(b.bucket), nilai: b.cogs }));

  // Donut kategori real
  const donutColors = ["#0C66E4", "#579DFF", "#579DFF", "#85B8FF", "#CCE0FF"];
  const catList = (stats?.byCategory ?? []).filter((c) => c.cogs > 0);
  const catTotal = catList.reduce((a, c) => a + c.cogs, 0);
  const DONUT_CIRC = 2 * Math.PI * 38;
  let donutAcc = 0;
  const donutSegs = catList.map((c, i) => {
    const dash = catTotal > 0 ? (c.cogs / catTotal) * DONUT_CIRC : 0;
    const seg = { ...c, color: donutColors[i % donutColors.length], dash, offset: -donutAcc, pct: catTotal > 0 ? Math.round((c.cogs / catTotal) * 100) : 0 };
    donutAcc += dash;
    return seg;
  });
  const fmtRpShort = (v) => (v >= 1e9 ? `Rp ${(v / 1e9).toFixed(1)}M` : v >= 1e6 ? `Rp ${(v / 1e6).toFixed(1)}jt` : `Rp ${Math.round(v).toLocaleString("id-ID")}`);
  const top5 = (stats?.perMaster ?? []).filter((m) => m.cogsTotal > 0).slice(0, 5);

  return (
    <div className="pm-master-container">

      {/* ─── Tab: Master Produk | Produk Marketplaces ─── */}
      <div className="pm-toptabs">
        <button className={`pm-toptab ${activeTab === "master" ? "active" : ""}`} onClick={() => setActiveTab("master")}>Master Produk</button>
        <button className={`pm-toptab ${activeTab === "marketplace" ? "active" : ""}`} onClick={() => setActiveTab("marketplace")}>Produk Marketplaces</button>
      </div>

      {activeTab === "marketplace" ? (
        <MarketplaceProductsTab locked={locked} onRequirePayment={onRequirePayment} />
      ) : (
      <>
      {/* ─── Row 1: Title and Top Actions Row ─── */}
      <div className="pm-title-action-header">
        <div className="title-section">
          <h1 className="pm-title">Master Produk</h1>
          <p className="pm-subtitle">Kelola master produk & integrasi SKU marketplace secara terpusat</p>
        </div>
        <div className="pm-header-actions-group">
          <button className="pm-btn pm-btn-mapping" onClick={() => (locked ? onRequirePayment?.() : sync())}>
            <Layers size={14} />
            <span>Mapping SKU</span>
          </button>
          <button className="pm-btn pm-btn-add-product" onClick={() => (locked ? onRequirePayment?.() : openAdd())}>
            <Plus size={14} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* ─── Row 2: Filter Toolbar Bar ─── */}
      <div className="pm-filter-toolbar-row">
        <div className="filters-inputs-grid">
          
          {/* Custom Styled Select: Platform */}
          <div className="filter-input-select-box">
            <label>Platform</label>
            <div className="premium-select-wrapper">
              <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}>
                <option value="all">Semua Platform</option>
                <option value="shopee">Shopee</option>
                <option value="tiktok">TikTok Shop</option>
                <option value="lazada">Lazada</option>
                <option value="tokopedia">Tokopedia</option>
              </select>
              <ChevronDown size={12} className="select-chevron-icon" />
            </div>
          </div>

          {/* Custom Styled Select: Toko */}
          <div className="filter-input-select-box">
            <label>Toko</label>
            <div className="premium-select-wrapper">
              {/* Toko SUNGGUHAN dari yang terhubung. Isinya dulu dikarang
                  ("Toko BitOmni") padahal ada 15 toko nyata — dan nilainya
                  tidak pernah dibaca ke mana pun. */}
              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
                <option value="all">
                  Semua Toko{storesTampil.length ? ` (${storesTampil.length})` : ""}
                </option>
                {storesTampil.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.channel === "shopee" ? "Shopee" : t.channel === "tiktok" ? "TikTok" : t.channel} — {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="select-chevron-icon" />
            </div>
          </div>

          {/* Custom Styled Select: Kategori */}
          <div className="filter-input-select-box">
            <label>Kategori</label>
            <div className="premium-select-wrapper">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">Semua Kategori</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={12} className="select-chevron-icon" />
            </div>
          </div>

          {/* Periode — kendali SUNGGUHAN.
              Sebelumnya cuma <span> berisi teks mati "01 Jun - 07 Jul 2026",
              sementara angka di kartu sebenarnya sepanjang masa. Tidak ada yang
              bisa tahu itu dari layar. */}
          <div className="filter-input-select-box date-range-picker-input">
            <label>Periode</label>
            <div className="date-input-icon-row">
              <Calendar size={13} className="text-gray" />
              <input type="date" value={dari} max={sampai}
                     onChange={(e) => setDari(e.target.value)} aria-label="Dari tanggal"
                     style={{ border: "none", background: "none", font: "inherit", color: "inherit", padding: 0 }} />
              <span style={{ opacity: 0.5 }}>–</span>
              <input type="date" value={sampai} min={dari} max={hariWib(0)}
                     onChange={(e) => setSampai(e.target.value)} aria-label="Sampai tanggal"
                     style={{ border: "none", background: "none", font: "inherit", color: "inherit", padding: 0 }} />
            </div>
          </div>

          {/* Pintasan periode. "Hari ini" yang paling sering dipakai: pemilik
              toko ingin tahu barang apa yang keluar HARI INI, di toko mana. */}
          <div className="filter-input-select-box">
            <label>Pintasan</label>
            <div style={{ display: "flex", gap: 4 }}>
              {[["Hari ini", 0], ["7 hari", 6], ["30 hari", 29]].map(([teks, mundur]) => {
                const d = hariWib(-mundur), s2 = hariWib(0);
                const aktif = dari === d && sampai === s2;
                return (
                  <button key={teks} onClick={() => { setDari(d); setSampai(s2); }} style={{
                    padding: "5px 9px", borderRadius: 6, cursor: "pointer", fontSize: 12,
                    fontWeight: aktif ? 600 : 500,
                    border: `1px solid ${aktif ? "#0C66E4" : "#DCDFE4"}`,
                    background: aktif ? "#E9F2FF" : "#fff",
                    color: aktif ? "#0C66E4" : "#626F86",
                  }}>{teks}</button>
                );
              })}
            </div>
          </div>
        </div>

        <button className="pm-btn pm-btn-export" onClick={download} disabled={!all.length}>
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>

      {note  && <div className="omni-pill sync"  style={{ margin: "4px 0 0" }}><Check size={12} /> {note}</div>}
      {error && <div className="omni-pill error" style={{ margin: "4px 0 0" }}><AlertTriangle size={12} /> {error}</div>}

      {/* ─── Row of 5 KPI Summary Cards (Vertical Layout) ─── */}
      <div className="pm-kpi-row-grid">
        {/* Card 1: Total Master Produk */}
        <div className="pm-kpi-metric-card">
          <div className="kpi-card-header-row">
            <div className="kpi-icon-badge bg-purple-light text-purple">
              <Package size={16} />
            </div>
            <span className="kpi-label">Total Master Produk</span>
          </div>
          <h2 className="kpi-number-value">{totalMasterProdukCount}</h2>
          <div className="kpi-card-footer-row">
            <span className="subtext-muted">Produk aktif</span>
          </div>
        </div>

        {/* Card 2: Total SKU Marketplace */}
        <div className="pm-kpi-metric-card">
          <div className="kpi-card-header-row">
            <div className="kpi-icon-badge bg-purple-light text-purple">
              <Layers size={16} />
            </div>
            <span className="kpi-label">Total SKU Marketplace</span>
          </div>
          <h2 className="kpi-number-value">{totalSkuMarketplaceCount}</h2>
          <div className="kpi-card-footer-row">
            <span className="subtext-trend text-purple">{skuMappedCount} dipetakan</span>
            <span className="subtext-muted">SKU terhubung</span>
          </div>
        </div>

        {/* Card 3: Total Movement (Keluar) */}
        <div className="pm-kpi-metric-card">
          <div className="kpi-card-header-row">
            <div className="kpi-icon-badge bg-purple-light text-purple">
              <TrendingUp size={16} />
            </div>
            <span className="kpi-label">Total Movement (Keluar)</span>
          </div>
          <h2 className="kpi-number-value">{totalMovementKeluarCount.toLocaleString("id-ID")} <span className="kpi-value-unit">pcs</span></h2>
          <div className="kpi-card-footer-row">
            <span className="subtext-muted">Keluar / dikirim</span>
          </div>
        </div>

        {/* Card 4: Total COGS */}
        <div className="pm-kpi-metric-card">
          <div className="kpi-card-header-row">
            <div className="kpi-icon-badge bg-purple-light text-purple">
              <DollarSign size={16} />
            </div>
            <span className="kpi-label">Total COGS</span>
          </div>
          <h2 className="kpi-number-value">{rupiah(totalCogsSum)}</h2>
          <div className="kpi-card-footer-row">
            {hppMissingQty > 0 && <span className="subtext-trend text-orange">{hppMissingQty.toLocaleString("id-ID")} pcs tanpa HPP</span>}
            <span className="subtext-muted">Total biaya pokok</span>
          </div>
        </div>

        {/* Card 5: Stok Tersedia (Fisik) */}
        <div className="pm-kpi-metric-card">
          <div className="kpi-card-header-row">
            <div className="kpi-icon-badge bg-purple-light text-purple">
              <ShoppingBag size={16} />
            </div>
            <span className="kpi-label">Stok Tersedia (Fisik)</span>
          </div>
          <h2 className="kpi-number-value">{totalStokTersediaSum.toLocaleString("id-ID")} <span className="kpi-value-unit">pcs</span></h2>
          <div className="kpi-card-footer-row">
            <span className="subtext-muted">Total fisik gudang</span>
          </div>
        </div>
      </div>

      {/* ─── Middle Section (Analytics: Line Chart, Donut Chart, Top 5 Products) ─── */}
      <div className="pm-analytics-grid-row">
        
        {/* Column 1: Ringkasan Movement & COGS */}
        <div className="analytics-card-item">
          <div className="card-item-header">
            <h3>Ringkasan Movement & COGS</h3>
            <div className="card-header-tabs-toggle">
              <button className={`tab-toggle-btn ${chartGran === "day" ? "active" : ""}`} onClick={() => setChartGran("day")}>Hari</button>
              <button className={`tab-toggle-btn ${chartGran === "week" ? "active" : ""}`} onClick={() => setChartGran("week")}>Minggu</button>
              <button className={`tab-toggle-btn ${chartGran === "month" ? "active" : ""}`} onClick={() => setChartGran("month")}>Bulan</button>
            </div>
          </div>
          <div className="card-item-body">
            {/* DUA PANEL, BUKAN DUA SUMBU DI SATU BIDANG.
                Grafik sebelumnya menaruh pcs di sumbu kiri dan Rupiah di sumbu
                kanan. Keduanya lalu terlihat nyaris berimpit — bukan karena
                berkaitan erat, tapi karena masing-masing dipaskan ke skalanya
                sendiri. Perbandingan yang muncul dari penskalaan, bukan dari
                datanya, adalah kesalahan grafik yang paling sering terjadi.

                Sekarang tiap ukuran punya panelnya sendiri dan berbagi sumbu
                tanggal. Hari ketika Rupiah tinggi sementara pcs pendek — barang
                mahal yang laku — jadi terlihat, bukan tenggelam. */}
            <div style={{ padding: "4px 2px 0" }}>
              <GrafikBatang
                data={dataKeluar} warna="#0C66E4"
                judul="Total Keluar" satuan="pcs" format={fmtAxisQty}
                labelSetiap={labelSetiap} tinggi={120}
              />
              <div style={{ height: 18 }} />
              <GrafikBatang
                data={dataCogs} warna="#85B8FF"
                judul="COGS" satuan="Rp" format={fmtAxisRp}
                labelSetiap={labelSetiap} tinggi={120}
              />
            </div>
          </div>
        </div>

        {/* Column 2: Breakdown COGS per Kategori (Legend positioned below chart in a 2-column grid) */}
        <div className="analytics-card-item">
          <div className="card-item-header">
            <h3>Breakdown COGS per Kategori</h3>
            <button className="text-purple-link">Lihat Detail</button>
          </div>
          <div className="card-item-body vertical-stack-layout">
            <div className="donut-chart-wrapper centered-donut">
              <svg width="100" height="100" viewBox="0 0 100 100" className="donut-svg">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F2F4" strokeWidth="8" />
                {donutSegs.map((seg) => (
                  <circle key={seg.category} cx="50" cy="50" r="38" fill="transparent" stroke={seg.color} strokeWidth="8"
                    strokeDasharray={`${seg.dash} ${DONUT_CIRC - seg.dash}`} strokeDashoffset={seg.offset} transform="rotate(-90 50 50)" />
                ))}
              </svg>
              <div className="donut-inner-text">
                <span className="text-small">Total</span>
                <span className="text-bold">{fmtRpShort(catTotal)}</span>
              </div>
            </div>

            <div className="donut-labels-list-grid">
              {donutSegs.length === 0 ? (
                <span className="subtext-muted" style={{ fontSize: 11 }}>Belum ada COGS — petakan SKU & isi HPP master</span>
              ) : (
                donutSegs.map((seg) => (
                  <div className="label-item-grid" key={seg.category}>
                    <div className="color-dot" style={{ background: seg.color }}></div>
                    <div className="label-text-column">
                      <span className="label-name text-truncate">{seg.category}</span>
                      <div className="label-details-row">
                        <span className="label-val">{fmtRpShort(seg.cogs)}</span>
                        <span className="label-pct">{seg.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Top 5 Produk (COGS Tertinggi) */}
        <div className="analytics-card-item">
          <div className="card-item-header">
            <h3>Top 5 Produk (COGS/Harga Pokok)</h3>
            <button className="text-purple-link">Lihat Semua</button>
          </div>
          <div className="card-item-body no-padding">
            <table className="mini-top5-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th className="text-right">COGS</th>
                </tr>
              </thead>
              <tbody>
                {top5.length === 0 ? (
                  <tr><td colSpan="2" className="subtext-muted" style={{ fontSize: 11.5, padding: "14px 4px" }}>Belum ada COGS tercatat</td></tr>
                ) : (
                  top5.map((m) => (
                    <tr key={m.masterProductId}>
                      <td className="font-semibold text-black text-truncate" style={{ maxWidth: 140 }}>{m.name}</td>
                      <td className="text-right font-semibold text-black">{rupiah(m.cogsTotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ─── Bottom Section (Split-Pane: Products Table & Product Details Card) ─── */}
      <div className="pm-split-layout-wrapper">
        
        {/* Left Hand: Main Products Table */}
        <div className="pm-table-card-section">
          {/* Sub Toolbar inside Table Card */}
          <div className="pm-sub-toolbar-filters">
            <div className="sub-search-input-box">
              <Search size={14} className="search-icon" />
              <input 
                type="text" 
                placeholder="Cari produk..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
              {search && (
                <button className="clear-search-btn" onClick={() => setSearch("")}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Premium Select: Status Produk */}
            <div className="sub-filter-select-box">
              <label>Status Produk</label>
              <div className="premium-select-wrapper">
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Non-aktif</option>
                </select>
                <ChevronDown size={10} className="select-chevron-icon" />
              </div>
            </div>

            {/* Premium Select: Kategori */}
            <div className="sub-filter-select-box">
              <label>Kategori</label>
              <div className="premium-select-wrapper">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">Semua</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={10} className="select-chevron-icon" />
              </div>
            </div>

            {/* Premium Select: Satuan */}
            <div className="sub-filter-select-box">
              <label>Satuan</label>
              <div className="premium-select-wrapper">
                <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                  <option value="all">Semua</option>
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown size={10} className="select-chevron-icon" />
              </div>
            </div>

            <button className="pm-btn pm-btn-filter-more">
              <SlidersHorizontal size={13} />
              <span>Filter</span>
            </button>
          </div>

          {/* Main Products Table Grid */}
          <div className="pm-table-responsive-container">
            <table className="pm-main-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th>Satuan</th>
                  <th className="text-right">Stok Fisik</th>
                  <th className="text-right">Total Keluar</th>
                  <th className="text-right">COGS Total</th>
                  <th className="text-right">Rata² COGS</th>
                  <th className="text-right">SKU Marketplace</th>
                  <th>Marketplace</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="empty-table-state">
                      <PackageOpen size={24} className="text-gray" />
                      <p>Tidak ada produk master terdaftar atau cocok dengan filter.</p>
                    </td>
                  </tr>
                ) : (
                  shown.map((p) => {
                    const isSelected = p.id === selectedProductId;
                    return (
                      <tr 
                        key={p.id} 
                        className={`table-row-item ${isSelected ? "row-selected" : ""}`}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setIsMobileDetailOpen(true);
                        }}
                      >
                        <td>
                          <div className="table-product-info-cell">
                            <span className="cell-thumbnail">
                              {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <PackageOpen size={14} className="text-gray" />}
                            </span>
                            <div className="cell-name-sku text-truncate" style={{ maxWidth: 180 }}>
                              <span className="product-name-txt text-truncate">{p.name}</span>
                              <span className="product-sku-txt text-truncate">{p.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="category-badge-chip">
                            {p.category || "Umum"}
                          </span>
                        </td>
                        <td>{p.unit || "pcs"}</td>
                        <td className="text-right font-bold text-black">{p.masterStock}</td>
                        <td className="text-right">{(p.totalKeluar || 0).toLocaleString("id-ID")}</td>
                        <td className="text-right font-semibold text-black">{rupiah(p.cogsTotal || 0)}</td>
                        <td className="text-right text-gray">{p.avgCogs != null ? rupiah(p.avgCogs) : "—"}</td>
                        <td className="text-right font-semibold text-black">{p.skuCount || 0} SKU</td>
                        <td>{renderMarketplaceIcons(p.mchannels?.length ? p.mchannels : p.channels)}</td>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="actions-button-group">
                            <button className="action-circle-btn" onClick={() => openEdit(p)} title="Edit">
                              <Edit3 size={13} className="text-gray" />
                            </button>
                            <button className="action-circle-btn danger-action" onClick={() => (locked ? onRequirePayment?.() : removeProduct(p))} title="Hapus">
                              <Trash2 size={13} className="text-gray" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="pm-table-footer-pagination-row">
            <span className="showing-entries-label">
              Menampilkan 1 - {shown.length} dari {all.length} produk
            </span>
            <div className="pagination-controls-box">
              <div className="page-limit-selector-wrapper">
                <select>
                  <option>10 / halaman</option>
                  <option>20 / halaman</option>
                  <option>50 / halaman</option>
                </select>
              </div>
              <div className="pagination-pages-list">
                <button className="page-nav-btn" disabled>&lt;</button>
                <button className="page-number-btn active">1</button>
                <button className="page-number-btn">2</button>
                <button className="page-number-btn">3</button>
                <button className="page-number-btn">4</button>
                <button className="page-number-btn">5</button>
                <span className="page-dots">...</span>
                <button className="page-number-btn">17</button>
                <button className="page-nav-btn">&gt;</button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Backdrop Overlay for bottom drawer */}
        {isMobileDetailOpen && (
          <div className="mobile-backdrop-overlay" onClick={() => setIsMobileDetailOpen(false)} />
        )}

        {/* Right Hand: Product Detail Side Panel / Slide-up Bottom Sheet */}
        <div className={`pm-detail-side-panel ${isMobileDetailOpen ? "mobile-open" : ""}`}>
          {selectedProduct ? (
            <div className="detail-panel-card-content">
              {/* Mobile Drawer Notch Bar */}
              <div className="mobile-drawer-handle-bar"></div>

              {/* Close Button for mobile view */}
              <button className="mobile-detail-close-btn" onClick={() => setIsMobileDetailOpen(false)}>
                <X size={16} />
              </button>

              <div className="detail-product-banner">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt="" className="banner-img" />
                ) : (
                  <div className="banner-placeholder">
                    <PackageOpen size={48} className="text-gray" />
                  </div>
                )}
              </div>

              <div className="detail-title-section-row">
                <div className="title-sku-group text-truncate" style={{ maxWidth: "80%" }}>
                  <h3 className="detail-product-name text-truncate">{selectedProduct.name}</h3>
                  <span className="detail-product-sku text-truncate">{selectedProduct.sku}</span>
                </div>
                <span className="detail-status-badge">Aktif</span>
              </div>

              <div className="detail-info-block-section">
                <h4>Informasi Produk</h4>
                <div className="info-ledger-list">
                  <div className="ledger-row">
                    <span className="ledger-label">Kategori</span>
                    <span className="ledger-val font-semibold text-black">{selectedProduct.category || "Umum"}</span>
                  </div>
                  <div className="ledger-row">
                    <span className="ledger-label">Satuan</span>
                    <span className="ledger-val">{selectedProduct.unit || "pcs"}</span>
                  </div>
                  <div className="ledger-row">
                    <span className="ledger-label">Stok Fisik</span>
                    <span className="ledger-val font-bold text-black">{selectedProduct.masterStock || 0}</span>
                  </div>
                  <div className="ledger-row">
                    <span className="ledger-label">Harga Pokok Terakhir</span>
                    <span className="ledger-val font-semibold text-black">{selectedProduct.costPrice != null ? rupiah(selectedProduct.costPrice) : "—"}</span>
                  </div>
                  <div className="ledger-row">
                    <span className="ledger-label">Total Keluar (periode)</span>
                    <span className="ledger-val">{(selectedProduct.totalKeluar || 0).toLocaleString("id-ID")} pcs</span>
                  </div>
                  <div className="ledger-row">
                    <span className="ledger-label">COGS Total (periode)</span>
                    <span className="ledger-val font-bold text-purple">
                      {rupiah(selectedProduct.cogsTotal || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-connected-skus-section">
                <h4>SKU Marketplace Terhubung ({selectedProduct.mappedSkus?.length || 0})</h4>
                <div className="connected-channels-rows-list">
                  {(selectedProduct.mappedSkus ?? []).length === 0 ? (
                    <span className="subtext-muted" style={{ fontSize: 12 }}>Belum ada SKU dipetakan ke master ini.</span>
                  ) : (
                    selectedProduct.mappedSkus.map((skuName) => (
                      <div className="channel-connection-row" key={skuName}>
                        <div className="channel-logo-placeholder" style={{ background: "#0C66E4" }}>{skuName[0]?.toUpperCase() || "S"}</div>
                        <div className="channel-desc">
                          <span className="channel-name">Resep SKU marketplace</span>
                          <span className="connected-sku-tag">{skuName}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button className="pm-btn pm-btn-detail-link" onClick={() => {
                setIsMobileDetailOpen(false);
                if (locked) onRequirePayment?.();
                else openEdit(selectedProduct);
              }}>
                Lihat Detail Produk
              </button>
            </div>
          ) : (
            <div className="detail-panel-empty-state">
              <PackageOpen size={36} className="text-gray" />
              <p>Pilih produk dari tabel untuk melihat rincian.</p>
            </div>
          )}
        </div>

      </div>

      {/* ─── Add/Edit Product Modal Overlay ─── */}
      {showForm && !locked && (
        <div className="product-modal-overlay" onClick={() => { setShow(false); setEditing(null); }}>
          <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Edit Produk Master" : "Tambah Produk Baru"}</h3>
              <button className="modal-close-btn" onClick={() => { setShow(false); setEditing(null); }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={saveProduct} className="modal-form">
              <div className="form-grid">
                <div className="form-item">
                  <label>Nama Produk</label>
                  <input required value={form.name} placeholder="Kopi Arabica 250g" onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-item">
                  <label>HPP / Harga Pokok (Rp)</label>
                  <input type="number" min="0" value={form.costPrice} placeholder="0" onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
                </div>
                <div className="form-item">
                  <label>Kategori</label>
                  <input value={form.category} placeholder="mis. Pupuk" onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="form-item">
                  <label>Satuan</label>
                  <input value={form.unit} placeholder="mis. pcs / botol / kg" onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <div className="form-item">
                  <label>Stok Fisik Awal</label>
                  <input type="number" min="0" value={form.masterStock} placeholder="0" onChange={(e) => setForm({ ...form, masterStock: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions-row">
                <button className="pm-btn pm-btn-outline" type="button" onClick={() => { setShow(false); setEditing(null); }}>Batal</button>
                <button className="pm-btn pm-btn-primary" type="submit" disabled={saving || !form.name.trim()}>
                  {saving ? "Menyimpan…" : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
