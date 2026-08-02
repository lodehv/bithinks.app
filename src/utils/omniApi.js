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
  // depth: 'all' | 'month' | 'now' — kedalaman tarik data pesanan pilihan user saat connect.
  shopeeConnectUrl:  (depth)       => api.get('/api/omni/shopee/connect', { params: depth ? { depth } : {} }).then((r) => r.data?.data?.authUrl),
  tiktokConnectUrl:  (depth)       => api.get('/api/omni/tiktok/connect', { params: depth ? { depth } : {} }).then((r) => r.data?.data?.authUrl),

  listProducts:      ()            => api.get('/api/omni/products').then(unwrap),
  // Produk marketplace (etalase) untuk tab Produk Marketplaces + tautan ke master.
  listMarketplaceProducts: (channel) => api.get('/api/omni/products/marketplace', { params: { channel } }).then(unwrap),
  syncProductCatalog: ()            => api.post('/api/omni/products/catalog/sync').then(unwrap),
  // Resep (BOM) SKU marketplace → master produk: [{masterProductId, qty}]
  listSkuMappings:   ()             => api.get('/api/omni/products/sku-mappings').then(unwrap),
  // Dashboard Kelola Produk (data real): movement keluar & COGS dari resep SKU.
  productDashboardStats: (params = {}) => api.get('/api/omni/products/dashboard-stats', { params }).then(unwrap),
  saveSkuMapping:    (sku, components) => api.put('/api/omni/products/sku-mappings', { sku, components }).then(unwrap),
  createProduct:     (payload)     => api.post('/api/omni/products', payload).then(unwrap),
  updateProduct:     (id, payload) => api.patch(`/api/omni/products/${id}`, payload).then(unwrap),
  deleteProduct:     (id)          => api.delete(`/api/omni/products/${id}`).then(unwrap),
  syncStock:         ()            => api.post('/api/omni/products/sync').then(unwrap),

  // ── WMS (gudang). Acuan: docs/SPEC-wms-uiux.md ──
  // Semua angka saldo datang JADI dari server (sudah lewat rumus jangkar);
  // frontend tidak boleh menghitung ulang "Siap Jual" sendiri.
  wmsSummary:        ()            => api.get('/api/omni/wms/summary').then(unwrap),
  wmsStock:          (params = {}) => api.get('/api/omni/wms/stock', { params }).then(unwrap),
  wmsStockDetail:    (id)          => api.get(`/api/omni/wms/stock/${id}`).then(unwrap),
  // payload: { safetyStock?, incoming?, channelSafetyStock?: [{ storeId, safetyStock|null }] }
  // Cadangan & Stok Akan Datang = setelan, bukan pergerakan barang → tidak masuk Buku Besar.
  wmsPatchStock:     (id, payload) => api.patch(`/api/omni/wms/stock/${id}`, payload).then(unwrap),
  // Penyesuaian stok: { productId, countedQty | availableQty | delta, type, reason? }
  // availableQty = target kolom Tersedia; server yang membalik rumusnya jadi stok fisik.
  wmsAdjust:         (payload)     => api.post('/api/omni/wms/adjust', payload).then(unwrap),
  wmsLedger:         (params = {}) => api.get('/api/omni/wms/ledger', { params }).then(unwrap),
  wmsLedgerCsvUrl:   (params = {}) => {
    const q = new URLSearchParams({ ...params, format: 'csv' }).toString()
    return `/api/omni/wms/ledger?${q}`
  },
  wmsReconcile:      (payload = {}) => api.post('/api/omni/wms/reconcile', payload).then(unwrap),

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
