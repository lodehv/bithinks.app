import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Info, RefreshCw } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// Ringkasan Stok — dalam 3 detik user tahu stoknya sehat atau ada yang bahaya.
// Isinya KPI + peringatan, bukan tabel lengkap (SPEC §4.1).
// Angka kosong ditulis apa adanya; tidak ada data contoh.
// ─────────────────────────────────────────────────────────────────────────────

const rupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");
const num = (n) => (n ?? 0).toLocaleString("id-ID");

const ALERT_TONE = {
  habis: "habis",
  menipis: "menipis",
  fisik_minus: "habis",
  sku_belum_dipetakan: "info",
  channel_belum_sinkron: "info",
};

function Kpi({ label, value, note, negative }) {
  const empty = value === null || value === undefined;
  // Nilai panjang (nominal rupiah) dikecilkan sedikit agar tidak patah dua baris
  // di kartu yang berbagi lebar dengan lima kartu lain.
  const long = !empty && String(value).length >= 12;
  return (
    <div className="wms-kpi">
      <div className="wms-kpi-label">{label}</div>
      <div className={`wms-kpi-value ${empty ? "empty" : ""} ${long ? "long" : ""} ${negative ? "neg" : ""}`}>
        {empty ? "Belum ada data" : value}
      </div>
      {note && <div className="wms-kpi-note">{note}</div>}
    </div>
  );
}

/** Grafik Masuk vs Keluar memakai WAKTU FISIK barang bergerak, bukan tanggal pesanan. */
function MovementChart({ data }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.masuk, d.keluar)));
  return (
    <div className="wms-panel">
      <div className="wms-panel-head">
        <div>
          <div className="wms-panel-title">Mutasi Masuk vs Keluar</div>
          <div className="wms-panel-sub">30 hari terakhir · memakai jam barang benar-benar bergerak</div>
        </div>
        <div className="wms-legend">
          <span><i className="masuk" /> Masuk</span>
          <span><i className="keluar" /> Keluar</span>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="wms-kpi-note">Belum ada mutasi stok pada rentang ini.</div>
      ) : (
        <div className="wms-bars">
          {data.map((d) => (
            <div className="wms-bar-col" key={d.bucket}>
              <div className="wms-bar-pair">
                <div className="wms-bar masuk" style={{ height: `${(d.masuk / max) * 100}%` }} title={`Masuk ${num(d.masuk)}`} />
                <div className="wms-bar keluar" style={{ height: `${(d.keluar / max) * 100}%` }} title={`Keluar ${num(d.keluar)}`} />
              </div>
              <div className="wms-bar-label">{d.bucket.slice(5)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WmsSummary({ locked, onRequirePayment, onOpenList }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(
    () => omniApi.wmsSummary().then(setData).catch(() => setData(false)),
    [],
  );
  useEffect(() => { load(); }, [load]);

  const reconcile = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await omniApi.wmsReconcile({ sinceDays: 90 });
      await load();
      setMsg({
        type: "ok",
        text: `Selesai memeriksa ${num(res.orders)} pesanan · ${num(res.movements)} mutasi stok dicatat.`
          + (res.unmappedSkus?.length ? ` ${res.unmappedSkus.length} SKU masih belum punya resep.` : ""),
      });
    } catch (err) {
      if (isPaymentRequired(err)) { onRequirePayment?.(); return; }
      setMsg({ type: "err", text: err?.response?.data?.error?.message ?? "Gagal menghitung ulang stok." });
    } finally { setBusy(false); }
  };

  if (data === null) return <div className="omni-loading">Memuat ringkasan stok…</div>;
  if (data === false) return <div className="omni-inline-msg">Gagal memuat ringkasan stok.</div>;

  const { kpi, alerts, movement } = data;

  return (
    <div>
      <div className="omni-toolbar">
        <div>
          <div className="omni-toolbar-title">Ringkasan Stok</div>
          <div className="omni-toolbar-sub">
            Satu stok fisik untuk semua channel. Setiap angka bisa ditelusuri di Buku Besar.
          </div>
        </div>
        <button className="omni-btn omni-btn-ghost" onClick={reconcile} disabled={busy || locked}>
          <RefreshCw size={14} className={busy ? "spin" : ""} /> {busy ? "Menghitung…" : "Hitung Ulang dari Pesanan"}
        </button>
      </div>

      {msg && <div className={`wms-msg ${msg.type}`}>{msg.text}</div>}

      <div className="wms-kpis">
        <Kpi label="SKU Aktif" value={num(kpi.skuAktif)} />
        <Kpi
          label="Nilai Stok"
          value={kpi.nilaiStok === null ? null : rupiah(kpi.nilaiStok)}
          note={kpi.nilaiStok === null
            ? "HPP produk belum diisi"
            : kpi.nilaiStokParsial ? "Sebagian produk belum punya HPP" : null}
        />
        <Kpi label="Stok Fisik" value={num(kpi.stokFisik)} />
        <Kpi label="Terkunci Pesanan" value={num(kpi.terkunci)} />
        <Kpi label="Tersedia" value={num(kpi.siapJual)} negative={kpi.siapJual < 0} />
        <Kpi
          label="Stok Akan Datang"
          value={num(kpi.dalamPerjalanan)}
          note={kpi.dalamPerjalanan === 0 ? "Barang Masuk (PO) belum aktif" : null}
        />
      </div>

      {alerts.length === 0 ? (
        <div className="wms-ok"><CheckCircle2 size={16} /> Tidak ada stok yang perlu ditangani sekarang.</div>
      ) : (
        <div className="wms-alerts">
          {alerts.map((a) => {
            const tone = ALERT_TONE[a.key] ?? "info";
            const Icon = tone === "habis" ? Ban : tone === "menipis" ? AlertTriangle : Info;
            return (
              <div
                className={`wms-alert ${tone}`}
                key={a.key}
                onClick={() => onOpenList?.(a.key)}
                style={{ cursor: onOpenList ? "pointer" : "default" }}
              >
                <Icon size={16} className="ico" />
                <div className="wms-alert-body">
                  <div className="wms-alert-title">{a.label}</div>
                  {a.samples.length > 0 && (
                    <div className="wms-alert-samples">
                      {a.samples.join(" · ")}{a.count > a.samples.length ? ` · +${a.count - a.samples.length} lagi` : ""}
                    </div>
                  )}
                </div>
                <div className="wms-alert-count">{num(a.count)} {a.unit}</div>
              </div>
            );
          })}
        </div>
      )}

      <MovementChart data={movement} />

      <div className="wms-note">
        <strong>Stok tidak lagi bergerak otomatis.</strong> Pesanan yang masuk tidak menurunkan
        Stok Fisik maupun Tersedia — keempat angka disetel manual dan berdiri sendiri, menunggu
        alur baru disusun. Laporan COGS di Kelola Produk tidak terpengaruh karena dihitung
        langsung dari pesanan dan resep SKU, bukan dari saldo gudang.
      </div>
    </div>
  );
}
