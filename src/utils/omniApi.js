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

  // ── Outbound: scan resi (Tersedia turun) → picking list (Stok Fisik turun) ──
  // Penolakan scan (resi tak dikenal / sudah dipindai / resep belum ada) datang
  // sebagai { ok:false, message } di dalam data, BUKAN sebagai HTTP error —
  // layar pemindaian dipakai beruntun dan harus tetap hidup.
  wmsOutbound:       ()            => api.get('/api/omni/wms/outbound').then(unwrap),
  wmsOutboundDetail: (id)          => api.get(`/api/omni/wms/outbound/${id}`).then(unwrap),
  wmsOutboundScan:   (payload)     => api.post('/api/omni/wms/outbound/scan', payload).then(unwrap),
  wmsOutboundClose:  (id)          => api.post(`/api/omni/wms/outbound/${id}`).then(unwrap),
  wmsOutboundPick:   (code)        => api.post('/api/omni/wms/outbound/pick', { code }).then(unwrap),

  // ── Barang Masuk (PO). Membuat PO TIDAK menambah stok — hanya penerimaan. ──
  wmsInbound:        (params = {}) => api.get('/api/omni/wms/inbound', { params }).then(unwrap),
  wmsInboundCreate:  (payload)     => api.post('/api/omni/wms/inbound', payload).then(unwrap),
  wmsInboundDetail:  (id)          => api.get(`/api/omni/wms/inbound/${id}`).then(unwrap),
  // receipts: [{ itemId, qty }] — sebagian didukung, sisanya tetap "akan datang".
  wmsInboundReceive: (id, receipts) => api.post(`/api/omni/wms/inbound/${id}`, { receipts }).then(unwrap),

  // Identitas perusahaan pelanggan — kop dokumen PO yang dikirim ke supplier.
  companyProfile:    ()            => api.get('/api/omni/settings/company').then(unwrap),
  saveCompanyProfile:(payload)     => api.patch('/api/omni/settings/company', payload).then(unwrap),

  // ── Pesanan ──
  // Sejak 17 Agu 2026 seluruh penyaringan, penghitungan, dan pemenggalan halaman
  // dikerjakan server. Sebelumnya server mengirim 200 pesanan terbaru tanpa
  // penyaring dan browser yang mengolahnya — akibatnya setiap angka di layar
  // salah, dan selalu lebih kecil dari yang sebenarnya.
  //
  // params: { tab, page, perPage, sort, search, from, to, channel:'shopee,tiktok' }
  // hasil : { orders, counts, meta:{ page, limit, total, totalPages } }
  //   counts = jumlah SEBENARNYA tiap tab, bukan hasil menyaring daftar di atas.
  listOrders: (params = {}) => api.get('/api/omni/orders', { params }).then((r) => ({
    orders: r.data?.data?.orders ?? [],
    counts: r.data?.data?.counts ?? {},
    meta:   r.data?.meta ?? { page: 1, limit: 0, total: 0, totalPages: 1 },
  })),

  // Antrean cetak resi satu platform, sudah dikelompokkan per SKU oleh server.
  // TAHAP BACA SAJA — endpoint ini tidak mengubah apa pun, di basis data maupun
  // di marketplace. Tombol cetak menyusul di tahap berikutnya.
  // hasil: { channel, kelompok[], totalLabel, totalSiapCetak, totalPerluAtur,
  //          totalPerluDiperiksa, pesananLintasKelompok, pesananPaketPecah }
  antreanCetak:      (channel, p = {}) => api.get('/api/omni/orders/antrean-cetak', { params: { channel, ...p } }).then(unwrap),
  // Aksi TULIS: membuat dokumen resi di marketplace dan mencatat ke label_cetak_log.
  // Yang dikirim cuma channel + sku; daftar pesanannya disusun server dari antrean.
  //
  // TIMEOUT SENGAJA JAUH LEBIH PANJANG dari bawaan 15 detik. Mencetak 51 resi
  // Shopee berarti membuat dokumen, menunggu sampai READY, lalu mengunduhnya —
  // puluhan detik, wajar. Dengan batas 15 detik, browser menyerah sementara
  // SERVER JALAN TERUS: resinya benar-benar dibuat di marketplace, tercatat,
  // dan pesanannya keluar dari antrean — sementara PDF-nya tidak pernah sampai
  // ke siapa pun. Itu kehilangan yang tidak bisa diperbaiki, karena berkasnya
  // memang tidak disimpan.
  // Pemeriksaan cermin: bertanya langsung ke marketplace berapa pesanan yang
  // menunggu dikirim, lalu membandingkannya dengan antrean kita. Timeout
  // dilonggarkan karena ia memanggil API marketplace sungguhan, satu kali per
  // toko per status.
  cerminAntrean:     (channel)       => api.get('/api/omni/orders/cermin', { params: { channel }, timeout: 120000 }).then(unwrap),
  cetakLabel:        (payload)      => api.post('/api/omni/orders/cetak-label', payload, { timeout: 180000 }).then(unwrap),

  // Angka ringkas halaman depan, dihitung server atas SELURUH pesanan.
  // hasil: { total, omset, perluProses, perStatus, perChannel }
  ordersSummary:     ()            => api.get('/api/omni/orders/summary').then(unwrap),

  // Unduhan CSV memakai penyaring yang sama dengan yang sedang dilihat.
  // Harus lewat axios (bukan tautan biasa) karena autentikasinya di header
  // Authorization — tautan <a> tidak membawanya.
  downloadOrdersCsv: (params = {}) =>
    api.get('/api/omni/orders', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    }).then((r) => r.data),

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
