import { useCallback, useEffect, useState } from "react";
import { Plus, PackagePlus, Building2, FileText } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../../utils/omniApi";
import WmsInboundForm from "./WmsInboundForm";
import WmsInboundDetail from "./WmsInboundDetail";
import WmsCompanyForm from "./WmsCompanyForm";
import WmsInboundDoc from "./WmsInboundDoc";
import FulfillBar from "./WmsFulfillBar";

// ─────────────────────────────────────────────────────────────────────────────
// Barang Masuk (PO) — daftar, buat, terima.
//
// Membuat PO TIDAK menambah stok apa pun. Selama barang belum tiba, sisanya
// hanya muncul sebagai "Stok Akan Datang" — penanda agar tidak memesan dobel,
// bukan barang yang bisa dijual.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");
const rupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");

/**
 * Nominal di bawah angka unit. Kalau ada item tanpa HPP, angkanya ditulis
 * sebagai batas bawah ("min.") — bukan seolah-olah sudah pasti. Menampilkan
 * total yang diam-diam kurang lebih berbahaya daripada mengaku belum lengkap,
 * karena nominal PO dipakai untuk mencocokkan tagihan supplier.
 */
function Nominal({ value, parsial }) {
  if (!value) return null;
  return (
    <div
      className="wms-num-sub"
      title={parsial ? "Sebagian produk belum punya HPP — nilai sebenarnya lebih besar." : undefined}
    >
      {parsial ? "min. " : ""}{rupiah(value)}
    </div>
  );
}

const STATUS = {
  draft:    { label: "Belum ada yang tiba", chip: "aman" },
  sebagian: { label: "Sebagian tiba", chip: "menipis" },
  selesai:  { label: "Lengkap", chip: "info" },
  batal:    { label: "Dibatalkan", chip: "habis" },
};

const tgl = (d) => (d ? new Date(d).toLocaleDateString("id-ID", {
  day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta",
}) : "—");

export default function WmsInbound({ locked, onRequirePayment }) {
  const [rows, setRows] = useState(null);
  const [view, setView] = useState(null);   // 'form' | 'company' | { id }
  const [doc, setDoc] = useState(null);     // 'memuat' | objek PO lengkap
  const [msg, setMsg] = useState(null);

  const load = useCallback(
    () => omniApi.wmsInbound().then(setRows).catch(() => setRows(false)),
    [],
  );
  useEffect(() => { load(); }, [load]);

  const guard = (err) => { if (isPaymentRequired(err)) { onRequirePayment?.(); return true; } return false; };

  /**
   * Buka dokumen PO langsung dari daftar. Baris daftar hanya membawa angka
   * ringkas, sedangkan surat butuh rincian item dan kop perusahaan — jadi
   * detailnya diambil dulu, baru lembarnya ditampilkan. Kalau gagal, daftar
   * tetap di tempat dengan pesan, bukan pindah ke layar buntu.
   */
  const openDoc = async (e, id) => {
    e.stopPropagation();               // jangan ikut membuka halaman detail
    setDoc("memuat"); setMsg(null);
    try {
      setDoc(await omniApi.wmsInboundDetail(id));
    } catch (err) {
      setDoc(null);
      if (guard(err)) return;
      setMsg("Gagal menyiapkan dokumen PO. Coba lagi sebentar.");
    }
  };

  if (doc === "memuat") return <div className="omni-loading">Menyiapkan dokumen PO…</div>;
  if (doc) return <WmsInboundDoc po={doc} onBack={() => setDoc(null)} />;

  if (view === "form") {
    return (
      <WmsInboundForm
        onBack={() => setView(null)}
        onCreated={(id) => { setView({ id }); load(); }}
        onError={guard}
      />
    );
  }
  if (view === "company") {
    return <WmsCompanyForm onBack={() => setView(null)} onError={guard} />;
  }
  if (view?.id) {
    return (
      <WmsInboundDetail
        inboundId={view.id}
        locked={locked}
        onError={guard}
        onBack={() => { setView(null); load(); }}
      />
    );
  }

  if (rows === null) return <div className="omni-loading">Memuat daftar PO…</div>;
  if (rows === false) return <div className="omni-inline-msg">Gagal memuat daftar PO.</div>;

  return (
    <div>
      <div className="omni-toolbar">
        <div>
          <div className="omni-toolbar-title">Barang Masuk</div>
          <div className="omni-toolbar-sub">
            Membuat PO tidak menambah stok — hanya penerimaan barang yang menambah.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="omni-btn omni-btn-ghost" onClick={() => setView("company")}>
            <Building2 size={14} /> Kop Surat
          </button>
          <button className="omni-btn omni-btn-primary" onClick={() => setView("form")} disabled={locked}>
            <Plus size={14} /> Buat PO
          </button>
        </div>
      </div>

      {msg && <div className="wms-msg err">{msg}</div>}

      {rows.length === 0 ? (
        <div className="omni-empty">
          <div className="omni-empty-icon"><PackagePlus size={22} /></div>
          <h3>Belum ada PO</h3>
          <p>Buat PO untuk mencatat pesanan ke supplier. Sisanya akan muncul sebagai Stok Akan Datang.</p>
        </div>
      ) : (
        <div className="omni-table-wrap">
          <table className="omni-table">
            <thead>
              <tr>
                <th>Nomor PO</th>
                <th>Supplier</th>
                <th>Perkiraan Tiba</th>
                <th style={{ textAlign: "right" }}>Dipesan</th>
                <th style={{ textAlign: "right" }}>Tiba</th>
                <th style={{ minWidth: 150 }}>Pemenuhan</th>
                <th>Status</th>
                <th style={{ width: 70, textAlign: "center" }}>Dokumen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="wms-row-clickable" onClick={() => setView({ id: r.id })}>
                  <td>
                    <div className="wms-prod-name">{r.code}</div>
                    <div className="wms-prod-sku">{num(r.totalItem)} produk · dibuat {tgl(r.createdAt)}</div>
                  </td>
                  <td>{r.supplier || <span className="omni-cell-muted">—</span>}</td>
                  <td className="omni-cell-muted">{tgl(r.expectedAt)}</td>
                  <td className="wms-num">
                    {num(r.dipesan)}
                    <Nominal value={r.nilai} parsial={r.nilaiParsial} />
                  </td>
                  <td className="wms-num strong">
                    {num(r.diterima)}
                    <Nominal value={r.nilaiDiterima} parsial={r.nilaiParsial} />
                  </td>
                  <td><FulfillBar ordered={r.dipesan} received={r.diterima} /></td>
                  <td>
                    <span className={`wms-chip ${STATUS[r.status]?.chip ?? "aman"}`}>
                      {STATUS[r.status]?.label ?? r.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="wms-doc-btn"
                      title={`Lihat & simpan PDF ${r.code}`}
                      aria-label={`Lihat dokumen ${r.code}`}
                      onClick={(e) => openDoc(e, r.id)}
                    >
                      <FileText size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
