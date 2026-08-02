import { useState } from "react";
import { ScanLine, Keyboard, ClipboardList, MinusCircle, PackageMinus } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Outbound (Barang Keluar) — kerangka navigasi. Alurnya belum ditetapkan, jadi
// tiap panel sengaja dibiarkan kosong alih-alih diisi tampilan sementara yang
// nanti harus dibongkar lagi.
//
//   Outbound
//   ├── Pengurangan Stok Tersedia
//   │   ├── Scan
//   │   └── Input Nomor Pesanan          (manual)
//   └── Pengurangan Stok Fisik
//       └── Scan Picking List
//
// Pemisahan ini mengikuti dua peristiwa yang memang beda waktunya: stok TERSEDIA
// berkurang saat pesanan masuk (barang masih di rak, tapi sudah tidak boleh
// dijual lagi), sedangkan stok FISIK baru berkurang saat barang benar-benar
// diambil dari rak lewat picking list.
// ─────────────────────────────────────────────────────────────────────────────

const GROUPS = [
  {
    id: "tersedia",
    label: "Pengurangan Stok Tersedia",
    icon: MinusCircle,
    subs: [
      { id: "scan", label: "Scan", icon: ScanLine },
      { id: "manual", label: "Input Nomor Pesanan", icon: Keyboard },
    ],
  },
  {
    id: "fisik",
    label: "Pengurangan Stok Fisik",
    icon: PackageMinus,
    subs: [
      { id: "picking", label: "Scan Picking List", icon: ClipboardList },
    ],
  },
];

export default function WmsOutbound() {
  const [groupId, setGroupId] = useState(GROUPS[0].id);
  const [subId, setSubId] = useState(GROUPS[0].subs[0].id);

  const group = GROUPS.find((g) => g.id === groupId) ?? GROUPS[0];
  const sub = group.subs.find((s) => s.id === subId) ?? group.subs[0];
  const SubIcon = sub.icon;

  // Pindah kelompok selalu memilih ulang sub pertamanya, supaya tidak menyisakan
  // pilihan milik kelompok sebelumnya yang tak ada di kelompok ini.
  const pickGroup = (g) => { setGroupId(g.id); setSubId(g.subs[0].id); };

  return (
    <div>
      <div className="omni-toolbar">
        <div>
          <div className="omni-toolbar-title">Outbound — Barang Keluar</div>
          <div className="omni-toolbar-sub">
            Perjalanan barang dari pesanan sampai benar-benar keluar gudang.
          </div>
        </div>
      </div>

      <div className="wms-sub level2">
        {GROUPS.map((g) => (
          <button key={g.id} className={groupId === g.id ? "active" : ""} onClick={() => pickGroup(g)}>
            <g.icon size={13} /> {g.label}
          </button>
        ))}
      </div>

      <div className="wms-nest">
        <div className="wms-sub level3">
          {group.subs.map((s) => (
            <button key={s.id} className={subId === s.id ? "active" : ""} onClick={() => setSubId(s.id)}>
              <s.icon size={13} /> {s.label}
            </button>
          ))}
        </div>

        <div className="omni-empty">
          <div className="omni-empty-icon"><SubIcon size={22} /></div>
          <h3>{sub.label}</h3>
          <p>Alurnya belum ditetapkan, jadi layar ini sengaja masih kosong.</p>
        </div>
      </div>

      <div className="wms-note" style={{ marginTop: 16 }}>
        <strong>Catatan keadaan sekarang:</strong> pergerakan stok otomatis dari pesanan sedang
        dimatikan, jadi pesanan yang masuk tidak menurunkan Stok Fisik maupun Tersedia. Semua
        angka disetel manual di tab Produk &amp; Stok sampai alur outbound ini ditetapkan.
      </div>
    </div>
  );
}
