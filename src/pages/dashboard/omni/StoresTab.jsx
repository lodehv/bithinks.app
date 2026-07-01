import { useEffect, useState } from "react";
import { Store as StoreIcon, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import { channelMeta } from "./channels";
import "./OmniModule.css";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";

const LOGOS = { shopee: shopeeLogo, tiktok: tiktokLogo };

// Marketplace untuk modal — Shopee & TikTok aktif; sisanya "Segera".
const MARKETPLACES = [
  { key: "shopee", label: "Shopee",      logo: shopeeLogo, active: true },
  { key: "tiktok", label: "TikTok Shop", logo: tiktokLogo, active: true },
  { key: "lazada", label: "Lazada",      color: "#1A2D8D", active: false },
  { key: "tokopedia", label: "Tokopedia", color: "#03AC0E", active: false },
  { key: "blibli", label: "Blibli",      color: "#0095DA", active: false },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function StoresTab({ locked, onRequirePayment }) {
  const [stores, setStores]     = useState(null);
  const [showModal, setModal]   = useState(false);
  const [connecting, setConn]   = useState(false);
  const [toast, setToast]       = useState("");
  const [error, setError]       = useState("");

  const load    = () => { setStores(null); omniApi.listStores().then(setStores).catch(() => setStores([])); };
  const reload  = () => omniApi.listStores().then(setStores).catch(() => {});
  useEffect(load, []);

  // Terima sinyal dari popup OAuth (bithinks.com/oauth/done) → refresh daftar.
  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin || e.data?.source !== "bithinks-oauth") return;
      setConn(false);
      if (e.data.status === "ok") { setToast("Toko berhasil terhubung."); reload(); }
      else setError("Otorisasi dibatalkan atau gagal.");
      setTimeout(() => setToast(""), 5000);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // OAuth via POPUP (URL bithinks tidak berubah). Popup dibuka sinkron (anti-blocker).
  const openOAuth = async (kind) => {
    if (locked) return onRequirePayment?.();
    setError(""); setModal(false); setConn(kind);
    const popup = window.open("about:blank", "bithinks-oauth", "width=520,height=720");
    try {
      const url = kind === "tiktok" ? await omniApi.tiktokConnectUrl() : await omniApi.shopeeConnectUrl();
      if (url && popup) { popup.location.href = url; }
      else { popup?.close(); throw new Error("no-url"); }
    } catch (err) {
      popup?.close(); setConn(false);
      if (isPaymentRequired(err)) return onRequirePayment?.();
      setError(err?.response?.data?.error?.message ?? `Integrasi ${kind} belum dikonfigurasi di server.`);
    }
  };

  const handleDelete = async (s) => {
    if (locked) return onRequirePayment?.();
    if (!window.confirm(`Putuskan toko "${s.name}"?`)) return;
    try { await omniApi.deleteStore(s.id); reload(); }
    catch (err) { if (isPaymentRequired(err)) onRequirePayment?.(); }
  };

  const connected = (stores ?? []).filter((s) => s.status === "connected");

  return (
    <div className="omni">
      <div className="int-head">
        <h1>Integrasi Toko</h1>
        <p>Hubungkan toko marketplace Anda untuk sinkronisasi pesanan otomatis</p>
      </div>

      {toast && <div className="omni-pill sync" style={{ marginBottom: 14 }}>{toast}</div>}
      {error && <div className="omni-pill error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="int-banner">
        <div className="int-banner-icon"><StoreIcon size={26} /></div>
        <div className="int-banner-text">
          <div className="int-banner-title">Tambahkan Semua Toko Marketplace Kamu</div>
          <div className="int-banner-sub">Setelah terhubung, semua pesanan akan disinkronkan secara otomatis</div>
        </div>
        <button className="int-add-btn" onClick={() => (locked ? onRequirePayment?.() : setModal(true))}>
          <Plus size={18} /> Tambahkan Marketplace
        </button>
      </div>

      {stores === null ? (
        <div className="omni-loading">Memuat toko…</div>
      ) : stores.length === 0 ? (
        <div className="omni-empty">
          <div className="omni-empty-icon"><StoreIcon size={24} /></div>
          <h3>Belum ada toko terhubung</h3>
          <p>Klik “Tambahkan Marketplace” untuk menghubungkan toko Shopee atau TikTok Shop Anda.</p>
        </div>
      ) : (
        <div className="int-table-wrap">
          <table className="int-table">
            <thead>
              <tr>
                <th>Nama Toko</th><th>Shop ID</th><th>Status</th><th>Waktu Dihubungkan</th><th style={{ textAlign: "right" }}>Atur</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => {
                const m = channelMeta(s.channel);
                const logo = LOGOS[s.channel];
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="int-store">
                        {logo
                          ? <img src={logo} alt={m.label} className="int-store-logo" />
                          : <span className="int-store-logo-fallback" style={{ background: m.color }}>{m.short}</span>}
                        <div>
                          <div className="int-store-name">{s.name}</div>
                          <div className="int-store-channel">{m.label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="int-shopid">{s.externalId || "—"}</td>
                    <td>
                      <span className={`int-status ${s.status === "connected" ? "connected" : "off"}`}>
                        <span className="dot" />{s.status === "connected" ? "Terhubung" : s.status}
                      </span>
                    </td>
                    <td style={{ color: "#6B7280" }}>{fmtDate(s.createdAt)}</td>
                    <td>
                      <div className="int-actions" style={{ justifyContent: "flex-end" }}>
                        <button className="int-act-btn" title="Segarkan" onClick={reload}><RefreshCw size={15} /></button>
                        <button className="int-act-btn danger" title="Putuskan" onClick={() => handleDelete(s)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Pilih Marketplace */}
      {showModal && (
        <div className="mp-overlay" onClick={() => setModal(false)}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-head">
              <h3>Pilih Marketplace</h3>
              <button className="mp-close" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <div className="mp-grid">
              {MARKETPLACES.map((mp) => (
                <div
                  key={mp.key}
                  className={`mp-card ${mp.active ? "" : "disabled"}`}
                  onClick={() => mp.active && openOAuth(mp.key)}
                >
                  {!mp.active && <span className="mp-badge">Segera</span>}
                  {mp.logo
                    ? <img src={mp.logo} alt={mp.label} className="mp-logo" />
                    : <span className="mp-logo-fallback" style={{ background: mp.color }}>{mp.label[0]}</span>}
                  <span className="mp-name">{mp.label}</span>
                </div>
              ))}
            </div>
            <div className="mp-hint">
              {connecting ? "Membuka halaman otorisasi…" : "Pilih marketplace yang ingin dihubungkan"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
