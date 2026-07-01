import { useEffect, useState } from "react";
import { Plus, RefreshCw, Boxes, Check, AlertTriangle } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import { channelMeta } from "./channels";
import "./OmniModule.css";

const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

export default function ProductsTab({ locked, onRequirePayment }) {
  const [products, setProducts] = useState(null);
  const [showForm, setShow]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [note, setNote]         = useState("");
  const [error, setError]       = useState("");
  const [form, setForm]         = useState({ sku: "", name: "", price: "", masterStock: "" });

  const load = () => {
    setProducts(null);
    omniApi.listProducts().then(setProducts).catch(() => setProducts([]));
  };
  useEffect(load, []);

  const guard = (err) => { if (isPaymentRequired(err)) { onRequirePayment?.(); return true; } return false; };

  const addProduct = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      await omniApi.createProduct({
        sku: form.sku.trim(),
        name: form.name.trim(),
        price: Number(form.price) || 0,
        masterStock: Number(form.masterStock) || 0,
      });
      setForm({ sku: "", name: "", price: "", masterStock: "" });
      setShow(false); load();
    } catch (err) {
      if (guard(err)) return;
      setError(err?.response?.data?.error?.message ?? "Gagal menambah produk.");
    } finally { setSaving(false); }
  };

  const sync = async () => {
    setNote(""); setError(""); setSyncing(true);
    try {
      const res = await omniApi.syncStock();
      setNote(`Tersinkron ke ${res.stores} toko · ${res.products} produk diperbarui.`);
      load();
    } catch (err) {
      if (guard(err)) return;
      setError(err?.response?.data?.error?.message ?? "Gagal menyinkronkan stok.");
    } finally { setSyncing(false); }
  };

  return (
    <div>
      <div className="omni-toolbar">
        <div>
          <div className="omni-toolbar-title">Produk & Stok</div>
          <div className="omni-toolbar-sub">Satu sumber stok untuk semua channel — sinkron otomatis, anti oversell.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="omni-btn omni-btn-ghost" onClick={() => (locked ? onRequirePayment?.() : setShow((s) => !s))}>
            <Plus size={15} /> Tambah Produk
          </button>
          <button className="omni-btn omni-btn-primary" onClick={() => (locked ? onRequirePayment?.() : sync())} disabled={syncing}>
            <RefreshCw size={15} className={syncing ? "spin" : ""} /> {syncing ? "Menyinkronkan…" : "Sinkronkan Stok"}
          </button>
        </div>
      </div>

      {note  && <div className="omni-pill sync" style={{ marginBottom: 14 }}><Check size={12} /> {note}</div>}
      {error && <div className="omni-pill error" style={{ marginBottom: 14 }}><AlertTriangle size={12} /> {error}</div>}

      {showForm && !locked && (
        <form className="omni-form" onSubmit={addProduct}>
          <div className="omni-form-row">
            <div className="omni-field"><label>SKU</label>
              <input className="omni-input" required value={form.sku} placeholder="KOP-001"
                onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div className="omni-field"><label>Nama Produk</label>
              <input className="omni-input" required value={form.name} placeholder="Kopi Arabica 250g"
                onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="omni-field"><label>Harga</label>
              <input className="omni-input" type="number" min="0" value={form.price} placeholder="0"
                onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="omni-field"><label>Stok</label>
              <input className="omni-input" type="number" min="0" value={form.masterStock} placeholder="0"
                onChange={(e) => setForm({ ...form, masterStock: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="omni-btn omni-btn-primary" type="submit" disabled={saving || !form.sku.trim() || !form.name.trim()}>
              {saving ? "Menyimpan…" : "Simpan Produk"}
            </button>
            <button className="omni-btn omni-btn-ghost" type="button" onClick={() => setShow(false)}>Batal</button>
          </div>
        </form>
      )}

      {products === null ? (
        <div className="omni-loading">Memuat produk…</div>
      ) : products.length === 0 ? (
        <div className="omni-empty">
          <div className="omni-empty-icon"><Boxes size={24} /></div>
          <h3>Belum ada produk</h3>
          <p>Tambah produk dan stok masternya, lalu tekan “Sinkronkan Stok” agar tersebar ke semua toko.</p>
        </div>
      ) : (
        <div className="omni-table-wrap">
          <table className="omni-table">
            <thead>
              <tr>
                <th>Produk</th><th>SKU</th><th>Stok Master</th><th>Status per Channel</th><th>Sinkron</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><span className="omni-cell-strong">{p.name}</span><div className="omni-cell-muted">{rupiah(p.price)}</div></td>
                  <td className="omni-cell-muted">{p.sku}</td>
                  <td className="omni-cell-strong">{p.masterStock}</td>
                  <td>
                    {p.channels.length === 0 ? (
                      <span className="omni-cell-muted">belum tersebar</span>
                    ) : (
                      <span className="omni-channel-chips">
                        {p.channels.map((c, i) => {
                          const m = channelMeta(c.channel);
                          return (
                            <span key={i} className={`omni-pill ${c.inSync ? "sync" : "unsync"}`} title={m.label}>
                              <span className="dot" style={{ background: m.color }} />{m.short} {c.syncedStock}
                            </span>
                          );
                        })}
                      </span>
                    )}
                  </td>
                  <td>
                    {p.fullySynced
                      ? <span className="omni-pill sync"><Check size={11} /> Sinkron</span>
                      : <span className="omni-pill unsync">Perlu sinkron</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
