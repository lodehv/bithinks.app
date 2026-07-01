import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import { channelMeta } from "./channels";
import "./OmniModule.css";

const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

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
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy]     = useState(null);

  const load = (status) => {
    setOrders(null);
    omniApi.listOrders(status || undefined).then(setOrders).catch(() => setOrders([]));
  };
  useEffect(() => { load(filter); }, [filter]);

  const changeStatus = async (id, status) => {
    if (locked) return onRequirePayment?.();
    setBusy(id);
    try {
      await omniApi.updateOrderStatus(id, status);
      load(filter);
    } catch (err) {
      if (isPaymentRequired(err)) onRequirePayment?.();
    } finally { setBusy(null); }
  };

  return (
    <div>
      <div className="omni-toolbar">
        <div>
          <div className="omni-toolbar-title">Pesanan Terpusat</div>
          <div className="omni-toolbar-sub">Semua pesanan dari setiap channel dalam satu inbox — tanpa rekap manual.</div>
        </div>
      </div>

      <div className="omni-segment">
        {STATUS.map((s) => (
          <button key={s.id} className={`omni-chip-btn ${filter === s.id ? "active" : ""}`} onClick={() => setFilter(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {orders === null ? (
        <div className="omni-loading">Memuat pesanan…</div>
      ) : orders.length === 0 ? (
        <div className="omni-empty">
          <div className="omni-empty-icon"><Inbox size={24} /></div>
          <h3>Belum ada pesanan</h3>
          <p>Pesanan dari Shopee & TikTok Shop akan masuk ke sini secara otomatis setelah toko terhubung.</p>
        </div>
      ) : (
        <div className="omni-table-wrap">
          <table className="omni-table">
            <thead>
              <tr><th>Channel</th><th>No. Pesanan</th><th>Pelanggan</th><th>Item</th><th>Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {orders.map((o) => {
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
