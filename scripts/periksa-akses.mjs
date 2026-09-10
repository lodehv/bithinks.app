import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { paymentRequiredFrom } from '../src/utils/paymentRequired.js'
import { loadPaymentPageData } from '../src/pages/dashboard/loadPaymentPageData.js'

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

const dashboard = readFileSync(new URL('../src/pages/Dashboard.jsx', import.meta.url), 'utf8')
const orders = readFileSync(new URL('../src/pages/dashboard/omni/OrdersTab.jsx', import.meta.url), 'utf8')
const attendance = readFileSync(new URL('../src/pages/dashboard/hrm/Absensi.jsx', import.meta.url), 'utf8')
const payment = readFileSync(new URL('../src/pages/dashboard/PaymentPage.jsx', import.meta.url), 'utf8')
const walletApi = readFileSync(new URL('../src/utils/omniApi.js', import.meta.url), 'utf8')

assert.match(dashboard, /PAYMENT_REQUIRED_EVENT/)
assert.match(dashboard, /detail\.action === "TOP_UP"/)
assert.match(orders, /<AntreanCetak locked=\{locked\}/)
assert.match(attendance, /locked\s*=\s*false, onRequirePayment/)
assert.match(payment, /const PRESETS = \[50000, 100000, 250000, 500000\]/)
assert.match(payment, /<select id="bank-code"/)
assert.doesNotMatch(payment, /Kode bank Singapay/)
assert.match(payment, /Simpan QR/)
assert.match(walletApi, /topupState:/)
assert.match(dashboard, /pushState/)
assert.match(dashboard, /popstate/)

console.log('  ✓ stable 402 contract')
console.log('  ✓ global top-up action')
console.log('  ✓ nested paid actions receive view-only state')
console.log('  ✓ top-up uses presets, bank choices, recovery, and browser history')
console.log('  ✓ wallet remains visible when payment recovery is unavailable')
