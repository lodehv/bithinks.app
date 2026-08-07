import { useEffect, useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import { omniApi } from "../../../../utils/omniApi";
import WmsProductDetail from "./WmsProductDetail";
import WmsStockRow from "./WmsStockRow";

// ─────────────────────────────────────────────────────────────────────────────
// Daftar Produk & Stok (SPEC §4.2).
// Urutan datang dari server: Habis di atas, lalu Menipis. Yang butuh tindakan
// tidak boleh tenggelam di bawah.
//
// Kolom Terkunci Pesanan dan Channel tidak ditampilkan di tabel ini agar ringkas;
// keduanya tetap ada di halaman detail produk. Baris & kolom yang bisa diubah
// langsung diatur di WmsStockRow.
// ─────────────────────────────────────────────────────────────────────────────

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "habis", label: "Habis" },
  { id: "menipis", label: "Menipis" },
  { id: "aman", label: "Aman" },
];

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
            Stok Fisik = Stok Tersedia + Stok Dialokasikan. Yang bisa diubah hanya Stok Fisik,
            Cadangan, dan Stok Akan Datang — Tersedia bergerak sendiri lewat scan resi.
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
              ? "Tambahkan produk master di Kelola Produk terlebih dahulu, lalu stoknya bisa diatur di sini."
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
                <th style={{ textAlign: "right" }}>Stok Tersedia</th>
                <th style={{ textAlign: "right" }}>Dialokasikan</th>
                <th style={{ textAlign: "right" }}>Cadangan</th>
                <th style={{ textAlign: "right" }}>Stok Akan Datang</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <WmsStockRow
                  key={row.productId}
                  row={row}
                  onOpen={setOpenId}
                  locked={locked}
                  onRequirePayment={onRequirePayment}
                  onSaved={() => setReloadKey((k) => k + 1)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
