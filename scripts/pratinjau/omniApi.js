// Pengganti utils/omniApi.js saat pratinjau. Dipasang lewat alias Vite, jadi
// halaman aslinya tidak diubah sedikit pun untuk bisa dilihat.
import { statsTiruan, tokoTiruan } from './data-tiruan.js'

export const omniApi = {
  listStores: async () => tokoTiruan,
  getMarketingStats: async () => statsTiruan,
}
export const subscriptionApi = { status: async () => ({}), checkout: async () => ({}) }
export const adminApi = { subscribers: async () => [], leads: async () => [] }
export const isPaymentRequired = () => false
