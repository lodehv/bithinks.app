// Nama dan warna tiap tahap antrean cetak, dipakai baris pesanan maupun panel
// "kenapa tidak bisa dicetak".
//
// Berdiri sendiri karena aturan react-refresh melarang berkas komponen
// mengekspor konstanta: berkas campuran membuat muat-ulang panas berhenti
// bekerja untuk seluruh layar.

export const TAHAP = {
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
  // Statusnya DIKENALI, dan status itu memang bukan keadaan yang dicetak —
  // diretur, dibatalkan, sudah jalan. Dulu semuanya disebut "Perlu diperiksa",
  // dan pemilik toko benar mengeluh: tidak ada satu kata pun tentang apa yang
  // perlu diperiksa. Sebutan aslinya dari marketplace ditampilkan di sebelahnya.
  bukan_untuk_dicetak: { teks: "Tidak untuk dicetak", warna: "#3F3F46", latar: "#FAFAFA" },
  perlu_diperiksa: { teks: "Perlu diperiksa",       warna: "#991B1B", latar: "#FEF2F2" },
};
