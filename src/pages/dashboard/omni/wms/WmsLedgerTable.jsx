import { useState } from "react";
import { ScanLine, ClipboardList, UserRound, Cog, ChevronDown } from "lucide-react";
import { TYPE_LABEL } from "./ledgerTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Baris Buku Besar Stok — log aktivitas pergerakan barang.
//
// Tiap baris menjawab tiga hal sekaligus, karena angka tanpa sebab tidak bisa
// ditindaklanjuti oleh siapa pun:
//   1. BERAPA  — ketiga angka bergerak berdampingan (Fisik · Tersedia · Alokasi)
//   2. KENAPA  — scan resi, scan picking list, atau input manual
//   3. SIAPA   — nama orang yang melakukannya, atau "Otomatis" bila dari sistem
//
// Rincian panjang (nomor resi, kode picking list, alasan) disembunyikan sampai
// barisnya dibuka: 200 baris yang semuanya bersuara sama kerasnya justru membuat
// yang penting tenggelam.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

/** ±n dengan tanda eksplisit; nol ditulis "—" agar mata melewatinya. */
function Delta({ value }) {
  if (!value) return <span className="omni-cell-muted">—</span>;
  return (
    <span className={`wms-delta ${value > 0 ? "plus" : "minus"}`}>
      {value > 0 ? "+" : ""}{num(value)}
    </span>
  );
}

/** Sumber perubahan — inti dari layar ini. */
function Cause({ row }) {
  if (row.trackingNumber) {
    return (
      <span className="wms-cause">
        <ScanLine size={13} className="ico" />
        <span>
          <strong>Scan resi</strong> {row.trackingNumber}
          {row.refLabel ? <span className="wms-cause-sub">Pesanan {row.refLabel}</span> : null}
        </span>
      </span>
    );
  }
  if (row.sessionCode) {
    return (
      <span className="wms-cause">
        <ClipboardList size={13} className="ico" />
        <span>
          <strong>Scan picking list</strong> {row.sessionCode}
        </span>
      </span>
    );
  }
  if (row.actorName) {
    return (
      <span className="wms-cause">
        <UserRound size={13} className="ico" />
        <span>
          <strong>Input manual</strong>
          <span className="wms-cause-sub">oleh {row.actorName}</span>
        </span>
      </span>
    );
  }
  return (
    <span className="wms-cause">
      <Cog size={13} className="ico" />
      <span><strong>Otomatis</strong><span className="wms-cause-sub">dari proses sistem</span></span>
    </span>
  );
}

export default function WmsLedgerTable({ rows, onOpenSession }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="omni-table-wrap">
      <table className="omni-table">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Produk</th>
            <th>Tipe</th>
            <th style={{ textAlign: "right" }}>Fisik</th>
            <th style={{ textAlign: "right" }}>Tersedia</th>
            <th style={{ textAlign: "right" }}>Dialokasikan</th>
            <th>Penyebab</th>
            <th style={{ width: 34 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const open = openId === r.id;
            // Dialokasikan bergerak sebagai akibat, bukan sebab: Fisik − Tersedia.
            const allocDelta = r.onHandDelta - r.availableDelta;
            return (
              <Row
                key={r.id}
                row={r}
                open={open}
                allocDelta={allocDelta}
                onToggle={() => setOpenId(open ? null : r.id)}
                onOpenSession={onOpenSession}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Row({ row: r, open, allocDelta, onToggle, onOpenSession }) {
  return (
    <>
      <tr className="wms-row-clickable" onClick={onToggle}>
        <td className="omni-cell-muted" style={{ whiteSpace: "nowrap" }}>
          {new Date(r.occurredAt).toLocaleString("id-ID", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
          })}
        </td>
        <td>
          <div className="wms-prod-name">{r.productName}</div>
          <div className="wms-prod-sku">{r.productSku}</div>
        </td>
        <td><span className={`wms-type ${r.type}`}>{r.typeLabel ?? TYPE_LABEL[r.type] ?? r.type}</span></td>
        <td className="wms-num"><Delta value={r.onHandDelta} /></td>
        <td className="wms-num"><Delta value={r.availableDelta} /></td>
        <td className="wms-num"><Delta value={allocDelta} /></td>
        <td><Cause row={r} /></td>
        <td className="wms-num">
          <ChevronDown size={14} className={`wms-chevron ${open ? "open" : ""}`} />
        </td>
      </tr>

      {open && (
        <tr className="wms-edit-row" onClick={(e) => e.stopPropagation()}>
          <td colSpan={8}>
            <div className="wms-ledger-detail">
              <div>
                <div className="wms-ledger-detail-label">Saldo sesudah mutasi ini</div>
                <div className="wms-formula" style={{ marginTop: 6 }}>
                  Stok Fisik <b>{num(r.onHandAfter)}</b>
                  <span className="eq">=</span> Tersedia <b>{num(r.availableAfter)}</b>
                  <span className="eq">+</span> Dialokasikan <span className="res">{num(r.allocatedAfter)}</span>
                </div>
              </div>

              <div className="wms-ledger-detail-grid">
                <Fact label="Penyebab" value={r.reason || "—"} />
                <Fact label="Oleh" value={r.actorName || "Otomatis (proses sistem)"} />
                {r.trackingNumber && <Fact label="Nomor resi" value={r.trackingNumber} mono />}
                {r.refLabel && <Fact label="Nomor pesanan" value={r.refLabel} mono />}
                {r.channel && <Fact label="Channel" value={r.channel} />}
                {r.sessionCode && <Fact label="Picking list" value={r.sessionCode} mono />}
              </div>

              {r.sessionId && onOpenSession && (
                <button
                  className="omni-btn omni-btn-ghost"
                  onClick={() => onOpenSession(r.sessionId)}
                >
                  <ClipboardList size={13} /> Lihat lembar picking list
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Fact({ label, value, mono }) {
  return (
    <div>
      <div className="wms-ledger-detail-label">{label}</div>
      <div className={`wms-ledger-detail-value ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}
