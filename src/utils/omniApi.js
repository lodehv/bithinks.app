import api from './api'

// ─────────────────────────────────────────────────────────────────────────────
// Service layer BitOmni + Subscription.
// Membungkus axios `api` (interceptor auth & 401 sudah ditangani di api.js).
// Catatan: error 402 (PAYMENT_REQUIRED) sengaja TIDAK ditangani global —
// dilempar ke pemanggil agar UI bisa arahkan ke halaman pembayaran.
// ─────────────────────────────────────────────────────────────────────────────

const unwrap = (r) => r.data?.data

export const omniApi = {
  listStores:        ()            => api.get('/api/omni/stores').then(unwrap),
  connectStore:      (payload)     => api.post('/api/omni/stores', payload).then(unwrap),
  deleteStore:       (id)          => api.delete(`/api/omni/stores/${id}`).then(unwrap),
  shopeeConnectUrl:  ()            => api.get('/api/omni/shopee/connect').then((r) => r.data?.data?.authUrl),
  tiktokConnectUrl:  ()            => api.get('/api/omni/tiktok/connect').then((r) => r.data?.data?.authUrl),

  listProducts:      ()            => api.get('/api/omni/products').then(unwrap),
  createProduct:     (payload)     => api.post('/api/omni/products', payload).then(unwrap),
  updateProduct:     (id, payload) => api.patch(`/api/omni/products/${id}`, payload).then(unwrap),
  deleteProduct:     (id)          => api.delete(`/api/omni/products/${id}`).then(unwrap),
  syncStock:         ()            => api.post('/api/omni/products/sync').then(unwrap),

  listOrders:        (status)      => api.get('/api/omni/orders', { params: status ? { status } : {} }).then(unwrap),
  updateOrderStatus: (id, status)  => api.patch(`/api/omni/orders/${id}`, { status }).then(unwrap),
  syncOrders:        ()            => api.post('/api/omni/orders/sync').then(unwrap),

  // Metrik Dashboard Marketing. params: { startDate, endDate, platforms[], stores[], granularity, asOf }
  // Response: { totals, buckets, meta }. Acuan logika: docs/SPEC-dashboard-marketing.md
  getMarketingStats: (params = {}) => {
    const { startDate, endDate, platforms, stores, granularity, asOf, adSpend } = params
    const query = {}
    if (startDate) query.startDate = startDate
    if (endDate) query.endDate = endDate
    if (platforms?.length) query.platforms = platforms.join(',')
    if (stores?.length) query.stores = stores.join(',')
    if (granularity) query.granularity = granularity
    if (asOf) query.asOf = asOf
    if (adSpend) query.adSpend = adSpend
    return api.get('/api/omni/marketing/stats', { params: query }).then(unwrap)
  },
}

export const subscriptionApi = {
  status:   ()            => api.get('/api/subscription/status').then(unwrap),
  // Buat sesi bayar iPaymu → { paymentUrl, reference, amount, periodMonths }.
  // Frontend mengarahkan browser ke paymentUrl.
  checkout: (months = 1)  => api.post('/api/subscription/checkout', { periodMonths: months }).then(unwrap),
}

// Panel admin platform (akses khusus demo@bithinks.id — gerbang di backend).
export const adminApi = {
  subscribers: () => api.get('/api/admin/subscribers').then(unwrap),
  leads:       () => api.get('/api/admin/leads').then(unwrap),
}

/** True bila error berasal dari gate langganan (trial/langganan habis). */
export const isPaymentRequired = (err) => err?.response?.status === 402
