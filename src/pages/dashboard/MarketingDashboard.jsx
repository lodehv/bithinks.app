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
  const [isSubmittingFilters, setIsSubmittingFilters] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);

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
  };

  // ─── Apply Filter Action ──────────────────────────────────────────────────
  const handleApplyFilters = () => {
    setIsSubmittingFilters(true);
    
    // Structure the exact parameters for the backend API call
    const params = {
      startDate,
      endDate,
      platforms: selectedPlatforms,
      stores: selectedStores
    };

    console.log("Mengirim filter ke backend:", params);
    
    // Developer Backend integration hook placeholder
    // omniApi.getMarketingStats(params)
    //   .then(setMarketingData)
    //   .finally(() => setIsSubmittingFilters(false));

    setTimeout(() => {
      setIsSubmittingFilters(false);
    }, 400);
  };

  // ─── Metrics Aggregate Calculations ────────────────────────────────────────
  // Calculate aggregate values directly from the marketingData array to avoid dummy placeholder values
  const totalOmset = marketingData.reduce((acc, row) => acc + (row.omset || 0), 0);
  const totalCogs = marketingData.reduce((acc, row) => acc + (row.cogs || 0), 0);
  const totalFees = marketingData.reduce((acc, row) => acc + (row.fees || 0), 0);
  const totalProfit = totalOmset - totalCogs - totalFees;
  
  // Calculate margin percent (safety check to prevent division by zero)
  const marginPercent = totalOmset > 0 ? (totalProfit / totalOmset) * 100 : 0;

  // Ledger split calculations dynamically summing custom backend details or using ratio fallbacks
  const totalAdminCommission = marketingData.reduce((acc, row) => acc + (row.adminCommission || 0), 0) || (totalFees * 0.45);
  const totalFreeShipping = marketingData.reduce((acc, row) => acc + (row.freeShipping || 0), 0) || (totalFees * 0.30);
  const totalCashbackExtra = marketingData.reduce((acc, row) => acc + (row.cashbackExtra || 0), 0) || (totalFees * 0.15);
  const totalVat = marketingData.reduce((acc, row) => acc + (row.vat || 0), 0) || (totalFees * 0.05);
  const totalHandling = marketingData.reduce((acc, row) => acc + (row.handling || 0), 0) || (totalFees * 0.03);
  const totalAdjustment = marketingData.reduce((acc, row) => acc + (row.adjustment || 0), 0) || (totalFees * 0.02);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

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

      {/* ─── KPI Metric Cards Section ─── */}
      <div className="marketing-kpi-grid">
        {/* Card 1: Omset */}
        <div className="kpi-card text-black bg-white">
          <div className="kpi-icon-row">
            <div className="kpi-icon-container bg-purple-light text-purple">
              <TrendingUp size={18} />
            </div>
            <span className="kpi-category">OMSET</span>
          </div>
          <div className="kpi-value">{formatRupiah(totalOmset)}</div>
          <div className="kpi-subtext">Total pendapatan bruto dari toko terpilih</div>
        </div>

        {/* Card 2: COGS */}
        <div className="kpi-card text-black bg-white">
          <div className="kpi-icon-row">
            <div className="kpi-icon-container bg-purple-light text-purple">
              <ShoppingCart size={18} />
            </div>
            <span className="kpi-category">COGS (HPP)</span>
          </div>
          <div className="kpi-value">{formatRupiah(totalCogs)}</div>
          <div className="kpi-subtext">Harga Pokok Pembelian untuk produk terjual</div>
        </div>

        {/* Card 3: Biaya Beban Platform */}
        <div className="kpi-card text-black bg-white clickable-kpi" onClick={() => setShowFeeModal(true)}>
          <div className="kpi-icon-row">
            <div className="kpi-icon-container bg-purple-light text-purple">
              <DollarSign size={18} />
            </div>
            <span className="kpi-category">BEBAN PLATFORM</span>
          </div>
          <div className="kpi-value hover-underline">{formatRupiah(totalFees)}</div>
          <div className="kpi-subtext">Potongan biaya komisi & administrasi e-commerce (klik rincian)</div>
        </div>

        {/* Card 4: Profit */}
        <div className="kpi-card text-black bg-white">
          <div className="kpi-icon-row">
            <div className="kpi-icon-container bg-purple-light text-purple">
              <Percent size={18} />
            </div>
            <span className="kpi-category">NET PROFIT</span>
          </div>
          <div className="kpi-value text-purple">{formatRupiah(totalProfit)}</div>
          <div className="kpi-subtext">
            Margin Bersih: {marginPercent.toFixed(1)}% setelah COGS & biaya platform
          </div>
        </div>
      </div>

      {/* ─── Platform Breakdown Table ─── */}
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
                <th className="text-right">Net Profit</th>
                <th className="text-right">Margin (%)</th>
              </tr>
            </thead>
            <tbody>
              {marketingData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-row">
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
                  const profit = (row.omset || 0) - (row.cogs || 0) - (row.fees || 0);
                  const margin = row.omset > 0 ? (profit / row.omset) * 100 : 0;
                  return (
                    <tr key={idx}>
                      <td className="font-semibold text-black text-capitalize">{row.platform}</td>
                      <td>{row.storeName}</td>
                      <td className="text-right">{formatRupiah(row.omset)}</td>
                      <td className="text-right">{formatRupiah(row.cogs)}</td>
                      <td className="text-right">{formatRupiah(row.fees)}</td>
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
                  <td className="text-right font-bold text-black">{formatRupiah(totalOmset)}</td>
                  <td className="text-right font-bold text-black">{formatRupiah(totalCogs)}</td>
                  <td className="text-right font-bold text-black">{formatRupiah(totalFees)}</td>
                  <td className="text-right font-bold text-purple">{formatRupiah(totalProfit)}</td>
                  <td className="text-right font-bold text-purple">{marginPercent.toFixed(1)}%</td>
                </tr>
              </tfoot>
            )}
          </table>
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
