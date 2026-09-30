// Mock master products and the home summary.

export const produkTiruan = [
  { id: 'p-01', name: 'Pupuk NPK 16-16-16 · 1 kg', sku: 'PUPUK-NPK-16', category: 'Pupuk',
    masterStock: 0, price: 28500, cogs: 19400, fullySynced: true, totalKeluar: 4120 },
  { id: 'p-02', name: 'Benih Cabai Rawit · sachet 10 g', sku: 'BENIH-CABAI-01', category: 'Benih',
    masterStock: 62, price: 17000, cogs: 9100, fullySynced: false, totalKeluar: 2874 },
  { id: 'p-03', name: 'Pupuk Kandang Fermentasi · 5 kg', sku: 'PUPUK-KDG-5', category: 'Pupuk',
    masterStock: 1840, price: 42000, cogs: 26300, fullySynced: true, totalKeluar: 1663 },
  { id: 'p-04', name: 'Polybag 25 x 25 · isi 100', sku: 'POLYBAG-2525', category: 'Perlengkapan',
    masterStock: 3, price: 24000, cogs: 15800, fullySynced: false, totalKeluar: 908 },
  { id: 'p-05', name: 'Sekam Bakar · 2 kg', sku: 'SEKAM-BKR-2', category: 'Media Tanam',
    masterStock: 734, price: 19500, cogs: 11200, fullySynced: true, totalKeluar: 1245 },
]

export const ringkasanPesananTiruan = {
  tanggal: '2026-09-19',
  hariIni: {
    pesanan: 148, omset: 21847500,
    perChannel: [
      { channel: 'shopee', pesanan: 96, total: 14208000 },
      { channel: 'tiktok', pesanan: 52, total: 7639500 },
    ],
  },
  antrian: {
    perluDikerjakan: 214, perluAtur: 37, siapCetak: 1096,
    menungguPembayaran: 4, perluDiperiksa: 12, tertuaWib: '2026-09-14',
  },
}

export const statistikProdukTiruan = {
  totalMovementKeluarCount: 11810,
  totalStokTersediaSum: 26322,
  hppMissingQty: 1420,
  chart: [],
}
