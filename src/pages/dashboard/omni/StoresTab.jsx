import { useEffect, useState } from "react";
import { Plus, Store as StoreIcon, RefreshCw } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import { CHANNELS, ACTIVE_CHANNELS, channelMeta } from "./channels";
import "./OmniModule.css";

export default function StoresTab({ locked, onRequirePayment }) {
  const [stores, setStores]   = useState(null);
  const [showForm, setShow]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm]       = useState({ channel: "shopee", name: "", externalId: "" });

  // Penautan Shopee resmi (OAuth) — backend yang pegang Partner Key & tukar token.
  const connectShopee = async () => {
    if (locked) return onRequirePayment?.();
    setError(""); setConnecting(true);
    try {
      const url = await omniApi.shopeeConnectUrl();
      if (url) { window.location.href = url; return; } // alihkan ke Shopee
      setError("Gagal mendapatkan URL otorisasi Shopee.");
      setConnecting(false);
    } catch (err) {
      if (isPaymentRequired(err)) { onRequirePayment?.(); return; }
      setError(err?.response?.data?.error?.message ?? "Integrasi Shopee belum dikonfigurasi di server.");
      setConnecting(false);
    }
  };

  const load = () => {
    setStores(null);
    omniApi.listStores().then(setStores).catch(() => setStores([]));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await omniApi.connectStore({
        channel: form.channel,
        name: form.name.trim(),
        externalId: form.externalId.trim() || undefined,
      });
      setForm({ channel: "shopee", name: "", externalId: "" });
      setShow(false);
      load();
    } catch (err) {
      if (isPaymentRequired(err)) return onRequirePayment?.();
      setError(err?.response?.data?.error?.message ?? "Gagal menghubungkan toko.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="omni-toolbar">
        <div>
          <div className="omni-toolbar-title">Toko Terhubung</div>
          <div className="omni-toolbar-sub">Hubungkan channel jualanmu agar stok & pesanan tersinkron.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="omni-btn omni-btn-ghost"
            onClick={() => (locked ? onRequirePayment?.() : setShow((s) => !s))}
            disabled={saving}
          >
            <Plus size={15} /> Tambah Manual
          </button>
          <button className="omni-btn omni-btn-primary" onClick={connectShopee} disabled={connecting || saving}>
            <StoreIcon size={15} /> {connecting ? "Mengalihkan…" : "Hubungkan Shopee"}
          </button>
        </div>
      </div>

      {error && !showForm && <div className="omni-pill error" style={{ marginBottom: 14 }}>{error}</div>}

      {showForm && !locked && (
        <form className="omni-form" onSubmit={submit}>
          <div className="omni-form-row">
            <div className="omni-field">
              <label>Channel</label>
              <select className="omni-select" value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                {Object.keys(CHANNELS).map((k) => (
                  <option key={k} value={k} disabled={!ACTIVE_CHANNELS.includes(k)}>
                    {CHANNELS[k].label}{ACTIVE_CHANNELS.includes(k) ? "" : " — segera"}
                  </option>
                ))}
              </select>
            </div>
            <div className="omni-field">
              <label>Nama Toko</label>
              <input className="omni-input" placeholder="mis. Toko Kopi Nusantara"
                value={form.name} required
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="omni-field">
              <label>ID Toko (opsional)</label>
              <input className="omni-input" placeholder="shop id di marketplace"
                value={form.externalId}
                onChange={(e) => setForm({ ...form, externalId: e.target.value })} />
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: "#DC2626" }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="omni-btn omni-btn-primary" type="submit" disabled={saving || !form.name.trim()}>
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
            <button className="omni-btn omni-btn-ghost" type="button" onClick={() => setShow(false)}>Batal</button>
          </div>
        </form>
      )}

      {stores === null ? (
        <div className="omni-loading">Memuat toko…</div>
      ) : stores.length === 0 ? (
        <div className="omni-empty">
          <div className="omni-empty-icon"><StoreIcon size={24} /></div>
          <h3>Belum ada toko terhubung</h3>
          <p>Hubungkan toko Shopee atau TikTok Shop-mu untuk mulai menyinkronkan stok & pesanan.</p>
        </div>
      ) : (
        <div className="omni-grid">
          {stores.map((s) => {
            const m = channelMeta(s.channel);
            return (
              <div className="omni-card" key={s.id}>
                <div className="omni-card-top">
                  <div className="omni-store-id">
                    <span className="omni-channel-dot" style={{ background: m.color }}>{m.short}</span>
                    <div>
                      <div className="omni-store-name">{s.name}</div>
                      <div className="omni-store-meta">{m.label}{s.externalId ? ` · ${s.externalId}` : ""}</div>
                    </div>
                  </div>
                  <span className={`omni-pill ${s.status === "connected" ? "live" : s.status === "error" ? "error" : "neutral"}`}>
                    <span className="dot" />{s.status === "connected" ? "TERHUBUNG" : s.status.toUpperCase()}
                  </span>
                </div>
                <div className="omni-store-meta" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <RefreshCw size={12} />
                  {s.lastSyncAt ? `Sinkron terakhir ${new Date(s.lastSyncAt).toLocaleString("id-ID")}` : "Belum pernah disinkron"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
