import { useState, useEffect } from "react";
import { Camera, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import "./RiwayatKehadiran.css";
import api from "../../../utils/api";

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function calcDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const diff = (new Date(checkOut) - new Date(checkIn)) / 60000; // menit
  const h = Math.floor(diff / 60);
  const m = Math.round(diff % 60);
  return `${h}j ${m}m`;
}

function statusOf(row) {
  if (!row.checkIn) return "alpha";
  const h = new Date(row.checkIn).getHours();
  if (h >= 9) return "telat";
  return "hadir";
}

const STATUS_LABEL = { hadir: "Hadir", telat: "Terlambat", alpha: "Alpha", izin: "Izin" };
const STATUS_ICON  = {
  hadir: <CheckCircle size={11} strokeWidth={2} />,
  telat: <AlertCircle size={11} strokeWidth={2} />,
  alpha: <XCircle size={11} strokeWidth={2} />,
  izin:  <Clock size={11} strokeWidth={2} />,
};

// Mock data — nanti diganti API
const MOCK_DATA = Array.from({ length: 23 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const checkIn  = i % 5 === 3 ? null : new Date(d.setHours(7 + (i % 3), 50 + (i % 10)));
  const checkOut = checkIn && i % 7 !== 0 ? new Date(new Date(checkIn).setHours(16 + (i % 2), 30 + (i % 15))) : null;
  return {
    id: `att-${i}`,
    date: new Date(d.setDate(d.getDate())).toISOString(),
    checkIn:  checkIn?.toISOString() ?? null,
    checkOut: checkOut?.toISOString() ?? null,
    photoIn:  null,
    photoOut: null,
    lat: -6.2 - i * 0.001,
    lng: 106.8 + i * 0.001,
  };
});

// ─── Selfie modal ─────────────────────────────────────────────────────────────
function SelfieModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="selfie-modal-overlay" onClick={onClose}>
      <img src={src} alt="selfie" className="selfie-modal-img" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RiwayatKehadiran() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [month, setMonth]     = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selfieModal, setSelfieModal] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/hrm/attendance?month=${month}`)
      .then(res => setData(res.data.data ?? []))
      .catch(() => setData(MOCK_DATA)) // fallback mock
      .finally(() => setLoading(false));
  }, [month]);

  // Stats
  const hadir  = data.filter(r => statusOf(r) === "hadir").length;
  const telat  = data.filter(r => statusOf(r) === "telat").length;
  const alpha  = data.filter(r => statusOf(r) === "alpha").length;
  const izin   = data.filter(r => r.status === "izin").length;

  // Pagination
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paged = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="riwayat-wrap">
      <SelfieModal src={selfieModal} onClose={() => setSelfieModal(null)} />

      {/* Summary */}
      <div className="riwayat-summary">
        <div className="riwayat-stat">
          <div className="riwayat-stat-label">Hadir</div>
          <div className="riwayat-stat-value green">{hadir}</div>
        </div>
        <div className="riwayat-stat">
          <div className="riwayat-stat-label">Terlambat</div>
          <div className="riwayat-stat-value orange">{telat}</div>
        </div>
        <div className="riwayat-stat">
          <div className="riwayat-stat-label">Alpha</div>
          <div className="riwayat-stat-value red">{alpha}</div>
        </div>
        <div className="riwayat-stat">
          <div className="riwayat-stat-label">Izin</div>
          <div className="riwayat-stat-value">{izin}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="riwayat-toolbar">
        <span className="riwayat-toolbar-title">Riwayat Kehadiran</span>
        <input
          type="month"
          value={month}
          onChange={e => { setMonth(e.target.value); setPage(1); }}
          className="riwayat-filter-input"
        />
      </div>

      {/* Table */}
      <div className="riwayat-table-wrap">
        {loading ? (
          <div className="riwayat-empty">
            <Clock size={28} strokeWidth={1.5} />
            <p>Memuat data...</p>
          </div>
        ) : paged.length === 0 ? (
          <div className="riwayat-empty">
            <Calendar size={28} strokeWidth={1.5} />
            <p>Tidak ada data pada bulan ini</p>
          </div>
        ) : (
          <table className="riwayat-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Durasi</th>
                <th>Status</th>
                <th>Foto</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(row => {
                const st  = row.status ?? statusOf(row);
                const dur = calcDuration(row.checkIn, row.checkOut);
                return (
                  <tr key={row.id}>
                    <td className="riwayat-date-cell">{fmtDate(row.date)}</td>

                    <td>
                      {row.checkIn
                        ? <span className="riwayat-time checkin">{fmtTime(row.checkIn)}</span>
                        : <span className="riwayat-time empty">–</span>}
                    </td>

                    <td>
                      {row.checkOut
                        ? <span className="riwayat-time checkout">{fmtTime(row.checkOut)}</span>
                        : <span className="riwayat-time empty">–</span>}
                    </td>

                    <td>
                      <span className="riwayat-duration">{dur ?? "–"}</span>
                    </td>

                    <td>
                      <span className={`riwayat-badge ${st}`}>
                        {STATUS_ICON[st]} {STATUS_LABEL[st]}
                      </span>
                    </td>

                    <td>
                      {row.photoIn
                        ? <img src={row.photoIn} alt="in" className="selfie-thumb" onClick={() => setSelfieModal(row.photoIn)} />
                        : <div className="no-selfie"><Camera size={14} strokeWidth={1.8} /></div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="riwayat-pagination">
            <span>Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} dari {data.length} data</span>
            <div className="riwayat-page-btns">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - page) <= 2)
                .map(p => (
                  <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
