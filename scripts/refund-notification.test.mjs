import { test } from 'node:test'
import assert from 'node:assert/strict'
import { refundNotificationCopy, refundRecoveryUrl } from '../src/pages/dashboard/refundNotification.js'

test('refund notification shows safe reference, exact rupiah, and human review instructions', () => {
  const copy = refundNotificationCopy({ reference: 'TOPUP-123', amountIdr: '10000', reason: 'CREDIT_RECOVERY_EXHAUSTED' })
  assert.equal(copy.title, 'Refund perlu penanganan admin')
  assert.match(copy.body, /TOPUP-123 · Rp10\.000/)
  assert.match(copy.body, /Pemulihan penambahan bit sudah habis/)
  assert.match(copy.body, /meninjau/)
})

test('recovery navigation requires server-confirmed platform access', () => {
  assert.equal(refundRecoveryUrl(true), '/dashboard?view=admin&admin=recovery')
  assert.equal(refundRecoveryUrl(false), null)
  assert.equal(refundRecoveryUrl(undefined), null)
})

test('unknown reasons do not reveal arbitrary provider text', () => {
  const copy = refundNotificationCopy({ reason: 'sensitive-provider-response' })
  assert.match(copy.body, /Perlu pemeriksaan admin/)
  assert.doesNotMatch(copy.body, /sensitive-provider-response/)
})
