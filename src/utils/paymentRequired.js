export const PAYMENT_REQUIRED_EVENT = 'bithinks:payment-required'

const DEFAULT_MESSAGE = 'Akses tulis sedang terkunci. Isi saldo atau aktifkan pembayaran untuk melanjutkan.'

/** Normalize both the US-02 contract and legacy bare 402 responses. */
export function paymentRequiredFrom(error) {
  if (error?.response?.status !== 402) return null

  const payload = error?.response?.data?.error
  return {
    code: typeof payload?.code === 'string' ? payload.code : 'PAYMENT_REQUIRED',
    message: typeof payload?.message === 'string' ? payload.message : DEFAULT_MESSAGE,
    reason: typeof payload?.reason === 'string' ? payload.reason : 'SUBSCRIPTION_REQUIRED',
    action: typeof payload?.action === 'string' ? payload.action : 'TOP_UP',
    balance: payload?.balance ?? null,
    required: payload?.required ?? null,
    currency: typeof payload?.currency === 'string' ? payload.currency : 'IDR',
  }
}

export function announcePaymentRequired(error) {
  const detail = paymentRequiredFrom(error)
  if (!detail) return null

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(PAYMENT_REQUIRED_EVENT, { detail }))
  }
  return detail
}
