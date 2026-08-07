import { useEffect, useState } from "react";
import { Download, Lock } from "lucide-react";
import { omniApi } from "../../../../utils/omniApi";
import api from "../../../../utils/api";
import WmsLedgerTable from "./WmsLedgerTable";
import WmsPickingList from "./WmsPickingList";
import { TYPE_LABEL } from "./ledgerTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Buku Besar Stok — jantung kepercayaan (SPEC §4.7).
// Setiap perubahan saldo ada barisnya di sini; tidak ada baris yang bisa diedit
// atau dihapus. Webhook dobel tidak menghasilkan baris ganda karena satu peristiwa
// dikunci satu referensi di database.
// ─────────────────────────────────────────────────────────────────────────────

export default function WmsLedger() {
  const [rows, setRows] = useState(null);
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [downloading, setDownloading] = useState(false);
  // Lembar picking list dibuka dari baris Buku Besar — supaya "kenapa stok
  // berkurang" bisa ditelusuri sampai ke kertas yang dipegang operator.
  const [sheet, setSheet] = useState(null);

  const openSession = async (sessionId) => {
    try {
      setSheet(await omniApi.wmsOutboundDetail(sessionId));
    } catch {
      setSheet(false);
    }
  };

  const params = () => ({
    ...(type !== "all" ? { type } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    limit: 300,
  });

  useEffect(() => {
    let alive = true;
    const query = {
      ...(type !== "all" ? { type } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      limit: 300,
    };
    omniApi.wmsLedger(query)
      .then((d) => { if (alive) setRows(d); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [type, from, to]);

  // Unduh lewat axios agar header Authorization ikut terkirim (bukan link biasa).
  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/api/omni/wms/ledger", {
        params: { ...params(), format: "csv" },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `buku-besar-stok-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* gagal unduh — tabel di layar tetap bisa dibaca */
    } finally {
      setDownloading(false);
    }
  };

  if (sheet) {
    return <WmsPickingList session={sheet} onBack={() => setSheet(null)} />;
  }

  return (
    <div style={{ "--wms-table-offset": "22rem" }}>
      <div className="omni-toolbar">
        <div>
          <div className="omni-toolbar-title">Buku Besar Stok</div>
          <div className="omni-toolbar-sub">
            <Lock size={11} style={{ verticalAlign: "-1px" }} /> Catatan permanen — tidak bisa diedit
            atau dihapus. Perbaikan dilakukan dengan menambah mutasi koreksi.
          </div>
        </div>
        <button className="omni-btn omni-btn-ghost" onClick={downloadCsv} disabled={downloading || !rows?.length}>
          <Download size={14} /> {downloading ? "Menyiapkan…" : "Ekspor CSV"}
        </button>
      </div>

      <div className="wms-filters">
        <div className="omni-field" style={{ maxWidth: 200 }}>
          <label>Tipe mutasi</label>
          <select className="omni-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Semua tipe</option>
            {Object.entries(TYPE_LABEL).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
        <div className="omni-field" style={{ maxWidth: 170 }}>
          <label>Dari tanggal</label>
          <input className="omni-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="omni-field" style={{ maxWidth: 170 }}>
          <label>Sampai tanggal</label>
          <input className="omni-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {rows === null
        ? <div className="omni-loading">Memuat buku besar…</div>
        : <WmsLedgerTable rows={rows} onOpenSession={openSession} />}
    </div>
  );
}
