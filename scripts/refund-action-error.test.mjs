import assert from 'node:assert/strict'
import { refundActionError } from '../src/pages/dashboard/refundActionError.js'

const uncertain = 'Keep the original request key'
for (const status of [400, 401, 403, 404, 409, 422]) {
  assert.equal(refundActionError({ response: { status, data: { error: { message: 'Rejected' } } } }, uncertain), 'Rejected')
  assert.match(refundActionError({ response: { status } }, uncertain), /Permintaan ditolak/)
}
for (const status of [408, 429, 500, 502, 503]) {
  assert.equal(refundActionError({ response: { status } }, uncertain), uncertain)
}
assert.equal(refundActionError(new Error('Network timeout'), uncertain), uncertain)
console.log('PASS: known rejections and uncertain outcomes remain distinct')
