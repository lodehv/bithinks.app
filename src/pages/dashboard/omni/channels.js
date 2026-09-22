// Metadata channel penjualan — label & warna konsisten di seluruh modul BitOmni.
export const CHANNELS = {
  shopee:    { label: 'Shopee',      color: '#EE4D2D', short: 'S'  },
  tiktok:    { label: 'TikTok Shop', color: '#111111', short: 'TT' },
  tokopedia: { label: 'Tokopedia',   color: '#03AC0E', short: 'Tk' },
  lazada:    { label: 'Lazada',      color: '#1A2D8D', short: 'L'  },
  pos:       { label: 'POS / Kasir', color: '#964AC0', short: 'P'  },
  web:       { label: 'Website',     color: '#1868DB', short: 'W'  },
}

export const channelMeta = (key) =>
  CHANNELS[key] ?? { label: key ?? '-', color: '#8C8F97', short: '?' }

// Channel yang dihidupkan duluan (sesuai fokus BitPos + BitOmni).
export const ACTIVE_CHANNELS = ['shopee', 'tiktok', 'pos']
