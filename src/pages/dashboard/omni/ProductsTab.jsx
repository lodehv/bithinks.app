import { useEffect, useMemo, useState } from "react";
import {
  Search, ChevronDown, SlidersHorizontal, Download, Plus, MoreHorizontal,
  Info, ArrowUpDown, PackageOpen, Check, AlertTriangle, RefreshCw,
} from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import "./ProductMaster.css";
import "./OmniModule.css";

const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const SORTS = [
  { id: "newest", label: "Terbaru" },
  { id: "name",   label: "Nama A–Z" },
  { id: "price",  label: "Harga tertinggi" },
  { id: "stock",  label: "Stok terbanyak" },
];

const TABS = [["all", "Semua Produk"], ["satuan", "Produk Satuan"], ["bundle", "Produk Bundle"]];

export default function ProductsTab({ locked, onRequirePayment }) {
  const [products, setProducts] = useState(null);
  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [tab, setTab]           = useState("all");
  const [selected, setSelected] = useState(() => new Set());
  const [showForm, setShow]     = useState(false);
  const [form, setForm]         = useState({ sku: "", name: "", price: "", masterStock: "" });
  const [saving, setSaving]     = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [note, setNote]         = useState("");
  const [error, setError]       = useState("");

  const load = () => { setProducts(null); omniApi.listProducts().then(setProducts).catch(() => setProducts([])); };
  useEffect(load, []);
  const guard = (err) => { if (isPaymentRequired(err)) { onRequirePayment?.(); return true; } return false; };

  const all = products ?? [];
  // Semua produk kita saat ini = produk satuan; bundle belum tersedia.
  const byTab = tab === "bundle" ? [] : all;
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q ? byTab.filter((p) => p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)) : byTab;
    return [...list].sort((a, b) => {
      if (sortBy === "name")  return a.name.localeCompare(b.name);
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "stock") return b.masterStock - a.masterStock;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [byTab, search, sortBy]);

  const counts = { all: all.length, satuan: all.length, bundle: 0 };

  const addProduct = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await omniApi.createProduct({
        sku: form.sku.trim(), name: form.name.trim(),
        price: Number(form.price) || 0, masterStock: Number(form.masterStock) || 0,
      });
      setForm({ sku: "", name: "", price: "", masterStock: "" }); setShow(false); load();
    } catch (err) { if (guard(err)) return; setError(err?.response?.data?.error?.message ?? "Gagal menambah produk."); }
    finally { setSaving(false); }
  };

  const sync = async () => {
    setNote(""); setError(""); setSyncing(true);
    try {
      const res = await omniApi.syncStock();
      setNote(`Tersinkron ke ${res.stores} toko · ${res.products} produk diperbarui.`); load();
    } catch (err) { if (guard(err)) return; setError(err?.response?.data?.error?.message ?? "Gagal menyinkronkan stok."); }
    finally { setSyncing(false); }
  };

  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = shown.length > 0 && shown.every((p) => selected.has(p.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(shown.map((p) => p.id)));

  const download = () => {
    const rows = [["Nama", "SKU", "Harga", "Stok"], ...all.map((p) => [p.name, p.sku, p.price, p.masterStock])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "produk-master.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="pm-page">
      <div className="pm-head">
        <h1 className="pm-title">Produk Master</h1>
        <div className="pm-head-actions">
          <button className="pm-btn pm-btn-outline" onClick={download} disabled={!all.length}>
            <Download size={16} /> Unduh <ChevronDown size={14} />
          </button>
          <button className="pm-btn pm-btn-primary" onClick={() => (locked ? onRequirePayment?.() : setShow((s) => !s))}>
            <Plus size={16} /> Tambah Produk Baru <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {note  && <div className="omni-pill sync"  style={{ margin: "0 24px 4px" }}><Check size={12} /> {note}</div>}
      {error && <div className="omni-pill error" style={{ margin: "0 24px 4px" }}><AlertTriangle size={12} /> {error}</div>}

      {showForm && !locked && (
        <form className="omni-form" style={{ margin: "0 24px 8px" }} onSubmit={addProduct}>
          <div className="omni-form-row">
            <div className="omni-field"><label>SKU</label>
              <input className="omni-input" required value={form.sku} placeholder="KOP-001" onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div className="omni-field"><label>Nama Produk</label>
              <input className="omni-input" required value={form.name} placeholder="Kopi Arabica 250g" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="omni-field"><label>Harga</label>
              <input className="omni-input" type="number" min="0" value={form.price} placeholder="0" onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="omni-field"><label>Stok</label>
              <input className="omni-input" type="number" min="0" value={form.masterStock} placeholder="0" onChange={(e) => setForm({ ...form, masterStock: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pm-btn pm-btn-primary" type="submit" disabled={saving || !form.sku.trim() || !form.name.trim()}>{saving ? "Menyimpan…" : "Simpan Produk"}</button>
            <button className="pm-btn pm-btn-outline" type="button" onClick={() => setShow(false)}>Batal</button>
          </div>
        </form>
      )}

      <div className="pm-toolbar">
        <div className="pm-search">
          <Search size={17} />
          <input placeholder="Cari nama produk atau SKU" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="pm-sort">
          <button className="pm-btn pm-btn-outline" onClick={() => setSortOpen((o) => !o)}>Urutkan <ChevronDown size={14} /></button>
          {sortOpen && (
            <div className="pm-sort-menu">
              {SORTS.map((s) => (
                <div key={s.id} className={`pm-sort-opt ${sortBy === s.id ? "active" : ""}`} onClick={() => { setSortBy(s.id); setSortOpen(false); }}>{s.label}</div>
              ))}
            </div>
          )}
        </div>
        <button className="pm-btn pm-btn-outline">Filter <SlidersHorizontal size={15} /></button>
        <button className="pm-btn pm-btn-ghost pm-sync" onClick={() => (locked ? onRequirePayment?.() : sync())} disabled={syncing}>
          <RefreshCw size={15} className={syncing ? "omni-spin" : ""} /> {syncing ? "Menyinkronkan…" : "Sinkronkan Stok"}
        </button>
      </div>

      <div className="pm-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={`pm-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
            {label} <span className="pm-tab-count">{counts[id]}</span>
          </button>
        ))}
      </div>

      <div className="pm-table-wrap">
        <table className="pm-table">
          <thead>
            <tr>
              <th className="pm-check"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th>Informasi Produk <ArrowUpDown size={13} /></th>
              <th>Master SKU</th><th>Harga</th><th>Stok</th>
              <th>Produk Terkait <Info size={13} className="pm-th-info" /></th>
              <th>Toko Terkait</th><th>Waktu</th><th>Atur</th>
            </tr>
          </thead>
          <tbody>
            {products === null ? (
              <tr><td colSpan={9} className="pm-state">Memuat produk…</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="pm-empty">
                  <div className="pm-empty-illust"><PackageOpen size={38} /></div>
                  <p>{search ? "Produk tidak ditemukan." : tab === "bundle" ? "Belum ada produk bundle." : "Belum ada produk master."}</p>
                </div>
              </td></tr>
            ) : shown.map((p) => (
              <tr key={p.id}>
                <td className="pm-check"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSel(p.id)} /></td>
                <td>
                  <div className="pm-info">
                    <span className="pm-thumb">{p.imageUrl ? <img src={p.imageUrl} alt="" /> : <PackageOpen size={18} />}</span>
                    <span className="pm-info-name">{p.name}</span>
                  </div>
                </td>
                <td className="pm-sku">{p.sku}</td>
                <td className="pm-strong">{rupiah(p.price)}</td>
                <td className="pm-strong">{p.masterStock}</td>
                <td className="pm-muted">—</td>
                <td>{p.channels.length ? <span className="pm-stores">{p.channels.length} toko</span> : <span className="pm-muted">—</span>}</td>
                <td className="pm-muted">{fmtDate(p.createdAt)}</td>
                <td><button className="pm-kebab" aria-label="Atur"><MoreHorizontal size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
