import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { omniApi } from "../../../utils/omniApi";
import TombolCetak from "./TombolCetak";
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

      {memuat ? (
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
          {/* Selisih antara total label dan penjumlahan kelompok DIJELASKAN,
              bukan disembunyikan. Angka yang tidak bisa dijelaskan membuat
              orang berhenti memercayai seluruh layar. */}
          {data.totalDimintaBatal > 0 && (
            <Catatan ikon={<Info size={16} />} warna="#9A3412" latar="#FFF7ED">
              {angka(data.totalDimintaBatal)} pesanan sedang <strong>diminta batal pembeli</strong> dan
              ikut terhitung di sini — itulah yang membuat angkanya sama dengan Seller Center.
              Resinya <strong>tidak ikut</strong> tombol di atas — supaya angka di tombol selalu
              sama dengan yang tercetak. Periksa dulu di Seller Center; kalau pembatalannya tidak
              Anda setujui, pesanannya masih harus dikirim dan resinya bisa dicetak dari sini.
              Kalau tidak dijawab dalam 24 jam, Shopee membatalkannya sendiri dan pesanannya keluar
              dari antrean.
              <div style={{ marginTop: 10 }}>
                <TombolCetak
                  channel={channel}
                  jumlah={data.totalDimintaBatal}
                  dimintaBatal="hanya"
                  teks={`Cetak ${angka(data.totalDimintaBatal)} resi yang diminta batal`}
                  dari={dari || undefined}
                  sampai={sampai || undefined}
                  onSelesai={ambil}
                />
              </div>
            </Catatan>
          )}

          {/* PENGIRIMAN YANG BELUM DIATUR — jangan cuma diberi tahu, beri
              jalan keluarnya di tempat yang sama.

              Sampai 26 Agustus 2026 layar ini berhenti di kalimat "perlu atur
              pengiriman". Itu menampilkan kekurangan kita sebagai kalau-kalau
              masalah pesanannya, dan menyuruh pemilik toko pergi ke Seller
              Center mengerjakan hal yang sistem ini seharusnya kerjakan. */}
          {channel === "shopee" && data.totalPerluAtur > 0 && (
            <Catatan ikon={<Info size={16} />} warna="#92400E" latar="#FFFBEB">
              {angka(data.totalPerluAtur)} pesanan <strong>belum diatur pengirimannya</strong>, jadi
              resinya belum terbit. Pilih caranya sekali di bawah ini — berlaku untuk semua pesanan,
              tidak perlu satu per satu.
              <TombolAturKirim
                jumlah={data.totalPerluAtur}
                dari={dari || undefined}
                sampai={sampai || undefined}
                onSelesai={ambil}
              />
            </Catatan>
          )}

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
