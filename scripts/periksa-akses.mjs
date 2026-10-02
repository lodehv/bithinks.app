import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { paymentRequiredFrom } from '../src/utils/paymentRequired.js'
import { loadPaymentPageData } from '../src/pages/dashboard/loadPaymentPageData.js'
import {
  amountAllowed, effectivePaymentStatus, normalizeTopupState, paymentErrorCode,
  paymentFromError, shouldPollPayment, validateTopup,
} from '../src/pages/dashboard/walletTopupModel.js'

const paymentError = {
  response: {
    status: 402,
    data: {
      error: {
        code: 'PAYMENT_REQUIRED',
        message: 'Saldo tidak mencukupi.',
        reason: 'INSUFFICIENT_BALANCE',
        action: 'TOP_UP',
      },
    },
  },
}

assert.deepEqual(paymentRequiredFrom(paymentError), {
  code: 'PAYMENT_REQUIRED',
  message: 'Saldo tidak mencukupi.',
  reason: 'INSUFFICIENT_BALANCE',
  action: 'TOP_UP',
})
assert.equal(paymentRequiredFrom({ response: { status: 403 } }), null)

const partialPaymentLoad = await loadPaymentPageData({
  get: async () => ({ balance: '50000' }),
  topupState: async () => { throw new Error('status endpoint unavailable') },
})
assert.equal(partialPaymentLoad.wallet.balance, '50000')
assert.equal(partialPaymentLoad.state, null)
assert.ok(partialPaymentLoad.stateError)

const capabilities = normalizeTopupState({
  capabilities: {
    version: 1,
    provider: 'singapay',
    methods: [
      { id: 'qris', label: 'QRIS', enabled: true, minAmount: 10000, maxAmount: 1000000 },
      { id: 'va', label: 'Virtual Account', enabled: true, minAmount: 20000, maxAmount: 500000, banks: [{ code: 'BCA', name: 'BCA' }] },
    ],
  },
})
assert.equal(capabilities.methods.length, 2)
assert.equal(capabilities.methods[1].banks[0].code, 'BCA')
assert.equal(validateTopup('60', 'qris', '', capabilities), null)
assert.match(validateTopup('39', 'qris', '', capabilities), /minimum/)
assert.match(validateTopup('2001', 'va', 'BCA', capabilities), /maksimum/)
assert.match(validateTopup('200', 'va', 'BNI', capabilities), /bank/)
assert.equal(amountAllowed(200, capabilities.methods[0]), true)
assert.equal(effectivePaymentStatus({ status: 'pending', expiresAt: '2026-01-01T00:00:00Z' }, Date.parse('2026-01-01T00:00:01Z')), 'expiry_check')
assert.equal(shouldPollPayment('expiry_check'), true)
assert.equal(shouldPollPayment('credit_pending'), true)
assert.equal(shouldPollPayment('refund_pending'), true)
assert.equal(shouldPollPayment('refunded'), false)
const blockedError = { response: { data: { error: { code: 'TOPUP_REPLACEMENT_BLOCKED', details: { activePayment: { paymentId: 'pay-1' } } } } } }
assert.equal(paymentErrorCode(blockedError), 'TOPUP_REPLACEMENT_BLOCKED')
assert.equal(paymentFromError(blockedError).paymentId, 'pay-1')

const dashboard = readFileSync(new URL('../src/pages/Dashboard.jsx', import.meta.url), 'utf8')
const dashboardLayout = readFileSync(new URL('../src/pages/dashboard/DashboardLayout.jsx', import.meta.url), 'utf8')
const orders = readFileSync(new URL('../src/pages/dashboard/omni/OrdersTab.jsx', import.meta.url), 'utf8')
const attendance = readFileSync(new URL('../src/pages/dashboard/hrm/Absensi.jsx', import.meta.url), 'utf8')
const payment = readFileSync(new URL('../src/pages/dashboard/PaymentPage.jsx', import.meta.url), 'utf8')
const paymentForm = readFileSync(new URL('../src/pages/dashboard/PaymentForm.jsx', import.meta.url), 'utf8')
const paymentStatus = readFileSync(new URL('../src/pages/dashboard/PaymentStatus.jsx', import.meta.url), 'utf8')
const walletApi = readFileSync(new URL('../src/utils/omniApi.js', import.meta.url), 'utf8')

assert.match(dashboard, /PAYMENT_REQUIRED_EVENT/)
assert.match(dashboard, /detail\.action === "TOP_UP"/)
assert.doesNotMatch(dashboard, /Akses berbayar diperlukan/)
assert.match(dashboard, /Saldo prabayar diperlukan untuk membuka kembali fitur/)
assert.match(orders, /<AntreanCetak locked=\{locked\}/)
assert.match(attendance, /locked\s*=\s*false, onRequirePayment/)
assert.match(paymentForm, /TOPUP_PRESETS/)
assert.match(paymentForm, /<BankSelect banks=/)
assert.doesNotMatch(paymentForm, /Kode bank Singapay/)
assert.match(paymentStatus, /Simpan QR/)
assert.match(paymentStatus, /refund_pending/)
assert.match(paymentStatus, /refund_failed/)
assert.match(payment, /TOPUP_PROVIDER_STATE_UNCERTAIN/)
assert.match(payment, /TOPUP_REPLACEMENT_BLOCKED/)
assert.match(walletApi, /topupState:/)
assert.match(dashboard, /pushState/)
assert.match(dashboard, /popstate/)
assert.doesNotMatch(dashboardLayout, /Paket kamu/)
assert.doesNotMatch(dashboardLayout, /sidebar-billing/)
assert.match(dashboardLayout, /topbar-wallet/)
assert.match(dashboardLayout, /aria-label=.*Saldo/)
assert.match(dashboard, /walletApi\.get/)
assert.match(dashboard, /\["owner", "admin"\]\.includes/)
assert.match(dashboard, /canViewWallet\s*\n\s*\? <PaymentPage/)

console.log('  ✓ stable 402 contract')
console.log('  ✓ global top-up action')
console.log('  ✓ nested paid actions receive view-only state')
console.log('  ✓ top-up uses presets, bank choices, recovery, and browser history')
console.log('  ✓ wallet remains visible when payment recovery is unavailable')
console.log('  ✓ authorized users receive an accessible header balance')
console.log('  ✓ provider capabilities and recovery states fail closed')
