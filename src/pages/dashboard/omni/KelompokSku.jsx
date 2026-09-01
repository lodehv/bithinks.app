import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import TombolCetak from "./TombolCetak";
import { angka, tanggal } from "./format-antrean";

// Satu kelompok SKU di antrean cetak, beserta daftar pesanannya.
// Dipisah dari AntreanCetak.jsx supaya kedua berkas tetap pendek dan bagian
// yang sering diubah (susunan kepala layar) tidak bercampur dengan bagian
// yang jarang diubah (baris pesanan).

const TAHAP = {
  siap_cetak:      { teks: "Siap dicetak",          warna: "#166534", latar: "#F0FDF4" },
  // Pembeli minta batal, penjual belum menjawab. TETAP dicetak — kalau
  // pembatalannya tidak disetujui, pesanannya tetap dikirim. Shopee
  // membatalkannya sendiri kalau tidak dijawab dalam 24 jam.
  diminta_batal:   { teks: "Diminta batal pembeli",  warna: "#9A3412", latar: "#FFF7ED" },
  perlu_atur:      { teks: "Perlu atur pengiriman", warna: "#92400E", latar: "#FFFBEB" },
  // Shopee sendiri yang menahannya. Di Seller Center pesanan ini muncul
  // sebagai "Tertunda" dengan tombol aksi MATI — pemilik toko pun tidak bisa
  // mengaturnya. Karena itu namanya harus menyebut siapa yang sedang menahan,
  // bukan menyuruh orang mengerjakan sesuatu yang mustahil.
  ditinjau_shopee: { teks: "Ditinjau Tim Shopee",     warna: "#3730A3", latar: "#EEF2FF" },
  // Keterangan pengiriman dari Shopee belum sampai ke kami. Ini utang KAMI,
  // bukan pekerjaan pemilik toko — dan dulu memang keliru disebut "perlu atur
  // pengiriman". Pengukuran 31 Agu 2026 membatalkannya: dari 129 pesanan, 123
  // sudah diatur sendiri oleh Shopee, jadi tombol itu menyuruh mengerjakan
  // sesuatu yang sudah selesai. Namanya sekarang menyebut keadaan sebenarnya.
  belum_diketahui: { teks: "Menunggu keterangan Shopee", warna: "#3F3F46", latar: "#FAFAFA" },
  perlu_diperiksa: { teks: "Perlu diperiksa",       warna: "#991B1B", latar: "#FEF2F2" },
};

/** Catatan yang menjelaskan angka, bukan menyembunyikannya. */
export function Catatan({ ikon, warna, latar, children }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px",
      background: latar, borderRadius: 8, fontSize: 13, color: warna, marginBottom: 10,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1, lineHeight: 0 }}>{ikon}</span>
      <span>{children}</span>
    </div>
  );
}

export default function Kelompok({ k, channel, sisi, dari, sampai, onSelesai }) {
  const [buka, setBuka] = useState(false);
  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, marginBottom: 8, background: "#fff" }}>
      {/* Tombol cetak berada DI SEBELAH tombol buka-tutup, bukan di dalamnya.
          <button> bersarang bukan HTML yang sah, dan akibatnya nyata: sebagian
          peramban tidak meneruskan klik ke tombol bagian dalam sama sekali. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <button
          onClick={() => setBuka((b) => !b)}
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 12, minWidth: 0,
            background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
          }}
        >
          {buka ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{k.nama}</div>
            <div style={{ fontSize: 12, color: "#6B7280", letterSpacing: ".02em" }}>{k.sku}</div>
          </div>
          {/* Angka besar = yang akan tercetak, sama persis dengan angka di
              tombol dan dengan jumlah halaman PDF.

              Aturan pemilik toko: 10 pesanan siap kirim berarti 10 resi. Resi
              yang belum tersimpan di sistem kami bukan urusan yang memakai —
              ia diambil sendiri saat tombol ditekan. */}
          <div style={{ textAlign: "right", flexShrink: 0, minWidth: 92 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
              {angka(sisi === "sudah" ? k.jumlahPesanan : k.siapCetak)}
              {/* "7 dari 8" hanya saat keduanya BERBEDA.
                  Aturan pemilik toko: kalau dari 8 pesanan 1 tidak bisa
                  dicetak, sebutkan bahwa yang bisa cuma 7 — jangan biarkan
                  orang menghitung sendiri baris yang ada. Saat semuanya bisa,
                  angka kedua cuma derau. */}
              {sisi !== "sudah" && k.siapCetak < k.jumlahPesanan && (
                <span style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF" }}>
                  {" "}dari {angka(k.jumlahPesanan)}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              {sisi === "sudah" ? "sudah tercetak" : "siap dicetak"}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, minWidth: 96 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#374151", fontVariantNumeric: "tabular-nums" }}>{angka(k.totalQty)}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>barang diambil</div>
          </div>
        </button>

        <div style={{ flexShrink: 0 }}>
          <TombolCetak
            channel={channel} sku={k.sku}
            jumlah={sisi === "sudah" ? k.jumlahPesanan : k.siapCetak}
            ulangi={sisi === "sudah"} dari={dari} sampai={sampai}
            onSelesai={onSelesai}
          />
        </div>
      </div>

      {buka && (
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "4px 16px 12px 46px" }}>
          {k.pesanan.map((p) => {
            const t = TAHAP[p.tahap] ?? TAHAP.perlu_diperiksa;
            return (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                borderBottom: "1px solid #F9FAFB", fontSize: 13,
              }}>
                <span style={{ color: "#111827", minWidth: 150, letterSpacing: ".02em", fontVariantNumeric: "tabular-nums" }}>
                  {p.nomorPesanan ?? "—"}
                </span>
                <span style={{ flex: 1, color: "#374151", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.penerima ?? "—"}
                </span>
                <span style={{ color: "#6B7280", flexShrink: 0 }}>{p.qty}×</span>
                <span style={{ color: "#9CA3AF", flexShrink: 0, minWidth: 52 }}>{tanggal(p.orderedAt)}</span>
                {/* KATA-KATA ASLI SHOPEE ADA DI BALIK LABELNYA.
                    Aturan pemilik toko 26 Agustus 2026: alasan sebuah pesanan
                    belum punya resi harus benar-benar dari marketplace, bukan
                    karangan kita. Tulisan pada label ini terjemahan kami; yang
                    muncul saat kursor diarahkan adalah apa yang Shopee
                    benar-benar katakan. */}
                <span
                  title={[p.statusMarketplace, p.statusPaket].filter(Boolean).join(" · ") || undefined}
                  style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 99,
                    background: t.latar, color: t.warna, flexShrink: 0,
                    cursor: p.statusMarketplace ? "help" : undefined,
                  }}
                >{t.teks}</span>
                {/* PERNAH DITOLAK MARKETPLACE.
                    Tanpa ini, pesanan yang sudah lima kali ditolak terlihat
                    persis sama dengan yang belum pernah dicoba. Itu yang
                    terjadi pada 585769371864369119: gagal lima kali dengan
                    kode yang sama, lalu berangkat 74 jam kemudian tanpa label
                    dari kami. */}
                {p.gagalBerulang > 0 && (
                  <span
                    title={p.kodeGagal ? `Kode terakhir dari marketplace: ${p.kodeGagal}` : undefined}
                    style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 99, flexShrink: 0,
                      background: "#FEF2F2", color: "#991B1B",
                      cursor: p.kodeGagal ? "help" : undefined,
                    }}
                  >gagal {p.gagalBerulang}×</span>
                )}
                {p.adaDiKelompokLain && (
                  <span title="Pesanan ini juga berisi SKU lain — labelnya tetap satu"
                        style={{ fontSize: 11, color: "#6B7280", flexShrink: 0 }}>+SKU lain</span>
                )}
                {p.packageCount > 1 && (
                  <span title="Pesanan ini pecah jadi beberapa paket — label belum lengkap"
                        style={{ fontSize: 11, color: "#991B1B", flexShrink: 0 }}>{p.packageCount} paket</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
