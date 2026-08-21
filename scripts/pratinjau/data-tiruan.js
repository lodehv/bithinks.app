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

const per_toko = toko.map(([channel, storeName, omset, cogs, fees, retur], i) => {
  const netProfit = omset - cogs - fees
  return { storeId: `t${i}`, storeName, channel, omset, cogs, fees, retur,
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
  biaya_api: j('fees'),
  cost_breakdown: [],
  biaya_iklan: 0,
  cogs_total: j('cogs'),
  total_biaya_beban: j('fees') + j('cogs'),
  profit: omsetPerkiraan - j('fees') - j('cogs'),
  profit_margin: (omsetPerkiraan - j('fees') - j('cogs')) / omsetPerkiraan * 100,
  meta: { granularity: 'day', asOf: null, startDate: null, endDate: null },
}

export const tokoTiruan = per_toko.map((t) => ({ id: t.storeId, name: t.storeName, channel: t.channel }))
