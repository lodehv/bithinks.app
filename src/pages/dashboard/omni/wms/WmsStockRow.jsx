import { useState } from "react";
import { Package, Pencil, Check, X, Plus, Minus, ClipboardCheck, PackagePlus } from "lucide-react";
import FulfillBar from "./WmsFulfillBar";
import { omniApi, isPaymentRequired } from "../../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// Satu baris tabel Produk & Stok. Acuan: dokumen "Cara Kerja Sistem Stok Gudang".
//
//   Stok Fisik        BISA diubah. Setiap perubahannya menggeser Stok Tersedia
//                     sama besar, supaya Stok Dialokasikan tidak ikut tergeser.
//   Stok Tersedia     TIDAK BISA diubah langsung — sengaja tanpa tombol pensil.
//                     Hanya scan resi & perubahan Stok Fisik yang menggerakkannya.
//   Stok Dialokasikan TURUNAN (Fisik − Tersedia), jadi juga tanpa tombol.
//   Cadangan          ambang peringatan menipis saja.
//   Akan Datang       TURUNAN sisa PO yang belum tiba — tanpa tombol ubah.
//                     Diklik untuk melihat PO mana saja yang menyumbangnya.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

const STATUS_LABEL = { aman: "Aman", menipis: "Menipis", habis: "Habis" };

const FIELDS = {
  fisik:    { label: "Stok Fisik" },
  cadangan: { label: "Cadangan", note: "Ambang peringatan menipis. Tidak mengurangi angka mana pun." },
};

const tglSingkat = (d) => (d ? new Date(d).toLocaleDateString("id-ID", {
  day: "2-digit", month: "short", timeZone: "Asia/Jakarta",
}) : "—");

/**
 * Tiga cara mengubah Stok Fisik, mengikuti §06 dokumen sistem stok. Dipisah
 * begini karena "barang datang 50" dan "sekarang totalnya 50" adalah dua hal
 * yang sangat berbeda — menyatukannya dalam satu kolom memaksa operator
 * menghitung di kepala, dan di situlah salah input paling sering terjadi.
 */
const FISIK_MODES = [
  {
    id: "tambah", label: "Barang Datang", icon: Plus, verb: "Jumlah yang datang",
    note: "Stok Fisik & Stok Tersedia sama-sama bertambah. Bila ada pesanan tertunggak (Tersedia minus), barang yang datang menutupnya lebih dulu, baru sisanya naik ke rak.",
  },
  {
    id: "kurangi", label: "Rusak / Susut", icon: Minus, verb: "Jumlah yang berkurang",
    note: "Stok Fisik & Stok Tersedia sama-sama berkurang, supaya Stok Dialokasikan tidak ikut tergeser. Stok Fisik tidak bisa turun di bawah 0.",
  },
  {
    id: "opname", label: "Hasil Hitung", icon: ClipboardCheck, verb: "Total hasil hitung fisik",
    note: "Isi TOTAL hasil hitungan di rak, bukan selisihnya. Sistem menghitung sendiri bedanya dengan angka sekarang.",
  },
];

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
  const [mode, setMode] = useState(null);        // fisik | cadangan | datang
  const [fisikMode, setFisikMode] = useState("tambah");
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editable = !locked;

  const current = { fisik: row.onHand, cadangan: row.safetyStock };
  const po = row.incomingOrders ?? [];

  const open = (which) => {
    setMode(which);
    setError("");
    setFisikMode("tambah");
    // Menambah barang selalu mulai dari kosong — mengisinya dengan stok sekarang
    // justru mengundang salah kirim "150" sebagai "tambah 150".
    setQty(which === "fisik" ? "" : String(current[which] ?? 0));
  };

  const close = () => { setMode(null); setError(""); };

  const save = async () => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 0) { setError("Isi angka bulat, minimal 0."); return; }

    setSaving(true);
    setError("");
    try {
      // Hasil simpan dikembalikan ke induk supaya barisnya bisa diperbarui DI
      // TEMPAT. Memuat ulang seluruh daftar akan mengurutkannya lagi, dan baris
      // yang baru saja diedit melompat entah ke mana — persis saat mata operator
      // masih tertuju ke situ.
      let updated = null;
      if (mode === "fisik") {
        const res = fisikMode === "opname"
          ? await omniApi.wmsAdjust({ productId: row.productId, countedQty: n, type: "opname" })
          : await omniApi.wmsAdjust({
              productId: row.productId,
              delta: fisikMode === "kurangi" ? -n : n,
              type: "koreksi",
            });
        updated = res?.detail?.product ?? null;
      } else {
        updated = (await omniApi.wmsPatchStock(row.productId, { safetyStock: n }))?.product ?? null;
      }
      close();
      onSaved(updated);
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

        {/* Tersedia & Dialokasikan sengaja TANPA tombol ubah — keduanya hanya
            boleh bergerak lewat scan resi atau perubahan Stok Fisik. */}
        <td className={`wms-num strong ${row.availableToSell < 0 ? "neg" : ""}`}>
          {num(row.availableToSell)}
        </td>
        <td className="wms-num">{num(row.allocated)}</td>

        <EditableCell value={row.safetyStock} editable={editable} onEdit={() => open("cadangan")} />

        {/* Turunan sisa PO — tanpa tombol ubah. Diklik untuk melihat asalnya. */}
        <td className="wms-num">
          {po.length === 0 ? (
            <span className="omni-cell-muted">—</span>
          ) : (
            <button
              type="button"
              className="wms-incoming"
              onClick={(e) => { e.stopPropagation(); setMode(mode === "po" ? null : "po"); }}
              title={`${po.length} PO belum tuntas`}
            >
              <span className="wms-incoming-qty">+{num(row.incoming)}</span>
              <FulfillBar ordered={row.incomingOrdered} received={row.incomingReceived} />
            </button>
          )}
        </td>

        <td><span className={`wms-chip ${row.status}`}>{STATUS_LABEL[row.status]}</span></td>
      </tr>

      {mode && (
        <tr className="wms-edit-row" onClick={(e) => e.stopPropagation()}>
          <td colSpan={7}>
            {mode === "po" ? (
              <div>
                <div className="wms-ledger-detail-label" style={{ marginBottom: 10 }}>
                  {po.length} PO belum tuntas · {num(row.incoming)} unit belum tiba
                </div>
                <div className="wms-po-list">
                  {po.map((o) => (
                    <div className="wms-po-row" key={o.id}>
                      <span className="ico"><PackagePlus size={14} /></span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="wms-prod-name">{o.code}</div>
                        <div className="wms-prod-sku">
                          {o.supplier || "Tanpa supplier"} · perkiraan tiba {tglSingkat(o.expectedAt)}
                        </div>
                      </div>
                      <div className="wms-po-qty">
                        <strong>{num(o.qtyReceived)}</strong> dari {num(o.qtyOrdered)} tiba
                        <div className="wms-prod-sku">sisa {num(o.sisa)}</div>
                      </div>
                      <div style={{ minWidth: 130 }}>
                        <FulfillBar ordered={o.qtyOrdered} received={o.qtyReceived} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="wms-edit-note">
                  Angka ini turunan sisa PO — tidak bisa diketik langsung. Ia berkurang sendiri
                  saat barang diterima di tab Barang Masuk.
                </div>
              </div>
            ) : null}

            {mode === "fisik" && (
              <div className="wms-sub level3" style={{ marginBottom: 12 }}>
                {FISIK_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={fisikMode === m.id ? "active" : ""}
                    onClick={() => { setFisikMode(m.id); setQty(""); setError(""); }}
                  >
                    <m.icon size={13} /> {m.label}
                  </button>
                ))}
              </div>
            )}

            {mode !== "po" && (
            <div className="wms-edit-bar">
              <div className="omni-field" style={{ maxWidth: 190 }}>
                <label>
                  {mode === "fisik"
                    ? FISIK_MODES.find((m) => m.id === fisikMode)?.verb
                    : FIELDS[mode].label}
                </label>
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
                {mode === "fisik" ? (
                  <>
                    Sekarang Fisik <strong>{num(row.onHand)}</strong> · Tersedia{" "}
                    <strong>{num(row.availableToSell)}</strong> · Dialokasikan{" "}
                    <strong>{num(row.allocated)}</strong>.{" "}
                    {FISIK_MODES.find((m) => m.id === fisikMode)?.note}
                  </>
                ) : (
                  <>Sekarang {num(current[mode])}. {FIELDS[mode].note}</>
                )}
              </div>
            </div>
            )}

            {error && <div className="wms-msg err" style={{ marginTop: 10 }}>{error}</div>}
          </td>
        </tr>
      )}
    </>
  );
}
