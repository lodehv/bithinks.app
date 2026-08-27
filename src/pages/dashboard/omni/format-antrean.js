// Penulisan angka dan tanggal untuk layar antrean cetak.
//
// Dikumpulkan di satu berkas supaya "19 Agu 2026" ditulis dengan cara yang
// sama di judul, di tombol tanggal, dan di daftar pesanan. Tanggal yang
// ditulis dua gaya berbeda di satu layar membuat orang mengira itu dua
// tanggal yang berbeda.

export const angka = (n) => Number(n ?? 0).toLocaleString("id-ID");

/** "23 Agu" — untuk baris pesanan yang ruangnya sempit. */
export const tanggal = (iso) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

const hari = (s) =>
  new Date(`${s}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });

/** yyyy-mm-dd menurut jam di layar orangnya, bukan UTC. */
const iso = (d) => d.toLocaleDateString("sv-SE");

export const hariIni = () => iso(new Date());

export const mundur = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

// Ditaruh DI ATAS pemakainya dengan sengaja. `labelRentang` memanggil keduanya,
// dan proyek ini pernah kehilangan satu halaman penuh gara-gara "zona mati
// temporal" — satu baris yang ditaruh di atas sumbernya, build hijau, layar
// putih. Urutan di berkas ini bukan soal kerapian.

/**
 * "27 Agu 09:10" — kapan sesuatu terjadi, sependek mungkin tapi tetap jelas.
 *
 * Dipakai menyebut kapan resi terakhir tercetak. Tanggalnya ikut karena
 * cetakan terakhir bisa saja kemarin sore, dan jam saja akan menyesatkan.
 */
export const jamSingkat = (iso) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).replace(/\./g, ":").replace(", ", " ");

/**
 * Nama periode yang sedang dilihat, dalam bahasa manusia.
 *
 * Kosong berarti SELURUH tumpukan, dan itu harus disebut terang-terangan.
 * "Semua tanggal" mencegah orang mengira layarnya cuma menampilkan hari ini
 * lalu menutup tab dengan pekerjaan kemarin yang belum tercetak.
 */
export function labelRentang(dari, sampai) {
  if (!dari && !sampai) return "Semua tanggal";

  // RENTANG YANG PUNYA NAMA DISEBUT NAMANYA.
  //
  // "2 hari terakhir" langsung terbaca; "26 Agu 2026 – 27 Agu 2026" harus
  // dihitung dulu di kepala. Keduanya benar, tapi cuma satu yang menolong.
  if (sampai === hariIni()) {
    if (dari === hariIni()) return "Hari ini";
    if (dari === mundur(1)) return "2 hari terakhir";
    if (dari === mundur(6)) return "7 hari terakhir";
  }

  if (dari && sampai) return dari === sampai ? hari(dari) : `${hari(dari)} – ${hari(sampai)}`;
  return dari ? `Sejak ${hari(dari)}` : `Sampai ${hari(sampai)}`;
}

