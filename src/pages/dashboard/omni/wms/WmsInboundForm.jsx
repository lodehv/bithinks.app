import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { omniApi } from "../../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// Form buat PO. Item dipilih dari produk master (Kelola Produk), jadi HPP-nya
// ikut terbawa otomatis — nilai penerimaan nanti tidak perlu ditebak.
//
// HPP tetap bisa diubah per baris karena harga beli sesekali berbeda dari HPP
// tercatat. Yang diubah di sini HANYA berlaku untuk PO ini; HPP produknya
// sendiri tidak ikut tertimpa, supaya satu pembelian tak diam-diam mengubah
// dasar perhitungan COGS semua pesanan lama.
// ─────────────────────────────────────────────────────────────────────────────

const rupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");

export default function WmsInboundForm({ onBack, onCreated, onError }) {
  const [products, setProducts] = useState(null);
  const [supplier, setSupplier] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([]);      // { productId, qty, unitCost }
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    omniApi.wmsStock().then(setProducts).catch(() => setProducts([]));
  }, []);

  const chosen = useMemo(() => new Set(lines.map((l) => l.productId)), [lines]);
  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products ?? [])
      .filter((p) => !chosen.has(p.productId))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [products, chosen, search]);

  const add = (p) => {
    setLines((l) => [...l, { productId: p.productId, name: p.name, sku: p.sku, qty: "", unitCost: p.costPrice ?? "" }]);
    setSearch("");
  };
  const patch = (id, k, v) => setLines((l) => l.map((x) => (x.productId === id ? { ...x, [k]: v } : x)));
  const remove = (id) => setLines((l) => l.filter((x) => x.productId !== id));

  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitCost) || 0), 0);

  const submit = async () => {
    const items = lines
      .map((l) => ({
        productId: l.productId,
        qtyOrdered: Number(l.qty) || 0,
        unitCost: l.unitCost === "" ? null : Number(l.unitCost),
      }))
      .filter((i) => i.qtyOrdered > 0);

    if (items.length === 0) { setError("Isi minimal satu produk dengan jumlah lebih dari 0."); return; }

    setSaving(true); setError("");
    try {
      const res = await omniApi.wmsInboundCreate({
        supplier: supplier.trim() || undefined,
        expectedAt: expectedAt || undefined,
        note: note.trim() || undefined,
        items,
      });
      onCreated(res.id);
    } catch (err) {
      if (onError?.(err)) return;
      setError(err?.response?.data?.error?.message ?? "Gagal membuat PO.");
    } finally { setSaving(false); }
  };

  if (products === null) return <div className="omni-loading">Memuat produk…</div>;

  return (
    <div>
      <div className="omni-toolbar">
        <button className="omni-btn omni-btn-ghost" onClick={onBack}><ArrowLeft size={14} /> Kembali</button>
        <button className="omni-btn omni-btn-primary" onClick={submit} disabled={saving || lines.length === 0}>
          {saving ? "Menyimpan…" : "Buat PO"}
        </button>
      </div>

      {error && <div className="wms-msg err">{error}</div>}

      <div className="wms-panel">
        <div className="wms-panel-head"><div><div className="wms-panel-title">Keterangan PO</div></div></div>
        <div className="wms-edit-bar">
          <div className="omni-field" style={{ minWidth: 220 }}>
            <label>Supplier</label>
            <input className="omni-input" value={supplier} onChange={(e) => setSupplier(e.target.value)}
              placeholder="Nama supplier" />
          </div>
          <div className="omni-field" style={{ maxWidth: 190 }}>
            <label>Perkiraan tiba</label>
            <input className="omni-input" type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} />
          </div>
          <div className="omni-field" style={{ flex: 1, minWidth: 220 }}>
            <label>Catatan</label>
            <input className="omni-input" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="mis. nomor PO supplier, syarat kirim" />
          </div>
        </div>
      </div>

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title">Produk yang dipesan</div>
            <div className="wms-panel-sub">Diambil dari Kelola Produk — HPP-nya ikut terbawa otomatis.</div>
          </div>
          <div className="wms-panel-sub">Nilai PO: <strong>{rupiah(total)}</strong></div>
        </div>

        <div className="omni-field" style={{ maxWidth: 340, marginBottom: 12 }}>
          <label><Search size={11} style={{ verticalAlign: "-1px" }} /> Cari & tambahkan produk</label>
          <input className="omni-input" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Nama atau SKU master" />
        </div>

        {search.trim() && (
          <div className="wms-picker">
            {options.length === 0
              ? <div className="wms-kpi-note">Tidak ada produk yang cocok.</div>
              : options.map((p) => (
                  <button key={p.productId} type="button" className="wms-picker-row" onClick={() => add(p)}>
                    <span>
                      <span className="wms-prod-name">{p.name}</span>
                      <span className="wms-prod-sku">{p.sku} · Stok Fisik {p.onHand.toLocaleString("id-ID")}</span>
                    </span>
                    <Plus size={14} />
                  </button>
                ))}
          </div>
        )}

        {lines.length === 0 ? (
          <div className="wms-kpi-note">Belum ada produk dipilih.</div>
        ) : (
          <div className="omni-table-wrap" style={{ maxHeight: "none" }}>
            <table className="omni-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th style={{ width: 130 }}>Jumlah</th>
                  <th style={{ width: 160 }}>HPP satuan</th>
                  <th style={{ textAlign: "right", width: 130 }}>Subtotal</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.productId}>
                    <td>
                      <div className="wms-prod-name">{l.name}</div>
                      <div className="wms-prod-sku">{l.sku}</div>
                    </td>
                    <td>
                      <input className="omni-input" value={l.qty} inputMode="numeric"
                        onChange={(e) => patch(l.productId, "qty", e.target.value.replace(/[^\d]/g, ""))} />
                    </td>
                    <td>
                      <input className="omni-input" value={l.unitCost} inputMode="numeric"
                        onChange={(e) => patch(l.productId, "unitCost", e.target.value.replace(/[^\d]/g, ""))} />
                    </td>
                    <td className="wms-num strong">
                      {rupiah((Number(l.qty) || 0) * (Number(l.unitCost) || 0))}
                    </td>
                    <td>
                      <button className="wms-edit-btn" style={{ opacity: 1 }} onClick={() => remove(l.productId)} title="Hapus">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
