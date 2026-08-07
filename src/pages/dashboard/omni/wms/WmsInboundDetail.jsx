import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Printer, PackageCheck } from "lucide-react";
import { omniApi } from "../../../../utils/omniApi";
import FulfillBar from "./WmsFulfillBar";
import WmsInboundDoc from "./WmsInboundDoc";

// ─────────────────────────────────────────────────────────────────────────────
// Detail PO + pencatatan penerimaan.
//
// Kolom "Terima sekarang" sengaja mulai KOSONG, tidak diisi sisa otomatis:
// mengisinya membuat satu tekan "Simpan" tanpa sengaja bisa menyatakan seluruh
// sisa sudah tiba. Penerimaan sebagian didukung — sisanya tetap tercatat sebagai
// Stok Akan Datang sampai benar-benar datang.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");
const rupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");
const tgl = (d) => (d ? new Date(d).toLocaleDateString("id-ID", {
  day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
}) : "—");

export default function WmsInboundDetail({ inboundId, locked, onBack, onError }) {
  const [po, setPo] = useState(null);
  const [qty, setQty] = useState({});        // itemId → string
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [printing, setPrinting] = useState(false);

  const load = useCallback(
    () => omniApi.wmsInboundDetail(inboundId).then(setPo).catch(() => setPo(false)),
    [inboundId],
  );
  useEffect(() => { load(); }, [load]);

  const receive = async () => {
    const receipts = Object.entries(qty)
      .map(([itemId, v]) => ({ itemId, qty: Number(v) || 0 }))
      .filter((r) => r.qty > 0);
    if (receipts.length === 0) {
      setMsg({ type: "err", text: "Isi jumlah yang diterima pada minimal satu baris." });
      return;
    }

    setSaving(true); setMsg(null);
    try {
      const res = await omniApi.wmsInboundReceive(inboundId, receipts);
      setQty({});
      if (res.po) setPo(res.po);
      setMsg({ type: res.ok ? "ok" : "err", text: res.message });
    } catch (err) {
      if (onError?.(err)) return;
      setMsg({ type: "err", text: err?.response?.data?.error?.message ?? "Gagal mencatat penerimaan." });
    } finally { setSaving(false); }
  };

  if (po === null) return <div className="omni-loading">Memuat PO…</div>;
  if (po === false) return <div className="omni-inline-msg">Gagal memuat PO.</div>;
  if (printing) return <WmsInboundDoc po={po} onBack={() => setPrinting(false)} />;

  const selesai = po.status === "selesai" || po.status === "batal";

  return (
    <div>
      <div className="omni-toolbar">
        <button className="omni-btn omni-btn-ghost" onClick={onBack}><ArrowLeft size={14} /> Kembali</button>
        <button className="omni-btn omni-btn-ghost" onClick={() => setPrinting(true)}>
          <Printer size={14} /> Cetak PO
        </button>
      </div>

      {msg && <div className={`wms-msg ${msg.type}`}>{msg.text}</div>}

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title">{po.code}</div>
            <div className="wms-panel-sub">
              {po.supplier || "Tanpa supplier"} · perkiraan tiba {tgl(po.expectedAt)}
              {po.note ? ` · ${po.note}` : ""}
            </div>
          </div>
          <div style={{ minWidth: 190 }}>
            <FulfillBar ordered={po.dipesan} received={po.diterima} />
            <div className="wms-panel-sub" style={{ marginTop: 4 }}>
              {num(po.diterima)} dari {num(po.dipesan)} unit tiba · nilai {rupiah(po.nilai)}
            </div>
          </div>
        </div>

        <div className="omni-table-wrap" style={{ maxHeight: "none" }}>
          <table className="omni-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th style={{ textAlign: "right" }}>Dipesan</th>
                <th style={{ textAlign: "right" }}>Sudah tiba</th>
                <th style={{ textAlign: "right" }}>Sisa</th>
                <th style={{ width: 150 }}>Terima sekarang</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="wms-prod-name">{i.name}</div>
                    <div className="wms-prod-sku">
                      {i.sku}{i.unitCost !== null ? ` · HPP ${rupiah(i.unitCost)}` : ""}
                    </div>
                  </td>
                  <td className="wms-num">{num(i.qtyOrdered)}{i.unit ? ` ${i.unit}` : ""}</td>
                  <td className="wms-num strong">{num(i.qtyReceived)}</td>
                  <td className="wms-num">
                    {i.sisa > 0
                      ? <span className="wms-chip menipis">{num(i.sisa)}</span>
                      : <span className="wms-chip aman">Lengkap</span>}
                  </td>
                  <td>
                    {i.sisa > 0 && !selesai && !locked ? (
                      <input
                        className="omni-input"
                        inputMode="numeric"
                        placeholder={`maks ${num(i.sisa)}`}
                        value={qty[i.id] ?? ""}
                        onChange={(e) => setQty((q) => ({ ...q, [i.id]: e.target.value.replace(/[^\d]/g, "") }))}
                      />
                    ) : <span className="omni-cell-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!selesai && !locked && (
          <div className="wms-edit-bar" style={{ marginTop: 14 }}>
            <button className="omni-btn omni-btn-primary" onClick={receive} disabled={saving}>
              <PackageCheck size={14} /> {saving ? "Menyimpan…" : "Catat Penerimaan"}
            </button>
            <div className="wms-edit-note">
              Yang diterima langsung menambah Stok Fisik. Bila Stok Tersedia sedang minus, barang
              yang masuk menutup pesanan tertunggak lebih dulu, baru sisanya naik ke rak.
            </div>
          </div>
        )}

        {selesai && (
          <div className="wms-note" style={{ marginTop: 14 }}>
            PO ini sudah {po.status === "batal" ? "dibatalkan" : "lengkap diterima"} — tidak bisa
            menerima lagi. Kelebihan kiriman dicatat lewat <strong>Barang Datang</strong> di tab
            Produk &amp; Stok agar sisa PO tetap punya arti.
          </div>
        )}
      </div>
    </div>
  );
}
