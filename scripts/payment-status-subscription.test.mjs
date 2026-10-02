import { test } from 'node:test'
import assert from 'node:assert/strict'
import { followPaymentStatus } from '../src/pages/dashboard/paymentStatusSubscription.js'

function fixture(snapshot = async () => ({ payment: { paymentId: 'a', status: 'pending' } })) {
  const page = new EventTarget(); page.hidden = false
  let now = 0, sequence = 0, polls = 0, unauthorized = 0, token = 'first'
  const tasks = new Map(), streams = [], payments = [], errors = []
  const timers = { setTimeout(fn, delay) { const id = ++sequence; tasks.set(id, { fn, at: now + delay }); return id }, clearTimeout(id) { tasks.delete(id) } }
  const stop = followPaymentStatus('a', { page, timers, url: 'https://test.invalid', getToken: () => token,
    stream(url, options) {
      let reject
      const promise = new Promise((resolve, fail) => { reject = fail; options.signal.addEventListener('abort', resolve) })
      streams.push({ url, ...options, reject }); return promise
    },
    getSnapshot(signal) { polls += 1; return snapshot(signal) },
    onPayment: (payment) => payments.push(payment.status), onError: (error) => errors.push(error),
    onUnauthorized: () => { unauthorized += 1 },
  })
  async function tick(ms) {
    const end = now + ms
    for (;;) {
      const next = [...tasks].filter(([, value]) => value.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
      if (!next) break
      now = next[1].at; tasks.delete(next[0]); next[1].fn(); await Promise.resolve(); await Promise.resolve()
    }
    now = end; await Promise.resolve(); await Promise.resolve()
  }
  const message = (status, index = streams.length - 1) => streams[index].onmessage({ event: 'payment-status', data: JSON.stringify({ payment: { paymentId: 'a', status } }) })
  return { page, streams, payments, errors, stop, tick, message, setToken: (value) => { token = value }, get polls() { return polls }, get unauthorized() { return unauthorized } }
}

test('authenticates SSE; healthy updates avoid polling and terminal credit closes it', async () => {
  const f = fixture()
  assert.equal(f.streams[0].headers.Authorization, 'Bearer first')
  assert.ok(f.streams[0].url.endsWith('?paymentId=a'))
  f.message('pending'); await f.tick(4000)
  assert.equal(f.polls, 0)
  f.message('credit_pending'); f.message('credited'); f.message('credited')
  assert.deepEqual(f.payments, ['pending', 'credit_pending', 'credited'])
  assert.equal(f.streams[0].signal.aborted, true)
  await f.tick(60_000); assert.equal(f.polls, 0); f.stop()
})

test('falls back on failure and discards an older poll when SSE recovers', async () => {
  let finish, signal
  const f = fixture((abort) => { signal = abort; return new Promise((resolve) => { finish = resolve }) })
  f.streams[0].reject(Error('503 unavailable')); await f.tick(0); await f.tick(4000)
  assert.equal(f.polls, 1); assert.equal(f.streams.length, 2)
  f.message('credit_pending')
  assert.equal(signal.aborted, true)
  finish({ payment: { paymentId: 'a', status: 'pending' } }); await f.tick(4000)
  assert.deepEqual(f.payments, ['credit_pending']); assert.equal(f.polls, 1); f.stop()
})

test('retries with backoff capped at thirty seconds', async () => {
  const f = fixture()
  for (const delay of [1000, 2000, 4000, 8000, 16000, 30000, 30000]) {
    const count = f.streams.length
    f.streams.at(-1).reject(Error('offline')); await f.tick(0); await f.tick(delay - 1)
    assert.equal(f.streams.length, count)
    await f.tick(1); assert.equal(f.streams.length, count + 1)
  }
  f.stop()
})

test('suspends hidden tabs and resumes using a new token; cleanup ignores stale events', async () => {
  const f = fixture()
  f.page.hidden = true; f.page.dispatchEvent(new Event('visibilitychange'))
  assert.equal(f.streams[0].signal.aborted, true)
  await f.tick(60_000); assert.equal(f.polls, 0); assert.equal(f.streams.length, 1)
  f.setToken('renewed'); f.page.hidden = false; f.page.dispatchEvent(new Event('visibilitychange'))
  assert.equal(f.streams[1].headers.Authorization, 'Bearer renewed')
  f.message('pending', 0); await f.tick(0)
  assert.deepEqual(f.payments, ['pending']) // Fresh resume poll only.
  f.stop(); f.message('credited'); await f.tick(60_000)
  assert.deepEqual(f.payments, ['pending']); assert.equal(f.streams[1].signal.aborted, true)
})

test('handles 401 and token expiry centrally without retries', async () => {
  const f = fixture()
  await assert.rejects(f.streams[0].onopen(new Response(null, { status: 401 })), /Unauthorized/)
  assert.equal(f.unauthorized, 1); await f.tick(60_000); assert.equal(f.polls, 0)
  const expired = fixture(); expired.streams[0].onmessage({ event: 'auth-expired' })
  assert.equal(expired.unauthorized, 1); await expired.tick(60_000); assert.equal(expired.streams.length, 1)
})

test('closes inaccessible payments and rejects non-SSE responses', async () => {
  const f = fixture()
  await assert.rejects(f.streams[0].onopen(new Response(null, { status: 404 })), /access denied/)
  assert.equal(f.errors[0].response.status, 404); await f.tick(60_000); assert.equal(f.polls, 0)
  const html = fixture()
  await assert.rejects(html.streams[0].onopen(new Response('<html>')), /unavailable/)
  html.stop()
})

test('detects silent streams and resumes fallback; heartbeats extend the watchdog', async () => {
  const f = fixture(); f.message('pending')
  await f.tick(30_000); f.streams[0].onmessage({ event: 'heartbeat' })
  await f.tick(44_999); assert.equal(f.streams.length, 1); assert.equal(f.polls, 0)
  await f.tick(4001); assert.equal(f.streams[0].signal.aborted, true); assert.equal(f.polls, 1); f.stop()
})
