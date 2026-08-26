import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { omniApi } from "../../../utils/omniApi";
import CerminSellerCenter from "./CerminSellerCenter";
import KepalaAntrean from "./KepalaAntrean";
import Kelompok, { Catatan } from "./KelompokSku";
import TombolAturKirim from "./TombolAturKirim";
import { angka } from "./format-antrean";

// ─────────────────────────────────────────────────────────────────────────────
// ANTREAN CETAK RESI
//
// Acuan: docs/SPEC-cetak-resi.md
//
// TUJUAN
// Menunjukkan pesanan yang menunggu labelnya dicetak, dikelompokkan per SKU,
// supaya orang gudang bisa mengambil barang sejenis sekali jalan lalu menempel
// labelnya berurutan — bukan bolak-balik rak mengikuti urutan pesanan.
//
// FILOSOFI — ANGKANYA TURUN SENDIRI
// Setelah mencetak, antrean dimuat ulang. Keanggotaan antrean diturunkan dari
// catatan cetak, bukan disimpan di kolom tersendiri, jadi yang sudah tercetak
// keluar dengan sendirinya. Inilah yang membuat "tumpukan habis → nol" benar-
// benar terlihat, dan yang membuat klik ganda tidak mencetak dua kali.
//
// SUSUNAN LAYAR — 19 Agustus 2026
// Kepala layar dipindah ke KepalaAntrean.jsx: dua zona, bukan empat pita
// kendali bertumpuk. Alasan lengkapnya ditulis di berkas itu. Berkas ini
// tinggal mengurus keadaan (channel, sisi, tanggal) dan daftar isinya.
// ─────────────────────────────────────────────────────────────────────────────

export default function AntreanCetak() {
  const [channel, setChannel] = useState("shopee");
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(null);

  // DUA SISI DARI SATU TUMPUKAN — aturan pemilik toko, 19 Agustus 2026:
  // "total resi 30, belum cetak 30 · sudah cetak 0. Begitu 15 dicetak, jadi
  // belum cetak 15 · sudah cetak 15."
  //
  // Sisi "sudah" bukan sekadar arsip: di situlah resi yang hilang sebelum
  // sempat ditempel bisa dicetak ulang. Berkas PDF-nya sengaja tidak disimpan,
  // jadi satu-satunya jalan adalah membuatnya lagi dari riwayat.
  const [sisi, setSisi] = useState("belum");

  // Saringan tanggal memakai tanggal PESANAN, bukan tanggal cetak. Kalau
  // memakai tanggal cetak, sisi "belum" tidak punya tanggal untuk disaring dan
  // totalnya berubah-ubah sendiri — padahal justru totalnya yang harus tetap.
  //
  // Kosong berarti SELURUH tumpukan. Sisi "belum" tidak boleh menyembunyikan
  // pekerjaan yang belum selesai hanya karena tanggalnya tidak dipilih.
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  // Nomor urut permintaan: berpindah tab cepat bisa membuat jawaban lama datang
  // belakangan dan menimpa yang baru — layar lalu menampilkan antrean Shopee
  // padahal tab TikTok yang aktif.
  const nomorTerakhir = useRef(0);

  const ambil = useCallback(async () => {
    const nomor = ++nomorTerakhir.current;
    setMemuat(true);
    setGalat(null);
    try {
      const d = await omniApi.antreanCetak(channel, {
        sisi,
        ...(dari ? { dari } : {}),
        ...(sampai ? { sampai } : {}),
      });
      if (nomor === nomorTerakhir.current) setData(d);
    } catch {
      if (nomor === nomorTerakhir.current) setGalat("Gagal memuat antrean cetak.");
    } finally {
      if (nomor === nomorTerakhir.current) setMemuat(false);
    }
  }, [channel, sisi, dari, sampai]);

  useEffect(() => { ambil(); }, [ambil]);

  const ubahTanggal = useCallback((a, b) => { setDari(a); setSampai(b); }, []);

  return (
    <>
      <KepalaAntrean
        channel={channel} setChannel={setChannel}
        sisi={sisi} setSisi={setSisi}
        dari={dari} sampai={sampai} onTanggal={ubahTanggal}
        data={data} onSelesai={ambil}
      />

      {/* SAAT MEMUAT ULANG, ISINYA TIDAK DIKOSONGKAN.
          Dulu tiap muat ulang mengganti seluruh isi dengan "Memuat antrean…".
          Akibatnya nyata dan sempat lolos ke produksi: setelah menekan "Atur
          Pengiriman", antrean dimuat ulang, panel hasilnya IKUT TERBONGKAR,
          dan laporan "kenapa gagal" hilang sebelum sempat dibaca — pemilik
          toko melihat tombol yang seolah tidak melakukan apa-apa.

          Layar kosong hanya untuk muatan PERTAMA, saat memang belum ada apa
          pun untuk ditampilkan. */}
      {memuat && !data ? (
        <div style={{ color: "#9CA3AF", fontSize: 13, padding: "20px 2px" }}>Memuat antrean…</div>
      ) : galat ? (
        <div style={{ color: "#991B1B", fontSize: 13, padding: "20px 2px" }}>{galat}</div>
      ) : !data || data.totalLabel === 0 ? (
        <div style={{ color: "#6B7280", fontSize: 14, padding: "28px 2px", textAlign: "center" }}>
          {sisi === "sudah"
            ? "Belum ada resi yang tercetak untuk saringan ini."
            : "Tidak ada pesanan yang menunggu dicetak. 👍"}
        </div>
      ) : (
        <>
          {/* CATATAN PANJANG SOAL PERMINTAAN BATAL DIHAPUS — 26 Agustus 2026.
              Dulu di sini ada satu paragraf penjelasan plus tombol keduanya
              sendiri. Pemilik toko: "ini mending dihapus saja, karena
              menimbulkan doble informasi dan kebingungan."

              Dia benar: lencana "Diminta batal pembeli" di baris pesanannya
              sudah mengatakan hal yang sama, di tempat yang lebih tepat —
              menempel pada pesanan yang dimaksud. Sekarang resinya ikut
              tercetak oleh tombol utama kalau memang tersedia. */}

          {data.selisihSisi ? (
            <Catatan ikon={<Info size={16} />} warna="#991B1B" latar="#FEF2F2">
              Ada <strong>{angka(Math.abs(data.selisihSisi))} pesanan</strong> yang tidak terhitung di
              sisi mana pun. Ini kekeliruan di sisi kami — tolong beri tahu, jangan dipakai sebagai
              acuan dulu.
            </Catatan>
          ) : null}

          <CerminSellerCenter channel={channel} dari={dari} sampai={sampai} />

          {data.pesananLintasKelompok > 0 && (
            <Catatan ikon={<Info size={16} />} warna="#1E40AF" latar="#EFF6FF">
              {angka(data.pesananLintasKelompok)} pesanan berisi lebih dari satu SKU, jadi muncul
              di beberapa kelompok. Labelnya tetap <strong>satu</strong> per pesanan — karena itu
              jumlah tiap kelompok kalau dijumlahkan lebih besar dari {angka(data.totalLabel)}.
            </Catatan>
          )}

          {data.pesananPaketPecah > 0 && (
            <Catatan ikon={<AlertTriangle size={16} />} warna="#991B1B" latar="#FEF2F2">
              {angka(data.pesananPaketPecah)} pesanan pecah jadi beberapa paket. Sistem baru
              menyimpan paket pertama, jadi labelnya belum lengkap — cetak sisanya lewat Seller Center.
            </Catatan>
          )}

          {data.terpotong && (
            <Catatan ikon={<AlertTriangle size={16} />} warna="#991B1B" latar="#FEF2F2">
              Antrean melebihi {angka(data.batas)} pesanan dan ditampilkan sebagian.
              Beri tahu kami — batasnya perlu dinaikkan.
            </Catatan>
          )}

          {data.kelompok.map((k) => (
            <Kelompok key={k.sku} k={k} channel={channel} sisi={sisi} dari={dari} sampai={sampai} onSelesai={ambil} />
          ))}

          <div style={{ fontSize: 12, color: "#9CA3AF", padding: "10px 2px", textAlign: "center" }}>
            Resi tercetak keluar dari antrean dengan sendirinya. Yang gagal tetap di sini
            supaya tidak ada yang terlewat.
          </div>
        </>
      )}
    </>
  );
}
