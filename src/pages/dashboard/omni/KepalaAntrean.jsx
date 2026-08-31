import TombolCetak from "./TombolCetak";
import PilihTanggal from "./PilihTanggal";
import { angka, jamSingkat, labelRentang } from "./format-antrean";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";

// KEPALA LAYAR ANTREAN CETAK — dua zona, bukan empat pita.
//
// Susunan lama menumpuk empat baris kendali sebelum orang sampai ke isinya:
// pil platform, pil belum/sudah, kelompok tanggal, lalu kartu statistik abu-
// abu. Keempatnya digambar dengan bobot yang sama, jadi tidak ada yang
// menuntun mata, dan angka 15/81 tertulis dua kali berjarak 40 piksel.
//
// Sekarang: satu kepala halaman (angka jangkar + tombol utama) dan satu bilah
// alat. Tidak ada informasi yang dibuang — semuanya cuma pindah ke tempat yang
// menyatakan perannya sendiri.
//
// TIGA ATURAN YANG DIPEGANG DI SINI
// 1. Tiap tingkat digambar berbeda: tombol beruas untuk pilihan yang saling
//    meniadakan, chip untuk keterangan, satu tombol untuk periode.
// 2. Satu warna merek di satu layar — hanya tombol cetak yang berlatar ungu
//    penuh. Pilihan yang aktif ditandai garis bawah, bukan warna merek.
// 3. Angka ditulis SEKALI. 15 dan 81 hidup di tombol beruas; 96 jadi judul.

const PLATFORM = [
  { id: "shopee", label: "Shopee", logo: shopeeLogo },
  { id: "tiktok", label: "TikTok Shop", logo: tiktokLogo },
];

/** Logo dijaga proporsinya: kedua berkasnya jauh dari persegi. */
function Merek({ logo }) {
  return (
    <span style={{
      width: 20, height: 16, flexShrink: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>
      <img src={logo} alt="" style={{
        maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
        display: "block", borderRadius: 3,
      }} />
    </span>
  );
}

/** Tombol beruas: beberapa pilihan disatukan dalam satu bingkai bersambung. */
function Ruas({ pilihan, nilai, onPilih }) {
  return (
    <div style={{ display: "inline-flex", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
      {pilihan.map((p, i) => {
        const aktif = p.id === nilai;
        return (
          <button
            key={p.id}
            onClick={() => onPilih(p.id)}
            aria-pressed={aktif}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px",
              fontSize: 13, fontFamily: "inherit", cursor: "pointer", border: "none",
              borderLeft: i ? "1px solid #E5E7EB" : "none",
              fontWeight: aktif ? 600 : 500,
              background: aktif ? "#fff" : "#F9FAFB",
              color: aktif ? "#111827" : "#6B7280",
              boxShadow: aktif ? "inset 0 -2px 0 #4F46E5" : "none",
              fontVariantNumeric: "tabular-nums",
            }}
          >{p.isi}</button>
        );
      })}
    </div>
  );
}

/**
 * Keterangan yang BAGIAN DARI total, bukan tambahan.
 *
 * Dulu "6 diminta batal" berdiri sejajar dengan 15 dan 81 di kartu statistik,
 * seolah angka keempat yang setara. Padahal 15 + 81 = 96 sudah habis, dan 6
 * itu ada DI DALAM-nya. Bentuk chip bertitik menyatakan hubungan itu tanpa
 * perlu kalimat.
 */
function Cip({ warna, latar, garis, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px",
      borderRadius: 999, background: latar, color: warna, border: `1px solid ${garis}`,
      fontSize: 12.5, fontWeight: 500, fontVariantNumeric: "tabular-nums",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: warna, flexShrink: 0 }} />
      {children}
    </span>
  );
}

export default function KepalaAntrean({
  channel, setChannel, sisi, setSisi, dari, sampai, onTanggal, data, onSelesai,
}) {
  const platform = PLATFORM.find((p) => p.id === channel);
  const total = data ? angka(data.totalAntrean ?? data.totalLabel) : "—";
  const jumlahTombol = sisi === "sudah" ? data?.totalSudah : data?.totalSiapCetak;

  return (
    <div style={{ marginTop: 24 }}>
      {/* ZONA 1 — kepala halaman. Angka jangkar dibaca lebih dulu dari apa pun,
          dan tombol utama duduk sejajar dengannya di kanan. */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{
              fontSize: 30, fontWeight: 700, color: "#111827",
              lineHeight: 1.1, fontVariantNumeric: "tabular-nums",
            }}>{total}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>total resi</span>
          </div>
          {/* LAYAR MENYEBUT ISINYA, BUKAN NAMANYA.
              "Semua tanggal" tidak memberi tahu apa pun; "2 hari terakhir ·
              cetak terakhir 27 Agu 09:10" langsung menjawab tumpukan ini sejak
              kapan, tanpa pemakainya menghitung sendiri. */}
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
            {platform?.label} · {labelRentang(dari, sampai)}
            {data?.cetakTerakhir ? ` · cetak terakhir ${jamSingkat(data.cetakTerakhir)}` : ""}
          </div>
        </div>

        {data && (
          <div style={{ marginLeft: "auto" }}>
            <TombolCetak
              channel={channel}
              jumlah={jumlahTombol ?? 0}
              ulangi={sisi === "sudah"}
              dari={dari || undefined} sampai={sampai || undefined}
              utama onSelesai={onSelesai}
            />
          </div>
        )}
      </div>

      {/* ZONA 2 — bilah alat. Satu baris, semuanya setinggi sama. */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        paddingBottom: 20, borderBottom: "1px solid #F3F4F6", marginBottom: 24,
      }}>
        <Ruas
          nilai={channel}
          onPilih={setChannel}
          pilihan={PLATFORM.map((p) => ({
            id: p.id,
            isi: <><Merek logo={p.logo} />{p.label}</>,
          }))}
        />

        {/* DUA SISI DARI SATU TUMPUKAN, angkanya menempel di tombolnya sendiri
            supaya "belum 15 · sudah 81" terbaca sekaligus tanpa berpindah. */}
        <Ruas
          nilai={sisi}
          onPilih={setSisi}
          pilihan={[
            { id: "belum", isi: <>Belum cetak{typeof data?.totalBelum === "number" && <b style={{ color: "#B45309", marginLeft: 5 }}>{angka(data.totalBelum)}</b>}</> },
            { id: "sudah", isi: <>Sudah cetak{typeof data?.totalSudah === "number" && <b style={{ color: "#166534", marginLeft: 5 }}>{angka(data.totalSudah)}</b>}</> },
          ]}
        />

        {data?.totalDimintaBatal > 0 && (
          <Cip warna="#9A3412" latar="#FFF7ED" garis="#FED7AA">
            {angka(data.totalDimintaBatal)} di antaranya diminta batal
          </Cip>
        )}
        {data?.totalDitinjauShopee > 0 && (
          <Cip warna="#3730A3" latar="#EEF2FF" garis="#C7D2FE">
            {angka(data.totalDitinjauShopee)} ditinjau Tim Shopee
          </Cip>
        )}
        {data?.totalBelumDiketahui > 0 && (
          <Cip warna="#3F3F46" latar="#FAFAFA" garis="#E4E4E7">
            {angka(data.totalBelumDiketahui)} menunggu keterangan Shopee
          </Cip>
        )}
        {data?.totalPerluAtur > 0 && (
          <Cip warna="#92400E" latar="#FFFBEB" garis="#FDE68A">
            {angka(data.totalPerluAtur)} perlu atur pengiriman
          </Cip>
        )}
        {data?.totalPerluDiperiksa > 0 && (
          <Cip warna="#991B1B" latar="#FEF2F2" garis="#FECACA">
            {angka(data.totalPerluDiperiksa)} perlu diperiksa
          </Cip>
        )}

        <div style={{ marginLeft: "auto" }}>
          <PilihTanggal dari={dari} sampai={sampai} onUbah={onTanggal} />
        </div>
      </div>
    </div>
  );
}
