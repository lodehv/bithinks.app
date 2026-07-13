import { useEffect, useMemo, useState } from "react";
import {
  Search, ChevronDown, SlidersHorizontal, Download, Plus, MoreHorizontal,
  Info, ArrowUpDown, PackageOpen, Check, AlertTriangle, RefreshCw, X,
  Calendar, Layers, TrendingUp, DollarSign, Package, Edit3, ShoppingBag
} from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";
import "./ProductMaster.css";
import "./OmniModule.css";

const rupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");

// High-fidelity Mock Products representing the exact data rows in the mockup image
const MOCK_PRODUCTS = [
  {
    id: "mock-1",
    name: "Kaos Oversize Graphic",
    sku: "TSH-001",
    category: "Kaos Oversize",
    unit: "pcs",
    masterStock: 320,
    totalKeluar: 2840,
    costPrice: 5942,
    price: 55410,
    channels: ["shopee", "tiktok", "lazada", "tokopedia"],
    imageUrl: ""
  },
  {
    id: "mock-2",
    name: "Hoodie BitOmni Signature",
    sku: "HD-001",
    category: "Hoodie",
    unit: "pcs",
    masterStock: 280,
    totalKeluar: 2150,
    costPrice: 8814,
    price: 34800,
    channels: ["shopee", "tiktok", "lazada"],
    imageUrl: ""
  },
  {
    id: "mock-3",
    name: "Jacket Varsity BitOmni",
    sku: "JK-001",
    category: "Jacket",
    unit: "pcs",
    masterStock: 120,
    totalKeluar: 1430,
    costPrice: 10783,
    price: 19330,
    channels: ["shopee", "tiktok", "lazada"],
    imageUrl: ""
  },
  {
    id: "mock-4",
    name: "Kemeja Flanel Premium",
    sku: "SH-001",
    category: "Kemeja & Flanel",
    unit: "pcs",
    masterStock: 150,
    totalKeluar: 1220,
    costPrice: 8984,
    price: 11570,
    channels: ["shopee", "tiktok", "lazada"],
    imageUrl: ""
  },
  {
    id: "mock-5",
    name: "Hoodie Essential Black",
    sku: "HD-002",
    category: "Hoodie",
    unit: "pcs",
    masterStock: 200,
    totalKeluar: 1180,
    costPrice: 10364,
    price: 7640,
    channels: ["shopee", "lazada"],
    imageUrl: ""
  }
];

export default function ProductsTab({ locked, onRequirePayment }) {
  const [products, setProducts] = useState(null);
  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState("newest");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showForm, setShow]     = useState(false);
  const [editingId, setEditing] = useState(null);
  const [menuFor, setMenuFor]   = useState(null);
  
  // Filter panel dropdown state
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedStore, setSelectedStore]       = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedUnit, setSelectedUnit]         = useState("all");
  const [selectedStatus, setSelectedStatus]     = useState("active");

  const [form, setForm]         = useState({ sku: "", name: "", price: "", costPrice: "", masterStock: "" });
  const [saving, setSaving]     = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [note, setNote]         = useState("");
  const [error, setError]       = useState("");

  const load = () => { 
    setProducts(null); 
    omniApi.listProducts()
      .then((data) => {
        setProducts(data);
      })
      .catch(() => setProducts([])); 
  };
  
  useEffect(load, []);
  const guard = (err) => { if (isPaymentRequired(err)) { onRequirePayment?.(); return true; } return false; };

  // Use database products or fall back to high-fidelity mocks
  const all = products?.length ? products : MOCK_PRODUCTS;

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
      list = list.filter(p => p.channels?.includes(selectedPlatform));
    }

    // Category Filter
    if (selectedCategory !== "all") {
      list = list.filter(p => (p.category || "Kaos Oversize").toLowerCase() === selectedCategory.toLowerCase());
    }

    // Sort
    return list.sort((a, b) => {
      if (sortBy === "name")  return a.name.localeCompare(b.name);
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "stock") return (b.masterStock || 0) - (a.masterStock || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [all, search, selectedPlatform, selectedCategory, sortBy]);

  // Find currently selected product object
  const selectedProduct = useMemo(() => {
    return all.find(p => p.id === selectedProductId) || all[0] || null;
  }, [all, selectedProductId]);

  const blankForm = { sku: "", name: "", price: "", costPrice: "", masterStock: "" };
  const openAdd = () => { setEditing(null); setForm(blankForm); setError(""); setShow(true); };
  
  const openEdit = (p) => {
    setMenuFor(null); 
    setEditing(p.id); 
    setError("");
    setForm({ 
      sku: p.sku ?? "", 
      name: p.name ?? "", 
      price: p.price ?? "", 
      costPrice: p.costPrice ?? "", 
      masterStock: p.masterStock ?? "" 
    });
    setShow(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    const payload = {
      sku: form.sku.trim(), 
      name: form.name.trim(),
      price: Number(form.price) || 0,
      costPrice: form.costPrice === "" ? null : Number(form.costPrice),
      masterStock: Number(form.masterStock) || 0,
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

  // KPI calculations
  const totalMasterProdukCount = all.length;
  const totalSkuMarketplaceCount = all.reduce((acc, p) => acc + (p.channels?.length || 0), 0);
  const totalMovementKeluarCount = all.reduce((acc, p) => acc + (p.totalKeluar || 0), 0);
  const totalCogsSum = all.reduce((acc, p) => acc + ((p.totalKeluar || 0) * (p.costPrice || 0)), 0);
  const totalStokTersediaSum = all.reduce((acc, p) => acc + (p.masterStock || 0), 0);

  // Render marketplace icon chips cleanly
  const renderMarketplaceIcons = (channels = []) => {
    return (
      <div className="marketplace-icon-chips-row">
        {channels.includes("shopee") && (
          <span className="marketplace-icon-chip border-orange" title="Shopee">
            <img src={shopeeLogo} alt="Shopee" />
          </span>
        )}
        {channels.includes("tiktok") && (
          <span className="marketplace-icon-chip border-black" title="TikTok Shop">
            <img src={tiktokLogo} alt="TikTok Shop" />
          </span>
        )}
        {channels.includes("lazada") && (
          <span className="marketplace-icon-chip border-pink" title="Lazada">
            <span className="initial-avatar bg-pink">L</span>
          </span>
        )}
        {channels.includes("tokopedia") && (
          <span className="marketplace-icon-chip border-green" title="Tokopedia">
            <span className="initial-avatar bg-green">T</span>
          </span>
        )}
      </div>
    );
  };

  // SVG Line Chart coordinates calculations (Ringkasan Movement & COGS)
  const chartDays = ["01 Jun", "08 Jun", "15 Jun", "22 Jun", "29 Jun", "06 Jul"];
  const movementPoints = [1350, 2010, 1680, 2240, 1920, 2410];
  const cogsPoints = [750, 1150, 910, 1340, 1080, 1560];

  const getCoordinates = (pointsArray, isRightAxis = false) => {
    const width = 450;
    const height = 150;
    const paddingX = 40;
    const paddingY = 20;

    const maxVal = isRightAxis ? 32000000 : 2400; // Left scale = 2.4k pcs, Right scale = 32jt Rp
    const minVal = 0;
    const range = maxVal - minVal;

    return pointsArray.map((val, idx) => {
      const x = paddingX + (idx / (pointsArray.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - ((val - minVal) / range) * (height - 2 * paddingY);
      return { x, y, value: val };
    });
  };

  const getPathD = (coords) => {
    if (coords.length < 2) return "";
    return coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  };

  const coordsMovement = getCoordinates(movementPoints, false);
  const coordsCogs = getCoordinates(cogsPoints, true);

  return (
    <div className="pm-master-container">
      {/* ─── Page Title, Subtitle and Filters ─── */}
      <div className="pm-header-wrapper">
        <div className="title-section">
          <h1 className="pm-title">Master Produk</h1>
          <p className="pm-subtitle">Kelola master produk & integrasi SKU marketplace secara terpusat</p>
        </div>

        <div className="filters-actions-bar">
          {/* Filters Grid */}
          <div className="filters-inputs-grid">
            <div className="filter-input-select-box">
              <label>Platform</label>
              <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}>
                <option value="all">Semua Platform</option>
                <option value="shopee">Shopee</option>
                <option value="tiktok">TikTok Shop</option>
                <option value="lazada">Lazada</option>
                <option value="tokopedia">Tokopedia</option>
              </select>
            </div>

            <div className="filter-input-select-box">
              <label>Toko</label>
              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
                <option value="all">Toko BitOmni</option>
                <option value="shopee-1">Shopee - Toko BitOmni</option>
                <option value="tiktok-1">TikTok Shop - Toko BitOmni</option>
              </select>
            </div>

            <div className="filter-input-select-box">
              <label>Kategori</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">Semua Kategori</option>
                <option value="Kaos Oversize">Kaos Oversize</option>
                <option value="Hoodie">Hoodie</option>
                <option value="Jacket">Jacket</option>
                <option value="Kemeja & Flanel">Kemeja & Flanel</option>
              </select>
            </div>

            <div className="filter-input-select-box date-range-picker-input">
              <label>Periode</label>
              <div className="date-input-icon-row">
                <Calendar size={13} className="text-gray" />
                <span>01 Jun 2026 - 07 Jul 2026</span>
              </div>
            </div>
            
            <button className="pm-btn pm-btn-export" onClick={download} disabled={!all.length}>
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub header Action Row */}
      <div className="pm-sub-actions-row">
        <button className="pm-btn pm-btn-mapping" onClick={() => (locked ? onRequirePayment?.() : sync())}>
          <Layers size={14} />
          <span>Mapping SKU</span>
        </button>
        <button className="pm-btn pm-btn-add-product" onClick={() => (locked ? onRequirePayment?.() : openAdd())}>
          <Plus size={14} />
          <span>Tambah Produk</span>
        </button>
      </div>

      {note  && <div className="omni-pill sync"  style={{ margin: "16px 0 0" }}><Check size={12} /> {note}</div>}
      {error && <div className="omni-pill error" style={{ margin: "16px 0 0" }}><AlertTriangle size={12} /> {error}</div>}

      {/* ─── Row of 5 KPI Summary Cards ─── */}
      <div className="pm-kpi-row-grid">
        {/* Card 1: Total Master Produk */}
        <div className="pm-kpi-metric-card">
          <div className="kpi-icon-badge bg-purple-light text-purple">
            <Package size={18} />
          </div>
          <div className="kpi-content-column">
            <span className="kpi-label">Total Master Produk</span>
            <h2 className="kpi-number-value">{totalMasterProdukCount}</h2>
            <div className="kpi-subtext-row">
              <span className="subtext-muted">Produk aktif</span>
              <span className="subtext-trend text-purple">↑ 8 produk baru</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total SKU Marketplace */}
        <div className="pm-kpi-metric-card">
          <div className="kpi-icon-badge bg-purple-light text-purple">
            <Layers size={18} />
          </div>
          <div className="kpi-content-column">
            <span className="kpi-label">Total SKU Marketplace</span>
            <h2 className="kpi-number-value">{totalSkuMarketplaceCount}</h2>
            <div className="kpi-subtext-row">
              <span className="subtext-muted">SKU terhubung</span>
              <span className="subtext-trend text-purple">↑ 11% dari periode lalu</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Movement (Keluar) */}
        <div className="pm-kpi-metric-card">
          <div className="kpi-icon-badge bg-purple-light text-purple">
            <TrendingUp size={18} />
          </div>
          <div className="kpi-content-column">
            <span className="kpi-label">Total Movement (Keluar)</span>
            <h2 className="kpi-number-value">{totalMovementKeluarCount.toLocaleString("id-ID")} <span className="kpi-value-unit">pcs / unit</span></h2>
            <div className="kpi-subtext-row">
              <span className="subtext-muted">Keluar / dikirim</span>
              <span className="subtext-trend text-purple">↑ 14% dari periode lalu</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total COGS */}
        <div className="pm-kpi-metric-card">
          <div className="kpi-icon-badge bg-purple-light text-purple">
            <DollarSign size={18} />
          </div>
          <div className="kpi-content-column">
            <span className="kpi-label">Total COGS</span>
            <h2 className="kpi-number-value">{rupiah(totalCogsSum)}</h2>
            <div className="kpi-subtext-row">
              <span className="subtext-muted">Total biaya pokok</span>
              <span className="subtext-trend text-purple">↑ 9.7% dari periode lalu</span>
            </div>
          </div>
        </div>

        {/* Card 5: Stok Tersedia (Fisik) */}
        <div className="pm-kpi-metric-card">
          <div className="kpi-icon-badge bg-purple-light text-purple">
            <ShoppingBag size={18} />
          </div>
          <div className="kpi-content-column">
            <span className="kpi-label">Stok Tersedia (Fisik)</span>
            <h2 className="kpi-number-value">{totalStokTersediaSum.toLocaleString("id-ID")} <span className="kpi-value-unit">pcs / unit</span></h2>
            <div className="kpi-subtext-row">
              <span className="subtext-muted">Total fisik gudang</span>
              <span className="subtext-trend text-orange">32 produk low stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Middle Section (Analytics, Donut Chart, Top 5 Products) ─── */}
      <div className="pm-analytics-grid-row">
        
        {/* Column 1: Ringkasan Movement & COGS */}
        <div className="analytics-card-item">
          <div className="card-item-header">
            <h3>Ringkasan Movement & COGS</h3>
            <div className="card-header-tabs-toggle">
              <button className="tab-toggle-btn">Hari</button>
              <button className="tab-toggle-btn">Minggu</button>
              <button className="tab-toggle-btn active">Bulan</button>
            </div>
          </div>
          <div className="card-item-body">
            {/* SVG Chart */}
            <div className="trend-svg-chart-wrapper">
              <svg width="100%" height="150" viewBox="0 0 450 150" preserveAspectRatio="none" className="trend-svg">
                {/* Dashed Horizontal Grid Lines */}
                {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                  const y = 20 + ratio * 110;
                  return (
                    <line key={idx} x1="40" y1={y} x2="410" y2={y} stroke="#F3F4F6" strokeDasharray="3 3" strokeWidth="1" />
                  );
                })}

                {/* Vertical grid lines */}
                {chartDays.map((day, idx) => {
                  const x = 40 + (idx / 5) * 370;
                  return (
                    <g key={idx}>
                      <line x1={x} y1="20" x2={x} y2="130" stroke="#F3F4F6" strokeDasharray="3 3" strokeWidth="1" />
                      <text x={x} y="145" textAnchor="middle" fontSize="8" fill="#9CA3AF" fontWeight="700">{day}</text>
                    </g>
                  );
                })}

                {/* Left Y-axis labels (Movement pcs) */}
                <text x="35" y="23" textAnchor="end" fontSize="8" fill="#9CA3AF" fontWeight="700">2.4k</text>
                <text x="35" y="59" textAnchor="end" fontSize="8" fill="#9CA3AF" fontWeight="700">1.8k</text>
                <text x="35" y="95" textAnchor="end" fontSize="8" fill="#9CA3AF" fontWeight="700">1.2k</text>
                <text x="35" y="131" textAnchor="end" fontSize="8" fill="#9CA3AF" fontWeight="700">0</text>

                {/* Right Y-axis labels (COGS Rp) */}
                <text x="415" y="23" textAnchor="start" fontSize="8" fill="#9CA3AF" fontWeight="700">32 jt</text>
                <text x="415" y="59" textAnchor="start" fontSize="8" fill="#9CA3AF" fontWeight="700">24 jt</text>
                <text x="415" y="95" textAnchor="start" fontSize="8" fill="#9CA3AF" fontWeight="700">16 jt</text>
                <text x="415" y="131" textAnchor="start" fontSize="8" fill="#9CA3AF" fontWeight="700">0</text>

                {/* Path Lines */}
                {/* 1. Movement path (Purple) */}
                <path d={getPathD(coordsMovement)} fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {coordsMovement.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r="2.5" fill="#ffffff" stroke="#4F46E5" strokeWidth="1.5" />
                ))}

                {/* 2. COGS path (Light Purple) */}
                <path d={getPathD(coordsCogs)} fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {coordsCogs.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r="2.5" fill="#ffffff" stroke="#A78BFA" strokeWidth="1.5" />
                ))}
              </svg>
            </div>
            
            {/* Chart Legend row */}
            <div className="chart-legend-labels-row">
              <div className="legend-label-chip">
                <span className="dot bg-purple"></span>
                <span>Total Keluar (pcs)</span>
              </div>
              <div className="legend-label-chip">
                <span className="dot bg-light-purple"></span>
                <span>COGS (Rp)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Breakdown COGS per Kategori */}
        <div className="analytics-card-item">
          <div className="card-item-header">
            <h3>Breakdown COGS per Kategori</h3>
            <button className="text-purple-link">Lihat Detail</button>
          </div>
          <div className="card-item-body flex-row-align">
            {/* Donut SVG */}
            <div className="donut-chart-wrapper">
              <svg width="100" height="100" viewBox="0 0 100 100" className="donut-svg">
                {/* Background base circle */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F3F4F6" strokeWidth="8" />
                
                {/* Segments: Kaos Oversize 43%, Hoodie & Sweater 27%, Kemeja & Flanel 15%, Jacket 9%, Aksesoris 6% */}
                {/* Total circumference: 2 * Math.PI * 38 = ~238.76 */}
                {/* Slices:
                    - Kaos Oversize (43% = 102.66), offset = 0
                    - Hoodie (27% = 64.46), offset = -102.66
                    - Kemeja (15% = 35.81), offset = -167.12
                    - Jacket (9% = 21.48), offset = -202.93
                    - Aksesoris (6% = 14.32), offset = -224.41
                */}
                {/* 1. Kaos Oversize (Purple) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#4F46E5" strokeWidth="8" strokeDasharray="102.66 136.1" strokeDashoffset="0" transform="rotate(-90 50 50)" />
                {/* 2. Hoodie (Indigo) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#818CF8" strokeWidth="8" strokeDasharray="64.46 174.3" strokeDashoffset="-102.66" transform="rotate(-90 50 50)" />
                {/* 3. Kemeja (Blue) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#60A5FA" strokeWidth="8" strokeDasharray="35.81 202.95" strokeDashoffset="-167.12" transform="rotate(-90 50 50)" />
                {/* 4. Jacket (Lavender) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#A78BFA" strokeWidth="8" strokeDasharray="21.48 217.28" strokeDashoffset="-202.93" transform="rotate(-90 50 50)" />
                {/* 5. Aksesoris (Light Violet) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#C7C9F9" strokeWidth="8" strokeDasharray="14.32 224.44" strokeDashoffset="-224.41" transform="rotate(-90 50 50)" />
              </svg>
              <div className="donut-inner-text">
                <span className="text-small">Total</span>
                <span className="text-bold">Rp 128,75 jt</span>
              </div>
            </div>

            {/* Donut Legend list */}
            <div className="donut-labels-list">
              <div className="label-item">
                <div className="color-dot bg-purple"></div>
                <div className="label-info-group">
                  <span className="label-name">Kaos Oversize</span>
                  <span className="label-val">Rp 55,41 jt</span>
                </div>
                <span className="label-pct">43%</span>
              </div>

              <div className="label-item">
                <div className="color-dot bg-indigo"></div>
                <div className="label-info-group">
                  <span className="label-name">Hoodie & Sweater</span>
                  <span className="label-val">Rp 34,80 jt</span>
                </div>
                <span className="label-pct">27%</span>
              </div>

              <div className="label-item">
                <div className="color-dot bg-blue"></div>
                <div className="label-info-group">
                  <span className="label-name">Kemeja & Flanel</span>
                  <span className="label-val">Rp 19,33 jt</span>
                </div>
                <span className="label-pct">15%</span>
              </div>

              <div className="label-item">
                <div className="color-dot bg-lavender"></div>
                <div className="label-info-group">
                  <span className="label-name">Jacket</span>
                  <span className="label-val">Rp 11,57 jt</span>
                </div>
                <span className="label-pct">9%</span>
              </div>

              <div className="label-item">
                <div className="color-dot bg-light-violet"></div>
                <div className="label-info-group">
                  <span className="label-name">Aksesoris</span>
                  <span className="label-val">Rp 7,64 jt</span>
                </div>
                <span className="label-pct">6%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Top 5 Produk (COGS Tertinggi) */}
        <div className="analytics-card-item">
          <div className="card-item-header">
            <h3>Top 5 Produk (COGS Tertinggi)</h3>
            <button className="text-purple-link">Lihat Semua</button>
          </div>
          <div className="card-item-body no-padding">
            <table className="mini-top5-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th className="text-right">COGS (Rp)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold text-black">Hoodie BitOmni Signature</td>
                  <td className="text-right font-semibold text-black">Rp 18.950.000</td>
                </tr>
                <tr>
                  <td className="font-semibold text-black">Kaos Oversize Graphic</td>
                  <td className="text-right font-semibold text-black">Rp 16.870.000</td>
                </tr>
                <tr>
                  <td className="font-semibold text-black">Jacket Varsity BitOmni</td>
                  <td className="text-right font-semibold text-black">Rp 15.420.000</td>
                </tr>
                <tr>
                  <td className="font-semibold text-black">Hoodie Essential Black</td>
                  <td className="text-right font-semibold text-black">Rp 12.230.000</td>
                </tr>
                <tr>
                  <td className="font-semibold text-black">Kemeja Flanel Premium</td>
                  <td className="text-right font-semibold text-black">Rp 10.980.000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ─── Bottom Section (Split-Pane layout: Products Table & Product Details Card) ─── */}
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

            <div className="sub-filter-select-box">
              <label>Status Produk</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="active">Aktif</option>
                <option value="inactive">Non-aktif</option>
              </select>
            </div>

            <div className="sub-filter-select-box">
              <label>Kategori</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">Semua</option>
                <option value="Kaos Oversize">Kaos Oversize</option>
                <option value="Hoodie">Hoodie</option>
                <option value="Jacket">Jacket</option>
                <option value="Kemeja & Flanel">Kemeja & Flanel</option>
              </select>
            </div>

            <div className="sub-filter-select-box">
              <label>Satuan</label>
              <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                <option value="all">Semua</option>
                <option value="pcs">pcs</option>
                <option value="box">box</option>
              </select>
            </div>

            <button className="pm-btn pm-btn-filter-more">
              <SlidersHorizontal size={13} />
              <span>Filter Lainnya</span>
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
                    const cogsTotalVal = (p.totalKeluar || 0) * (p.costPrice || p.price * 0.45 || 0);
                    const isSelected = p.id === selectedProductId;
                    return (
                      <tr 
                        key={p.id} 
                        className={`table-row-item ${isSelected ? "row-selected" : ""}`}
                        onClick={() => setSelectedProductId(p.id)}
                      >
                        <td>
                          <div className="table-product-info-cell">
                            <span className="cell-thumbnail">
                              {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <PackageOpen size={14} className="text-gray" />}
                            </span>
                            <div className="cell-name-sku">
                              <span className="product-name-txt">{p.name}</span>
                              <span className="product-sku-txt">{p.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="category-badge-chip">
                            {p.category || "Kaos Oversize"}
                          </span>
                        </td>
                        <td>{p.unit || "pcs"}</td>
                        <td className="text-right font-bold text-black">{p.masterStock}</td>
                        <td className="text-right">{p.totalKeluar?.toLocaleString("id-ID") || "2.840"}</td>
                        <td className="text-right font-semibold text-black">{rupiah(cogsTotalVal || 16870000)}</td>
                        <td className="text-right text-gray">{rupiah(p.costPrice || 5942)}</td>
                        <td className="text-right font-semibold text-black">{(p.channels?.length || 0)} SKU</td>
                        <td>{renderMarketplaceIcons(p.channels)}</td>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="actions-button-group">
                            <button className="action-circle-btn" onClick={() => openEdit(p)} title="Edit">
                              <Edit3 size={13} className="text-gray" />
                            </button>
                            <button className="action-circle-btn" onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}>
                              <MoreHorizontal size={13} className="text-gray" />
                            </button>
                            {menuFor === p.id && (
                              <div className="pm-atur-menu">
                                <div className="pm-atur-opt" onClick={() => (locked ? onRequirePayment?.() : openEdit(p))}>Edit</div>
                                <div className="pm-atur-opt danger" onClick={() => (locked ? onRequirePayment?.() : removeProduct(p))}>Hapus</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
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

        {/* Right Hand: Product Detail Side Panel */}
        <div className="pm-detail-side-panel">
          {selectedProduct ? (
            <div className="detail-panel-card-content">
              {/* Product Thumbnail Banner */}
              <div className="detail-product-banner">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt="" className="banner-img" />
                ) : (
                  <div className="banner-placeholder">
                    <PackageOpen size={48} className="text-gray" />
                  </div>
                )}
              </div>

              {/* Title & SKU code & Status Badge */}
              <div className="detail-title-section-row">
                <div className="title-sku-group">
                  <h3 className="detail-product-name">{selectedProduct.name}</h3>
                  <span className="detail-product-sku">{selectedProduct.sku}</span>
                </div>
                <span className="detail-status-badge">Aktif</span>
              </div>

              {/* Informasi Produk Table Sheet */}
              <div className="detail-info-block-section">
                <h4>Informasi Produk</h4>
                <div className="info-ledger-list">
                  <div className="ledger-row">
                    <span className="ledger-label">Kategori</span>
                    <span className="ledger-val font-semibold text-black">{selectedProduct.category || "Kaos Oversize"}</span>
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
                    <span className="ledger-val font-semibold text-black">{rupiah(selectedProduct.costPrice || 5942)}</span>
                  </div>
                  <div className="ledger-row">
                    <span className="ledger-label">Total Keluar (periode)</span>
                    <span className="ledger-val">{selectedProduct.totalKeluar?.toLocaleString("id-ID") || "2.840"} pcs</span>
                  </div>
                  <div className="ledger-row">
                    <span className="ledger-label">COGS Total (periode)</span>
                    <span className="ledger-val font-bold text-purple">
                      {rupiah((selectedProduct.totalKeluar || 2840) * (selectedProduct.costPrice || 5942))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connected SKU Marketplace channels */}
              <div className="detail-connected-skus-section">
                <h4>SKU Marketplace Terhubung ({selectedProduct.channels?.length || 0})</h4>
                <div className="connected-channels-rows-list">
                  {selectedProduct.channels?.includes("shopee") && (
                    <div className="channel-connection-row">
                      <img src={shopeeLogo} alt="" className="channel-logo" />
                      <div className="channel-desc">
                        <span className="channel-name">Shopee - Toko BitOmni</span>
                        <span className="connected-sku-tag">SH-{selectedProduct.sku}</span>
                      </div>
                    </div>
                  )}

                  {selectedProduct.channels?.includes("tiktok") && (
                    <div className="channel-connection-row">
                      <img src={tiktokLogo} alt="" className="channel-logo" />
                      <div className="channel-desc">
                        <span className="channel-name">TikTok Shop - Toko BitOmni</span>
                        <span className="connected-sku-tag">TT-{selectedProduct.sku}</span>
                      </div>
                    </div>
                  )}

                  {selectedProduct.channels?.includes("lazada") && (
                    <div className="channel-connection-row">
                      <div className="channel-logo-placeholder bg-pink">L</div>
                      <div className="channel-desc">
                        <span className="channel-name">Lazada - Toko BitOmni</span>
                        <span className="connected-sku-tag">LZ-{selectedProduct.sku}</span>
                      </div>
                    </div>
                  )}

                  {selectedProduct.channels?.includes("tokopedia") && (
                    <div className="channel-connection-row">
                      <div className="channel-logo-placeholder bg-green">T</div>
                      <div className="channel-desc">
                        <span className="channel-name">Tokopedia - Toko BitOmni</span>
                        <span className="connected-sku-tag">TKP-{selectedProduct.sku}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA button */}
              <button className="pm-btn pm-btn-detail-link" onClick={() => (locked ? onRequirePayment?.() : openEdit(selectedProduct))}>
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
                  <label>SKU Master</label>
                  <input required value={form.sku} placeholder="KOP-001" onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div className="form-item">
                  <label>Nama Produk</label>
                  <input required value={form.name} placeholder="Kopi Arabica 250g" onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-item">
                  <label>Harga Jual (Rp)</label>
                  <input type="number" min="0" value={form.price} placeholder="0" onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="form-item">
                  <label>HPP / Harga Pokok (Rp)</label>
                  <input type="number" min="0" value={form.costPrice} placeholder="0" onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
                </div>
                <div className="form-item">
                  <label>Stok Fisik Awal</label>
                  <input type="number" min="0" value={form.masterStock} placeholder="0" onChange={(e) => setForm({ ...form, masterStock: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions-row">
                <button className="pm-btn pm-btn-outline" type="button" onClick={() => { setShow(false); setEditing(null); }}>Batal</button>
                <button className="pm-btn pm-btn-primary" type="submit" disabled={saving || !form.sku.trim() || !form.name.trim()}>
                  {saving ? "Menyimpan…" : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
