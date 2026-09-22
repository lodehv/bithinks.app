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

  // Dikelompokkan menurut alasannya, urutan kemunculan dipertahankan.
  const kelompokAlasan = [];
  for (const r of hasil?.rincian ?? []) {
    const teks = r.alasan || "Tidak ada keterangan dari Shopee.";
    const ada = kelompokAlasan.find((k) => k.alasan === teks);
    if (ada) ada.nomor.push(r.nomorPesanan);
    else kelompokAlasan.push({ alasan: teks, nomor: [r.nomorPesanan], jadi: r.jadi });
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      padding: "12px 14px", marginBottom: 12,
      border: "1px solid #DDDEE1", borderRadius: 10, background: "#fff",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Angka disebut SEKALI, di sini. Tombolnya tidak mengulanginya —
            chip di bilah alat pun sudah menyebutnya. */}
        <span style={{ fontSize: 13.5, color: "#292A2E" }}>
          <strong style={{ fontWeight: 600 }}>{angka(jumlah)} pesanan</strong> belum diatur pengirimannya
        </span>

        {/* Dua pilihan setara, jadi keduanya digambar netral. Warna merek
            disimpan untuk satu hal saja di layar ini: tombol cetak. */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {CARA.map(({ id, teks, ikon }) => (
            <button
              key={id}
              onClick={() => jalankan(id)}
              disabled={Boolean(sibuk)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                fontFamily: "inherit", cursor: sibuk ? "not-allowed" : "pointer",
                border: "1px solid #DDDEE1", background: "#fff", color: "#505258",
                opacity: sibuk && sibuk !== id ? 0.45 : 1,
              }}
            >
              {sibuk === id ? <Loader2 size={15} /> : ikon}
              {sibuk === id ? "Mengatur\u2026" : teks}
            </button>
          ))}
        </div>
      </div>

      {galat && <div style={{ fontSize: 13, color: "#AE2E24" }}>{galat}</div>}

      {hasil && (
        <div style={{ fontSize: 13, color: "#505258", display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #F0F1F2", paddingTop: 10 }}>
          <div>
            <strong>{angka(hasil.diatur)}</strong> diatur pengirimannya.
            {hasil.sudahSejakTadi > 0 && ` ${angka(hasil.sudahSejakTadi)} memang sudah diatur sebelumnya.`}
            {hasil.gagal > 0 && ` ${angka(hasil.gagal)} gagal.`}
          </div>

          {/* ALASAN YANG SAMA DITULIS SEKALI.
              Tiga pesanan yang gagal karena sebab yang sama tidak perlu tiga
              baris berisi kalimat identik — yang berbeda cuma nomornya.

              Pergantian metode tetap DISEBUT, tidak dihaluskan: barang yang
              menunggu dijemput padahal harus diantar ke gerai adalah kerugian
              nyata, dan pemilik toko baru tahu setelah kurirnya tidak datang. */}
          {kelompokAlasan.map(({ alasan, nomor, jadi }) => (
            <div key={alasan} style={{ color: jadi ? "#9E4C00" : "#AE2E24" }}>
              <div>{alasan}</div>
              <div style={{ color: "#6B6E76", fontSize: 12.5, letterSpacing: ".02em", marginTop: 2 }}>
                {nomor.join(" \u00b7 ")}
              </div>
            </div>
          ))}

          {/* Hanya kalau memang ada yang berhasil. Menyuruh orang memuat ulang
              untuk mencetak sesuatu yang tidak jadi dibuat itu menyesatkan. */}
          {hasil.diatur > 0 && (
            <div style={{ color: "#6B6E76" }}>
              Resinya terbit beberapa saat lagi. Muat ulang antrean, lalu cetak.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
