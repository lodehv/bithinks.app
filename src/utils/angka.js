// ─────────────────────────────────────────────────────────────────────────────
// ANGKA YANG DIKETIK PEMILIK TOKO — pemisah ribuan sambil mengetik.
//
// MASALAH YANG DIPERBAIKI
// Kolom biaya iklan dulu `<input type="number">`. Bentuk itu tidak bisa
// menampilkan pemisah ribuan sama sekali — peramban melarangnya — jadi
// "1500000" tampil sebagai deretan angka polos. Pemilik toko harus menghitung
// digitnya sendiri untuk tahu apakah yang diketik satu setengah juta atau lima
// belas juta, dan itu persis jenis salah ketik yang tidak pernah ketahuan:
// angkanya masuk, lalu diam-diam mengubah laba yang terlihat.
//
// FILOSOFI
// Yang ditampilkan berpemisah ("1.500.000"), yang disimpan tetap bilangan
// bulat. Keduanya tidak pernah tertukar karena hanya ada satu jalan masuk dan
// satu jalan keluar di berkas ini.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bilangan → teks berpemisah ribuan gaya Indonesia, tanpa "Rp".
 * Dipakai untuk ISI kolom isian; label mata uangnya ditaruh di sebelahnya.
 */
export function teksRibuan(nilai) {
  const n = Number(nilai)
  if (!Number.isFinite(n)) return ''
  return Math.round(Math.abs(n)).toLocaleString('id-ID')
}

/**
 * Teks yang sedang diketik → bilangan bulat.
 *
 * Semua yang bukan digit dibuang, termasuk titik pemisahnya sendiri. Titik
 * TIDAK pernah dibaca sebagai desimal: "1.000" berarti seribu rupiah, dan
 * menafsirkannya sebagai satu rupiah akan mengubah angka pemilik toko seribu
 * kali lipat tanpa satu pun peringatan.
 *
 * Tanda minus ikut dibuang. Beban negatif akan MENAMBAH laba, dan itu bukan
 * koreksi melainkan kebocoran.
 *
 * @returns bilangan bulat ≥ 0. Teks kosong menghasilkan 0.
 */
export function bacaRibuan(teks) {
  const digit = String(teks ?? '').replace(/\D/g, '')
  if (digit === '') return 0
  const n = Number(digit)
  return Number.isFinite(n) ? n : 0
}
