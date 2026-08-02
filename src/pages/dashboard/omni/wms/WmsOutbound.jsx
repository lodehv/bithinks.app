import { useState } from "react";
import { ScanLine, Keyboard, ClipboardList, MinusCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Outbound (Barang Keluar) — kerangka navigasi bertingkat. Alurnya belum
// ditetapkan, jadi tiap panel sengaja dibiarkan kosong alih-alih diisi tampilan
// sementara yang nanti harus dibongkar lagi.
//
//   Outbound
//   └── Pengurangan Stok Tersedia          (tingkat 1)
//       ├── Scan                            (tingkat 2)
//       │   └── Scan Picking List           (tingkat 3)
//       └── Input Nomor Pesanan             (tingkat 2, manual)
//
// Tingkat 1 baru berisi satu menu karena disebut sebagai "yang pertama"; ruang
// untuk menu berikutnya sudah siap tanpa perlu menata ulang.
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL1 = [
  { id: "pengurangan", label: "Pengurangan Stok Tersedia", icon: MinusCircle },
];

const LEVEL2 = [
  { id: "scan", label: "Scan", icon: ScanLine },
  { id: "manual", label: "Input Nomor Pesanan", icon: Keyboard },
];

const LEVEL3_SCAN = [
  { id: "picking", label: "Scan Picking List", icon: ClipboardList },
];

/** Panel kosong yang jujur: menyebut namanya, tanpa berpura-pura sudah berfungsi. */
function Placeholder({ title, icon }) {
  return (
    <div className="omni-empty">
      <div className="omni-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>Alurnya belum ditetapkan, jadi layar ini sengaja masih kosong.</p>
    </div>
  );
}

export default function WmsOutbound() {
  const [lvl1, setLvl1] = useState("pengurangan");
  const [lvl2, setLvl2] = useState("scan");
  const [lvl3, setLvl3] = useState("picking");

  const activeL2 = LEVEL2.find((v) => v.id === lvl2);
  const activeL3 = LEVEL3_SCAN.find((v) => v.id === lvl3);

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
        {LEVEL1.map((v) => (
          <button key={v.id} className={lvl1 === v.id ? "active" : ""} onClick={() => setLvl1(v.id)}>
            <v.icon size={13} /> {v.label}
          </button>
        ))}
      </div>

      {lvl1 === "pengurangan" && (
        <div className="wms-nest">
          <div className="wms-sub level3">
            {LEVEL2.map((v) => (
              <button key={v.id} className={lvl2 === v.id ? "active" : ""} onClick={() => setLvl2(v.id)}>
                <v.icon size={13} /> {v.label}
              </button>
            ))}
          </div>

          {lvl2 === "scan" ? (
            <div className="wms-nest">
              <div className="wms-sub level3">
                {LEVEL3_SCAN.map((v) => (
                  <button key={v.id} className={lvl3 === v.id ? "active" : ""} onClick={() => setLvl3(v.id)}>
                    <v.icon size={13} /> {v.label}
                  </button>
                ))}
              </div>
              <Placeholder title={activeL3?.label ?? "Scan"} icon={<ClipboardList size={22} />} />
            </div>
          ) : (
            <Placeholder title={activeL2?.label ?? "Input Nomor Pesanan"} icon={<Keyboard size={22} />} />
          )}
        </div>
      )}

      <div className="wms-note" style={{ marginTop: 16 }}>
        <strong>Catatan keadaan sekarang:</strong> pergerakan stok otomatis dari pesanan sedang
        dimatikan, jadi pesanan yang masuk tidak menurunkan Stok Fisik maupun Tersedia. Semua
        angka disetel manual di tab Produk &amp; Stok sampai alur outbound ini ditetapkan.
      </div>
    </div>
  );
}
