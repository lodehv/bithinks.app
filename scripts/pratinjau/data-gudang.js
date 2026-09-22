// Mock warehouse data for the preview screenshot.

export const ringkasanGudangTiruan = {
  kpi: {
    skuAktif: 184, nilaiStok: 418737500, nilaiStokParsial: true,
    stokFisik: 27418, terkunci: 1096, siapJual: 26322, dalamPerjalanan: 0,
  },
  alerts: [
    { key: 'habis', label: 'Stok habis', count: 7, unit: 'SKU', samples: ['PUPUK-NPK-16', 'SEKAM-BKR-2', 'POLYBAG-2525'] },
    { key: 'menipis', label: 'Stok menipis di bawah cadangan', count: 23, unit: 'SKU', samples: ['BENIH-CABAI-01', 'PUPUK-KDG-5'] },
    { key: 'negatif', label: 'Tersedia minus setelah alokasi', count: 2, unit: 'SKU', samples: ['BENIH-TOMAT-04'] },
  ],
  movement: [
    { bucket: '2026-09-15', masuk: 1420, keluar: 980 },
    { bucket: '2026-09-16', masuk: 310, keluar: 1247 },
    { bucket: '2026-09-17', masuk: 0, keluar: 1663 },
    { bucket: '2026-09-18', masuk: 2400, keluar: 894 },
    { bucket: '2026-09-19', masuk: 180, keluar: 1502 },
  ],
}

const baris = (productId, name, sku, category, onHand, allocated, safetyStock, status) => ({
  productId, name, sku, category, imageUrl: null,
  onHand, allocated, availableToSell: onHand - allocated, safetyStock,
  incoming: 0, incomingOrdered: 0, incomingReceived: 0, incomingOrders: [], status,
})

export const stokGudangTiruan = [
  baris('p-01', 'Pupuk NPK 16-16-16 · 1 kg', 'PUPUK-NPK-16', 'Pupuk', 0, 0, 40, 'habis'),
  baris('p-02', 'Benih Cabai Rawit · sachet 10 g', 'BENIH-CABAI-01', 'Benih', 62, 45, 80, 'menipis'),
  baris('p-03', 'Pupuk Kandang Fermentasi · 5 kg', 'PUPUK-KDG-5', 'Pupuk', 1840, 214, 200, 'aman'),
  baris('p-04', 'Polybag 25 x 25 · isi 100', 'POLYBAG-2525', 'Perlengkapan', 12, 30, 25, 'menipis'),
  baris('p-05', 'Sekam Bakar · 2 kg', 'SEKAM-BKR-2', 'Media Tanam', 734, 118, 150, 'aman'),
]
