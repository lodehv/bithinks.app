// Pengganti utils/omniApi.js saat pratinjau. Dipasang lewat alias Vite, jadi
// halaman aslinya tidak diubah sedikit pun untuk bisa dilihat.
import { statsTiruan, tokoTiruan, pendaftaranTiruan } from './data-tiruan.js'

export const omniApi = {
  listStores: async () => tokoTiruan,
  getMarketingStats: async () => statsTiruan,
}
export const subscriptionApi = { status: async () => ({}), checkout: async () => ({}) }
export const adminApi = {
  subscribers: async () => [],
  leads: async () => [],
  pendaftaran: async () => pendaftaranTiruan,
  // Tidak pernah dipanggil saat memotret (tidak ada yang menekan tombol), tapi
  // ada supaya bentuk tiruannya sama dengan yang asli.
  tinjauPendaftaran: async () => ({ status: 'disetujui' }),
}
export const isPaymentRequired = () => false
