import { useState } from "react";
import { Printer, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { omniApi } from "../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// TOMBOL CETAK RESI — Tahap 2e.
//
// TUJUAN
// Satu klik: "cetak 30 resi SKU A" → satu berkas PDF berisi ketiga puluhnya,
// langsung terunduh. Meniru cara kerja yang sudah dipakai admin di Seller
// Center, supaya tidak ada kebiasaan baru yang harus dipelajari.
//
// FILOSOFI — SATU KLIK, TANPA DIALOG KONFIRMASI
// Tidak ada "Anda yakin?". Bukan karena aksinya remeh, tapi karena aksinya
// AMAN DIULANG: daftar pesanannya disusun server dari antrean, dan yang sudah
// tercetak keluar dari antrean. Klik kedua tidak menemukan apa-apa lagi.
// Dialog konfirmasi yang tidak melindungi apa pun cuma melatih orang menekan
// "ya" tanpa membaca.
//
// FILOSOFI — YANG GAGAL DITUNJUKKAN, BUKAN DISEMBUNYIKAN
// Panel hasil selalu muncul, juga saat semuanya berhasil. Kegagalan yang cuma
// tampil sebagai toast merah sekejap adalah persis keluhan yang fitur ini
// dibangun untuk menghilangkan: resi yang tidak masuk pantauan.
//
// Tiga keadaan dibedakan karena TINDAKANNYA berbeda bagi pemilik toko:
//   tertunda  tidak perlu apa-apa, akan dicoba lagi
//   dilewati  perlu atur pengiriman dulu
//   gagal     perlu dilihat, ada yang harus dibereskan
// ─────────────────────────────────────────────────────────────────────────────

const angka = (n) => Number(n ?? 0).toLocaleString("id-ID");

/** Ubah PDF base64 jadi berkas yang langsung terunduh. */
function unduhPdf(base64, namaBerkas) {
  const biner = atob(base64);
  const byte = new Uint8Array(biner.length);
  for (let i = 0; i < biner.length; i++) byte[i] = biner.charCodeAt(i);

  const url = URL.createObjectURL(new Blob([byte], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = namaBerkas;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Dilepas belakangan: mencabutnya seketika membatalkan unduhan di sebagian
  // peramban sebelum berkasnya sempat terbaca.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return url;
}

function namaBerkas(channel, sku) {
  const tgl = new Date().toISOString().slice(0, 10);
  const bagian = sku ? sku.replace(/[^\w.-]+/g, "-").slice(0, 40) : "semua";
  return `resi-${channel}-${bagian}-${tgl}.pdf`;
}

function Baris({ ikon, warna, latar, judul, isi }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px",
      background: latar, borderRadius: 8, fontSize: 13, color: warna, marginTop: 6,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1, lineHeight: 0 }}>{ikon}</span>
      <span><strong>{judul}</strong>{isi ? ` — ${isi}` : ""}</span>
    </div>
  );
}

/**
 * Panel hasil satu aksi cetak.
 *
 * Alasan kegagalan dikelompokkan menurut kalimatnya, bukan didaftar satu per
 * satu: dua puluh baris "Status pesanan belum mendukung cetak label" tidak
 * memberi tahu apa pun selain bahwa daftarnya panjang.
 */
function Hasil({ h, channel, onUlang }) {
  const alasanGagal = Object.entries(
    (h.gagal ?? []).reduce((acc, g) => {
      const k = g.pesan || g.kode || "Tidak diketahui";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  );
  const alasanDilewati = Object.entries(
    (h.dilewati ?? []).reduce((acc, d) => {
      acc[d.alasan] = (acc[d.alasan] ?? 0) + 1;
      return acc;
    }, {}),
  );

  return (
    <div style={{
      border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px",
      marginBottom: 10, background: "#fff",
    }}>
      {h.jumlahTercetak > 0 ? (
        <Baris
          ikon={<CheckCircle2 size={16} />} warna="#166534" latar="#F0FDF4"
          judul={`${angka(h.jumlahTercetak)} resi tercetak`}
          isi="berkasnya sudah terunduh"
        />
      ) : (
        <Baris
          ikon={<AlertTriangle size={16} />} warna="#92400E" latar="#FFFBEB"
          judul="Tidak ada resi yang tercetak" isi={null}
        />
      )}

      {h.tertunda > 0 && (
        <Baris
          ikon={<Clock size={16} />} warna="#1E40AF" latar="#EFF6FF"
          judul={`${angka(h.tertunda)} masih disiapkan ${channel === "shopee" ? "Shopee" : "TikTok"}`}
          isi="tidak perlu apa-apa, tetap di antrean — coba lagi sebentar lagi"
        />
      )}

      {alasanDilewati.map(([alasan, n]) => (
        <Baris key={alasan} ikon={<AlertTriangle size={16} />} warna="#92400E" latar="#FFFBEB"
               judul={`${angka(n)} dilewati`} isi={alasan} />
      ))}

      {alasanGagal.map(([alasan, n]) => (
        <Baris key={alasan} ikon={<AlertTriangle size={16} />} warna="#991B1B" latar="#FEF2F2"
               judul={`${angka(n)} gagal`} isi={alasan} />
      ))}

      <button onClick={onUlang} style={{
        marginTop: 10, background: "none", border: "none", padding: 0,
        color: "#4F46E5", fontSize: 13, cursor: "pointer", fontWeight: 600,
      }}>
        Tutup
      </button>
    </div>
  );
}

/**
 * Tombol cetak untuk satu tumpukan.
 *
 * `sku` kosong berarti seluruh antrean platform ini. Yang dikirim ke server
 * cuma channel dan sku — daftar pesanannya disusun ulang di sana, memakai
 * penyaring yang sama dengan yang menghasilkan angka di layar ini.
 */
export default function TombolCetak({ channel, sku, jumlah, utama = false, onSelesai }) {
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState(null);

  async function cetak(e) {
    e?.stopPropagation();
    setSibuk(true);
    setGalat(null);
    try {
      const d = await omniApi.cetakLabel({ channel, sku: sku ?? undefined });
      if (d.pdfBase64) unduhPdf(d.pdfBase64, namaBerkas(channel, sku));
      setHasil(d);
      // Antreannya dimuat ulang supaya angkanya turun. Inilah yang membuat
      // "tumpukan habis → nol" benar-benar terlihat.
      onSelesai?.();
    } catch (err) {
      setGalat(
        err?.response?.status === 402
          ? "Langganan sedang tidak aktif, jadi cetak resi dimatikan."
          : "Gagal menghubungi marketplace. Coba lagi sebentar lagi.",
      );
    } finally {
      setSibuk(false);
    }
  }

  if (hasil) return <Hasil h={hasil} channel={channel} onUlang={() => setHasil(null)} />;

  return (
    <>
      <button
        onClick={cetak}
        disabled={sibuk || jumlah === 0}
        title={jumlah === 0 ? "Tidak ada yang perlu dicetak" : undefined}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: utama ? "10px 18px" : "7px 12px",
          borderRadius: 8, border: "none",
          fontSize: utama ? 14 : 13, fontWeight: 600,
          cursor: sibuk || jumlah === 0 ? "not-allowed" : "pointer",
          background: jumlah === 0 ? "#F3F4F6" : "#4F46E5",
          color: jumlah === 0 ? "#9CA3AF" : "#fff",
          opacity: sibuk ? 0.7 : 1,
          flexShrink: 0,
        }}
      >
        {sibuk ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
        {sibuk ? "Menyiapkan…" : `Cetak ${angka(jumlah)} resi`}
      </button>

      {galat && (
        <div style={{ fontSize: 12, color: "#991B1B", marginTop: 6 }}>{galat}</div>
      )}
    </>
  );
}
