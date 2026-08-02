import { useState } from "react";
import { Package, Pencil, Check, X } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// Satu baris tabel Produk & Stok, dengan ubah-cepat di tempat pada keempat
// kolom angka. Yang terjadi di belakang layar berbeda-beda, karena sifat tiap
// angka memang berbeda:
//
//   Stok Fisik  → barang nyata bertambah/berkurang. Dicatat sebagai mutasi
//                 "Koreksi Manual" di Buku Besar; angka lama tidak ditimpa.
//   Tersedia    → angka TURUNAN (fisik − terkunci − cadangan). Mengubahnya
//                 berarti menggeser stok fisiknya. Server yang membalik rumus
//                 itu — frontend tidak menghitung saldo sendiri.
//   Cadangan    → setelan, bukan pergerakan barang. Tidak masuk Buku Besar.
//   Akan Datang → barang yang dipesan tapi belum tiba, jadi juga bukan
//                 pergerakan. Tidak menambah Stok Fisik sampai barang diterima.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

const STATUS_LABEL = { aman: "Aman", menipis: "Menipis", habis: "Habis" };

const FIELDS = {
  fisik:    { label: "Stok Fisik", note: "Perubahan barang nyata — tercatat sebagai Koreksi Manual di Buku Besar." },
  tersedia: { label: "Tersedia", note: "Tersedia = Stok Fisik − Terkunci − Cadangan, jadi menyetelnya akan menggeser Stok Fisik." },
  cadangan: { label: "Cadangan", note: "Cadangan menahan sebagian stok agar tidak ikut terjual. Stok Fisik tidak berubah." },
  datang:   { label: "Stok Akan Datang", note: "Barang yang dipesan tapi belum tiba. Belum menambah Stok Fisik." },
};

/** Sel angka + pensil yang muncul saat baris disentuh mouse. */
function EditableCell({ value, onEdit, editable, className = "", render }) {
  return (
    <td className={`wms-num ${className}`}>
      <span className="wms-cell-edit">
        {render ? render() : <span>{num(value)}</span>}
        {editable && (
          <button
            type="button"
            className="wms-edit-btn"
            title="Ubah"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Pencil size={12} />
          </button>
        )}
      </span>
    </td>
  );
}

export default function WmsStockRow({ row, onOpen, locked, onRequirePayment, onSaved }) {
  const [mode, setMode] = useState(null);   // fisik | tersedia | cadangan | datang
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editable = !locked;

  const current = {
    fisik: row.onHand,
    tersedia: row.availableToSell,
    cadangan: row.safetyStock,
    datang: row.incoming,
  };

  const open = (which) => {
    setMode(which);
    setError("");
    setQty(String(current[which] ?? 0));
  };

  const close = () => { setMode(null); setError(""); };

  const save = async () => {
    const n = Number(qty);
    if (!Number.isInteger(n)) { setError("Isi angka bulat."); return; }
    if (mode !== "tersedia" && n < 0) { setError("Angka tidak boleh minus."); return; }

    setSaving(true);
    setError("");
    try {
      if (mode === "fisik") {
        await omniApi.wmsAdjust({ productId: row.productId, countedQty: n, type: "koreksi" });
      } else if (mode === "tersedia") {
        await omniApi.wmsAdjust({ productId: row.productId, availableQty: n, type: "koreksi" });
      } else if (mode === "cadangan") {
        await omniApi.wmsPatchStock(row.productId, { safetyStock: n });
      } else {
        await omniApi.wmsPatchStock(row.productId, { incoming: n });
      }
      close();
      onSaved();
    } catch (err) {
      if (isPaymentRequired(err)) { onRequirePayment?.(); return; }
      setError(err?.response?.data?.error?.message ?? "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const keys = (e) => { if (e.key === "Enter") save(); if (e.key === "Escape") close(); };

  return (
    <>
      <tr className="wms-row-clickable" onClick={() => onOpen(row.productId)}>
        <td>
          <div className="wms-prod">
            {row.imageUrl
              ? <img src={row.imageUrl} alt="" />
              : <div className="ph"><Package size={15} /></div>}
            <div style={{ minWidth: 0 }}>
              <div className="wms-prod-name">{row.name}</div>
              <div className="wms-prod-sku">{row.sku}{row.category ? ` · ${row.category}` : ""}</div>
            </div>
          </div>
        </td>

        <EditableCell value={row.onHand} editable={editable} onEdit={() => open("fisik")} />

        <EditableCell
          value={row.availableToSell}
          editable={editable}
          onEdit={() => open("tersedia")}
          className={`strong ${row.availableToSell < 0 ? "neg" : ""}`}
        />

        <EditableCell value={row.safetyStock} editable={editable} onEdit={() => open("cadangan")} />

        <EditableCell
          value={row.incoming}
          editable={editable}
          onEdit={() => open("datang")}
          render={() => (row.incoming > 0
            ? <span className="wms-chip info">+{num(row.incoming)}</span>
            : <span className="omni-cell-muted">—</span>)}
        />

        <td><span className={`wms-chip ${row.status}`}>{STATUS_LABEL[row.status]}</span></td>
      </tr>

      {mode && (
        <tr className="wms-edit-row" onClick={(e) => e.stopPropagation()}>
          <td colSpan={6}>
            <div className="wms-edit-bar">
              <div className="omni-field" style={{ maxWidth: 170 }}>
                <label>{FIELDS[mode].label}</label>
                <input
                  className="omni-input"
                  value={qty}
                  autoFocus
                  onChange={(e) => setQty(e.target.value.replace(/[^\d-]/g, ""))}
                  onKeyDown={keys}
                />
              </div>
              <button className="omni-btn omni-btn-primary" disabled={saving} onClick={save}>
                <Check size={13} /> {saving ? "Menyimpan…" : "Simpan"}
              </button>
              <button className="omni-btn omni-btn-ghost" disabled={saving} onClick={close}>
                <X size={13} /> Batal
              </button>
              <div className="wms-edit-note">
                Sekarang {num(current[mode])}. {FIELDS[mode].note}
              </div>
            </div>

            {error && <div className="wms-msg err" style={{ marginTop: 10 }}>{error}</div>}
          </td>
        </tr>
      )}
    </>
  );
}
