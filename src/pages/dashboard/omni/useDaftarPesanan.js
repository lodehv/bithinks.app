import { useCallback, useEffect, useRef, useState } from "react";
import { omniApi } from "../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// useDaftarPesanan — mengambil satu halaman pesanan beserta jumlah tiap tab.
//
// TUJUAN
// Menjadi satu-satunya pintu halaman Pesanan ke server, supaya komponen
// tampilannya tidak perlu tahu soal halaman, penundaan ketikan, atau jawaban
// yang datang tidak berurutan.
//
// FILOSOFI
// Sebelum 17 Agustus 2026, halaman ini menarik 200 pesanan terbaru sekali di
// awal lalu mengerjakan semuanya sendiri di browser: menyaring, menghitung
// badge, mengurutkan, memenggal halaman. Semuanya berdiri di atas 200 baris
// yang bukan keseluruhan, jadi semua angkanya salah.
//
// Sekarang pembagian tugasnya tegas: server yang menyaring dan menghitung,
// browser yang menampilkan. Sebab hanya server yang melihat seluruh pesanan.
//
// DAMPAK
// Setiap perubahan tab, pencarian, tanggal, atau halaman berarti satu
// permintaan baru. Itu memang lebih banyak permintaan daripada dulu — dan itu
// pertukaran yang disengaja: yang dulu "hemat" sebenarnya hanya menampilkan
// sebagian data sambil mengaku menampilkan semuanya.
// ─────────────────────────────────────────────────────────────────────────────

const JEDA_KETIK_MS = 350;

const KOSONG = {
  orders: [],
  counts: {},
  meta: { page: 1, limit: 0, total: 0, totalPages: 1 },
};

/**
 * Ubah pilihan di layar jadi parameter URL.
 * Yang kosong tidak dikirim, supaya URL-nya tetap terbaca saat ditelusuri.
 */
function keParams({ tab, page, perPage, sort, search, from, to, channels }) {
  const p = { tab, page, perPage, sort };
  if (search?.trim()) p.search = search.trim();
  if (from) p.from = from;
  if (to) p.to = to;
  if (channels?.size) p.channel = [...channels].join(",");
  return p;
}

export function useDaftarPesanan(pilihan) {
  const [hasil, setHasil] = useState(null); // null = belum pernah dimuat
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(null);

  // Nomor urut permintaan. Tanpa ini, jawaban permintaan lama yang datang
  // terlambat akan menimpa jawaban yang lebih baru — misalnya saat mengetik
  // cepat di kotak cari, hasil untuk "AB" bisa menimpa hasil untuk "ABC".
  // Layarnya lalu menampilkan pesanan yang tidak cocok dengan apa yang tertulis
  // di kotak pencarian, dan tidak ada yang tahu itu terjadi.
  const nomorTerakhir = useRef(0);

  const { tab, page, perPage, sort, search, from, to, channels } = pilihan;

  // Penundaan hanya untuk ketikan. Klik tab atau ganti halaman harus langsung
  // terasa; menahannya 350 milidetik cuma membuat aplikasi terasa berat.
  const [kataTertunda, setKataTertunda] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setKataTertunda(search), JEDA_KETIK_MS);
    return () => clearTimeout(t);
  }, [search]);

  const kunci = JSON.stringify(
    keParams({ tab, page, perPage, sort, search: kataTertunda, from, to, channels }),
  );

  const ambil = useCallback(async () => {
    const nomor = ++nomorTerakhir.current;
    setMemuat(true);
    setGalat(null);
    try {
      const data = await omniApi.listOrders(JSON.parse(kunci));
      if (nomor !== nomorTerakhir.current) return; // sudah ada yang lebih baru
      setHasil(data);
    } catch (e) {
      if (nomor !== nomorTerakhir.current) return;
      setGalat(e);
      setHasil(KOSONG);
    } finally {
      if (nomor === nomorTerakhir.current) setMemuat(false);
    }
  }, [kunci]);

  useEffect(() => { ambil(); }, [ambil]);

  return {
    orders: hasil?.orders ?? [],
    counts: hasil?.counts ?? {},
    meta: hasil?.meta ?? KOSONG.meta,
    // Bedanya penting: `pertamaKali` menampilkan "Memuat pesanan…", sedangkan
    // `memuat` pada pemuatan berikutnya cuma meredupkan daftar yang sudah ada.
    // Kalau daftarnya dikosongkan tiap ganti halaman, layarnya berkedip.
    pertamaKali: hasil === null,
    memuat,
    galat,
    muatUlang: ambil,
  };
}
