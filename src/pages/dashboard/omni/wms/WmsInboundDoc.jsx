import { ArrowLeft, Printer, Building2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Dokumen Purchase Order siap cetak.
//
// Kop suratnya memakai identitas PERUSAHAAN PELANGGAN, bukan penyedia aplikasi:
// surat ini dikirim ke supplier atas nama mereka. Kalau profil perusahaan belum
// diisi, ditampilkan ajakan mengisinya — bukan diam-diam memakai nama bawaan,
// karena PO tanpa identitas yang benar tidak layak dikirim ke pihak luar.
//
// PDF-nya lewat dialog cetak browser, sama seperti picking list: hasilnya PDF
// sungguhan tanpa dependensi, dan bisa langsung dicetak ke kertas.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");
const rupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");
const tgl = (d) => (d ? new Date(d).toLocaleDateString("id-ID", {
  day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
}) : "—");

export default function WmsInboundDoc({ po, onBack }) {
  const c = po.company ?? {};
  const lengkap = !!(c.name && c.address);

  return (
    <div>
      <div className="omni-toolbar wms-noprint">
        <button className="omni-btn omni-btn-ghost" onClick={onBack}>
          <ArrowLeft size={14} /> Kembali
        </button>
        <button className="omni-btn omni-btn-primary" onClick={() => window.print()}>
          <Printer size={14} /> Cetak / Simpan PDF
        </button>
      </div>

      {!lengkap && (
        <div className="wms-note wms-noprint" style={{ marginBottom: 14 }}>
          <Building2 size={13} style={{ verticalAlign: "-2px" }} />{" "}
          <strong>Kop surat belum lengkap.</strong> Isi nama dan alamat perusahaan di tombol
          <strong> Kop Surat</strong> supaya PO ini layak dikirim ke supplier.
        </div>
      )}

      <div className="wms-sheet">
        <div className="wms-sheet-head">
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {c.logo && <img src={c.logo} alt="" className="wms-sheet-logo" />}
            <div>
              <div className="wms-sheet-company">{c.name || "— nama perusahaan belum diisi —"}</div>
              {c.address && <div className="wms-sheet-meta">{c.address}</div>}
              {(c.phone || c.email) && (
                <div className="wms-sheet-meta">{[c.phone, c.email].filter(Boolean).join(" · ")}</div>
              )}
              {c.taxId && <div className="wms-sheet-meta">NPWP {c.taxId}</div>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="wms-sheet-title">PURCHASE ORDER</div>
            <div className="wms-sheet-meta">{po.code}</div>
            <div className="wms-sheet-meta">Dibuat {tgl(po.createdAt)}</div>
          </div>
        </div>

        <div className="wms-doc-grid">
          <div>
            <div className="wms-ledger-detail-label">Kepada</div>
            <div className="wms-ledger-detail-value">{po.supplier || "—"}</div>
          </div>
          <div>
            <div className="wms-ledger-detail-label">Perkiraan tiba</div>
            <div className="wms-ledger-detail-value">{tgl(po.expectedAt)}</div>
          </div>
          {po.note && (
            <div>
              <div className="wms-ledger-detail-label">Catatan</div>
              <div className="wms-ledger-detail-value">{po.note}</div>
            </div>
          )}
        </div>

        <table className="wms-sheet-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Produk</th>
              <th>SKU</th>
              <th style={{ textAlign: "right", width: 90 }}>Jumlah</th>
              <th style={{ textAlign: "right", width: 120 }}>Harga satuan</th>
              <th style={{ textAlign: "right", width: 130 }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((i, idx) => (
              <tr key={i.id}>
                <td>{idx + 1}</td>
                <td><strong>{i.name}</strong></td>
                <td>{i.sku}</td>
                <td style={{ textAlign: "right" }}>
                  <strong>{num(i.qtyOrdered)}</strong>{i.unit ? ` ${i.unit}` : ""}
                </td>
                <td style={{ textAlign: "right" }}>
                  {i.unitCost === null ? "—" : rupiah(i.unitCost)}
                </td>
                <td style={{ textAlign: "right" }}>
                  <strong>{i.unitCost === null ? "—" : rupiah(i.unitCost * i.qtyOrdered)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ textAlign: "right", fontWeight: 700 }}>Total</td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>{rupiah(po.nilai)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="wms-doc-sign">
          <div>
            <div className="wms-ledger-detail-label">Dipesan oleh</div>
            <div className="wms-doc-sign-line" />
            <div className="wms-sheet-meta">{c.name || ""}</div>
          </div>
          <div>
            <div className="wms-ledger-detail-label">Diterima supplier</div>
            <div className="wms-doc-sign-line" />
            <div className="wms-sheet-meta">{po.supplier || ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
