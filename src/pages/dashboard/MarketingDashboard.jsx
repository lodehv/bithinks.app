import { useState, useEffect, Fragment } from "react";
import { omniApi } from "../../utils/omniApi";
import { 
  Calendar, Filter, ChevronDown, Check, X, 
  HelpCircle, RefreshCw, BarChart3, DollarSign, 
  TrendingUp, ShoppingCart, Percent
} from "lucide-react";
import "./MarketingDashboard.css";

export default function MarketingDashboard() {
  // ─── Filter States ────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  
  // Popover Toggle States
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  // ─── API Data States ──────────────────────────────────────────────────────
  const [stores, setStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [marketingData, setMarketingData] = useState([]); // Kept empty to avoid dummy data, ready for backend injection
  const [stats, setStats] = useState(null);               // { totals, buckets, meta } dari backend
  const [isSubmittingFilters, setIsSubmittingFilters] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [adSpend, setAdSpend] = useState(0);
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

  const clearAllFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedPlatforms([]);
    setSelectedStores([]);
    setAdSpend(0);
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
        adSpend,
        ...overrides,
      })
      .then((data) => setStats(data))
      .catch((err) => console.error("Gagal memuat metrik marketing:", err))
      .finally(() => setIsSubmittingFilters(false));
  };

  // Muat awal (tanpa filter → seluruh data, basis order_date).
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const totalTerkonfirmasi  = t.terkonfirmasi  ?? 0;
  const totalBerisiko       = t.berisiko       ?? 0;
  const totalRetur          = t.retur          ?? 0;
  const totalDibatalkan     = t.dibatalkan     ?? 0;

  // Beban platform (PRD: biaya_api) + rincian per platform (cost_breakdown[]).
  // COGS/HPP menyusul (Master Produk) → cogs_total 0.
  const totalCogs = stats?.cogs_total ?? 0;
  const totalFees = stats?.biaya_api ?? 0;
  const costBreakdown = Array.isArray(stats?.cost_breakdown) ? stats.cost_breakdown : [];
  const totalProfit = totalOmsetPerkiraan - totalCogs - totalFees;

  // Calculate margin percent (safety check to prevent division by zero)
  const marginPercent = totalOmsetPerkiraan > 0 ? (totalProfit / totalOmsetPerkiraan) * 100 : 0;

  // Donut calculations
  const hasData = totalOmsetKotor > 0;
  const profitPct = hasData ? Math.max(0, (totalProfit / totalOmsetKotor) * 100) : 0;
  const feesPct = hasData ? Math.max(0, (totalFees / totalOmsetKotor) * 100) : 0;
  const cogsPct = hasData ? Math.max(0, (totalCogs / totalOmsetKotor) * 100) : 0;
  const returPct = hasData ? Math.max(0, (totalRetur / totalOmsetKotor) * 100) : 0;

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
  const adSpendPct = hasData ? Math.max(0, (adSpend / totalOmsetKotor) * 100) : 0;
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

  const formatShortRupiah = (val) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}Jt`;
    if (val < 0) return `-Rp ${formatShortRupiah(Math.abs(val))}`;
    return `Rp ${val}`;
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
    <div className="marketing-dashboard-container">
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

          {/* 4. Biaya Iklan Input */}
          <div className="filter-item">
            <label className="filter-label">Biaya Iklan (Ad Spend)</label>
            <div className="ad-spend-input-wrapper">
              <span className="currency-symbol">Rp</span>
              <input 
                type="number" 
                min="0"
                value={adSpend || ""} 
                onChange={(e) => setAdSpend(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="filter-ad-spend-input"
              />
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

      {/* ─── Summary Cards Section (Omset Harian & Status Breakdown) ─── */}
      <div className="marketing-summary-wrapper">
        
        {/* Card 1: Ringkasan Omset Harian */}
        <div className="summary-card">
          <div className="summary-card-header">
            <h4>Omset Harian</h4>
            <span className="summary-card-subtitle">Basis order_date • tidak berubah retroaktif</span>
          </div>

          <div className="summary-blocks-grid">
            {/* Block 1: Omset Kotor */}
            <div className="summary-block">
              <div className="block-meta-row">
                <span className="block-category">OMSET KOTOR</span>
                <DollarSign size={13} className="text-purple" />
              </div>
              <div className="block-value">{formatRupiah(totalOmsetKotor)}</div>
              <div className="block-subtext">Akumulasi seluruh order</div>
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

            {/* Block 3: Omset Perkiraan */}
            <div className="summary-block block-highlighted">
              <div className="block-meta-row">
                <span className="block-category">OMSET PERKIRAAN</span>
                <TrendingUp size={13} className="text-purple" />
              </div>
              <div className="block-value text-purple">{formatRupiah(totalOmsetPerkiraan)}</div>
              <div className="block-subtext">Kotor − retur − batal (estimasi total)</div>
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

        {/* Card 2: Status Breakdown */}
        <div className="summary-card">
          <div className="summary-card-header">
            <h4>Breakdown status</h4>
            <span className="summary-card-subtitle">Omset Penjualan • Basis harga etalase • by order_date</span>
          </div>

          <div className="summary-blocks-grid">
            {/* Block 1: Omset Perkiraan */}
            <div className="summary-block block-highlighted">
              <div className="block-meta-row">
                <span className="block-category">OMSET PERKIRAAN</span>
                <DollarSign size={13} className="text-purple" />
              </div>
              <div className="block-value text-purple">{formatRupiah(totalOmsetPerkiraan)}</div>
              <div className="block-subtext">Mengakumulasi keseluruhan order</div>
            </div>

            {/* Block 2: Terkonfirmasi */}
            <div className="summary-block">
              <div className="block-meta-row">
                <span className="block-category">TERKONFIRMASI</span>
                <Check size={13} className="text-purple" />
              </div>
              <div className="block-value">{formatRupiah(totalTerkonfirmasi)}</div>
              <div className="block-subtext">Status delivered / selesai</div>
            </div>

            {/* Block 3: Pipeline */}
            <div className="summary-block">
              <div className="block-meta-row">
                <span className="block-category">PIPELINE</span>
                <TrendingUp size={13} className="text-purple" />
              </div>
              <div className="block-value">{formatRupiah(totalPipeline)}</div>
              <div className="block-subtext">Status shipped / processed</div>
            </div>

            {/* Block 4: Berisiko */}
            <div className="summary-block">
              <div className="block-meta-row">
                <span className="block-category">BERISIKO</span>
                <HelpCircle size={13} className="text-purple" />
              </div>
              <div className="block-value">{formatRupiah(totalBerisiko)}</div>
              <div className="block-subtext">Status pending / ready</div>
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
            <span className="trend-legend-item"><span className="trend-dot" style={{ background: "#4f46e5" }}></span>Omset</span>
            <span className="trend-legend-item"><span className="trend-dot" style={{ background: "#059669" }}></span>Diterima</span>
          </div>
        </div>

        <div className="trend-plot">
          {!hasTrend ? (
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
                  <th className="text-right">Net Profit</th>
                  <th className="text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody>
                {marketingData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="table-empty-row">
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
                  marketingData.map((row, idx) => {
                    const profit = (row.omset || 0) - (row.cogs || 0) - (row.fees || 0) - (row.retur || 0);
                    const margin = row.omset > 0 ? (profit / row.omset) * 100 : 0;
                    return (
                      <tr key={idx}>
                        <td className="font-semibold text-black text-capitalize">{row.platform}</td>
                        <td>{row.storeName}</td>
                        <td className="text-right">{formatRupiah(row.omset)}</td>
                        <td className="text-right">{formatRupiah(row.cogs)}</td>
                        <td className="text-right">{formatRupiah(row.fees)}</td>
                        <td className="text-right text-purple font-semibold">{formatRupiah(row.retur || 0)}</td>
                        <td className="text-right font-semibold text-black">{formatRupiah(profit)}</td>
                        <td className="text-right font-semibold text-purple">{margin.toFixed(1)}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              
              {/* Show summary totals row only when data exists */}
              {marketingData.length > 0 && (
                <tfoot>
                  <tr className="summary-total-row">
                    <td colSpan="2" className="font-bold text-black text-left">TOTAL RINGKASAN</td>
                    <td className="text-right font-bold text-black">{formatRupiah(totalOmsetKotor)}</td>
                    <td className="text-right font-bold text-black">{formatRupiah(totalCogs)}</td>
                    <td className="text-right font-bold text-black">{formatRupiah(totalFees)}</td>
                    <td className="text-right font-bold text-black">{formatRupiah(totalRetur)}</td>
                    <td className="text-right font-bold text-purple">{formatRupiah(totalProfit)}</td>
                    <td className="text-right font-bold text-purple">{marginPercent.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

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
                  /* Balanced Demo Rings when empty to show layout (COGS 40%, Profit 25%, Fees 15%, Ad Spend 12%, Retur 8%) */
                  <>
                    {/* COGS demo segment (40%) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#111827"
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${circumference * 0.40} ${circumference * 0.60}`}
                      strokeDashoffset={-(circumference * 0.60)}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    {/* Ad Spend demo segment (12%) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#C7C9F9"
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${circumference * 0.12} ${circumference * 0.88}`}
                      strokeDashoffset={-(circumference * 0.48)}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    {/* Retur demo segment (8%) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#9CA3AF"
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${circumference * 0.08} ${circumference * 0.92}`}
                      strokeDashoffset={-(circumference * 0.40)}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    {/* Platform Fees demo segment (15%) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#818CF8"
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${circumference * 0.15} ${circumference * 0.85}`}
                      strokeDashoffset={-(circumference * 0.25)}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    {/* Net Profit demo segment (25%) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#4F46E5"
                      strokeWidth={strokeWidth} 
                      strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </>
                )}
              </svg>
              
              {/* Centered text */}
              <div className="donut-center-label">
                <span className="donut-label-title">TOTAL OMSET</span>
                <span className="donut-label-value">{formatRupiah(totalOmsetKotor)}</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="donut-legend-list">
              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#4F46E5" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Net Profit</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalProfit)} ({hasData ? profitPct.toFixed(1) : "25.0"}%)
                  </span>
                </div>
              </div>
              
              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#818CF8" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Beban Platform</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalFees)} ({hasData ? feesPct.toFixed(1) : "15.0"}%)
                  </span>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#C7C9F9" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Biaya Iklan</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(adSpend)} ({hasData ? adSpendPct.toFixed(1) : "12.0"}%)
                  </span>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#9CA3AF" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">Beban Retur</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalRetur)} ({hasData ? returPct.toFixed(1) : "8.0"}%)
                  </span>
                </div>
              </div>

              <div className="legend-item">
                <div className="legend-color-dot" style={{ backgroundColor: "#111827" }}></div>
                <div className="legend-text-group">
                  <span className="legend-label">COGS (HPP)</span>
                  <span className="legend-value font-bold text-black">
                    {formatRupiah(totalCogs)} ({hasData ? cogsPct.toFixed(1) : "40.0"}%)
                  </span>
                </div>
              </div>
            </div>
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
      )}
    </div>
  );
}
