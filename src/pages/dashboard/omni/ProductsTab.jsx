import { useEffect, useMemo, useState } from "react";
import {
  Search, ChevronDown, SlidersHorizontal, Download, Plus, MoreHorizontal,
  Info, ArrowUpDown, PackageOpen, Check, AlertTriangle, RefreshCw, X,
  Calendar, Layers, TrendingUp, DollarSign, Package, Edit3, ShoppingBag, Trash2
} from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";
import "./ProductMaster.css";
import "./OmniModule.css";

const rupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");

const getProductCategory = (p) => {
  let cat = p?.category;
  if (!cat) {
    const name = (p?.name || "").toLowerCase();
    if (name.includes("kaos") || name.includes("t-shirt") || name.includes("baju") || name.includes("hoodie") || name.includes("jacket") || name.includes("jaket") || name.includes("kemeja") || name.includes("flanel")) {
      cat = "Fashion";
    } else if (name.includes("susu") || name.includes("oat") || name.includes("kopi") || name.includes("aren") || name.includes("cair") || name.includes("barista")) {
      cat = "Bahan Minuman";
    } else if (name.includes("pupuk") || name.includes("pmp")) {
      cat = "Pertanian & Kebun";
    } else {
      cat = "Umum";
    }
  }
  
  if (cat === "Kaos Oversize" || cat === "Hoodie" || cat === "Jacket" || cat === "Kemeja & Flanel") {
    return "Fashion";
  }
  return cat;
};

const MOCK_PRODUCTS = [
  {
    id: "mock-1",
    name: "Fashion",
    sku: "TSH-001",
    category: "Fashion",
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
    name: "Fashion",
    sku: "HD-001",
    category: "Fashion",
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
    name: "Fashion",
    sku: "JK-001",
    category: "Fashion",
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
    name: "Fashion",
    sku: "SH-001",
    category: "Fashion",
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
    name: "Fashion",
    sku: "HD-002",
    category: "Fashion",
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
  
  // Mobile detail drawer state
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  
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
      list = list.filter(p => {
        const active = p.channels?.map(c => typeof c === "string" ? c : c?.channel) || [];
        return active.includes(selectedPlatform);
      });
    }

    // Category Filter
    if (selectedCategory !== "all") {
      list = list.filter(p => getProductCategory(p).toLowerCase() === selectedCategory.toLowerCase());
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

  const chartDays = ["01 Jun", "08 Jun", "15 Jun", "22 Jun", "29 Jun", "06 Jul"];
  const movementPoints = [1350, 2010, 1680, 2240, 1920, 2410];
  const cogsPoints = [750, 1150, 910, 1340, 1080, 1560];

  const getCoordinates = (pointsArray, isRightAxis = false) => {
    const width = 450;
    const height = 150;
    const paddingX = 40;
    const paddingY = 20;

    const maxVal = isRightAxis ? 32000000 : 2400; 
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
              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
                <option value="all">Toko BitOmni</option>
                <option value="shopee-1">Shopee - Toko BitOmni</option>
                <option value="tiktok-1">TikTok Shop - Toko BitOmni</option>
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
                <option value="Fashion">Fashion</option>
                <option value="Bahan Minuman">Bahan Minuman</option>
                <option value="Pertanian & Kebun">Pertanian & Kebun</option>
                <option value="Umum">Umum</option>
              </select>
              <ChevronDown size={12} className="select-chevron-icon" />
            </div>
          </div>

          {/* Periode Info picker */}
          <div className="filter-input-select-box date-range-picker-input">
            <label>Periode</label>
            <div className="date-input-icon-row">
              <Calendar size={13} className="text-gray" />
              <span>01 Jun 2026 - 07 Jul 2026</span>
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
            <span className="subtext-trend text-purple">↑ 8 baru</span>
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
            <span className="subtext-trend text-purple">↑ 11%</span>
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
            <span className="subtext-trend text-purple">↑ 14%</span>
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
            <span className="subtext-trend text-purple">↑ 9.7%</span>
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
            <span className="subtext-trend text-orange">32 low</span>
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
              <button className="tab-toggle-btn">Hari</button>
              <button className="tab-toggle-btn">Minggu</button>
              <button className="tab-toggle-btn active">Bulan</button>
            </div>
          </div>
          <div className="card-item-body">
            <div className="pm-trend-svg-chart-wrapper">
              <svg width="100%" height="150" viewBox="0 0 450 150" preserveAspectRatio="none" className="pm-trend-svg">
                {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                  const y = 20 + ratio * 110;
                  return (
                    <line key={idx} x1="40" y1={y} x2="410" y2={y} stroke="#F3F4F6" strokeDasharray="3 3" strokeWidth="1" />
                  );
                })}

                {chartDays.map((day, idx) => {
                  const x = 40 + (idx / 5) * 370;
                  return (
                    <g key={idx}>
                      <line x1={x} y1="20" x2={x} y2="130" stroke="#F3F4F6" strokeDasharray="3 3" strokeWidth="1" />
                      <text x={x} y="145" textAnchor="middle" fontSize="8" fill="#9CA3AF" fontWeight="700">{day}</text>
                    </g>
                  );
                })}

                <text x="35" y="23" textAnchor="end" fontSize="8" fill="#9CA3AF" fontWeight="700">2.4k</text>
                <text x="35" y="59" textAnchor="end" fontSize="8" fill="#9CA3AF" fontWeight="700">1.8k</text>
                <text x="35" y="95" textAnchor="end" fontSize="8" fill="#9CA3AF" fontWeight="700">1.2k</text>
                <text x="35" y="131" textAnchor="end" fontSize="8" fill="#9CA3AF" fontWeight="700">0</text>

                <text x="415" y="23" textAnchor="start" fontSize="8" fill="#9CA3AF" fontWeight="700">32 jt</text>
                <text x="415" y="59" textAnchor="start" fontSize="8" fill="#9CA3AF" fontWeight="700">24 jt</text>
                <text x="415" y="95" textAnchor="start" fontSize="8" fill="#9CA3AF" fontWeight="700">16 jt</text>
                <text x="415" y="131" textAnchor="start" fontSize="8" fill="#9CA3AF" fontWeight="700">0</text>

                <path d={getPathD(coordsMovement)} fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {coordsMovement.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r="2.5" fill="#ffffff" stroke="#4F46E5" strokeWidth="1.5" />
                ))}

                <path d={getPathD(coordsCogs)} fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {coordsCogs.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r="2.5" fill="#ffffff" stroke="#A78BFA" strokeWidth="1.5" />
                ))}
              </svg>
            </div>
            
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

        {/* Column 2: Breakdown COGS per Kategori (Legend positioned below chart in a 2-column grid) */}
        <div className="analytics-card-item">
          <div className="card-item-header">
            <h3>Breakdown COGS per Kategori</h3>
            <button className="text-purple-link">Lihat Detail</button>
          </div>
          <div className="card-item-body vertical-stack-layout">
            <div className="donut-chart-wrapper centered-donut">
              <svg width="100" height="100" viewBox="0 0 100 100" className="donut-svg">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F3F4F6" strokeWidth="8" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#4F46E5" strokeWidth="8" strokeDasharray="102.66 136.1" strokeDashoffset="0" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#818CF8" strokeWidth="8" strokeDasharray="64.46 174.3" strokeDashoffset="-102.66" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#60A5FA" strokeWidth="8" strokeDasharray="35.81 202.95" strokeDashoffset="-167.12" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#A78BFA" strokeWidth="8" strokeDasharray="21.48 217.28" strokeDashoffset="-202.93" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#C7C9F9" strokeWidth="8" strokeDasharray="14.32 224.44" strokeDashoffset="-224.41" transform="rotate(-90 50 50)" />
              </svg>
              <div className="donut-inner-text">
                <span className="text-small">Total</span>
                <span className="text-bold">Rp 128,7jt</span>
              </div>
            </div>

            <div className="donut-labels-list-grid">
              
              {/* Category 1 */}
              <div className="label-item-grid">
                <div className="color-dot bg-purple"></div>
                <div className="label-text-column">
                  <span className="label-name text-truncate">Fashion</span>
                  <div className="label-details-row">
                    <span className="label-val">Rp 55,4jt</span>
                    <span className="label-pct">43%</span>
                  </div>
                </div>
              </div>

              {/* Category 2 */}
              <div className="label-item-grid">
                <div className="color-dot bg-indigo"></div>
                <div className="label-text-column">
                  <span className="label-name text-truncate">Hoodie & Sweater</span>
                  <div className="label-details-row">
                    <span className="label-val">Rp 34,8jt</span>
                    <span className="label-pct">27%</span>
                  </div>
                </div>
              </div>

              {/* Category 3 */}
              <div className="label-item-grid">
                <div className="color-dot bg-blue"></div>
                <div className="label-text-column">
                  <span className="label-name text-truncate">Kemeja & Flanel</span>
                  <div className="label-details-row">
                    <span className="label-val">Rp 19,3jt</span>
                    <span className="label-pct">15%</span>
                  </div>
                </div>
              </div>

              {/* Category 4 */}
              <div className="label-item-grid">
                <div className="color-dot bg-lavender"></div>
                <div className="label-text-column">
                  <span className="label-name text-truncate">Jacket</span>
                  <div className="label-details-row">
                    <span className="label-val">Rp 11,5jt</span>
                    <span className="label-pct">9%</span>
                  </div>
                </div>
              </div>

              {/* Category 5 */}
              <div className="label-item-grid">
                <div className="color-dot bg-light-violet"></div>
                <div className="label-text-column">
                  <span className="label-name text-truncate">Aksesoris</span>
                  <div className="label-details-row">
                    <span className="label-val">Rp 7,6jt</span>
                    <span className="label-pct">6%</span>
                  </div>
                </div>
              </div>

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
                <tr>
                  <td className="font-semibold text-black text-truncate" style={{ maxWidth: 140 }}>Fashion</td>
                  <td className="text-right font-semibold text-black">Rp 18.950.000</td>
                </tr>
                <tr>
                  <td className="font-semibold text-black text-truncate" style={{ maxWidth: 140 }}>Fashion</td>
                  <td className="text-right font-semibold text-black">Rp 16.870.000</td>
                </tr>
                <tr>
                  <td className="font-semibold text-black text-truncate" style={{ maxWidth: 140 }}>Fashion</td>
                  <td className="text-right font-semibold text-black">Rp 15.420.000</td>
                </tr>
                <tr>
                  <td className="font-semibold text-black text-truncate" style={{ maxWidth: 140 }}>Fashion</td>
                  <td className="text-right font-semibold text-black">Rp 12.230.000</td>
                </tr>
                <tr>
                  <td className="font-semibold text-black text-truncate" style={{ maxWidth: 140 }}>Fashion</td>
                  <td className="text-right font-semibold text-black">Rp 10.980.000</td>
                </tr>
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
                  <option value="Fashion">Fashion</option>
                  <option value="Bahan Minuman">Bahan Minuman</option>
                  <option value="Pertanian & Kebun">Pertanian & Kebun</option>
                  <option value="Umum">Umum</option>
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
                  <option value="pcs">pcs</option>
                  <option value="box">box</option>
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
                    const cogsTotalVal = (p.totalKeluar || 0) * (p.costPrice || p.price * 0.45 || 0);
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
                            {getProductCategory(p)}
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
                    <span className="ledger-val font-semibold text-black">{getProductCategory(selectedProduct)}</span>
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
