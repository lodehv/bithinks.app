import { useState } from "react";
import { Store, Boxes, Inbox, Lock } from "lucide-react";
import "./OmniModule.css";
import StoresTab from "./StoresTab";
import ProductsTab from "./ProductsTab";
import OrdersTab from "./OrdersTab";

const TABS = [
  { id: "stores",   label: "Toko Terhubung", icon: Store },
  { id: "products", label: "Produk & Stok",  icon: Boxes },
  { id: "orders",   label: "Pesanan",        icon: Inbox },
];

export default function OmniModule({ locked = false, onRequirePayment }) {
  const [tab, setTab] = useState("stores");

  return (
    <div className="omni">
      {locked && (
        <div className="omni-lock">
          <Lock size={15} />
          <span><strong>Mode hanya-baca.</strong> Trial berakhir — aksi tulis terkunci sampai pembayaran dikonfirmasi.</span>
          <button className="omni-btn omni-btn-primary omni-lock-action" onClick={onRequirePayment}>Bayar Sekarang</button>
        </div>
      )}

      <div className="omni-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`omni-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === "stores"   && <StoresTab   locked={locked} onRequirePayment={onRequirePayment} />}
      {tab === "products" && <ProductsTab locked={locked} onRequirePayment={onRequirePayment} />}
      {tab === "orders"   && <OrdersTab   locked={locked} onRequirePayment={onRequirePayment} />}
    </div>
  );
}
