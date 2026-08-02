import { useCallback, useEffect, useRef, useState } from "react";
import { ScanLine, CheckCircle2, XCircle, Printer, Package } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../../utils/omniApi";
import WmsPickingList from "./WmsPickingList";

// ─────────────────────────────────────────────────────────────────────────────
// Scan resi → Tersedia turun.
//
// Kolom input sengaja dijaga tetap fokus dan dikosongkan setiap selesai: alat
// pemindai bekerja seperti papan ketik yang mengetik cepat lalu menekan Enter,
// jadi operator tak boleh perlu menyentuh mouse di antara dua pindaian.
//
// Tally memakai satu baris per master produk — angkanya yang bertambah, persis
// seperti lembar picking list yang nanti dicetak.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

export default function WmsOutboundScan({ locked, onRequirePayment, mode = "scan" }) {
  const [data, setData] = useState(null);
  const [resi, setResi] = useState("");
  const [busy, setBusy] = useState(false);
  const [feed, setFeed] = useState([]);      // hasil pindaian terakhir, terbaru di atas
  const [printing, setPrinting] = useState(null);
  const inputRef = useRef(null);

  const load = useCallback(
    () => omniApi.wmsOutbound().then(setData).catch(() => setData(false)),
    [],
  );
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!busy && !printing) inputRef.current?.focus(); }, [busy, printing]);

  const submit = async (e) => {
    e?.preventDefault();
    const value = resi.trim();
    if (!value || busy) return;

    setBusy(true);
    try {
      const res = await omniApi.wmsOutboundScan({ trackingNumber: value });
      setResi("");
      setFeed((f) => [{ ...res, resi: value, at: new Date() }, ...f].slice(0, 30));
      if (res.ok) await load();
    } catch (err) {
      if (isPaymentRequired(err)) { onRequirePayment?.(); return; }
      setFeed((f) => [{
        ok: false, resi: value, at: new Date(),
        message: err?.response?.data?.error?.message ?? "Gagal memindai.",
      }, ...f].slice(0, 30));
    } finally {
      setBusy(false);
    }
  };

  const closeAndPrint = async () => {
    if (!data?.session?.id) return;
    setBusy(true);
    try {
      const res = await omniApi.wmsOutboundClose(data.session.id);
      setPrinting(res);
      await load();
    } catch (err) {
      if (isPaymentRequired(err)) { onRequirePayment?.(); return; }
      setFeed((f) => [{
        ok: false, resi: "—", at: new Date(),
        message: err?.response?.data?.error?.message ?? "Gagal menutup sesi.",
      }, ...f].slice(0, 30));
    } finally { setBusy(false); }
  };

  if (printing) {
    return <WmsPickingList session={printing} onBack={() => { setPrinting(null); load(); }} />;
  }
  if (data === null) return <div className="omni-loading">Memuat sesi outbound…</div>;
  if (data === false) return <div className="omni-inline-msg">Gagal memuat sesi outbound.</div>;

  const { session } = data;
  const totalUnit = session.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div>
      <form className="wms-scan-bar" onSubmit={submit}>
        <div className="omni-field" style={{ flex: 1, minWidth: 240 }}>
          <label><ScanLine size={11} style={{ verticalAlign: "-1px" }} /> Scan nomor resi</label>
          <input
            ref={inputRef}
            className="omni-input wms-scan-input"
            placeholder="Arahkan pemindai ke resi, atau ketik lalu tekan Enter"
            value={resi}
            disabled={locked || busy}
            onChange={(e) => setResi(e.target.value)}
            autoComplete="off"
          />
        </div>
        <button className="omni-btn omni-btn-primary" disabled={locked || busy || !resi.trim()}>
          {busy ? "Memproses…" : "Pindai"}
        </button>
      </form>

      <div className="wms-scan-grid">
        <div className="wms-panel">
          <div className="wms-panel-head">
            <div>
              <div className="wms-panel-title">{session.code}</div>
              <div className="wms-panel-sub">
                {session.scans.length === 0
                  ? "Belum ada resi dipindai."
                  : `${num(session.scans.length)} resi · ${num(session.items.length)} produk · ${num(totalUnit)} unit`}
              </div>
            </div>
            <button
              className="omni-btn omni-btn-ghost"
              onClick={closeAndPrint}
              disabled={locked || busy || session.items.length === 0}
              title={session.items.length === 0 ? "Pindai resi dulu" : "Tutup sesi & cetak picking list"}
            >
              <Printer size={14} /> Buat Picking List
            </button>
          </div>

          {session.items.length === 0 ? (
            <div className="wms-kpi-note">
              Hasil pindaian akan muncul di sini — satu baris per produk, angkanya bertambah tiap resi.
            </div>
          ) : (
            <div className="omni-table-wrap">
              <table className="omni-table">
                <thead>
                  <tr><th>Produk</th><th style={{ textAlign: "right" }}>Qty</th></tr>
                </thead>
                <tbody>
                  {session.items.map((i) => (
                    <tr key={i.productId}>
                      <td>
                        <div className="wms-prod">
                          {i.imageUrl ? <img src={i.imageUrl} alt="" /> : <div className="ph"><Package size={15} /></div>}
                          <div style={{ minWidth: 0 }}>
                            <div className="wms-prod-name">{i.name}</div>
                            <div className="wms-prod-sku">{i.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="wms-num strong">{num(i.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="wms-panel">
          <div className="wms-panel-head">
            <div>
              <div className="wms-panel-title">Hasil pindaian</div>
              <div className="wms-panel-sub">Terbaru di atas.</div>
            </div>
          </div>
          {feed.length === 0 ? (
            <div className="wms-kpi-note">Belum ada pindaian pada sesi ini.</div>
          ) : (
            <div className="wms-feed">
              {feed.map((f, idx) => (
                <div className={`wms-feed-row ${f.ok ? "ok" : "err"}`} key={`${f.resi}-${idx}`}>
                  {f.ok ? <CheckCircle2 size={15} className="ico" /> : <XCircle size={15} className="ico" />}
                  <div style={{ minWidth: 0 }}>
                    <div className="wms-feed-resi">{f.resi}</div>
                    <div className="wms-feed-msg">{f.message}</div>
                    {f.added?.length > 0 && (
                      <div className="wms-feed-items">
                        {f.added.map((a) => `${a.name} +${num(a.qty)}`).join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {mode === "scan" && (
        <div className="wms-note" style={{ marginTop: 16 }}>
          Memindai resi <strong>menurunkan Tersedia</strong>, bukan Stok Fisik — barangnya masih di
          rak. Stok Fisik baru turun saat lembar picking list dipindai di tab Pengurangan Stok Fisik.
        </div>
      )}
    </div>
  );
}
