import { useState } from "react";
import { Truck, Store, Loader2 } from "lucide-react";
import { omniApi } from "../../../utils/omniApi";
import { angka } from "./format-antrean";

// ─────────────────────────────────────────────────────────────────────────────
// ATUR PENGIRIMAN — satu klik untuk seluruh tumpukan.
//
// Aturan pemilik toko 26 Agustus 2026: setiap pesanan yang masuk harus bisa
// diproses sistem kita sampai resinya tersedia. Layar yang cuma menulis
// "perlu atur pengiriman" lalu berhenti sedang menampilkan KEKURANGAN KITA
// sebagai kalau-kalau masalah pesanannya — dan menyuruh pemilik toko pergi ke
// Seller Center mengerjakan hal yang sistem ini seharusnya kerjakan.
//
// Metodenya dipilih SEKALI dan berlaku untuk semua pesanan, bukan ditanyakan
// satu per satu.
//
// ⚠ MENGUBAH KEADAAN DI SHOPEE. Sekali berhasil, kurir sungguhan akan datang
// menjemput barang sungguhan. Karena itu tidak ada bawaan yang tertekan
// sendiri: dua tombol, dua maksud, keduanya harus dipilih sadar.
// ─────────────────────────────────────────────────────────────────────────────

const CARA = [
  { id: "pickup", teks: "Dijemput kurir", ikon: <Truck size={15} /> },
  { id: "dropoff", teks: "Diantar ke gerai", ikon: <Store size={15} /> },
];

export default function TombolAturKirim({ jumlah, dari, sampai, onSelesai }) {
  const [sibuk, setSibuk] = useState(null);
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState(null);

  async function jalankan(metode) {
    setSibuk(metode);
    setGalat(null);
    setHasil(null);
    try {
      const d = await omniApi.aturKirim({
        metode,
        ...(dari ? { dari } : {}),
        ...(sampai ? { sampai } : {}),
      });
      setHasil(d);
      onSelesai?.();
    } catch {
      setGalat("Gagal mengatur pengiriman. Tidak ada yang berubah untuk pesanan yang gagal — coba lagi.");
    } finally {
      setSibuk(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CARA.map(({ id, teks, ikon }) => (
          <button
            key={id}
            onClick={() => jalankan(id)}
            disabled={Boolean(sibuk)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "9px 16px", borderRadius: 8, fontSize: 13.5, fontWeight: 600,
              fontFamily: "inherit", cursor: sibuk ? "not-allowed" : "pointer",
              border: "1px solid #C7D2FE", background: sibuk === id ? "#EEF2FF" : "#fff",
              color: "#4F46E5", opacity: sibuk && sibuk !== id ? 0.5 : 1,
            }}
          >
            {sibuk === id ? <Loader2 size={15} /> : ikon}
            {sibuk === id ? "Mengatur…" : `${teks} — ${angka(jumlah)} pesanan`}
          </button>
        ))}
      </div>

      {galat && <div style={{ fontSize: 13, color: "#991B1B" }}>{galat}</div>}

      {hasil && (
        <div style={{ fontSize: 13, color: "#374151", display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <strong>{angka(hasil.diatur)}</strong> pesanan diatur pengirimannya.
            {hasil.sudahSejakTadi > 0 && ` ${angka(hasil.sudahSejakTadi)} di antaranya memang sudah diatur sebelumnya.`}
            {hasil.gagal > 0 && ` ${angka(hasil.gagal)} gagal.`}
          </div>

          {/* Pergantian metode DISEBUT, tidak dihaluskan. Barang yang menunggu
              dijemput padahal harus diantar ke gerai adalah kerugian nyata,
              dan pemilik toko baru tahu setelah kurirnya tidak datang. */}
          {hasil.berpindahMetode > 0 && (
            <div style={{ color: "#9A3412" }}>
              {angka(hasil.berpindahMetode)} pesanan tidak menerima cara yang dipilih,
              jadi diatur dengan cara yang diterima kurirnya.
            </div>
          )}

          {hasil.rincian?.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 3 }}>
              {hasil.rincian.map((r) => (
                <li key={r.nomorPesanan} style={{ color: r.jadi ? "#9A3412" : "#991B1B" }}>
                  <span style={{ letterSpacing: ".02em" }}>{r.nomorPesanan}</span>
                  {r.alasan ? ` — ${r.alasan}` : ""}
                </li>
              ))}
            </ul>
          )}

          <div style={{ color: "#6B7280" }}>
            Resinya terbit beberapa saat setelah ini. Muat ulang antrean lalu cetak seperti biasa.
          </div>
        </div>
      )}
    </div>
  );
}
