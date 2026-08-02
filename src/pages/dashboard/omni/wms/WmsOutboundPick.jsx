import { useEffect, useRef, useState } from "react";
import { ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// Scan Picking List → Stok Fisik turun untuk seluruh isi lembar, sekali jalan.
//
// Lembar yang sama tidak bisa memotong stok dua kali: server menolak sesi yang
// sudah selesai, dan kunci idempotency per (sesi × produk) di Buku Besar jadi
// jaring pengaman terakhirnya.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

export default function WmsOutboundPick({ locked, onRequirePayment }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [feed, setFeed] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => { if (!busy) inputRef.current?.focus(); }, [busy]);

  const submit = async (e) => {
    e?.preventDefault();
    const value = code.trim();
    if (!value || busy) return;

    setBusy(true);
    try {
      const res = await omniApi.wmsOutboundPick(value);
      setCode("");
      setFeed((f) => [{ ...res, code: value, at: new Date() }, ...f].slice(0, 20));
    } catch (err) {
      if (isPaymentRequired(err)) { onRequirePayment?.(); return; }
      setFeed((f) => [{
        ok: false, code: value, at: new Date(),
        message: err?.response?.data?.error?.message ?? "Gagal memindai picking list.",
      }, ...f].slice(0, 20));
    } finally { setBusy(false); }
  };

  return (
    <div>
      <form className="wms-scan-bar" onSubmit={submit}>
        <div className="omni-field" style={{ flex: 1, minWidth: 240 }}>
          <label><ClipboardList size={11} style={{ verticalAlign: "-1px" }} /> Scan barcode picking list</label>
          <input
            ref={inputRef}
            className="omni-input wms-scan-input"
            placeholder="Arahkan pemindai ke barcode, atau ketik kodenya (mis. PL-20260802-0001)"
            value={code}
            disabled={locked || busy}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
          />
        </div>
        <button className="omni-btn omni-btn-primary" disabled={locked || busy || !code.trim()}>
          {busy ? "Memproses…" : "Kurangi Stok Fisik"}
        </button>
      </form>

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title">Hasil pindaian</div>
            <div className="wms-panel-sub">Terbaru di atas.</div>
          </div>
        </div>

        {feed.length === 0 ? (
          <div className="wms-kpi-note">
            Belum ada picking list dipindai. Lembarnya dibuat dari tab Pengurangan Stok Tersedia.
          </div>
        ) : (
          <div className="wms-feed">
            {feed.map((f, idx) => (
              <div className={`wms-feed-row ${f.ok ? "ok" : "err"}`} key={`${f.code}-${idx}`}>
                {f.ok ? <CheckCircle2 size={15} className="ico" /> : <XCircle size={15} className="ico" />}
                <div style={{ minWidth: 0 }}>
                  <div className="wms-feed-resi">{f.code}</div>
                  <div className="wms-feed-msg">{f.message}</div>
                  {f.items?.length > 0 && (
                    <div className="wms-feed-items">
                      {f.items.map((i) => `${i.name} −${num(i.qty)}`).join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="wms-note" style={{ marginTop: 16 }}>
        Pemindaian ini <strong>menurunkan Stok Fisik</strong> — barang benar-benar keluar dari rak.
        Tersedia sudah lebih dulu berkurang saat resinya dipindai, jadi tidak dikurangi dua kali.
      </div>
    </div>
  );
}
