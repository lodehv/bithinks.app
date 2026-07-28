import { BookOpen } from "lucide-react";
import { TYPE_LABEL } from "./ledgerTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Tabel Buku Besar Stok — dipakai layar Buku Besar dan mini-ledger Detail Produk.
// Append-only: tidak ada aksi edit/hapus di sini, dan itu memang disengaja.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

const waktu = (iso) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

/** Tampilkan ± dengan tanda eksplisit; 0 ditulis "—" agar mata tak tertipu. */
function Delta({ value }) {
  if (!value) return <span className="omni-cell-muted">—</span>;
  return (
    <span className={`wms-delta ${value > 0 ? "plus" : "minus"}`}>
      {value > 0 ? "+" : ""}{num(value)}
    </span>
  );
}

export default function WmsLedgerTable({ rows, compact = false }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="omni-empty" style={{ padding: compact ? "28px 20px" : "56px 20px" }}>
        <div className="omni-empty-icon"><BookOpen size={compact ? 18 : 22} /></div>
        <h3>Belum ada mutasi stok</h3>
        <p>
          Mutasi tercatat otomatis saat pesanan masuk, dikirim, atau diretur — dan saat Anda
          mencatat penyesuaian hasil opname.
        </p>
      </div>
    );
  }

  return (
    <div className="omni-table-wrap">
      <table className="omni-table">
        <thead>
          <tr>
            <th>Waktu</th>
            {!compact && <th>Produk</th>}
            <th>Tipe</th>
            <th style={{ textAlign: "right" }}>Fisik ±</th>
            <th style={{ textAlign: "right" }}>Terkunci ±</th>
            <th style={{ textAlign: "right" }}>Saldo Fisik</th>
            <th>Referensi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="omni-cell-muted" style={{ whiteSpace: "nowrap" }}>{waktu(r.occurredAt)}</td>
              {!compact && (
                <td>
                  <div className="wms-prod-name">{r.productName}</div>
                  <div className="wms-prod-sku">{r.productSku}</div>
                </td>
              )}
              <td><span className={`wms-type ${r.type}`}>{TYPE_LABEL[r.type] ?? r.type}</span></td>
              <td className="wms-num"><Delta value={r.onHandDelta} /></td>
              <td className="wms-num"><Delta value={r.allocatedDelta} /></td>
              <td className="wms-num strong">{num(r.onHandAfter)}</td>
              <td>
                <div className="wms-prod-name" style={{ fontWeight: 500 }}>
                  {r.refLabel ?? (r.reason ? r.reason : "—")}
                </div>
                <div className="wms-prod-sku">
                  {[r.channel, r.refLabel && r.reason ? r.reason : null].filter(Boolean).join(" · ") || "—"}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
