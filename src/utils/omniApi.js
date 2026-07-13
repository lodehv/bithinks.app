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
}

export const subscriptionApi = {
  status:        ()            => api.get('/api/subscription/status').then(unwrap),
  paymentInfo:   (months = 1)  => api.get('/api/subscription/payment', { params: { months } }).then(unwrap),
  submitPayment: (payload)     => api.post('/api/subscription/payment', payload).then(unwrap),
}

/** True bila error berasal dari gate langganan (trial/langganan habis). */
export const isPaymentRequired = (err) => err?.response?.status === 402
