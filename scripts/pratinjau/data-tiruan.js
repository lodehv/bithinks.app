// Data tiruan seukuran data sungguhan (10 toko, angka miliaran, nama toko
// panjang). Gunanya cuma satu: memaksa tata letak menghadapi isi terburuk yang
// wajar. TIDAK ada kredensial, TIDAK ada panggilan jaringan.
const toko = [
  ['shopee', 'Bithinks Official Shop Jakarta', 551470002, 149389330, 104896009, 161855],
  ['tiktok', 'Bithinks Store Indonesia', 474083440, 175404132, 99171379, 2980007],
  ['shopee', 'Bithinks Beauty Official', 309039739, 86818944, 71393924, 1154686],
  ['tiktok', 'Bithinks Grosir Bandung', 33645379, 9473300, 5429329, 314973],
  ['shopee', 'Bithinks Reseller Surabaya', 26358552, 9229118, 5033856, 62493],
  ['tiktok', 'Bithinks Warehouse Medan', 8806000, 2630000, 2002963, 35998],
  ['shopee', 'Bithinks Outlet Semarang', 4705954, 1477400, 932779, 0],
  ['tiktok', 'Bithinks Cabang Makassar', 3120000, 980000, 611200, 12000],
  ['shopee', 'Bithinks Cabang Denpasar', 1980500, 620100, 388900, 0],
  ['tiktok', 'Bithinks Cabang Palembang', 940000, 300000, 184300, 5500],
]

// Biaya iklan SENGAJA tidak seragam. Dua toko dibiarkan nol supaya potretnya
// memperlihatkan kolom kosong dan kolom terisi bersebelahan — dan toko terakhir
// beriklan lebih besar daripada labanya, keadaan yang justru paling perlu
// terbaca di layar.
const iklanTiruan = [12500000, 9800000, 6250000, 1750000, 880000, 0, 145000, 0, 62000, 1200000]

const per_toko = toko.map(([channel, storeName, omset, cogs, fees, retur], i) => {
  const iklan = iklanTiruan[i] ?? 0
  const netProfit = omset - cogs - fees - iklan
  return { storeId: `t${i}`, storeName, channel, omset, cogs, fees, retur, iklan,
           netProfit, margin: omset > 0 ? (netProfit / omset) * 100 : 0 }
})

const j = (k) => per_toko.reduce((a, b) => a + b[k], 0)
const omsetPerkiraan = j('omset')

export const statsTiruan = {
  totals: { omsetKotor: 1567173099, omsetPerkiraan, pipeline: 0, terkonfirmasi: 0,
            berisiko: 0, retur: j('retur'), batal: 0 },
  buckets: Array.from({ length: 60 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 5, 23 + i))
    const gelombang = 0.55 + 0.45 * Math.sin(i / 6) + (i > 40 ? 0.5 : 0)
    const om = Math.round(omsetPerkiraan / 60 * gelombang)
    return { bucket: d.toISOString().slice(0, 10), omsetPerkiraan: om,
             terkonfirmasi: Math.round(om * (i > 48 ? 0.15 : 0.92)) }
  }),
  per_toko,
  // Tiga sudut pandang. Angkanya sengaja BERBEDA jauh satu sama lain dan
  // mencerminkan bentuk aslinya di produksi: yang tuntas hari ini berasal dari
  // pesanan 8–9 hari lalu, dan yang cair lebih kecil lagi karena beban platform
  // sudah dipotong. Kalau ketiganya dibuat sama, potretnya tidak akan
  // memperlihatkan apa pun yang perlu diperiksa mata.
  //
  // `perPlatform` memuat Shopee tanpa satu pun tanggal cair — itu keadaan
  // produksi sungguhan per 29 Agu 2026 (0 dari 1.473), dan justru keadaan
  // itulah yang paling perlu terlihat di potret.
  pov: {
    omset: { nilai: 1414149566, pesanan: 5231, dikeluarkan: { nilai: 936929, pesanan: 13 } },
    beban: { nilai: 726366963 + j('iklan'), platform: 290044639, cogs: 436322324, iklan: j('iklan') },
    laba: { nilai: 687782603, margin: 48.6 },
    tuntas: {
      nilai: 38295057, pesanan: 575,
      cakupan: { punyaTanggal: 18927, seharusnya: 18930 },
    },
    penerimaan: {
      nilai: 21740118, pesanan: 312,
      cakupan: {
        punyaTanggal: 3114, seharusnya: 21641,
        perPlatform: [
          { channel: 'shopee', punyaTanggal: 0, seharusnya: 10116 },
          { channel: 'tiktok', punyaTanggal: 3114, seharusnya: 11525 },
        ],
      },
    },
  },
  // Posisi uang (saldo). Angkanya sengaja jauh lebih besar daripada arus
  // harian — memang begitu bentuknya: uang yang sedang di jalan menumpuk dari
  // banyak hari, sementara arus harian cuma sehari. Kalau dibuat sebanding,
  // potretnya tidak memperlihatkan alasan zona ini dipisah.
  posisi: {
    belumDikirim: { nilai: 41250000, pesanan: 312, dasar: 'kotor' },
    diJalan: { nilai: 268400000, pesanan: 2140, dasar: 'kotor' },
    berisikoBatal: { nilai: 2_394_414, pesanan: 38, dasar: 'kotor' },
    selesai: { nilai: 1_754_164_499, pesanan: 30_072, dasar: 'kotor' },
    // Nomor pesanan tiap tahap. Dua baris cukup untuk potret — yang perlu
    // terlihat bentuk tabelnya, bukan panjangnya.
    daftar: [
      { id: 'P1', kartu: 'belumDikirim', pesanan: '250914AAA111', channel: 'shopee', toko: 'Bithinks Official Shop Jakarta', nominal: 132_000, status: 'READY_TO_SHIP' },
      { id: 'P2', kartu: 'diJalan', pesanan: '576461234567890001', channel: 'tiktok', toko: 'Bithinks Store Indonesia', nominal: 98_000, status: 'IN_TRANSIT' },
      { id: 'P3', kartu: 'berisikoBatal', pesanan: '250913BBB222', channel: 'shopee', toko: 'Bithinks Grosir Bandung', nominal: 77_000, status: 'IN_CANCEL' },
      { id: 'P4', kartu: 'selesai', pesanan: '576461234567890002', channel: 'tiktok', toko: 'Bithinks Beauty Official', nominal: 410_000, status: 'COMPLETED' },
    ],
    belumDibayar: { nilai: 190115, pesanan: 5, dasar: 'kotor' },
    ikutSaringanTanggal: false,
    // Sel rincian: tahap × platform × toko. Dua toko per platform supaya
    // pengelompokan benar-benar teruji — satu toko saja akan terlihat rapi
    // apa pun bentuk kodenya.
    perToko: [
      { tahap: 'diJalan', channel: 'shopee', storeId: 't0', toko: 'Bithinks Official Shop Jakarta', pesanan: 5, nilai: 903_000 },
      { tahap: 'diJalan', channel: 'shopee', storeId: 't3', toko: 'Bithinks Grosir Bandung', pesanan: 1, nilai: 58_000 },
      { tahap: 'diJalan', channel: 'tiktok', storeId: 't1', toko: 'Bithinks Store Indonesia', pesanan: 2, nilai: 512_000 },
      { tahap: 'sampai', channel: 'tiktok', storeId: 't2', toko: 'Bithinks Beauty Official', pesanan: 10, nilai: 2_105_900 },
    ],
  },
  // Cakupan beban sengaja TIDAK lengkap di pratinjau — justru keadaan itulah
  // yang perlu terlihat di potret. Angkanya meniru produksi 29 Agu 2026.
  cakupan_beban: {
    pesananBerbeban: 108, pesananTotal: 542, omsetTanpaBeban: 11384210, lengkap: false,
    // Dibuat beberapa jam lalu supaya potretnya memperlihatkan bentuk kalimatnya.
    sinkronTerakhir: new Date(Date.now() - 5 * 3600_000).toISOString(),
    jedaSinkronJam: 6,
  },
  biaya_api: j('fees'),
  cost_breakdown: [],
  biaya_iklan: j('iklan'),
  cogs_total: j('cogs'),
  total_biaya_beban: j('fees') + j('cogs') + j('iklan'),
  profit: omsetPerkiraan - j('fees') - j('cogs') - j('iklan'),
  profit_margin: (omsetPerkiraan - j('fees') - j('cogs') - j('iklan')) / omsetPerkiraan * 100,
  // ── RETUR ────────────────────────────────────────────────────────────────
  // Jumlah pesanan diambil dari sensus produksi 11 Sep 2026 supaya bentuk
  // nyatanya ikut terpotret: retur kecil, dan Shopee menumpuk di tahap awal.
  //
  // Satu baris SENGAJA tanpa resi dan tanpa titik perjalanan. Marketplace tidak
  // selalu mengirim keduanya, dan potret yang semua barisnya lengkap tidak
  // pernah memperlihatkan bagaimana baris yang tidak lengkap terbaca.
  retur: {
    total: { nilai: 14_295_039, pesanan: 141 },
    periodeLalu: { nilai: 2_576_597, pesanan: 10 },
    diJalan: { nilai: 11_713_442, pesanan: 130 },
    sampai: { nilai: 2_105_900, pesanan: 10 },
    ikutSaringanTanggal: true,
    // Sel rincian: tahap × platform × toko. Dua toko per platform supaya
    // pengelompokan benar-benar teruji — satu toko saja akan terlihat rapi
    // apa pun bentuk kodenya.
    perToko: [
      { tahap: 'diJalan', channel: 'shopee', storeId: 't0', toko: 'Bithinks Official Shop Jakarta', pesanan: 5, nilai: 903_000 },
      { tahap: 'diJalan', channel: 'shopee', storeId: 't3', toko: 'Bithinks Grosir Bandung', pesanan: 1, nilai: 58_000 },
      { tahap: 'diJalan', channel: 'tiktok', storeId: 't1', toko: 'Bithinks Store Indonesia', pesanan: 2, nilai: 512_000 },
      { tahap: 'sampai', channel: 'tiktok', storeId: 't2', toko: 'Bithinks Beauty Official', pesanan: 10, nilai: 2_105_900 },
    ],
    daftar: [
      {
        id: 'R1', kartu: 'diJalan', tahap: 'diJalan', pesanan: '250911ABCD1234',
        channel: 'Shopee', toko: 'Bithinks Official Shop Jakarta',
        item: '[PAKET RESELLER KCL] Business Package KCL - Pupuk Dewa Dewi, Pupuk Manohara Merah - 100% Original × 1 +1 item lain', nominal: 189_000,
        alasan: 'Barang rusak saat diterima', alasanAsli: 'DAMAGED',
        resi: 'SPXID048812345678', status: 'ACCEPTED', tanggal: '11 Sep 09:12',
        diamHari: 2, uangSaja: false,
        jejak: [
          { waktu: '11 Sep 09:12', teks: 'Pembeli mengajukan retur' },
          { waktu: '11 Sep 14:40', teks: 'Penjual menyetujui' },
          { waktu: '12 Sep 08:05', teks: 'Paket diserahkan ke kurir' },
        ],
      },
      {
        id: 'R2', kartu: 'diJalan', tahap: 'diJalan', pesanan: '576461234567890123',
        channel: 'TikTok', toko: 'Bithinks Store Indonesia',
        item: 'Masker Wajah Charcoal × 1', nominal: 74_500,
        alasan: 'Barang tidak sesuai deskripsi', alasanAsli: 'ITEM_NOT_AS_DESCRIBED',
        resi: 'JX8827361192', status: 'BUYER_SHIPPED_ITEM', tanggal: '10 Sep 20:31',
        diamHari: 3, uangSaja: false,
        jejak: [
          { waktu: '10 Sep 20:31', teks: 'Pembeli mengajukan retur' },
          { waktu: '11 Sep 07:15', teks: 'Disetujui otomatis' },
          { waktu: '11 Sep 16:48', teks: 'Pembeli mengirim barang' },
        ],
      },
      {
        id: 'R3', kartu: 'sampai', tahap: 'sampai', pesanan: '576461234567890999',
        channel: 'TikTok', toko: 'Bithinks Beauty Official',
        item: '[Paket Lebih murah 2Pcs] Pupuk Dewa Dewi 1 Liter -KCL- Original untuk Tanaman dalam masa Pembuahan Umbi dan Buah × 1', nominal: 410_000,
        alasan: 'Pembeli berubah pikiran', alasanAsli: 'CHANGE_OF_MIND',
        resi: 'JX8827361007', status: 'RETURN_OR_REFUND_REQUEST_COMPLETE', tanggal: '05 Sep 11:02',
        diamHari: 5, uangSaja: false,
        jejak: [
          { waktu: '05 Sep 11:02', teks: 'Pembeli mengajukan retur' },
          { waktu: '06 Sep 09:44', teks: 'Pembeli mengirim barang' },
          { waktu: '09 Sep 13:20', teks: 'Barang sampai di gudang · stok naik' },
        ],
      },
      {
        id: 'R4', kartu: 'periodeLalu', tahap: 'diJalan', pesanan: '250910WXYZ9876',
        channel: 'Shopee', toko: 'Bithinks Grosir Bandung',
        item: 'Sabun Batang Kemasan 6 pcs × 1', nominal: 58_000,
        alasan: 'Ukuran tidak sesuai', alasanAsli: 'WRONG_SIZE',
        resi: null, status: 'ACCEPTED', tanggal: '10 Sep 14:02',
        diamHari: 32, uangSaja: true,
        jejak: [],
      },
    ],
  },
  meta: { granularity: 'day', asOf: null, startDate: null, endDate: null },
}

export const tokoTiruan = per_toko.map((t) => ({ id: t.storeId, name: t.storeName, channel: t.channel }))

// ── Antrean cetak ───────────────────────────────────────────────────────────
//
// Sengaja memuat KEEMPAT sebab sekaligus, termasuk `belum_diketahui` yang
// ditambahkan 31 Agustus 2026. Potretnya jadi bukti bahwa keempatnya punya
// nama dan warnanya sendiri — bukan satu warna yang menampung apa saja.
const pesanan = (n, tahap, extra = {}) => ({
  id: `p-${n}`, nomorPesanan: `2608${31}RK${n}Q9N3J`, penerima: `Penerima ${n}`,
  qty: 1 + (n % 3), orderedAt: extra.orderedAt ?? '2026-08-31T02:00:00.000Z', tahap,
  statusMarketplace: extra.sm ?? 'READY_TO_SHIP', statusPaket: extra.sp ?? null,
  adaDiKelompokLain: Boolean(extra.skuLain), skuLain: extra.skuLain ?? [], packageCount: 1,
  menungguLama: Boolean(extra.lama),
  gagalBerulang: extra.gagal ?? 0, kodeGagal: extra.kode ?? null,
});

export const antreanTiruan = {
  channel: 'shopee',
  kelompok: [
    {
      sku: 'PUPUK-NPK-16', nama: 'Pupuk NPK 16-16-16 · 1 kg',
      jumlahPesanan: 6, siapCetak: 4, totalQty: 9,
      dimintaBatal: 0, perluAtur: 1, ditinjauShopee: 0, belumDiketahui: 1, perluDiperiksa: 0,
      pesanan: [
        pesanan(1, 'siap_cetak', { sm: 'PROCESSED', sp: 'LOGISTICS_REQUEST_CREATED', lama: true }),
        pesanan(2, 'siap_cetak', { sm: 'PROCESSED', sp: 'LOGISTICS_REQUEST_CREATED', lama: true }),
        pesanan(3, 'siap_cetak', { sm: 'PROCESSED', sp: 'LOGISTICS_PICKUP_DONE' }),
        pesanan(4, 'siap_cetak', { sm: 'PROCESSED', sp: 'LOGISTICS_REQUEST_CREATED' }),
        pesanan(5, 'perlu_atur', { sm: 'READY_TO_SHIP', sp: 'LOGISTICS_READY', gagal: 5, kode: '21042105' }),
        pesanan(6, 'belum_diketahui', { sm: 'READY_TO_SHIP', sp: null }),
      ],
    },
    {
      sku: 'BENIH-CABAI-01', nama: 'Benih Cabai Rawit · sachet 10 g',
      jumlahPesanan: 5, siapCetak: 2, totalQty: 6,
      dimintaBatal: 1, perluAtur: 0, ditinjauShopee: 1, belumDiketahui: 0,
      bukanUntukDicetak: 1, perluDiperiksa: 0,
      pesanan: [
        pesanan(7, 'siap_cetak', { sm: 'PROCESSED', sp: 'LOGISTICS_REQUEST_CREATED' }),
        pesanan(8, 'siap_cetak', { sm: 'PROCESSED', sp: 'LOGISTICS_REQUEST_CREATED' }),
        pesanan(9, 'diminta_batal', { sm: 'IN_CANCEL', sp: 'LOGISTICS_READY' }),
        pesanan(10, 'ditinjau_shopee', { sm: 'READY_TO_SHIP', sp: 'LOGISTICS_NOT_START' }),
        pesanan(11, 'bukan_untuk_dicetak', { sm: 'TO_RETURN', sp: null, skuLain: ['PUPUK-NPK-16'] }),
      ],
    },
  ],
  totalLabel: 10, totalSiapCetak: 6, totalDimintaBatal: 1,
  // totalPerluAtur > 0 supaya tombol Atur Pengiriman ikut terpotret. Tombol
  // itu pernah terbuang dari render tanpa disengaja, dan tidak ada satu pun
  // potret yang bisa menunjukkan ia hilang.
  totalPerluAtur: 1, totalDitinjauShopee: 1, totalBelumDiketahui: 1,
  // Hanya untuk potret: baris pesanan dibuka supaya lencananya benar-benar
  // terlihat, bukan cuma ada di kode.
  pratinjauTerbuka: true,
  // Panel "kenapa tidak bisa dicetak" hanya muncul setelah cip diklik, jadi
  // pratinjau membukanya sendiri supaya ia ikut terpotret.
  pratinjauTahap: 'menunggu_lama',
  alasanTahap: {
    perlu_atur: 'Pengirimannya belum diatur, jadi resinya belum terbit.',
    ditinjau_shopee: 'Sedang ditinjau Tim Shopee. Pengirimannya belum bisa diatur — biasanya selesai dalam 24 jam.',
    belum_diketahui: 'Keterangan pengiriman dari Shopee belum sampai ke kami. Sedang kami ambil — biasanya beberapa detik.',
    bukan_untuk_dicetak: 'Status pesanan ini di marketplace bukan keadaan yang bisa dicetak.',
    perlu_diperiksa: 'Status pesanan ini belum dikenali sistem. Perlu diperiksa dulu.',
  },
  totalPerluDiperiksa: 0, totalBukanUntukDicetak: 1,
  pesananLintasKelompok: 1, pesananPaketPecah: 0, totalPernahGagal: 1,
  // Dua angka pencegahan, ikut dipotret supaya kalimatnya benar-benar terlihat.
  menungguLama: 2, batasLamaJam: 24,
  menitSejakKabarMarketplace: 190, batasSunyiMenit: 60,
};
