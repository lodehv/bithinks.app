import { useState } from "react";
import { PackageOpen } from "lucide-react";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// Produk Marketplaces — daftar produk dari toko marketplace (Shopee/TikTok) yang
// akan ditautkan ke Master Produk. SHELL struktur; isi data disambung menyusul.
// ─────────────────────────────────────────────────────────────────────────────

const SUB_TABS = [
  { key: "shopee", label: "Shopee", logo: shopeeLogo },
  { key: "tiktok", label: "TikTok Shop", logo: tiktokLogo },
];

export default function MarketplaceProductsTab() {
  const [channel, setChannel] = useState("shopee");

  return (
    <div className="mp-products">
      {/* Header */}
      <div className="mp-products-head">
        <div>
          <h1 className="pm-title">Produk Marketplaces</h1>
          <p className="pm-subtitle">Produk dari toko marketplace untuk ditautkan ke Master Produk</p>
        </div>
      </div>

      {/* Sub-tab: Shopee / TikTok */}
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

      {/* Area konten per channel — placeholder (disambung ke endpoint menyusul) */}
      <div className="mp-products-panel">
        <div className="mp-products-empty">
          <PackageOpen size={30} className="text-gray" />
          <h4>Produk {channel === "shopee" ? "Shopee" : "TikTok Shop"}</h4>
          <p>Daftar produk marketplace untuk ditautkan ke Master Produk akan tampil di sini.</p>
        </div>
      </div>
    </div>
  );
}
