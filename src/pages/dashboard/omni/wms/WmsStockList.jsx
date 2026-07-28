import { useEffect, useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import { omniApi } from "../../../../utils/omniApi";
import WmsProductDetail from "./WmsProductDetail";

// ─────────────────────────────────────────────────────────────────────────────
// Daftar Produk & Stok — tabel utama dengan lima saldo (SPEC §4.2).
// Urutan datang dari server: Habis di atas, lalu Menipis. Yang butuh tindakan
// tidak boleh tenggelam di bawah.
// ─────────────────────────────────────────────────────────────────────────────

const num = (n) => (n ?? 0).toLocaleString("id-ID");

const STATUS_LABEL = { aman: "Aman", menipis: "Menipis", habis: "Habis" };

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "habis", label: "Habis" },
  { id: "menipis", label: "Menipis" },
  { id: "aman", label: "Aman" },
];

function StockRow({ row, onOpen }) {
  return (
    <tr className="wms-row-clickable" onClick={() => onOpen(row.productId)}>
      <td>
        <div className="wms-prod">
          {row.imageUrl
            ? <img src={row.imageUrl} alt="" />
            : <div className="ph"><Package size={15} /></div>}
          <div style={{ minWidth: 0 }}>
            <div className="wms-prod-name">{row.name}</div>
            <div className="wms-prod-sku">{row.sku}{row.category ? ` · ${row.category}` : ""}</div>
          </div>
        </div>
      </td>
      <td className="wms-num">{num(row.onHand)}</td>
      <td className="wms-num">{num(row.allocated)}</td>
      <td className={`wms-num strong ${row.availableToSell < 0 ? "neg" : ""}`}>{num(row.availableToSell)}</td>
      <td className="wms-num">{num(row.safetyStock)}</td>
      <td className="wms-num">
        {row.incoming > 0
          ? <span className="wms-chip info">+{num(row.incoming)} dtg</span>
          : <span className="omni-cell-muted">—</span>}
      </td>
      <td>
        {row.channels.length === 0
          ? <span className="omni-cell-muted">Belum ada toko</span>
          : <span className="omni-cell-muted">
              {row.channelsPending === 0
                ? `${row.channels.length} channel selaras`
                : `${row.channelsPending} dari ${row.channels.length} menunggu`}
            </span>}
      </td>
      <td><span className={`wms-chip ${row.status}`}>{STATUS_LABEL[row.status]}</span></td>
    </tr>
  );
}

export default function WmsStockList({ locked, onRequirePayment, initialFilter }) {
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    omniApi.wmsStock()
      .then((d) => { if (alive) setRows(d); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [reloadKey]);

  // Peringatan di Ringkasan bisa membuka daftar ini sudah tersaring.
  const [appliedFilter, setAppliedFilter] = useState(null);
  if (initialFilter !== appliedFilter) {
    setAppliedFilter(initialFilter);
    if (initialFilter === "habis" || initialFilter === "menipis") setStatus(initialFilter);
  }

  const categories = useMemo(
    () => Array.from(new Set((rows ?? []).map((r) => r.category).filter(Boolean))).sort(),
    [rows],
  );

  const shown = useMemo(() => {
    let list = rows ?? [];
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (category !== "all") list = list.filter((r) => r.category === category);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q));
    return list;
  }, [rows, status, category, search]);

  if (openId) {
    return (
      <WmsProductDetail
        productId={openId}
        locked={locked}
        onRequirePayment={onRequirePayment}
        onBack={() => { setOpenId(null); setReloadKey((k) => k + 1); }}
      />
    );
  }

  if (rows === null) return <div className="omni-loading">Memuat daftar stok…</div>;

  return (
    <div>
      <div className="omni-toolbar">
        <div>
          <div className="omni-toolbar-title">Produk & Stok</div>
          <div className="omni-toolbar-sub">
            Siap Jual = Stok Fisik − Terkunci Pesanan − Cadangan. Klik baris untuk rincian & penyesuaian.
          </div>
        </div>
      </div>

      <div className="wms-filters">
        <div className="omni-field" style={{ minWidth: 210 }}>
          <label><Search size={11} style={{ verticalAlign: "-1px" }} /> Cari produk</label>
          <input
            className="omni-input"
            placeholder="Nama atau SKU master"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="omni-field" style={{ maxWidth: 170 }}>
          <label>Status stok</label>
          <select className="omni-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
        <div className="omni-field" style={{ maxWidth: 190 }}>
          <label>Kategori</label>
          <select className="omni-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Semua kategori</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="omni-empty">
          <div className="omni-empty-icon"><Package size={22} /></div>
          <h3>{(rows ?? []).length === 0 ? "Belum ada produk master" : "Tidak ada yang cocok"}</h3>
          <p>
            {(rows ?? []).length === 0
              ? "Tambahkan produk master di tab Produk & Stok, lalu petakan resep SKU marketplace agar stok ikut terpotong otomatis."
              : "Ubah kata kunci atau filter untuk melihat produk lain."}
          </p>
        </div>
      ) : (
        <div className="omni-table-wrap">
          <table className="omni-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th style={{ textAlign: "right" }}>Stok Fisik</th>
                <th style={{ textAlign: "right" }}>Terkunci</th>
                <th style={{ textAlign: "right" }}>Siap Jual</th>
                <th style={{ textAlign: "right" }}>Cadangan</th>
                <th style={{ textAlign: "right" }}>Dalam Perjalanan</th>
                <th>Channel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => <StockRow key={row.productId} row={row} onOpen={setOpenId} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
