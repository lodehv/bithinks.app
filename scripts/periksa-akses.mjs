import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { paymentRequiredFrom } from '../src/utils/paymentRequired.js'

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

const dashboard = readFileSync(new URL('../src/pages/Dashboard.jsx', import.meta.url), 'utf8')
const orders = readFileSync(new URL('../src/pages/dashboard/omni/OrdersTab.jsx', import.meta.url), 'utf8')
const attendance = readFileSync(new URL('../src/pages/dashboard/hrm/Absensi.jsx', import.meta.url), 'utf8')

assert.match(dashboard, /PAYMENT_REQUIRED_EVENT/)
assert.match(dashboard, /detail\.action === "TOP_UP"/)
assert.match(dashboard, /activeMenu === "payment" && canManageBilling/)
assert.match(dashboard, /onRequirePayment=\{handleRequirePayment\}/)
assert.doesNotMatch(dashboard, /onRequirePayment=\{goToPayment\}/)
assert.match(orders, /<AntreanCetak locked=\{locked\}/)
assert.match(attendance, /locked\s*=\s*false, onRequirePayment/)

console.log('  ✓ stable 402 contract')
console.log('  ✓ global top-up action')
console.log('  ✓ restricted roles cannot open wallet routes')
console.log('  ✓ nested paid actions receive view-only state')
