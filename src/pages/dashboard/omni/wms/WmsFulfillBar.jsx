// ─────────────────────────────────────────────────────────────────────────────
// Bar pemenuhan PO — sepintas terlihat berapa bagian pesanan yang sudah tiba.
//
// Berkas tersendiri, bukan diekspor dari WmsInbound: layar daftar PO, detail PO,
// dan tabel stok sama-sama memakainya. Kalau ia tinggal di salah satu layar,
// layar itu saling mengimpor dengan yang lain (melingkar) dan komponennya bisa
// bernilai undefined saat runtime — build tetap lolos, rusaknya baru di layar.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

export default function FulfillBar({ ordered, received }) {
  const pct = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
  const penuh = ordered > 0 && received >= ordered;
  return (
    <div className="wms-bar-wrap" title={`${num(received)} dari ${num(ordered)} sudah tiba`}>
      <div className={`wms-bar-track ${penuh ? "penuh" : ""}`}>
        <div className="wms-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="wms-bar-text">{penuh ? "Terpenuhi" : `${pct}%`}</span>
    </div>
  );
}
