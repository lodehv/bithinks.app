import { useState } from "react";
import { BookOpen, LayoutDashboard, PackagePlus, Truck, Warehouse } from "lucide-react";
import WmsSummary from "./WmsSummary";
import WmsStockList from "./WmsStockList";
import WmsLedger from "./WmsLedger";
import WmsOutbound from "./WmsOutbound";
import WmsInbound from "./WmsInbound";
import "./Wms.css";
import "../OmniModule.css";

// ─────────────────────────────────────────────────────────────────────────────
// Modul Gudang (WMS). Peta navigasi mengikuti docs/SPEC-wms-uiux.md §3.
// Barang Masuk (PO) & sesi opname multi-produk belum masuk lingkup ini; opname
// per produk sudah tersedia di layar Detail Produk.
// ─────────────────────────────────────────────────────────────────────────────

const VIEWS = [
  { id: "summary", label: "Ringkasan Stok", icon: LayoutDashboard },
  { id: "stock", label: "Produk & Stok", icon: Warehouse },
  { id: "ledger", label: "Buku Besar Stok", icon: BookOpen },
  { id: "inbound", label: "Barang Masuk", icon: PackagePlus },
  { id: "outbound", label: "Outbound", icon: Truck },
];

export default function WmsTab({ locked, onRequirePayment }) {
  const [view, setView] = useState("summary");
  const [stockFilter, setStockFilter] = useState(null);

  // Peringatan di Ringkasan langsung membuka daftar yang sudah tersaring.
  const openList = (alertKey) => {
    setStockFilter(alertKey === "habis" || alertKey === "menipis" ? alertKey : null);
    setView("stock");
  };

  return (
    <div className="wms">
      <div className="wms-sub">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className={view === v.id ? "active" : ""}
            onClick={() => { setView(v.id); if (v.id !== "stock") setStockFilter(null); }}
          >
            <v.icon size={14} /> {v.label}
          </button>
        ))}
      </div>

      {view === "summary" && (
        <WmsSummary locked={locked} onRequirePayment={onRequirePayment} onOpenList={openList} />
      )}
      {view === "stock" && (
        <WmsStockList locked={locked} onRequirePayment={onRequirePayment} initialFilter={stockFilter} />
      )}
      {view === "ledger" && <WmsLedger />}
      {view === "inbound" && <WmsInbound locked={locked} onRequirePayment={onRequirePayment} />}
      {view === "outbound" && <WmsOutbound locked={locked} onRequirePayment={onRequirePayment} />}
    </div>
  );
}
