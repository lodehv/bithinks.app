// Mock orders for the preview screenshot. Numbers are deliberately uneven, so
// a column that silently right-aligns the wrong way is visible in the picture.

const barang = (name, sku, qty) => ({ name, sku, qty, imageUrl: null })

export const pesananTiruan = {
  orders: [
    {
      id: 'ord-9f21c4a7', externalOrderNo: '260831RK1Q9N3J', channel: 'shopee',
      status: 'dikemas', channelStatus: 'READY_TO_SHIP',
      orderedAt: '2026-09-18T09:14:00+07:00', total: 412500, totalCogs: 236000,
      itemCount: 3, recipientName: 'Wulan Prameswari', trackingNumber: 'SPXID043918274',
      items: [barang('Pupuk NPK 16-16-16 · 1 kg', 'PUPUK-NPK-16', 2)],
    },
    {
      id: 'ord-3b77e015', externalOrderNo: '260831RK2Q9N3J', channel: 'tiktok',
      status: 'dikirim', channelStatus: 'IN_TRANSIT',
      orderedAt: '2026-09-17T16:48:00+07:00', total: 1287000, totalCogs: 742300,
      itemCount: 7, recipientName: 'Bagas Nurhadi', trackingNumber: 'JX7743029118',
      items: [barang('Benih Cabai Rawit · sachet 10 g', 'BENIH-CABAI-01', 5)],
    },
    {
      id: 'ord-c0d8f332', externalOrderNo: '260831RK3Q9N3J', channel: 'shopee',
      status: 'baru', channelStatus: 'UNPAID',
      orderedAt: '2026-09-19T07:02:00+07:00', total: 96000, totalCogs: null,
      itemCount: 1, recipientName: 'Ratna Sihombing', trackingNumber: null,
      items: [barang('Polybag 25 x 25 · isi 100', 'POLYBAG-2525', 1)],
    },
    {
      id: 'ord-51ae9d68', externalOrderNo: '260831RK4Q9N3J', channel: 'shopee',
      status: 'selesai', channelStatus: 'COMPLETED',
      orderedAt: '2026-09-11T11:35:00+07:00', total: 2418750, totalCogs: 1329400,
      itemCount: 12, recipientName: 'Koperasi Tani Sumber Rejeki', trackingNumber: 'SPXID043701852',
      items: [barang('Pupuk Kandang Fermentasi · 5 kg', 'PUPUK-KDG-5', 9)],
    },
    {
      id: 'ord-7d4402bb', externalOrderNo: '260831RK5Q9N3J', channel: 'tiktok',
      status: 'batal', channelStatus: 'CANCELLED',
      orderedAt: '2026-09-14T20:21:00+07:00', total: 174500, totalCogs: 98200,
      itemCount: 2, recipientName: 'Eka Purnamasari', trackingNumber: null,
      items: [barang('Sekam Bakar · 2 kg', 'SEKAM-BKR-2', 2)],
    },
  ],
  counts: { unpaid: 4, baru: 18, dikemas: 1096, dikirim: 213, selesai: 3412, batal: 38, return: 141 },
  meta: { page: 1, perPage: 20, total: 4921, totalPages: 247 },
}
