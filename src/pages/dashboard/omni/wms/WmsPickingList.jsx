import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { ArrowLeft, Printer } from "lucide-react";
import { formatDateTime, WIB } from "../../../../utils/datetime";

// ─────────────────────────────────────────────────────────────────────────────
// Lembar Picking List — daftar ambil barang + barcode sesi.
//
// PDF-nya lewat dialog cetak browser ("Simpan sebagai PDF") alih-alih pustaka
// pembuat PDF. Dua alasan: hasilnya PDF sungguhan tanpa menambah dependensi,
// dan operator gudang tetap bisa langsung mencetak ke printer tanpa lewat
// berkas — yang justru lebih sering dipakai di lapangan.
//
// Barcode memakai Code128 lewat JsBarcode. Encoding Code128 punya checksum, dan
// barcode yang salah hitung baru ketahuan saat gagal dipindai di gudang — bukan
// tempat yang tepat untuk mengandalkan kode buatan sendiri.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

export default function WmsPickingList({ session, onBack }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (!barcodeRef.current || !session?.code) return;
    JsBarcode(barcodeRef.current, session.code, {
      format: "CODE128",
      width: 2,
      height: 64,
      displayValue: true,
      fontSize: 14,
      margin: 0,
    });
  }, [session?.code]);

  if (!session) return null;

  const totalUnit = session.items.reduce((s, i) => s + i.qty, 0);
  const tanggal = formatDateTime(session.createdAt, { month: "long", year: "always", timeZone: WIB });

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

      <div className="wms-sheet">
        <div className="wms-sheet-head">
          <div>
            <div className="wms-sheet-title">PICKING LIST</div>
            <div className="wms-sheet-meta">{session.code}</div>
            <div className="wms-sheet-meta">Dibuat {tanggal}</div>
            <div className="wms-sheet-meta">
              {num(session.scans?.length ?? 0)} resi · {num(session.items.length)} produk · {num(totalUnit)} unit
            </div>
          </div>
          <div className="wms-sheet-barcode">
            <svg ref={barcodeRef} />
          </div>
        </div>

        <table className="wms-sheet-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Produk</th>
              <th>SKU</th>
              <th style={{ textAlign: "right", width: 90 }}>Qty</th>
              <th style={{ width: 70 }}>Ambil</th>
            </tr>
          </thead>
          <tbody>
            {session.items.map((i, idx) => (
              <tr key={i.productId}>
                <td>{idx + 1}</td>
                <td><strong>{i.name}</strong></td>
                <td>{i.sku}</td>
                <td style={{ textAlign: "right" }}>
                  <strong>{num(i.qty)}</strong>{i.unit ? ` ${i.unit}` : ""}
                </td>
                <td><span className="wms-sheet-box" /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="wms-sheet-foot">
          Pindai barcode di atas pada tab <strong>Pengurangan Stok Fisik</strong> setelah semua barang
          diambil. Satu lembar hanya bisa dipindai sekali.
        </div>
      </div>
    </div>
  );
}
