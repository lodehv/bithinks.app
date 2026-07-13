import { useState } from "react";
import { ChevronDown, Copy, Package, MapPin, Truck, CheckCircle2, Clock } from "lucide-react";
import { channelMeta } from "./channels";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";

const LOGOS = { shopee: shopeeLogo, tiktok: tiktokLogo };
const rupiah = (n) => (n === null || n === undefined ? "—" : "Rp " + Number(n).toLocaleString("id-ID"));
const fmt = (d) =>
  d ? new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS_LABEL = {
  baru: "Perlu Diproses", dikemas: "Perlu Dikirim", dikirim: "Dikirim", selesai: "Selesai", batal: "Dibatalkan",
};
const pillClass = (s) =>
  s === "selesai" ? "sync" : s === "batal" ? "error" : s === "baru" ? "neutral" : "unsync";

const STATUS_OPTS = ["baru", "dikemas", "dikirim", "selesai", "batal"];

export default function OrderCard({ order: o, onChangeStatus, busy }) {
  const [open, setOpen] = useState(false);
  const m = channelMeta(o.channel);
  const logo = LOGOS[o.channel];
  const first = o.items?.[0];
  const paid = o.channelStatus && /unpaid/i.test(o.channelStatus) ? false : true;

  const copy = (e, text) => { e.stopPropagation(); navigator.clipboard?.writeText(text); };

  return (
    <div className={`ord-card ${open ? "open" : ""}`}>
      <div className="ord-row" onClick={() => setOpen((v) => !v)}>
        <div className="ord-thumb">
          {first?.imageUrl
            ? <img src={first.imageUrl} alt="" />
            : (logo ? <img src={logo} alt={m.label} className="ord-thumb-logo" /> : <Package size={20} />)}
        </div>

        <div className="ord-main">
          <div className="ord-line1">
            No. <b>{o.externalOrderNo || o.id.slice(0, 8)}</b>
            <button className="ord-copy" title="Salin" onClick={(e) => copy(e, o.externalOrderNo || "")}><Copy size={12} /></button>
            <span className="ord-dot-sep">·</span> <span className="ord-date">{fmt(o.orderedAt)}</span>
          </div>
          <div className="ord-title">{first?.name || "—"}</div>
          <div className="ord-itemcount">{o.itemCount} item</div>
        </div>

        <div className="ord-money">
          <div className="ord-money-label">GMV</div>
          <div className="ord-gmv">{rupiah(o.total)}</div>
          <div className="ord-cogs">COGS —</div>
        </div>

        <div className="ord-recv">
          <div className="ord-money-label">Penerima</div>
          <div className="ord-recv-name">{o.recipientName || o.customerName || "—"}</div>
          <div className="ord-resi"><Package size={12} /> {o.trackingNumber || "—"}</div>
        </div>

        <div className="ord-status-col">
          <span className={`omni-pill ${pillClass(o.status)}`}>{o.status.toUpperCase()}</span>
        </div>

        <ChevronDown size={18} className="ord-chevron" />
      </div>

      {open && (
        <div className="ord-detail">
          <div className="ord-badges">
            <span className={`ord-badge ${pillClass(o.status)}`}>{STATUS_LABEL[o.status]}</span>
            <span className={`ord-badge ${paid ? "sync" : "unsync"}`}>
              {paid ? <><CheckCircle2 size={13} /> Sudah Dibayar</> : <><Clock size={13} /> Belum Dibayar</>}
            </span>
            <span className="ord-badge-spacer" />
            <span className="ord-shop">{o.storeName || m.label}</span>
            {logo && <img src={logo} alt={m.label} className="ord-shop-logo" />}
          </div>

          {/* Rincian item (master produk & COGS menyusul) */}
          <div className="ord-section-title">Rincian Item</div>
          <div className="ord-items-wrap">
            <table className="ord-items">
              <thead>
                <tr><th>SKU Pesanan</th><th>Produk</th><th>Qty</th><th>Harga</th><th style={{ textAlign: "right" }}>Subtotal</th></tr>
              </thead>
              <tbody>
                {(o.items ?? []).map((it, i) => (
                  <tr key={i}>
                    <td className="ord-sku">{it.sku || "—"}</td>
                    <td>
                      <div className="ord-item-prod">
                        <span className="ord-item-thumb">
                          {it.imageUrl ? <img src={it.imageUrl} alt="" loading="lazy" /> : <Package size={16} />}
                        </span>
                        <span>{it.name}</span>
                      </div>
                    </td>
                    <td>{it.qty}</td>
                    <td>{rupiah(it.price)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{rupiah(it.price * it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ord-note">Master produk keluar & COGS/HPP otomatis tampil setelah SKU dipetakan ke master produk.</div>

          {/* Ringkasan keuangan */}
          <div className="ord-fin">
            <div className="ord-fin-card"><span>Harga Sblm Diskon</span><b>{rupiah(o.subtotalGross)}</b></div>
            <div className="ord-fin-card"><span>Diskon Seller</span><b className="neg">{o.sellerDiscount ? "−" + rupiah(o.sellerDiscount) : "—"}</b></div>
            <div className="ord-fin-card"><span>GMV (Omset)</span><b>{rupiah(o.total)}</b></div>
            <div className="ord-fin-card"><span>Total Bayar</span><b>{rupiah(o.totalPaid ?? o.total)}</b></div>
          </div>

          {/* Alamat & logistik */}
          <div className="ord-grid2">
            <div>
              <div className="ord-section-title"><MapPin size={14} /> Alamat Penerima</div>
              <div className="ord-addr-name">{o.recipientName || "—"}</div>
              <div className="ord-addr">{o.recipientAddress || "—"}</div>
              {o.recipientPhone && <div className="ord-addr-phone">{o.recipientPhone}</div>}
            </div>
            <div>
              <div className="ord-section-title"><Truck size={14} /> Logistik</div>
              <div className="ord-log-row">Metode: <span className="ord-log-val">{o.deliveryOption || o.shippingProvider || "—"}</span></div>
              <div className="ord-log-row">No. Resi: <span className="ord-log-val">{o.trackingNumber || "—"}</span></div>
              <div className="ord-log-row" style={{ marginTop: 10 }}>
                Ubah status:{" "}
                <select className="omni-select" style={{ padding: "5px 8px", fontSize: 12 }}
                  value={o.status} disabled={busy} onChange={(e) => onChangeStatus(o.id, e.target.value)}>
                  {STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
