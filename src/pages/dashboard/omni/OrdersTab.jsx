import { useEffect, useMemo, useState } from "react";
import { Inbox, RefreshCw, ShoppingBag, Truck, Wallet, ClipboardList } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import { channelMeta } from "./channels";
import "./OmniModule.css";

const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const rupiahShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return "Rp " + (v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt";
  if (v >= 1_000) return "Rp " + Math.round(v / 1_000).toLocaleString("id-ID") + " rb";
  return rupiah(v);
};

const STATUS = [
  { id: "",        label: "Semua" },
  { id: "baru",    label: "Baru" },
  { id: "dikemas", label: "Dikemas" },
  { id: "dikirim", label: "Dikirim" },
  { id: "selesai", label: "Selesai" },
  { id: "batal",   label: "Batal" },
];

const pillClass = (s) =>
  s === "selesai" ? "sync" : s === "batal" ? "error" : s === "baru" ? "neutral" : "unsync";

export default function OrdersTab({ locked, onRequirePayment }) {
  const [orders, setOrders] = useState(null); // semua pesanan (tanpa filter)
  const [filter, setFilter] = useState("");
  const [busy, setBusy]     = useState(null);

  const load = () => {
    setOrders(null);
    omniApi.listOrders().then(setOrders).catch(() => setOrders([]));
  };
  useEffect(load, []);

  const changeStatus = async (id, status) => {
    if (locked) return onRequirePayment?.();
    setBusy(id);
    try {
      await omniApi.updateOrderStatus(id, status);
      load();
    } catch (err) {
      if (isPaymentRequired(err)) onRequirePayment?.();
    } finally { setBusy(null); }
  };

  // ─── Ringkasan dihitung dari seluruh pesanan ───────────────────────────────
  const summary = useMemo(() => {
    const list = orders ?? [];
    const by = (s) => list.filter((o) => o.status === s).length;
    const omzet = list.filter((o) => o.status !== "batal").reduce((a, o) => a + Number(o.total || 0), 0);
    const channels = {};
    list.forEach((o) => { channels[o.channel] = (channels[o.channel] || 0) + 1; });
    return {
      total: list.length,
      perluProses: by("baru") + by("dikemas"),
      dikirim: by("dikirim"),
      omzet,
      channels,
    };
  }, [orders]);

  const shown = useMemo(
    () => (filter ? (orders ?? []).filter((o) => o.status === filter) : (orders ?? [])),
    [orders, filter]
  );

  const cards = [
    { icon: ShoppingBag,  label: "Total Pesanan",  value: summary.total,                sub: "semua channel",       tone: "" },
    { icon: ClipboardList, label: "Perlu Diproses", value: summary.perluProses,          sub: "baru & dikemas",      tone: "amber" },
    { icon: Truck,        label: "Dikirim",         value: summary.dikirim,              sub: "dalam pengiriman",    tone: "blue" },
    { icon: Wallet,       label: "Total Omzet",     value: rupiahShort(summary.omzet),   sub: "di luar pesanan batal", tone: "green" },
  ];

  return (
    <div>
      <div className="omni-toolbar" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="omni-toolbar-title">Pesanan Terpusat</div>
          <div className="omni-toolbar-sub">Semua pesanan dari setiap channel dalam satu inbox — tanpa rekap manual.</div>
        </div>
        <button className="omni-refresh-btn" onClick={load} disabled={orders === null}>
          <RefreshCw size={14} className={orders === null ? "omni-spin" : ""} /> Segarkan
        </button>
      </div>

      {/* Kartu ringkasan */}
      <div className="omni-stats">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div className="omni-stat" key={c.label}>
              <div className="omni-stat-label"><Icon size={14} /> {c.label}</div>
              <div className={`omni-stat-value ${c.tone}`}>{orders === null ? "…" : c.value}</div>
              <div className="omni-stat-sub">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Breakdown channel */}
      {orders && orders.length > 0 && (
        <div className="omni-channel-row">
          {Object.entries(summary.channels).map(([ch, n]) => {
            const m = channelMeta(ch);
            return (
              <span className="omni-channel-tag" key={ch}>
                <span className="dot" style={{ background: m.color }} />{m.label}<b>{n}</b>
              </span>
            );
          })}
        </div>
      )}

      {/* Filter status */}
      <div className="omni-segment">
        {STATUS.map((s) => {
          const count = s.id ? (orders ?? []).filter((o) => o.status === s.id).length : (orders ?? []).length;
          return (
            <button key={s.id} className={`omni-chip-btn ${filter === s.id ? "active" : ""}`} onClick={() => setFilter(s.id)}>
              {s.label}{orders && <span className="omni-chip-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {orders === null ? (
        <div className="omni-loading">Memuat pesanan…</div>
      ) : shown.length === 0 ? (
        <div className="omni-empty">
          <div className="omni-empty-icon"><Inbox size={24} /></div>
          <h3>{filter ? "Tidak ada pesanan pada status ini" : "Belum ada pesanan"}</h3>
          <p>Pesanan dari Shopee &amp; TikTok Shop akan masuk ke sini secara otomatis setelah toko terhubung.</p>
        </div>
      ) : (
        <div className="omni-table-wrap">
          <table className="omni-table">
            <thead>
              <tr><th>Channel</th><th>No. Pesanan</th><th>Pelanggan</th><th>Item</th><th>Total</th><th>Status</th><th>Ubah</th></tr>
            </thead>
            <tbody>
              {shown.map((o) => {
                const m = channelMeta(o.channel);
                return (
                  <tr key={o.id}>
                    <td><span className="omni-pill neutral"><span className="dot" style={{ background: m.color }} />{m.label}</span></td>
                    <td className="omni-cell-strong">{o.externalOrderNo || o.id.slice(0, 8)}</td>
                    <td>{o.customerName || <span className="omni-cell-muted">—</span>}</td>
                    <td className="omni-cell-muted">{o.itemCount} item</td>
                    <td className="omni-cell-strong">{rupiah(o.total)}</td>
                    <td><span className={`omni-pill ${pillClass(o.status)}`}>{o.status.toUpperCase()}</span></td>
                    <td>
                      <select className="omni-select" style={{ padding: "6px 8px", fontSize: 12 }}
                        value={o.status} disabled={busy === o.id}
                        onChange={(e) => changeStatus(o.id, e.target.value)}>
                        {STATUS.filter((s) => s.id).map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
