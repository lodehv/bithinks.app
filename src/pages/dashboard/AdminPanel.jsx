import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Users, Search, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { adminApi } from "../../utils/omniApi";
import AdminLeads from "./AdminLeads";
import RecoveryQueue from "./RecoveryQueue";
import AdminFinance from "./AdminFinance";
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

const ADMIN_TABS = [
  { id: "subscribers", label: "Pelanggan" },
  { id: "leads", label: "Registrasi (Lead)" },
  { id: "payments", label: "Pembayaran" },
  { id: "wallets", label: "Wallet" },
  { id: "recovery", label: "Pemulihan pembayaran" },
  { id: "audit", label: "Audit" },
];

export default function AdminPanel() {
  const [tab, setTab]     = useState(() => new URLSearchParams(window.location.search).get("admin") === "recovery" ? "recovery" : "subscribers");
  const [data, setData]   = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);
  const [statusBusy, setStatusBusy] = useState("");
  const tabButtonsRef = useRef([]);

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
  const handleTabKeyDown = (event, index) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % ADMIN_TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (index + ADMIN_TABS.length - 1) % ADMIN_TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = ADMIN_TABS.length - 1;
    else return;

    event.preventDefault();
    setTab(ADMIN_TABS[nextIndex].id);
    tabButtonsRef.current[nextIndex]?.focus();
  };

  const changeStatus = async (row) => {
    const action = row.status === "suspended" ? "resume" : "suspend";
    const reason = window.prompt(`Alasan ${action === "suspend" ? "penangguhan" : "pengaktifan kembali"} (wajib)`);
    if (!reason?.trim()) return;
    setStatusBusy(row.tenantId); setError("");
    try { await adminApi.changeTenantStatus(row.tenantId, { action, reason }, crypto.randomUUID()); await load(); }
    catch { setError("Status tenant belum dapat diubah."); }
    finally { setStatusBusy(""); }
  };

  const tabContent = {
    subscribers: (
      <>
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
            <label className="adm-visually-hidden" htmlFor="adm-subscriber-search">
              Cari toko, email, atau WhatsApp
            </label>
            <Search size={15} aria-hidden="true" />
            <input
              id="adm-subscriber-search"
              type="search"
              placeholder="Cari toko / email / WhatsApp…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="adm-filters">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                className={filter === f.id ? "active" : ""}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="adm-error" role="alert" aria-live="polite">{error}</div>}
        <div className="adm-table-wrap">
          <table className="adm-table adm-subscriber-table" role="table" aria-label="Daftar pelanggan">
            <thead role="rowgroup">
              <tr role="row">
                <th id="adm-col-store" scope="col" role="columnheader">Toko</th>
                <th id="adm-col-owner" scope="col" role="columnheader">Pemilik</th>
                <th id="adm-col-email" scope="col" role="columnheader">Email</th>
                <th id="adm-col-whatsapp" scope="col" role="columnheader">WhatsApp</th>
                <th id="adm-col-plan" scope="col" role="columnheader">Paket</th>
                <th id="adm-col-status" scope="col" role="columnheader">Status</th>
                <th id="adm-col-days" scope="col" role="columnheader">Sisa</th>
                <th id="adm-col-actions" scope="col" role="columnheader">Tindakan</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map((r) => (
                <tr key={r.tenantId} role="row" className={r.followUp ? "row-followup" : ""}>
                  <td role="cell" headers="adm-col-store" data-label="Toko">
                    <div className="adm-store">{r.tenantName}</div>
                    <div className="adm-sub">{r.slug}</div>
                  </td>
                  <td role="cell" headers="adm-col-owner" data-label="Pemilik">{r.ownerName || "—"}</td>
                  <td role="cell" headers="adm-col-email" data-label="Email" className="adm-mono">{r.email || "—"}</td>
                  <td role="cell" headers="adm-col-whatsapp" data-label="WhatsApp" className="adm-mono">{r.whatsapp || "—"}</td>
                  <td role="cell" headers="adm-col-plan" data-label="Paket">{r.plan}</td>
                  <td role="cell" headers="adm-col-status" data-label="Status">
                    <span className={`adm-badge st-${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>
                  </td>
                  <td role="cell" headers="adm-col-days" data-label="Sisa">
                    {r.status === "active" || r.status === "trial" ? `${r.daysLeft} hr` : "—"}
                  </td>
                  <td role="cell" headers="adm-col-actions" data-label="Tindakan">
                    {waLink(r.whatsapp) ? (
                      <a className="adm-wa" href={waLink(r.whatsapp)} target="_blank" rel="noreferrer">
                        <MessageCircle size={13} aria-hidden="true" /> Follow-up
                      </a>
                    ) : "—"}
                    <button
                      className="adm-status-action"
                      type="button"
                      disabled={statusBusy === r.tenantId}
                      onClick={() => void changeStatus(r)}
                    >
                      {statusBusy === r.tenantId ? "…" : r.status === "suspended" ? "Resume" : "Suspend"}
                    </button>
                  </td>
                </tr>
              ))}
              {!busy && rows.length === 0 && (
                <tr role="row">
                  <td role="cell" colSpan={8} className="adm-empty">
                    <Users size={18} aria-hidden="true" /> Tidak ada data pelanggan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    ),
    leads: <AdminLeads />,
    payments: <AdminFinance section="payments" />,
    wallets: <AdminFinance section="wallets" />,
    recovery: <RecoveryQueue />,
    audit: <AdminFinance section="audit" />,
  };

  return (
    <div className="adm">
      <div className="adm-head">
        <div>
          <h1><ShieldCheck size={20} /> Panel Admin</h1>
          <p>Kontrol pelanggan berlangganan dan lead registrasi yang perlu ditindaklanjuti.</p>
        </div>
        {tab === "subscribers" && (
          <button className="adm-refresh" type="button" onClick={load} disabled={busy}>
            <RefreshCw size={14} className={busy ? "spin" : ""} aria-hidden="true" /> Muat ulang
          </button>
        )}
      </div>

      <div className="adm-tabs" role="tablist" aria-label="Bagian panel admin" aria-orientation="horizontal">
        {ADMIN_TABS.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => { tabButtonsRef.current[index] = node; }}
            id={"admin-tab-" + item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={"admin-panel-" + item.id}
            tabIndex={tab === item.id ? 0 : -1}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {ADMIN_TABS.map(({ id }) => (
        <div
          key={id}
          className="adm-tabpanel"
          id={"admin-panel-" + id}
          role="tabpanel"
          aria-labelledby={"admin-tab-" + id}
          tabIndex={0}
          hidden={tab !== id}
        >
          {tab === id ? tabContent[id] : null}
        </div>
      ))}
    </div>
  );
}
