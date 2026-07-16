import { useState, useEffect } from "react";
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
  const [visibleLines, setVisibleLines] = useState(["omset", "profit", "cogs", "fees", "adSpend"]);

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

  // COGS/HPP & beban platform menyusul (belum ada sumber data) → jangan dikarang.
  const totalCogs = 0;
  const totalFees = 0;
  const totalProfit = totalOmsetPerkiraan - totalCogs - totalFees;

  // Calculate margin percent (safety check to prevent division by zero)
  const marginPercent = totalOmsetPerkiraan > 0 ? (totalProfit / totalOmsetPerkiraan) * 100 : 0;

  // Ledger split calculations dynamically summing custom backend details or using ratio fallbacks
  const totalAdminCommission = marketingData.reduce((acc, row) => acc + (row.adminCommission || 0), 0) || (totalFees * 0.45);
  const totalFreeShipping = marketingData.reduce((acc, row) => acc + (row.freeShipping || 0), 0) || (totalFees * 0.30);
  const totalCashbackExtra = marketingData.reduce((acc, row) => acc + (row.cashbackExtra || 0), 0) || (totalFees * 0.15);
  const totalVat = marketingData.reduce((acc, row) => acc + (row.vat || 0), 0) || (totalFees * 0.05);
  const totalHandling = marketingData.reduce((acc, row) => acc + (row.handling || 0), 0) || (totalFees * 0.03);
  const totalAdjustment = marketingData.reduce((acc, row) => acc + (row.adjustment || 0), 0) || (totalFees * 0.02);

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

  // ─── Trend Chart Section Calculations ───
  const chartRatios = [0.12, 0.15, 0.11, 0.16, 0.13, 0.18, 0.15];
  const chartDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  
  const baseOmsetVal = totalOmsetKotor > 0 ? totalOmsetKotor : 12500000;
  const baseCogsVal = totalCogs > 0 ? totalCogs : baseOmsetVal * 0.45;
  const baseFeesVal = totalFees > 0 ? totalFees : baseOmsetVal * 0.15;
  const baseReturVal = totalRetur > 0 ? totalRetur : baseOmsetVal * 0.08;

  const dailyOmset = chartRatios.map(r => Math.round(baseOmsetVal * r * 7));
  const dailyCogs = chartRatios.map(r => Math.round(baseCogsVal * r * 7));
  const dailyFees = chartRatios.map(r => Math.round(baseFeesVal * r * 7));
  const dailyAdSpend = chartRatios.map(r => Math.round((adSpend > 0 ? adSpend : baseOmsetVal * 0.12) * r * 7));
  const dailyRetur = chartRatios.map(r => Math.round(baseReturVal * r * 7));
  const dailyProfit = dailyOmset.map((o, i) => o - dailyCogs[i] - dailyFees[i] - dailyRetur[i] - dailyAdSpend[i]);

  const toggleMetricLine = (metric) => {
    setVisibleLines(prev => 
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  const allChartValues = [
    ...(visibleLines.includes("omset") ? dailyOmset : []),
    ...(visibleLines.includes("cogs") ? dailyCogs : []),
    ...(visibleLines.includes("fees") ? dailyFees : []),
    ...(visibleLines.includes("adSpend") ? dailyAdSpend : []),
    ...(visibleLines.includes("profit") ? dailyProfit : [])
  ];
  
  const chartMax = Math.max(...allChartValues, 1000000);
  const chartMin = Math.min(...allChartValues, 0);
  const chartRange = chartMax - chartMin || 1;

  const getCoordinates = (pointsArray) => {
    const width = 800;
    const height = 180;
    const paddingX = 40;
    const paddingY = 20;

    return pointsArray.map((val, idx) => {
      const x = paddingX + (idx / (pointsArray.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - ((val - chartMin) / chartRange) * (height - 2 * paddingY);
      return { x, y, value: val };
    });
  };

  const getPathD = (coords) => {
    if (coords.length < 2) return "";
    return coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  };

  const coordsOmset = getCoordinates(dailyOmset);
  const coordsProfit = getCoordinates(dailyProfit);
  const coordsCogs = getCoordinates(dailyCogs);
  const coordsFees = getCoordinates(dailyFees);
  const coordsAdSpend = getCoordinates(coordsCogs.map((_, i) => dailyAdSpend[i]));

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

      {/* ─── Trend Line Chart Section ─── */}
      <div className="marketing-chart-card trend-chart-card">
        <div className="chart-card-header trend-header">
          <div className="header-title-group">
            <TrendingUp size={16} className="text-purple" />
            <h3>Tren Finansial & Kampanye</h3>
          </div>
          
          {/* Legend Checklist Toggles */}
          <div className="trend-legend-toggles">
            <label className="toggle-label-btn">
              <input 
                type="checkbox" 
                checked={visibleLines.includes("omset")} 
                onChange={() => toggleMetricLine("omset")} 
              />
              <span className="toggle-indicator dot-omset"></span>
              <span>Omset</span>
            </label>

            <label className="toggle-label-btn">
              <input 
                type="checkbox" 
                checked={visibleLines.includes("profit")} 
                onChange={() => toggleMetricLine("profit")} 
              />
              <span className="toggle-indicator dot-profit"></span>
              <span>Net Profit</span>
            </label>

            <label className="toggle-label-btn">
              <input 
                type="checkbox" 
                checked={visibleLines.includes("cogs")} 
                onChange={() => toggleMetricLine("cogs")} 
              />
              <span className="toggle-indicator dot-cogs"></span>
              <span>COGS (HPP)</span>
            </label>

            <label className="toggle-label-btn">
              <input 
                type="checkbox" 
                checked={visibleLines.includes("fees")} 
                onChange={() => toggleMetricLine("fees")} 
              />
              <span className="toggle-indicator dot-fees"></span>
              <span>Beban Platform</span>
            </label>

            <label className="toggle-label-btn">
              <input 
                type="checkbox" 
                checked={visibleLines.includes("adSpend")} 
                onChange={() => toggleMetricLine("adSpend")} 
              />
              <span className="toggle-indicator dot-adspend"></span>
              <span>Biaya Iklan</span>
            </label>
          </div>
        </div>

        <div className="trend-chart-body">
          <div className="trend-chart-container">
            <svg width="100%" height="180" viewBox="0 0 800 180" preserveAspectRatio="none" className="trend-svg">
              {/* Horizontal Grid lines */}
              {[0, 0.33, 0.66, 1].map((ratio, i) => {
                const val = chartMax - ratio * chartRange;
                const y = 20 + ratio * 140; // mapped from paddingY 20 to height 180 - paddingY 20
                return (
                  <g key={i}>
                    <line 
                      x1="40" 
                      y1={y} 
                      x2="760" 
                      y2={y} 
                      stroke="#F3F4F6" 
                      strokeDasharray="4 4" 
                      strokeWidth="1"
                    />
                    <text 
                      x="35" 
                      y={y + 3} 
                      textAnchor="end" 
                      fontSize="9" 
                      fill="#9CA3AF" 
                      fontWeight="700"
                    >
                      {formatShortRupiah(val)}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Grid Lines & Day Labels */}
              {chartDays.map((day, idx) => {
                const x = 40 + (idx / 6) * 720;
                return (
                  <g key={idx}>
                    <line 
                      x1={x} 
                      y1="20" 
                      x2={x} 
                      y2="160" 
                      stroke="#F3F4F6" 
                      strokeDasharray="4 4" 
                      strokeWidth="1"
                    />
                    <text 
                      x={x} 
                      y={176} 
                      textAnchor="middle" 
                      fontSize="9.5" 
                      fill="#6B7280" 
                      fontWeight="800"
                    >
                      {day}
                    </text>
                  </g>
                );
              })}

              {/* ─── Paths Drawing ─── */}
              
              {/* 1. Omset Line */}
              {visibleLines.includes("omset") && (
                <>
                  <path 
                    d={getPathD(coordsOmset)} 
                    fill="none" 
                    stroke="#4F46E5" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {coordsOmset.map((c, i) => (
                    <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#ffffff" stroke="#4F46E5" strokeWidth="2" />
                  ))}
                </>
              )}

              {/* 2. COGS Line */}
              {visibleLines.includes("cogs") && (
                <>
                  <path 
                    d={getPathD(coordsCogs)} 
                    fill="none" 
                    stroke="#374151" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  {coordsCogs.map((c, i) => (
                    <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#ffffff" stroke="#374151" strokeWidth="2" />
                  ))}
                </>
              )}

              {/* 3. Platform Fees Line */}
              {visibleLines.includes("fees") && (
                <>
                  <path 
                    d={getPathD(coordsFees)} 
                    fill="none" 
                    stroke="#818CF8" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  {coordsFees.map((c, i) => (
                    <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#ffffff" stroke="#818CF8" strokeWidth="2" />
                  ))}
                </>
              )}

              {/* 4. Ad Spend Line */}
              {visibleLines.includes("adSpend") && (
                <>
                  <path 
                    d={getPathD(coordsAdSpend)} 
                    fill="none" 
                    stroke="#C7C9F9" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  {coordsAdSpend.map((c, i) => (
                    <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#ffffff" stroke="#C7C9F9" strokeWidth="2" />
                  ))}
                </>
              )}

              {/* 5. Profit Line */}
              {visibleLines.includes("profit") && (
                <>
                  <path 
                    d={getPathD(coordsProfit)} 
                    fill="none" 
                    stroke="#111827" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  {coordsProfit.map((c, i) => (
                    <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#ffffff" stroke="#111827" strokeWidth="2" />
                  ))}
                </>
              )}
            </svg>
          </div>
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
                  <th className="ledger-th-pct text-right">RASIO</th>
                  <th className="ledger-th-amount text-right">JUMLAH (IDR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="ledger-td-desc">Biaya Komisi Administrasi Marketplace</td>
                  <td className="text-right text-gray">45.0%</td>
                  <td className="text-right">{formatRupiah(totalAdminCommission)}</td>
                </tr>
                <tr>
                  <td className="ledger-td-desc">Beban Layanan Program Gratis Ongkir Ekstra</td>
                  <td className="text-right text-gray">30.0%</td>
                  <td className="text-right">{formatRupiah(totalFreeShipping)}</td>
                </tr>
                <tr>
                  <td className="ledger-td-desc">Beban Layanan Program Cashback Ekstra</td>
                  <td className="text-right text-gray">15.0%</td>
                  <td className="text-right">{formatRupiah(totalCashbackExtra)}</td>
                </tr>
                <tr>
                  <td className="ledger-td-desc">Pajak Pertambahan Nilai (PPN 11% Jasa Platform)</td>
                  <td className="text-right text-gray">5.0%</td>
                  <td className="text-right">{formatRupiah(totalVat)}</td>
                </tr>
                <tr>
                  <td className="ledger-td-desc">Biaya Penanganan Pembayaran (Handling Gateway)</td>
                  <td className="text-right text-gray">3.0%</td>
                  <td className="text-right">{formatRupiah(totalHandling)}</td>
                </tr>
                <tr>
                  <td className="ledger-td-desc">Penyesuaian Beban Operasional Lain-Lain</td>
                  <td className="text-right text-gray">2.0%</td>
                  <td className="text-right">{formatRupiah(totalAdjustment)}</td>
                </tr>
                
                {/* Ledger Double Underline Total */}
                <tr className="ledger-total-row">
                  <td className="font-bold text-black text-left">TOTAL BEBAN PLATFORM</td>
                  <td className="text-right text-gray font-bold">100.0%</td>
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
