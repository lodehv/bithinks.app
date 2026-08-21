import { useEffect, useMemo, useState } from "react";
import { Inbox, Search, Check, X, ShieldAlert, RefreshCw } from "lucide-react";
import { adminApi } from "../../utils/omniApi";
import "./AdminPanel.css";

// ─────────────────────────────────────────────────────────────────────────────
// PENAMPUNGAN PELANGGAN — permintaan pendaftaran yang menunggu keputusan.
//
// Sejak 21 Agustus 2026 pendaftaran swalayan ditutup: orang mengajukan diri,
// pemilik yang memutuskan. Tombol "Setujui" di layar ini adalah SATU-SATUNYA
// cara pelanggan baru lahir — tanpa ia, produk tidak punya pintu masuk sama
// sekali.
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("id-ID", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
};

const STATUS = {
  menunggu:  { label: "Menunggu",  kelas: "st-trial" },
  disetujui: { label: "Disetujui", kelas: "st-active" },
  ditolak:   { label: "Ditolak",   kelas: "st-expired" },
};

const FILTERS = [
  { id: "menunggu",  label: "Menunggu" },
  { id: "all",       label: "Semua" },
  { id: "disetujui", label: "Disetujui" },
  { id: "ditolak",   label: "Ditolak" },
];

export default function AdminPendaftaran() {
  const [data, setData]     = useState(null);
  const [query, setQuery]   = useState("");
  // Dibuka di "Menunggu": itu satu-satunya kolom yang menuntut tindakan.
  const [filter, setFilter] = useState("menunggu");
  const [error, setError]   = useState("");
  const [pesan, setPesan]   = useState("");
  const [busy, setBusy]     = useState(false);
  const [sedang, setSedang] = useState(null); // id yang tombolnya sedang ditekan

  const load = () => {
    setBusy(true); setError("");
    adminApi.pendaftaran()
      .then(setData)
      .catch((e) => setError(e?.response?.status === 403
        ? "Akses ditolak. Penampungan ini khusus admin."
        : "Gagal memuat permintaan pendaftaran."))
      .finally(() => setBusy(false));
  };
  useEffect(load, []);

  const tinjau = async (baris, aksi) => {
    if (aksi === "setujui" && !window.confirm(
      `Setujui ${baris.email}? Akun untuk "${baris.companyName}" akan langsung dibuat.`
    )) return;

    let catatan;
    if (aksi === "tolak") {
      catatan = window.prompt(`Alasan menolak ${baris.email}? (boleh dikosongkan)`) ?? undefined;
    }

    setSedang(baris.id); setError(""); setPesan("");
    try {
      const hasil = await adminApi.tinjauPendaftaran(baris.id, aksi, catatan);
      setPesan(hasil?.message ?? `Permintaan ${baris.email} ditandai ${aksi}.`);
      load();
    } catch (e) {
      setError(e?.response?.data?.error?.message ?? "Gagal menyimpan keputusan.");
    } finally {
      setSedang(null);
    }
  };

  const rows = useMemo(() => {
    const list = data?.rows ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return [r.email, r.phone, r.name, r.companyName]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [data, query, filter]);

  const s = data?.summary;

  return (
    <>
      {s && (
        <div className="adm-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="adm-card"><span>Total Permintaan</span><strong>{s.total}</strong></div>
          <div className="adm-card followup"><span>Menunggu Keputusan</span><strong>{s.menunggu}</strong></div>
          <div className="adm-card ok"><span>Disetujui</span><strong>{s.disetujui}</strong></div>
          <div className="adm-card danger"><span>Ditolak</span><strong>{s.ditolak}</strong></div>
        </div>
      )}

      <div className="adm-toolbar">
        <div className="adm-search">
          <Search size={15} />
          <input placeholder="Cari email / nama / usaha…" value={query}
                 onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="adm-filters">
          {FILTERS.map((f) => (
            <button key={f.id} className={filter === f.id ? "active" : ""}
                    onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
          <button className="adm-refresh" onClick={load} disabled={busy} style={{ marginLeft: 4 }}>
            <RefreshCw size={14} className={busy ? "spin" : ""} /> Muat ulang
          </button>
        </div>
      </div>

      {error && <div className="adm-error">{error}</div>}
      {pesan && <div className="adm-error" style={{
        background: "#F0FDF4", borderColor: "#BBF7D0", color: "#166534",
      }}>{pesan}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Pemohon</th><th>Usaha</th><th>Kontak</th>
              <th>Diajukan</th><th>Status</th><th>Keputusan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.status === "menunggu" ? "row-followup" : ""}>
                <td>
                  <div className="adm-store">{r.name}</div>
                  <div className="adm-mono">{r.email}</div>
                  {!r.emailTerverifikasi && (
                    <div className="adm-sub" style={{ color: "#c2410c", display: "flex", alignItems: "center", gap: 4 }}>
                      <ShieldAlert size={11} /> email belum dibuktikan lewat OTP
                    </div>
                  )}
                </td>
                <td>
                  <div className="adm-store">{r.companyName}</div>
                  <div className="adm-sub">
                    {[r.industry, r.employeeCount && `${r.employeeCount} karyawan`]
                      .filter(Boolean).join(" · ") || "—"}
                  </div>
                </td>
                <td className="adm-mono">{r.phone || "—"}</td>
                <td className="adm-mono">{fmt(r.createdAt)}</td>
                <td>
                  <span className={`adm-badge ${STATUS[r.status]?.kelas ?? ""}`}>
                    {STATUS[r.status]?.label ?? r.status}
                  </span>
                </td>
                <td>
                  {r.status === "menunggu" ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="adm-wa" disabled={sedang === r.id}
                              onClick={() => tinjau(r, "setujui")}
                              style={{ cursor: "pointer", fontFamily: "inherit" }}>
                        <Check size={13} /> Setujui
                      </button>
                      <button className="adm-wa" disabled={sedang === r.id}
                              onClick={() => tinjau(r, "tolak")}
                              style={{
                                cursor: "pointer", fontFamily: "inherit", color: "#b91c1c",
                                background: "#FEF2F2", borderColor: "#FECACA",
                              }}>
                        <X size={13} /> Tolak
                      </button>
                    </div>
                  ) : (
                    <div className="adm-sub">
                      {STATUS[r.status]?.label} {fmt(r.reviewedAt)}
                      {r.reviewedByName && ` · ${r.reviewedByName}`}
                      {r.catatan && <div style={{ color: "#6b7280" }}>“{r.catatan}”</div>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!busy && rows.length === 0 && (
              <tr><td colSpan={6} className="adm-empty">
                <Inbox size={18} /> Tidak ada permintaan pada saringan ini.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
