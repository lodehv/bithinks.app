import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ClipboardCheck, Shield } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../../utils/omniApi";
import WmsLedgerTable from "./WmsLedgerTable";

// ─────────────────────────────────────────────────────────────────────────────
// Detail Produk — kartu 5 saldo (dengan rumus jangkar terlihat), sebaran channel,
// antrean pesanan, dan mini Buku Besar (SPEC §4.3).
// Transparansi rumus = kepercayaan: user harus bisa melihat dari mana Siap Jual datang.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

function Balance({ label, value, ats }) {
  return (
    <div className={`wms-balance ${ats ? "ats" : ""}`}>
      <div className="wms-balance-label">{label}</div>
      <div className={`wms-balance-value ${value < 0 ? "neg" : ""}`}>{num(value)}</div>
    </div>
  );
}

export default function WmsProductDetail({ productId, locked, onRequirePayment, onBack }) {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [buffer, setBuffer] = useState("");
  const [counted, setCounted] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(
    () => omniApi.wmsStockDetail(productId)
      .then((d) => { setData(d); setBuffer(String(d.product.safetyStock)); })
      .catch(() => setData(false)),
    [productId],
  );

  useEffect(() => { load(); }, [load]);

  const guard = (err) => {
    if (isPaymentRequired(err)) { onRequirePayment?.(); return true; }
    setMsg({ type: "err", text: err?.response?.data?.error?.message ?? "Gagal menyimpan." });
    return false;
  };

  const saveBuffer = async () => {
    setBusy(true); setMsg(null);
    try {
      const d = await omniApi.wmsPatchStock(productId, { safetyStock: Number(buffer) || 0 });
      setData(d);
      setMsg({ type: "ok", text: `Cadangan disimpan. Siap Jual kini ${num(d.product.availableToSell)}.` });
    } catch (err) { guard(err); } finally { setBusy(false); }
  };

  const submitCount = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const res = await omniApi.wmsAdjust({
        productId, countedQty: Number(counted), type: "opname", reason: reason.trim(),
      });
      if (!res.applied) {
        setMsg({ type: "ok", text: res.message ?? "Tidak ada selisih." });
      } else {
        setMsg({
          type: "ok",
          text: `Selisih ${res.delta > 0 ? "+" : ""}${num(res.delta)} dicatat di Buku Besar. Stok Fisik kini ${num(res.stokFisik)}.`,
        });
        setCounted(""); setReason("");
      }
      await load();
    } catch (err) { guard(err); } finally { setBusy(false); }
  };

  if (data === null) return <div className="omni-loading">Memuat detail stok…</div>;
  if (data === false) return <div className="omni-inline-msg">Gagal memuat detail produk.</div>;

  const { product: p, channels, queue, ledger } = data;

  return (
    <div>
      <div className="omni-toolbar">
        <div>
          <button className="omni-btn omni-btn-ghost" onClick={onBack} style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Kembali ke daftar
          </button>
          <div className="omni-toolbar-title">{p.name}</div>
          <div className="omni-toolbar-sub">{p.sku}{p.category ? ` · ${p.category}` : ""}{p.unit ? ` · satuan ${p.unit}` : ""}</div>
        </div>
        <span className={`wms-chip ${p.status}`}>
          {p.status === "aman" ? "Aman" : p.status === "menipis" ? "Menipis" : "Habis / Stop Jual"}
        </span>
      </div>

      {msg && <div className={`wms-msg ${msg.type}`}>{msg.text}</div>}

      <div className="wms-balance-grid">
        <Balance label="Stok Fisik" value={p.onHand} />
        <Balance label="Terkunci Pesanan" value={p.allocated} />
        <Balance label="Cadangan" value={p.safetyStock} />
        <Balance label="Siap Jual" value={p.availableToSell} ats />
        <Balance label="Dalam Perjalanan" value={p.incoming} />
      </div>

      <div className="wms-formula" style={{ marginBottom: 16 }}>
        Stok Fisik <b>{num(p.onHand)}</b>
        <span className="eq">−</span> Terkunci <b>{num(p.allocated)}</b>
        <span className="eq">−</span> Cadangan <b>{num(p.safetyStock)}</b>
        <span className="eq">=</span> Siap Jual <span className="res">{num(p.availableToSell)}</span>
      </div>

      {p.availableToSell <= 0 && (
        <div className="wms-note" style={{ marginBottom: 16 }}>
          Siap Jual sudah habis — produk ini seharusnya <strong>distop di semua channel</strong> agar
          tidak ada pesanan baru yang tak bisa dipenuhi.
        </div>
      )}

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title">Antrean Pesanan</div>
            <div className="wms-panel-sub">Dua angka ini sengaja dipisah — terkunci belum tentu sudah keluar gudang.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div>
            <div className="wms-balance-label">Terkunci (belum dikirim)</div>
            <div className="wms-balance-value">{num(queue.terkunci)}</div>
            <div className="wms-kpi-note">dari {num(queue.orders.terkunci)} pesanan</div>
          </div>
          <div>
            <div className="wms-balance-label">Sudah keluar fisik</div>
            <div className="wms-balance-value">{num(queue.dikirim)}</div>
            <div className="wms-kpi-note">dari {num(queue.orders.dikirim)} pesanan</div>
          </div>
        </div>
      </div>

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title">Sebaran per Channel</div>
            <div className="wms-panel-sub">Angka yang seharusnya tampil di tiap channel vs yang sudah benar-benar terkirim.</div>
          </div>
        </div>
        {channels.length === 0 ? (
          <div className="wms-kpi-note">Belum ada toko terhubung.</div>
        ) : (
          <>
            {channels.map((c) => (
              <div className="wms-chan" key={c.storeId}>
                <div>
                  <div className="wms-chan-name">{c.storeName}</div>
                  <div className="wms-chan-meta">
                    {c.channel} · Cadangan {c.safetyStock === null ? `${num(p.safetyStock)} (ikut global)` : num(c.safetyStock)}
                  </div>
                </div>
                <div className="wms-chan-right">
                  <div style={{ textAlign: "right" }}>
                    <div className="wms-chan-name">{num(c.target)}</div>
                    <div className="wms-chan-meta">seharusnya tampil</div>
                  </div>
                  <span className={`wms-chip ${c.inSync ? "aman" : "menipis"}`}>
                    {c.inSync ? "Selaras" : `Terkirim ${num(c.syncedStock)}`}
                  </span>
                </div>
              </div>
            ))}
            {channels.some((c) => !c.inSync) && (
              <div className="wms-note blue" style={{ marginTop: 12 }}>
                Angka Siap Jual belum bisa didorong otomatis ke marketplace — izin ubah-stok
                Shopee/TikTok belum aktif untuk aplikasi ini. Sementara itu perbarui stok di
                Seller Center memakai angka <strong>seharusnya tampil</strong> di atas.
              </div>
            )}
          </>
        )}
      </div>

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title"><Shield size={13} style={{ verticalAlign: "-2px" }} /> Cadangan (buffer anti-oversell)</div>
            <div className="wms-panel-sub">Unit yang sengaja ditahan agar jeda sinkron antar channel tidak berujung oversell.</div>
          </div>
        </div>
        <div className="wms-form-inline">
          <div className="omni-field" style={{ maxWidth: 160 }}>
            <label>Cadangan global</label>
            <input
              className="omni-input" type="number" min="0" value={buffer}
              onChange={(e) => setBuffer(e.target.value)} disabled={locked}
            />
          </div>
          <button className="omni-btn omni-btn-primary" onClick={saveBuffer} disabled={busy || locked}>
            Simpan Cadangan
          </button>
        </div>
      </div>

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title"><ClipboardCheck size={13} style={{ verticalAlign: "-2px" }} /> Stok Opname</div>
            <div className="wms-panel-sub">
              Masukkan hasil hitung fisik. Selisihnya dicatat sebagai mutasi beralasan — angka lama tidak ditimpa diam-diam.
            </div>
          </div>
        </div>
        <form className="wms-form-inline" onSubmit={submitCount}>
          <div className="omni-field" style={{ maxWidth: 150 }}>
            <label>Hitungan fisik</label>
            <input
              className="omni-input" type="number" min="0" required value={counted}
              onChange={(e) => setCounted(e.target.value)} placeholder={String(p.onHand)} disabled={locked}
            />
          </div>
          <div className="omni-field" style={{ minWidth: 220 }}>
            <label>Alasan selisih (wajib)</label>
            <input
              className="omni-input" required minLength={3} value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="rusak / hilang / salah hitung" disabled={locked}
            />
          </div>
          <button className="omni-btn omni-btn-primary" type="submit" disabled={busy || locked}>
            Catat Penyesuaian
          </button>
        </form>
        {counted !== "" && Number(counted) !== p.onHand && (
          <div className="wms-formula" style={{ marginTop: 12 }}>
            Sistem <b>{num(p.onHand)}</b>
            <span className="eq">vs</span> Fisik <b>{num(Number(counted))}</b>
            <span className="eq">→</span> Selisih
            <span className="res">{Number(counted) - p.onHand > 0 ? "+" : ""}{num(Number(counted) - p.onHand)}</span>
          </div>
        )}
      </div>

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title">Riwayat Mutasi Terakhir</div>
            <div className="wms-panel-sub">10 mutasi terbaru produk ini. Selengkapnya ada di Buku Besar Stok.</div>
          </div>
        </div>
        <WmsLedgerTable rows={ledger} compact />
      </div>
    </div>
  );
}
