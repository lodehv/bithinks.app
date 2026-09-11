import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Search, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { adminApi } from "../../utils/omniApi";
import AdminLeads from "./AdminLeads";
import RecoveryQueue from "./RecoveryQueue";
import "./AdminPanel.css";

// wa.me link dari nomor Indonesia (0812… → 62812…).
const waLink = (phone) => {
  const d = String(phone || "").replace(/\D/g, "");
  if (!d) return null;
  const intl = d.startsWith("62") ? d : d.startsWith("0") ? "62" + d.slice(1) : "62" + d;
  return `https://wa.me/${intl}`;
};

const STATUS_LABEL = {
  active: "Aktif", trial: "Trial", expired: "Berakhir", suspended: "Ditangguhkan",
};

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "followup", label: "Perlu Follow-up" },
  { id: "active", label: "Aktif" },
  { id: "trial", label: "Trial" },
  { id: "expired", label: "Berakhir" },
];

export default function AdminPanel() {
  const [tab, setTab]     = useState("subscribers"); // 'subscribers' | 'leads' | 'recovery'
  const [data, setData]   = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  const load = useCallback(() => {
    setBusy(true); setError("");
    adminApi.subscribers()
      .then(setData)
      .catch((e) => setError(e?.response?.status === 403
        ? "Akses ditolak. Panel ini khusus admin."
        : "Gagal memuat data pelanggan."))
      .finally(() => setBusy(false));
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const rows = useMemo(() => {
    const list = data?.rows ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((r) => {
      if (filter === "followup" && !r.followUp) return false;
      if (filter !== "all" && filter !== "followup" && r.status !== filter) return false;
      if (!q) return true;
      return [r.tenantName, r.ownerName, r.email, r.whatsapp, r.plan]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [data, query, filter]);

  const s = data?.summary;

  return (
    <div className="adm">
      <div className="adm-head">
        <div>
          <h1><ShieldCheck size={20} /> Panel Admin</h1>
          <p>Kontrol pelanggan berlangganan dan lead registrasi yang perlu ditindaklanjuti.</p>
        </div>
        {tab === "subscribers" && (
          <button className="adm-refresh" onClick={load} disabled={busy}>
            <RefreshCw size={14} className={busy ? "spin" : ""} /> Muat ulang
          </button>
        )}
      </div>

      <div className="adm-tabs">
        <button className={tab === "subscribers" ? "active" : ""} onClick={() => setTab("subscribers")}>Pelanggan</button>
        <button className={tab === "leads" ? "active" : ""} onClick={() => setTab("leads")}>Registrasi (Lead)</button>
        <button className={tab === "recovery" ? "active" : ""} onClick={() => setTab("recovery")}>Pemulihan pembayaran</button>
      </div>

      {tab === "leads" && <AdminLeads />}
      {tab === "recovery" && <RecoveryQueue />}

      {tab === "subscribers" && <>
      {s && (
        <div className="adm-cards">
          <div className="adm-card"><span>Total</span><strong>{s.total}</strong></div>
          <div className="adm-card ok"><span>Aktif</span><strong>{s.active}</strong></div>
          <div className="adm-card warn"><span>Trial</span><strong>{s.trial}</strong></div>
          <div className="adm-card danger"><span>Berakhir</span><strong>{s.expired}</strong></div>
          <div className="adm-card followup"><span>Perlu Follow-up</span><strong>{s.followUp}</strong></div>
        </div>
      )}

      <div className="adm-toolbar">
        <div className="adm-search">
          <Search size={15} />
          <input placeholder="Cari toko / email / WhatsApp…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="adm-filters">
          {FILTERS.map((f) => (
            <button key={f.id} className={filter === f.id ? "active" : ""} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
      </div>

      {error && <div className="adm-error">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Toko</th><th>Pemilik</th><th>Email</th><th>WhatsApp</th>
              <th>Paket</th><th>Status</th><th>Sisa</th><th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tenantId} className={r.followUp ? "row-followup" : ""}>
                <td><div className="adm-store">{r.tenantName}</div><div className="adm-sub">{r.slug}</div></td>
                <td>{r.ownerName || "—"}</td>
                <td className="adm-mono">{r.email || "—"}</td>
                <td className="adm-mono">{r.whatsapp || "—"}</td>
                <td>{r.plan}</td>
                <td><span className={`adm-badge st-${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
                <td>{r.status === "active" || r.status === "trial" ? `${r.daysLeft} hr` : "—"}</td>
                <td>
                  {waLink(r.whatsapp) ? (
                    <a className="adm-wa" href={waLink(r.whatsapp)} target="_blank" rel="noreferrer">
                      <MessageCircle size={13} /> Follow-up
                    </a>
                  ) : "—"}
                </td>
              </tr>
            ))}
            {!busy && rows.length === 0 && (
              <tr><td colSpan={8} className="adm-empty"><Users size={18} /> Tidak ada data pelanggan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </>}
    </div>
  );
}
