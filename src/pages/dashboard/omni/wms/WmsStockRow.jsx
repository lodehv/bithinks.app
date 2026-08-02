import { useState } from "react";
import { Package, Pencil, Check, X } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// Satu baris pada tabel Produk & Stok, lengkap dengan ubah-cepat di tempat.
//
// Yang bisa diubah langsung dari sini hanya DUA kolom, dan itu disengaja:
//
//   Stok Fisik → jumlah barang nyata. Perubahannya TIDAK menimpa angka lama,
//                melainkan dicatat sebagai mutasi "Koreksi Manual" beralasan di
//                Buku Besar. Karena itu kolom alasan wajib diisi.
//   Cadangan   → sekadar setelan, bukan pergerakan barang, jadi tidak masuk
//                Buku Besar dan tidak perlu alasan.
//
// Tersedia dan Stok Akan Datang sengaja TIDAK bisa diubah: keduanya angka
// TURUNAN. "Tersedia" adalah hasil hitungan Fisik − Terkunci − Cadangan, dan
// "Akan Datang" berasal dari penerimaan barang. Menyediakan tombol ubah di situ
// berarti mengizinkan hasil hitungan diubah lepas dari bahan hitungnya — saldo
// jadi tak bisa dipertanggungjawabkan, persis masalah yang mau dihindari WMS.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

const STATUS_LABEL = { aman: "Aman", menipis: "Menipis", habis: "Habis" };

/** Sel angka + tombol pensil yang muncul saat baris disentuh mouse. */
function EditableCell({ value, onEdit, editable, className = "" }) {
  return (
    <td className={`wms-num ${className}`}>
      <span className="wms-cell-edit">
        <span>{num(value)}</span>
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
  const [mode, setMode] = useState(null);      // 'fisik' | 'cadangan' | null
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editable = !locked;

  const open = (which) => {
    setMode(which);
    setError("");
    setReason("");
    setQty(String(which === "fisik" ? row.onHand : row.safetyStock));
  };

  const close = () => { setMode(null); setError(""); };

  const save = async () => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 0) { setError("Isi angka bulat, minimal 0."); return; }
    if (mode === "fisik" && reason.trim().length < 3) {
      setError("Alasan wajib diisi — inilah yang menjelaskan perubahan stok di Buku Besar.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (mode === "fisik") {
        await omniApi.wmsAdjust({
          productId: row.productId,
          countedQty: n,
          type: "koreksi",
          reason: reason.trim(),
        });
      } else {
        await omniApi.wmsSetSafetyStock(row.productId, { safetyStock: n });
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

        <td className={`wms-num strong ${row.availableToSell < 0 ? "neg" : ""}`}>
          {num(row.availableToSell)}
        </td>

        <EditableCell value={row.safetyStock} editable={editable} onEdit={() => open("cadangan")} />

        <td className="wms-num">
          {row.incoming > 0
            ? <span className="wms-chip info">+{num(row.incoming)}</span>
            : <span className="omni-cell-muted">—</span>}
        </td>

        <td><span className={`wms-chip ${row.status}`}>{STATUS_LABEL[row.status]}</span></td>
      </tr>

      {mode && (
        <tr className="wms-edit-row" onClick={(e) => e.stopPropagation()}>
          <td colSpan={6}>
            <div className="wms-edit-bar">
              <div className="omni-field" style={{ maxWidth: 150 }}>
                <label>{mode === "fisik" ? "Stok fisik sebenarnya" : "Cadangan"}</label>
                <input
                  className="omni-input"
                  value={qty}
                  autoFocus
                  onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))}
                  onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") close(); }}
                />
              </div>

              {mode === "fisik" && (
                <div className="omni-field" style={{ flex: 1, minWidth: 220 }}>
                  <label>Alasan perubahan (wajib)</label>
                  <input
                    className="omni-input"
                    placeholder="rusak / hilang / salah hitung / restok"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") close(); }}
                  />
                </div>
              )}

              <button className="omni-btn omni-btn-primary" disabled={saving} onClick={save}>
                <Check size={13} /> {saving ? "Menyimpan…" : "Simpan"}
              </button>
              <button className="omni-btn omni-btn-ghost" disabled={saving} onClick={close}>
                <X size={13} /> Batal
              </button>
            </div>

            <div className="wms-edit-note">
              {mode === "fisik"
                ? `Sistem mencatat ${num(row.onHand)} → perubahannya disimpan sebagai mutasi Koreksi Manual di Buku Besar, bukan menimpa angka lama.`
                : "Cadangan tidak mengurangi stok fisik — ia hanya menahan sebagian agar tidak ikut terjual."}
            </div>

            {error && <div className="wms-msg err" style={{ marginTop: 10 }}>{error}</div>}
          </td>
        </tr>
      )}
    </>
  );
}
