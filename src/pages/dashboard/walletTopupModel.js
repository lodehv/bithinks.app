export const TOPUP_PRESETS = [200, 400, 1000, 2000]
export const RUPIAH_PER_BIT = 250

const METHOD_IDS = new Set(['qris', 'va'])
const POLLING_STATES = new Set(['pending', 'expiry_check', 'credit_pending', 'credit_processing', 'credit_failed', 'refund_pending', 'refund_processing'])

export const rupiah = (value) => `Rp${Number(value || 0).toLocaleString('id-ID')}`
export const bit = (value) => `${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} bit`
export const rupiahToBits = (value) => Number(value || 0) / RUPIAH_PER_BIT
export const bitsToRupiah = (value) => Number(value || 0) * RUPIAH_PER_BIT

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

export function validateTopup(bits, method, bankCode, capabilities) {
  const selectedBits = Number(bits)
  const nominal = bitsToRupiah(selectedBits)
  const option = methodCapability(capabilities, method)
  if (!option) return 'Pilih cara bayar yang tersedia.'
  if (!Number.isSafeInteger(selectedBits) || selectedBits <= 0 || !Number.isSafeInteger(nominal)) return 'Masukkan jumlah bit bulat yang valid.'
  if (option.minAmount !== null && nominal < option.minAmount) {
    return `Jumlah minimum untuk ${option.label} adalah ${Math.ceil(option.minAmount / RUPIAH_PER_BIT)} bit.`
  }
  if (option.maxAmount !== null && nominal > option.maxAmount) {
    return `Jumlah maksimum untuk ${option.label} adalah ${Math.floor(option.maxAmount / RUPIAH_PER_BIT)} bit.`
  }
  if (method === 'va' && !option.banks.some((bank) => bank.code === bankCode)) {
    return 'Pilih bank Virtual Account yang tersedia.'
  }
  return null
}

export function amountAllowed(bits, capability) {
  const amount = bitsToRupiah(bits)
  return Number.isSafeInteger(bits) && bits > 0 && Number.isSafeInteger(amount)
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
