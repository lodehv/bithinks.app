const REASONS = {
  PAYMENT_INELIGIBLE: 'Pembayaran tidak memenuhi syarat untuk penambahan bit.',
  CREDIT_RECOVERY_EXHAUSTED: 'Pemulihan penambahan bit sudah habis.',
  REFUND_RECOVERY_FAILED: 'Refund belum berhasil diselesaikan.',
}

export function refundNotificationCopy(data = {}) {
  const amount = `Rp${String(data.amountIdr ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
  return {
    title: 'Refund perlu penanganan admin',
    body: `${data.reference ?? 'Pembayaran'} · ${amount}. ${REASONS[data.reason] ?? 'Perlu pemeriksaan admin.'} Buka Pemulihan pembayaran untuk meninjau.`,
  }
}

export function refundRecoveryUrl(isPlatformAdmin) {
  return isPlatformAdmin ? '/dashboard?view=admin&admin=recovery' : null
}
