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
// Kolom Channel tidak ditampilkan di tabel ini agar ringkas — ia tetap ada di
// halaman detail produk. Baris & kolom yang bisa diubah diatur di WmsStockRow.
// ─────────────────────────────────────────────────────────────────────────────

// Urutan sengaja dari yang paling gawat: yang butuh tindakan ada di kiri, tempat
// mata jatuh lebih dulu. Warnanya mengikuti tangga perhatian yang sama dengan
// chip status di tabel — hitam pekat paling mendesak, putih paling tenang.
const STATUS_CARDS = [
  { id: "habis",   label: "Stok Habis",   hint: "Tersedia sudah ≤ 0" },
  { id: "menipis", label: "Stok Menipis", hint: "Tersedia menyentuh Cadangan" },
  { id: "aman",    label: "Stok Aman",    hint: "Tidak perlu tindakan" },
];

export default function WmsStockList({ locked, onRequirePayment, initialFilter }) {
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [justEdited, setJustEdited] = useState(() => new Set());

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

  /**
   * Perbarui satu baris DI TEMPAT. Urutan daftar (Habis di atas, lalu Menipis)
   * hanya dihitung ulang saat halaman dimuat — bukan tiap kali menyimpan. Kalau
   * diurutkan ulang tiap simpan, produk yang baru saja diperbaiki langsung
   * melompat ke bagian bawah dan operator kehilangan jejak apa yang barusan
   * dikerjakannya. Angka & statusnya tetap ikut berubah, cuma posisinya diam.
   */
  const applyRowUpdate = (updated) => {
    if (!updated?.productId) { setReloadKey((k) => k + 1); return; }
    setRows((prev) => (prev ?? []).map(
      (r) => (r.productId === updated.productId ? { ...r, ...updated } : r),
    ));
    // Baris yang baru diedit ditahan tetap terlihat walau statusnya berubah dan
    // tak lagi cocok dengan penyaring aktif. Tanpa ini, memperbaiki produk
    // "Habis" membuat barisnya lenyap seketika — terasa seperti hilang, bukan
    // seperti selesai. Ia baru menyesuaikan diri saat penyaring diganti.
    setJustEdited((prev) => new Set(prev).add(updated.productId));
  };

  const counts = useMemo(() => {
    const c = { habis: 0, menipis: 0, aman: 0 };
    for (const r of rows ?? []) if (c[r.status] !== undefined) c[r.status] += 1;
    return c;
  }, [rows]);

  const categories = useMemo(
    () => Array.from(new Set((rows ?? []).map((r) => r.category).filter(Boolean))).sort(),
    [rows],
  );

  const shown = useMemo(() => {
    let list = rows ?? [];
    if (status !== "all") {
      list = list.filter((r) => r.status === status || justEdited.has(r.productId));
    }
    if (category !== "all") list = list.filter((r) => r.category === category);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q));
    return list;
  }, [rows, status, category, search, justEdited]);

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

      <div className="wms-status-cards">
        {STATUS_CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`wms-status-card ${c.id} ${status === c.id ? "active" : ""}`}
            aria-pressed={status === c.id}
            // Menekan kartu yang sedang aktif mengembalikan daftar ke semua produk,
            // supaya tidak ada jalan buntu tanpa tombol "reset" tersendiri.
            onClick={() => {
              setJustEdited(new Set());
              setStatus(status === c.id ? "all" : c.id);
            }}
          >
            <span className="wms-status-card-label">{c.label}</span>
            <span className="wms-status-card-count">{counts[c.id]}</span>
            <span className="wms-status-card-hint">{c.hint}</span>
          </button>
        ))}
      </div>

      {status !== "all" && (
        <div className="wms-status-active">
          Menampilkan {STATUS_CARDS.find((c) => c.id === status)?.label.toLowerCase()} saja.
          <button type="button" onClick={() => { setJustEdited(new Set()); setStatus("all"); }}>
            Tampilkan semua produk
          </button>
        </div>
      )}

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
                  onSaved={applyRowUpdate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
