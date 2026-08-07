import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ClipboardCheck, Shield, ScanLine, PackagePlus } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../../utils/omniApi";
import WmsLedgerTable from "./WmsLedgerTable";
import FulfillBar from "./WmsFulfillBar";

// ─────────────────────────────────────────────────────────────────────────────
// Detail Produk — kartu saldo, asal tiap angka, sebaran channel, dan mini Buku Besar.
//
// Mengikuti model tiga angka: `Stok Fisik = Stok Tersedia + Stok Dialokasikan`.
// Tiap angka yang bukan hasil ketikan user dibuat bisa DITELUSURI ke asalnya —
// Dialokasikan ke sesi outbound yang resinya sudah dipindai, Akan Datang ke PO
// yang belum tuntas. Angka turunan tanpa asal-usul cepat jadi angka yang tak
// dipercaya siapa pun.
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
      setMsg({ type: "ok", text: "Cadangan disimpan. Ia hanya ambang peringatan menipis — tidak mengurangi angka mana pun." });
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

  const { product: p, channels, claims, ledger } = data;

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
        <Balance label="Stok Tersedia" value={p.availableToSell} ats />
        <Balance label="Stok Dialokasikan" value={p.allocated} />
        <Balance label="Cadangan" value={p.safetyStock} />
        <Balance label="Stok Akan Datang" value={p.incoming} />
      </div>

      <div className="wms-formula" style={{ marginBottom: 16 }}>
        Stok Fisik <b>{num(p.onHand)}</b>
        <span className="eq">=</span> Tersedia <b>{num(p.availableToSell)}</b>
        <span className="eq">+</span> Dialokasikan <span className="res">{num(p.allocated)}</span>
      </div>

      {p.availableToSell <= 0 && (
        <div className="wms-note" style={{ marginBottom: 16 }}>
          Stok Tersedia sudah habis — produk ini seharusnya <strong>distop di semua channel</strong>
          agar tidak ada pesanan baru yang tak bisa dipenuhi.
        </div>
      )}

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title">
              <ScanLine size={13} style={{ verticalAlign: "-2px" }} /> Asal Stok Dialokasikan
            </div>
            <div className="wms-panel-sub">
              Sesi outbound yang resinya sudah dipindai tapi picking list-nya belum — barangnya
              masih di rak, tapi sudah terikat pesanan.
            </div>
          </div>
        </div>
        {claims.length === 0 ? (
          <div className="wms-kpi-note">
            Belum ada yang dialokasikan. Angka Dialokasikan naik saat resi dipindai di tab Outbound.
          </div>
        ) : (
          <div className="wms-po-list">
            {claims.map((c) => (
              <div className="wms-po-row" key={c.id}>
                <span className="ico"><ScanLine size={14} /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="wms-prod-name">{c.code}</div>
                  <div className="wms-prod-sku">
                    {c.status === "siap_pick" ? "Picking list sudah dicetak" : "Masih menerima pindaian resi"}
                  </div>
                </div>
                <div className="wms-po-qty"><strong>{num(c.qty)}</strong> unit terikat</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title">
              <PackagePlus size={13} style={{ verticalAlign: "-2px" }} /> Stok Akan Datang
            </div>
            <div className="wms-panel-sub">
              PO yang belum tuntas. Angkanya berkurang sendiri saat barang diterima —
              tidak bisa diketik langsung.
            </div>
          </div>
        </div>
        {(p.incomingOrders ?? []).length === 0 ? (
          <div className="wms-kpi-note">Tidak ada PO yang belum tuntas untuk produk ini.</div>
        ) : (
          <div className="wms-po-list">
            {p.incomingOrders.map((o) => (
              <div className="wms-po-row" key={o.id}>
                <span className="ico"><PackagePlus size={14} /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="wms-prod-name">{o.code}</div>
                  <div className="wms-prod-sku">{o.supplier || "Tanpa supplier"}</div>
                </div>
                <div className="wms-po-qty">
                  <strong>{num(o.qtyReceived)}</strong> dari {num(o.qtyOrdered)} tiba
                  <div className="wms-prod-sku">sisa {num(o.sisa)}</div>
                </div>
                <div style={{ minWidth: 130 }}>
                  <FulfillBar ordered={o.qtyOrdered} received={o.qtyReceived} />
                </div>
              </div>
            ))}
          </div>
        )}
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
                Angka Tersedia belum bisa didorong otomatis ke marketplace — izin ubah-stok
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
            <div className="wms-panel-sub">Ambang peringatan menipis. Tidak mengurangi Stok Tersedia maupun Stok Fisik.</div>
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
