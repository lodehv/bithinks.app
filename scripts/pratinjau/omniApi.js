// Pengganti utils/omniApi.js saat pratinjau. Dipasang lewat alias Vite, jadi
// halaman aslinya tidak diubah sedikit pun untuk bisa dilihat.
import { statsTiruan, tokoTiruan, antreanTiruan } from './data-tiruan.js'

// Dengan VITE_POTRET_MEMUAT=1, jawaban sengaja TIDAK PERNAH datang.
//
// Kenapa perlu: tiruan di atas menjawab seketika, jadi potret selalu menangkap
// layar yang sudah jadi — dan keadaan MEMUAT, yang justru paling sering dilihat
// pemakai saat membuka halaman, mustahil dilihat siapa pun. Aturan "lihat
// potretnya" tidak bisa dipenuhi untuk keadaan yang tidak bisa dipotret.
const tahanJawaban = import.meta.env.VITE_POTRET_MEMUAT === '1'
const takPernahDatang = () => new Promise(() => {})

export const omniApi = {
  listStores: async () => tokoTiruan,
  getMarketingStats: tahanJawaban ? takPernahDatang : async () => statsTiruan,
  antreanCetak: tahanJawaban ? takPernahDatang : async () => antreanTiruan,
  riwayatCetak: async () => ({ sesi: [], total: 0 }),
  lewatTanpaCetak: async () => ({ pesanan: [], total: 0 }),
  aturKirim: async () => ({ berhasil: 0, gagal: 0 }),
  cetakLabel: async () => ({}),
}
export const subscriptionApi = { status: async () => ({}), checkout: async () => ({}) }
export const adminApi = { subscribers: async () => [], leads: async () => [] }
export const isPaymentRequired = () => false
