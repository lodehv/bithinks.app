const PAYMENT_STATUS = {
  CREATED: ['Menunggu pembayaran', 'warning'],
  PENDING: ['Menunggu pembayaran', 'warning'],
  PAID: ['Dibayar', 'positive'],
  CREDIT_PENDING: ['Kredit diproses', 'warning'],
  CREDITED: ['Masuk saldo', 'positive'],
  CREDIT_FAILED: ['Kredit gagal', 'negative'],
  EXPIRED: ['Kedaluwarsa', 'negative'],
  CANCELLED: ['Dibatalkan', 'negative'],
  REFUND_PENDING: ['Refund menunggu', 'warning'],
  REFUND_PROCESSING: ['Refund diproses', 'warning'],
  REFUNDED: ['Refund berhasil', 'positive'],
  REFUND_FAILED: ['Refund gagal', 'negative'],
  pending: ['Menunggu pembayaran', 'warning'],
  submitted: ['Menunggu verifikasi', 'warning'],
  approved: ['Disetujui', 'positive'],
  rejected: ['Ditolak', 'negative'],
  expired: ['Kedaluwarsa', 'negative'],
}

const DISBURSEMENT_STATUS = {
  READY: ['Rekening terverifikasi; belum ditransfer', 'positive'],
  PENDING: ['Transfer diproses', 'warning'],
  UNCERTAIN: ['Hasil belum pasti; cek status, jangan transfer ulang', 'warning'],
  SUCCEEDED: ['Refund berhasil', 'positive'],
  FAILED: ['Transfer gagal; perlu tindak lanjut admin/support', 'negative'],
}

export function financialStatus(value, context = 'payment') {
  const definition = (context === 'disbursement' ? DISBURSEMENT_STATUS : PAYMENT_STATUS)[value]
  return definition ? { label: definition[0], tone: definition[1] } : { label: 'Status belum dikenal', tone: 'neutral' }
}

export function reconciliationStatus(value) {
  const definitions = {
    unknown: ['Belum diketahui', 'neutral'],
    reconciled: ['Sesuai', 'positive'],
    discrepant: ['Selisih', 'negative'],
  }
  const definition = definitions[value]
  return definition ? { label: definition[0], tone: definition[1] } : { label: 'Status rekonsiliasi belum dikenal', tone: 'neutral' }
}
