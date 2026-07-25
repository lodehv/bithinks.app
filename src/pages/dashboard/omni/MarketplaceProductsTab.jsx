import { useEffect, useState } from "react";
import { PackageOpen, RefreshCw, Link2, Check, ImageOff } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// Produk Marketplaces — grid etalase (6/baris): gambar, nama etalase, SKU,
// tombol "Petakan ke Master Produk". Data: GET /api/omni/products/marketplace.
// ─────────────────────────────────────────────────────────────────────────────

const SUB_TABS = [
  { key: "tiktok", label: "TikTok Shop", logo: tiktokLogo },
  { key: "shopee", label: "Shopee", logo: shopeeLogo },
];

export default function MarketplaceProductsTab({ locked, onRequirePayment }) {
  const [channel, setChannel] = useState("tiktok");
  const [products, setProducts] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [note, setNote] = useState("");

  const load = (ch) => {
    setProducts(null);
    omniApi.listMarketplaceProducts(ch).then(setProducts).catch(() => setProducts([]));
  };
  useEffect(() => { load(channel); }, [channel]);

  const syncCatalog = async () => {
    if (locked) return onRequirePayment?.();
    setSyncing(true); setNote("");
    try {
      const r = await omniApi.syncProductCatalog();
      setNote(`${r?.synced ?? 0} produk tersinkron.`);
      load(channel);
    } catch (err) {
      if (isPaymentRequired(err)) return onRequirePayment?.();
      setNote(err?.response?.data?.error?.message ?? "Gagal sinkron produk.");
    } finally {
      setSyncing(false);
      setTimeout(() => setNote(""), 5000);
    }
  };

  return (
    <div className="mp-products">
      {/* Header */}
      <div className="mp-products-head">
        <div>
          <h1 className="pm-title">Produk Marketplaces</h1>
          <p className="pm-subtitle">Produk dari toko marketplace untuk ditautkan ke Master Produk</p>
        </div>
        <button className="pm-btn pm-btn-add-product" onClick={syncCatalog} disabled={syncing}>
          <RefreshCw size={14} className={syncing ? "spin" : ""} />
          <span>{syncing ? "Menyinkron…" : "Sync Produk"}</span>
        </button>
      </div>

      {/* Sub-tab: TikTok / Shopee */}
      <div className="mp-subtabs">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            className={`mp-subtab ${channel === t.key ? "active" : ""}`}
            onClick={() => setChannel(t.key)}
          >
            <img src={t.logo} alt={t.label} className="mp-subtab-logo" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {note && <div className="omni-pill sync" style={{ marginBottom: 12 }}><Check size={12} /> {note}</div>}

      {/* Konten */}
      {products === null ? (
        <div className="mp-products-panel"><div className="mp-products-empty"><RefreshCw size={26} className="spin text-gray" /><p>Memuat produk…</p></div></div>
      ) : products.length === 0 ? (
        <div className="mp-products-panel">
          <div className="mp-products-empty">
            <PackageOpen size={30} className="text-gray" />
            <h4>Belum ada produk {channel === "shopee" ? "Shopee" : "TikTok"}</h4>
            <p>Klik <b>Sync Produk</b> untuk menarik semua produk (aktif &amp; non-aktif) dari toko marketplace-mu.</p>
          </div>
        </div>
      ) : (
        <div className="mpp-grid">
          {products.map((p) => (
            <div key={p.id} className={`mpp-card ${p.status !== "active" ? "inactive" : ""}`}>
              <div className="mpp-card-img">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.title} loading="lazy" />
                  : <div className="mpp-card-noimg"><ImageOff size={22} /></div>}
                <span className={`mp-status-badge ${p.status}`}>{p.status === "active" ? "Aktif" : "Non-aktif"}</span>
              </div>
              <div className="mpp-card-body">
                <div className="mpp-card-title" title={p.title}>{p.title}</div>
                <div className="mpp-card-skus">
                  {(p.skus || []).length === 0
                    ? <span className="mp-sku-empty">Tanpa SKU</span>
                    : p.skus.map((s, i) => <span key={i} className="mp-sku-chip">{s}</span>)}
                </div>
              </div>
              <button className={`mp-map-btn ${p.mapped ? "mapped" : ""}`}>
                {p.mapped
                  ? <><Check size={13} /> {p.masterName || "Tertaut"}</>
                  : <><Link2 size={13} /> Petakan ke Master Produk</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
