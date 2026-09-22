import { useEffect, useMemo, useState } from "react";
import { UserPlus, Search, MessageCircle, Mail, RefreshCw } from "lucide-react";
import { adminApi } from "../../utils/omniApi";
import { formatDateTime } from "../../utils/datetime";
import "./AdminPanel.css";

const waLink = (phone) => {
  const d = String(phone || "").replace(/\D/g, "");
  if (!d) return null;
  const intl = d.startsWith("62") ? d : d.startsWith("0") ? "62" + d.slice(1) : "62" + d;
  return `https://wa.me/${intl}`;
};

const fmt = (d) => (d ? formatDateTime(d) : "-");

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "pending", label: "Belum Selesai" },
  { id: "completed", label: "Sudah Terdaftar" },
];

// Daftar orang yang pernah klik "Kirim Kode OTP" (lead registrasi).
export default function AdminLeads() {
  const [data, setData]   = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  const load = () => {
    setBusy(true); setError("");
    adminApi.leads()
      .then(setData)
      .catch((e) => setError(e?.response?.status === 403
        ? "Akses ditolak. Panel ini khusus admin."
        : "Gagal memuat data lead."))
      .finally(() => setBusy(false));
  };
  useEffect(load, []);

  const rows = useMemo(() => {
    const list = data?.rows ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((r) => {
      if (filter === "pending" && r.completed) return false;
      if (filter === "completed" && !r.completed) return false;
      if (!q) return true;
      return String(r.identifier || "").toLowerCase().includes(q);
    });
  }, [data, query, filter]);

  const s = data?.summary;

  return (
    <>
      {s && (
        <div className="adm-cards" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="adm-card"><span>Total Lead</span><strong>{s.total}</strong></div>
          <div className="adm-card ok"><span>Sudah Terdaftar</span><strong>{s.completed}</strong></div>
          <div className="adm-card followup"><span>Belum Selesai</span><strong>{s.pending}</strong></div>
        </div>
      )}

      <div className="adm-toolbar">
        <div className="adm-search">
          <Search size={15} />
          <input placeholder="Cari email / nomor…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="adm-filters">
          {FILTERS.map((f) => (
            <button key={f.id} className={filter === f.id ? "active" : ""} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
          <button className="adm-refresh" onClick={load} disabled={busy} style={{ marginLeft: 4 }}>
            <RefreshCw size={14} className={busy ? "spin" : ""} /> Muat ulang
          </button>
        </div>
      </div>

      {error && <div className="adm-error">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Email / Nomor</th><th>Kanal</th><th>Percobaan</th>
              <th>Terakhir Coba</th><th>IP</th><th>Status</th><th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.identifier} className={!r.completed ? "row-followup" : ""}>
                <td className="adm-mono">
                  {r.identifier}
                  {r.truncated && <span title="Data lama mungkin terpotong" style={{ color: "#C25100" }}> ⚠</span>}
                </td>
                <td>{r.channel === "email" ? "Email" : "WhatsApp"}</td>
                <td>{r.attempts}×</td>
                <td className="adm-mono">{fmt(r.lastAt)}</td>
                <td className="adm-mono">{r.lastIp || "—"}</td>
                <td>
                  <span className={`adm-badge ${r.completed ? "st-active" : "st-trial"}`}>
                    {r.completed ? "Terdaftar" : "Lead"}
                  </span>
                </td>
                <td>
                  {r.channel === "email" ? (
                    <a className="adm-wa" href={`mailto:${r.identifier}`} style={{ color: "#0C66E4", background: "#E9F2FF", borderColor: "#CCE0FF" }}>
                      <Mail size={13} /> Email
                    </a>
                  ) : waLink(r.identifier) ? (
                    <a className="adm-wa" href={waLink(r.identifier)} target="_blank" rel="noreferrer">
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  ) : "—"}
                </td>
              </tr>
            ))}
            {!busy && rows.length === 0 && (
              <tr><td colSpan={7} className="adm-empty"><UserPlus size={18} /> Belum ada lead registrasi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
