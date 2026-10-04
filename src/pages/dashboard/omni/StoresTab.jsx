import { useCallback, useEffect, useState } from "react";
import { Store as StoreIcon, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import { channelMeta } from "./channels";
import "./OmniModule.css";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";
import { formatDateTime } from "../../../utils/datetime";
import { notify } from "../../../components/notifications/notificationBus";

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
  d ? formatDateTime(d, { year: "always" }) : "-";

export default function StoresTab({ locked, onRequirePayment }) {
  const [stores, setStores]     = useState(null);
  const [showModal, setModal]   = useState(false);
  const [connecting, setConn]   = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => omniApi.listStores().then(setStores), []);
  useEffect(() => {
    setStores(null);
    reload().catch(() => setStores([]));
  }, [reload]);

  // Terima sinyal dari popup OAuth (bithinks.com/oauth/done) → refresh daftar.
  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin || e.data?.source !== "bithinks-oauth") return;
      setConn(false);
      if (e.data.status === "ok") {
        notify({ type: "success", title: "Toko berhasil terhubung", description: "Sinkronisasi pesanan akan berjalan otomatis." });
        reload().catch(() => {});
      } else {
        notify({ type: "error", title: "Integrasi toko gagal", description: "Otorisasi dibatalkan atau tidak dapat diselesaikan. Coba lagi." });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [reload]);

  useEffect(() => {
    if (!pendingDelete) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !deleting) setPendingDelete(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [pendingDelete, deleting]);

  // OAuth via POPUP (URL bithinks tidak berubah). Popup dibuka sinkron (anti-blocker).
  const openOAuth = async (kind) => {
    if (locked) return onRequirePayment?.();
    setModal(false); setConn(kind);
    const popup = window.open("about:blank", "bithinks-oauth", "width=520,height=720");
    try {
      const url = kind === "tiktok" ? await omniApi.tiktokConnectUrl() : await omniApi.shopeeConnectUrl();
      if (url && popup) { popup.location.href = url; }
      else { popup?.close(); throw new Error("no-url"); }
    } catch (err) {
      popup?.close(); setConn(false);
      if (isPaymentRequired(err)) return onRequirePayment?.();
      if (err?.config) return;
      notify({
        type: "error",
        title: "Integrasi toko gagal",
        description: err?.response?.data?.error?.message ?? `Integrasi ${kind} belum dikonfigurasi di server.`,
      });
    }
  };

  const handleDelete = (store) => {
    setPendingDelete(store);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await omniApi.deleteStore(pendingDelete.id);
      setStores((current) => (current ?? []).filter((store) => store.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      if (isPaymentRequired(err)) onRequirePayment?.();
    } finally {
      setDeleting(false);
    }
  };

  const refreshStores = async () => {
    try {
      await reload();
      notify({ type: "success", title: "Daftar toko diperbarui" });
    } catch {
      // Shared request notifications report the actionable failure.
    }
  };

  return (
    <div className="omni int-page">
      <div className="int-head">
        <h1>Integrasi Toko</h1>
        <p>Hubungkan toko marketplace Anda untuk sinkronisasi pesanan otomatis</p>
      </div>

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
                    <td style={{ color: "#6B6E76" }}>{fmtDate(s.createdAt)}</td>
                    <td>
                      <div className="int-actions" style={{ justifyContent: "flex-end" }}>
                        <button className="int-act-btn" title="Segarkan" onClick={refreshStores}><RefreshCw size={15} /></button>
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

      {/* Modal Pilih Marketplace — pesanan mulai terkumpul sejak toko dihubungkan */}
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
              {connecting ? "Membuka halaman otorisasi…" : "Pesanan mulai terkumpul otomatis sejak toko dihubungkan"}
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="ds-blanket" onMouseDown={() => !deleting && setPendingDelete(null)}>
          <section
            className="ds-dialog ds-dialog-small"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disconnect-store-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ds-dialog-header">
              <h2 className="ds-dialog-title" id="disconnect-store-title">Putuskan toko?</h2>
            </div>
            <div className="ds-dialog-body">
              <p>
                <strong>{pendingDelete.name}</strong> akan berhenti menerima sinkronisasi baru.
                Pesanan dan riwayat tetap tersimpan, dan toko dapat diintegrasikan kembali kapan saja.
              </p>
            </div>
            <div className="ds-dialog-footer">
              <button className="ds-btn" type="button" disabled={deleting} onClick={() => setPendingDelete(null)} autoFocus>
                Batal
              </button>
              <button className="ds-btn ds-btn-danger" type="button" disabled={deleting} onClick={confirmDelete}>
                {deleting ? "Memutuskan…" : "Putuskan toko"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
