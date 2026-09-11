import { X } from "lucide-react";
import { TAHAP } from "./tahap-label";
import { angka } from "./format-antrean";

/** "31 jam" / "3 hari" — sudah berapa lama pesanan ini menunggu. */
function umurJam(iso) {
  const jam = Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000);
  return jam < 48 ? `${jam} jam` : `${Math.floor(jam / 24)} hari`;
}

// ─────────────────────────────────────────────────────────────────────────────
// KENAPA PESANAN INI TIDAK BISA DICETAK — dibuka dari cip di kepala antrean.
//
// Aturan pemilik toko 10 September 2026: angka "3 pesanan tidak untuk dicetak"
// harus bisa ditekan dan menyebutkan sebabnya. Angka tanpa sebab memaksa orang
// menebak, dan menebak soal resi adalah hal yang seluruh layar ini hindari.
//
// KALIMATNYA DARI SERVER, BUKAN DITULIS ULANG DI SINI.
// `data.alasanTahap` datang dari peta yang sama yang dipakai jalur cetak saat
// melewati sebuah pesanan. Menulis kalimat kedua di browser berarti dua
// keterangan untuk keadaan yang sama, dan suatu hari keduanya berbeda.
//
// Status marketplace ditampilkan apa adanya di tiap baris. Itu satu-satunya
// keterangan yang bukan terjemahan kami.
// ─────────────────────────────────────────────────────────────────────────────

// Dua cip di kepala bukan tahap: keduanya menyaring pesanan lintas tahap.
// Mereka tetap harus bisa dibuka, karena angka yang tidak bisa ditekan memaksa
// orang menebak pesanan mana yang dimaksud.
const SOROTAN = {
  menunggu_lama: {
    teks: "Menunggu lebih dari batas",
    warna: "#9A3412",
    latar: "#FFF7ED",
    // Ditandai server. Menghitung ulang di sini akan membuat angka di cip dan
    // jumlah baris di panel bisa berbeda, dan tidak ada yang tahu mana benar.
    cocok: (p) => Boolean(p.menungguLama),
    alasan: (data) =>
      `Resinya sudah siap dan belum juga dicetak lebih dari ${data.batasLamaJam ?? 24} jam. ` +
      "Marketplace membatasi waktu pengiriman, jadi yang paling tua paling dekat ke batas itu.",
  },
  pernah_gagal: {
    teks: "Pernah gagal dicetak",
    warna: "#991B1B",
    latar: "#FEF2F2",
    cocok: (p) => p.gagalBerulang > 0,
    alasan: () =>
      "Marketplace pernah menolak mencetak pesanan ini. Kode terakhirnya ada di tiap baris.",
  },
};

export default function RincianTahap({ data, tahap, onTutup }) {
  const sorotan = SOROTAN[tahap];
  const t = sorotan ?? TAHAP[tahap] ?? TAHAP.perlu_diperiksa;
  const cocok = sorotan
    ? (p) => sorotan.cocok(p, data)
    : (p) => p.tahap === tahap;

  // Satu pesanan bisa muncul di beberapa kelompok SKU. Di sini ia disebut
  // sekali: yang ditanya "kenapa pesanan ini", bukan "kenapa baris ini".
  const unik = new Map();
  for (const k of data.kelompok ?? []) {
    for (const p of k.pesanan ?? []) {
      if (cocok(p) && !unik.has(p.id)) unik.set(p.id, p);
    }
  }
  const pesanan = [...unik.values()];
  const alasan = sorotan ? sorotan.alasan(data) : data.alasanTahap?.[tahap];

  return (
    <div style={{
      border: `1px solid ${t.warna}22`, borderRadius: 10, background: t.latar,
      padding: "12px 14px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: alasan ? 6 : 10 }}>
        <strong style={{ color: t.warna, fontSize: 13.5 }}>
          {angka(pesanan.length)} pesanan · {t.teks}
        </strong>
        <button
          type="button"
          onClick={onTutup}
          aria-label="Tutup"
          style={{
            marginLeft: "auto", display: "inline-flex", alignItems: "center",
            border: "none", background: "transparent", color: t.warna,
            cursor: "pointer", padding: 2, fontFamily: "inherit",
          }}
        ><X size={15} /></button>
      </div>

      {alasan && (
        <div style={{ color: t.warna, fontSize: 13, marginBottom: 10, opacity: 0.92 }}>{alasan}</div>
      )}

      <div style={{ display: "grid", gap: 4 }}>
        {pesanan.map((p) => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 10, fontSize: 12.5,
            padding: "5px 8px", borderRadius: 7, background: "#fff",
          }}>
            <span style={{
              color: "#111827", minWidth: 150, letterSpacing: ".02em",
              fontVariantNumeric: "tabular-nums",
            }}>{p.nomorPesanan ?? "—"}</span>
            <span style={{
              flex: 1, color: "#374151", minWidth: 0, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{p.penerima ?? "—"}</span>
            {/* Kata asli marketplace. Satu-satunya keterangan yang bukan
                terjemahan kami, jadi ia yang bisa dibawa saat bertanya ke
                Seller Center. */}
            {tahap === "menunggu_lama" && p.orderedAt && (
              <span style={{ color: "#9A3412", fontSize: 11, flexShrink: 0 }}>
                {umurJam(p.orderedAt)}
              </span>
            )}
            {p.statusMarketplace && (
              <span style={{ color: "#6B7280", fontSize: 11, flexShrink: 0 }}>{p.statusMarketplace}</span>
            )}
            {p.statusPaket && (
              <span style={{ color: "#9CA3AF", fontSize: 11, flexShrink: 0 }}>{p.statusPaket}</span>
            )}
            {p.gagalBerulang > 0 && (
              <span
                title={p.kodeGagal ? `Kode terakhir dari marketplace: ${p.kodeGagal}` : undefined}
                style={{ color: "#991B1B", fontSize: 11, flexShrink: 0 }}
              >gagal {p.gagalBerulang}×</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
