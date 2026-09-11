export const TOPUP_PRESETS = [50000, 100000, 250000, 500000]

const METHOD_IDS = new Set(['qris', 'va'])
const POLLING_STATES = new Set(['pending', 'expiry_check', 'credit_pending', 'credit_processing', 'credit_failed', 'refund_pending', 'refund_processing'])

export const rupiah = (value) => `Rp${Number(value || 0).toLocaleString('id-ID')}`

export function normalizeTopupState(state) {
  if (!state?.capabilities || !Array.isArray(state.capabilities.methods)) return null

  const methods = state.capabilities.methods
    .filter((item) => METHOD_IDS.has(item?.id))
    .map((item) => ({
      id: item.id,
      label: item.label || (item.id === 'qris' ? 'QRIS' : 'Transfer bank'),
      enabled: item.enabled === true,
      minAmount: Number.isSafeInteger(item.minAmount) ? item.minAmount : null,
      maxAmount: Number.isSafeInteger(item.maxAmount) ? item.maxAmount : null,
      expiryMinutes: Number.isSafeInteger(item.expiryMinutes) ? item.expiryMinutes : null,
      banks: item.id === 'va' ? (item.banks ?? state.banks ?? []) : [],
    }))

  return {
    version: String(state.capabilities.version ?? ''),
    provider: state.capabilities.provider,
    methods,
  }
}

export function firstEnabledMethod(capabilities) {
  return capabilities?.methods.find((item) => item.enabled)?.id ?? ''
}

export function methodCapability(capabilities, method) {
  return capabilities?.methods.find((item) => item.id === method && item.enabled) ?? null
}

export function validateTopup(amount, method, bankCode, capabilities) {
  const nominal = Number(amount)
  const option = methodCapability(capabilities, method)
  if (!option) return 'Pilih cara bayar yang tersedia.'
  if (!Number.isSafeInteger(nominal) || nominal <= 0) return 'Masukkan nominal rupiah bulat yang valid.'
  if (option.minAmount !== null && nominal < option.minAmount) {
    return `Nominal minimum untuk ${option.label} adalah ${rupiah(option.minAmount)}.`
  }
  if (option.maxAmount !== null && nominal > option.maxAmount) {
    return `Nominal maksimum untuk ${option.label} adalah ${rupiah(option.maxAmount)}.`
  }
  if (method === 'va' && !option.banks.some((bank) => bank.code === bankCode)) {
    return 'Pilih bank Virtual Account yang tersedia.'
  }
  return null
}

export function amountAllowed(amount, capability) {
  return Number.isSafeInteger(amount)
    && capability?.enabled === true
    && (capability.minAmount === null || amount >= capability.minAmount)
    && (capability.maxAmount === null || amount <= capability.maxAmount)
}

export function effectivePaymentStatus(payment, now = Date.now()) {
  const status = payment?.status
  if (status === 'pending' && payment?.expiresAt) {
    const expiresAt = new Date(payment.expiresAt).getTime()
    if (Number.isFinite(expiresAt) && expiresAt <= now) return 'expiry_check'
  }
  return status
}

export function shouldPollPayment(status) {
  return POLLING_STATES.has(status)
}

export function paymentErrorCode(error) {
  return error?.response?.data?.error?.code ?? null
}

export function paymentFromError(error) {
  const detail = error?.response?.data?.error?.details
  return detail?.payment ?? detail?.activePayment ?? null
}
