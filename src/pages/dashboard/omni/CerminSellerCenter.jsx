import { useState } from "react";
import { ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { omniApi } from "../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// PEMERIKSAAN CERMIN — apakah antrean kita sama dengan Seller Center?
//
// TUJUAN
// Membuktikan, bukan menjanjikan. Syarat dari pemilik toko: "apa yang ada di
// Seller Center harus ada di kita, selisih toleransinya NOL".
//
// FILOSOFI — SATU-SATUNYA ANGKA YANG TIDAK BERASAL DARI KITA SENDIRI
// Semua angka lain di halaman ini dihitung dari basis data kita. Itu punya
// titik buta yang tidak bisa dilihat dari dalam: pesanan yang tidak pernah
// sampai ke basis data tidak akan muncul di hitungan mana pun. Angkanya rapi,
// dan tetap salah. Tombol ini bertanya ke sumber aslinya.
//
// KENAPA HARUS DITEKAN, BUKAN JALAN SENDIRI
// Ia memanggil marketplace sungguhan, sekali per toko per status. Menjalankan
// itu tiap halaman dibuka berarti menghabiskan jatah laju untuk pertanyaan
// yang jawabannya jarang berubah.
//
// KENAPA HASILNYA TIDAK DISEMBUNYIKAN SAAT COCOK
// "Cocok" adalah kabar yang paling berguna di sini — ia satu-satunya bukti
// bahwa angka di layar boleh dipercaya. Menyembunyikannya saat cocok membuat
// tombolnya cuma terasa sebagai pencari masalah.
// ─────────────────────────────────────────────────────────────────────────────

const angka = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);

export default function CerminSellerCenter({ channel, dari, sampai }) {
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState(null);

  const namaPasar = channel === "tiktok" ? "TikTok Seller Center" : "Shopee Seller Center";

  async function periksa() {
    setSibuk(true);
    setGalat(null);
    try {
      // Jendela waktunya MENGIKUTI saringan tanggal di halaman. Kalau berbeda,
      // panel ini memajang angka yang tidak bisa dibandingkan dengan angka di
      // atasnya — dan itu justru membuat orang ragu pada keduanya.
      setHasil(await omniApi.cerminAntrean(channel, {
        ...(dari ? { dari } : {}),
        ...(sampai ? { sampai } : {}),
      }));
    } catch (err) {
      setGalat(
        err?.code === "ECONNABORTED"
          ? "Marketplace terlalu lama menjawab. Coba lagi sebentar lagi."
          : "Gagal bertanya ke marketplace. Coba lagi sebentar lagi.",
      );
      setHasil(null);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div style={{ margin: "10px 0 0" }}>
      <button
        onClick={periksa}
        disabled={sibuk}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 7, fontSize: 13, fontWeight: 500,
          border: "1px solid #E5E7EB", background: "#fff",
          color: sibuk ? "#9CA3AF" : "#374151", cursor: sibuk ? "default" : "pointer",
        }}
      >
        <RefreshCw size={14} style={sibuk ? { opacity: 0.5 } : undefined} />
        {sibuk ? `Menghitung di ${namaPasar}…` : `Cocokkan dengan ${namaPasar}`}
      </button>

      {galat && <div style={{ marginTop: 8, fontSize: 13, color: "#991B1B" }}>{galat}</div>}

      {hasil && <Hasil hasil={hasil} namaPasar={namaPasar} />}
    </div>
  );
}

function Hasil({ hasil, namaPasar }) {
  const cocok = hasil.cocok;
  const warna = cocok ? "#166534" : "#92400E";
  const latar = cocok ? "#F0FDF4" : "#FFFBEB";

  return (
    <div style={{
      marginTop: 10, padding: "12px 14px", borderRadius: 9,
      background: latar, border: `1px solid ${cocok ? "#BBF7D0" : "#FDE68A"}`,
      fontSize: 13, color: "#374151", lineHeight: 1.6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, color: warna }}>
        {cocok ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
        {cocok
          ? "Cocok — selisihnya nol"
          : `Selisih ${angka(hasil.selisih)} pesanan`}
      </div>

      <div style={{ marginTop: 6 }}>
        {namaPasar} <strong>{angka(hasil.diMarketplace)}</strong> · antrean kita{" "}
        <strong>{angka(hasil.diKita)}</strong>
        <span style={{ color: "#6B7280" }}>
          {" · "}
          {hasil.hariDiperiksa
            ? `diperiksa ${hasil.hariDiperiksa} hari terakhir`
            : "sesuai tanggal yang dipilih"}
        </span>
      </div>

      {hasil.jumlahHilang > 0 && (
        <div style={{ marginTop: 6 }}>
          <strong>{angka(hasil.jumlahHilang)} pesanan ada di sana tapi belum masuk ke kita.</strong>{" "}
          Akan tertarik sendiri saat sinkronisasi berikutnya. Kalau angkanya besar, biasanya karena
          ada toko yang belum ditautkan di Integrasi Toko — pemeriksaan ini hanya mencakup toko yang
          tertaut.
          <Nomor daftar={hasil.hilang} jumlah={hasil.jumlahHilang} />
        </div>
      )}

      {hasil.jumlahAsing > 0 && (
        <div style={{ marginTop: 6 }}>
          <strong>{angka(hasil.jumlahAsing)} pesanan ada di antrean kita tapi tidak lagi menunggu
          dikirim di sana</strong> — statusnya kemungkinan sudah berubah dan catatan kita belum ikut.
          <Nomor daftar={hasil.asing} jumlah={hasil.jumlahAsing} />
        </div>
      )}

      {hasil.adaTokoYangGagalDitanya && (
        <div style={{ marginTop: 6, color: "#991B1B" }}>
          Ada toko yang tidak bisa ditanya, jadi hasil ini <strong>belum lengkap</strong>.
          {(hasil.perToko ?? []).filter((t) => t.galat).map((t) => (
            <div key={t.storeId} style={{ fontSize: 12, marginTop: 2 }}>· {t.toko}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Nomor pesanan disebutkan — tanpa itu tidak ada yang bisa diperiksa sendiri. */
function Nomor({ daftar, jumlah }) {
  if (!daftar?.length) return null;
  return (
    <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: 12, color: "#6B7280", wordBreak: "break-all" }}>
      {daftar.join(", ")}
      {jumlah > daftar.length && ` … dan ${angka(jumlah - daftar.length)} lagi`}
    </div>
  );
}
