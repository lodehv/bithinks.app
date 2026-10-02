import { shouldPollPayment } from './walletTopupModel.js'

/** Own one payment's transport, including fallback, visibility, and cancellation. */
export function followPaymentStatus(paymentId, options) {
  const { stream, url, getToken, getSnapshot, onPayment, onError, onUnauthorized } = options
  const page = options.page ?? document
  const timers = options.timers ?? window
  let stopped = false, generation = 0, healthy = false, retryDelay = 1000
  let connection, polling, pollTimer, retryTimer, watchdog

  function clearTimer(id) { if (id !== undefined) timers.clearTimeout(id) }
  function stopPolling() {
    clearTimer(pollTimer); pollTimer = undefined
    polling?.abort(); polling = undefined
  }
  function pause() {
    generation += 1; connection?.abort(); connection = undefined
    clearTimer(retryTimer); clearTimer(watchdog); stopPolling(); healthy = false
  }
  function stop() {
    if (stopped) return
    stopped = true; pause(); page.removeEventListener('visibilitychange', visibilityChanged)
  }
  function accept(payment) {
    if (payment?.paymentId !== paymentId || typeof payment.status !== 'string') throw Error('Invalid payment snapshot')
    onPayment(payment)
    if (!shouldPollPayment(payment.status)) stop()
  }
  async function poll() {
    if (stopped || page.hidden || healthy || polling) return
    const request = new AbortController()
    polling = request
    try {
      const state = await getSnapshot(request.signal)
      if (!request.signal.aborted && !stopped && !healthy) {
        if (!state?.payment) throw Error('ACTIVE_PAYMENT_NOT_FOUND')
        accept(state.payment)
      }
    } catch (error) {
      if (!request.signal.aborted && !stopped) {
        if (error?.response?.status === 401) { stop(); onUnauthorized() }
        else onError(error)
      }
    } finally { if (polling === request) polling = undefined }
  }
  function startPolling() {
    if (pollTimer !== undefined || stopped || page.hidden) return
    pollTimer = timers.setTimeout(function tick() {
      pollTimer = undefined; void poll(); startPolling()
    }, 4000)
  }
  function connect() {
    if (stopped || page.hidden) return
    const token = getToken()
    if (!token) { stop(); onUnauthorized(); return }
    const current = ++generation
    const abort = new AbortController()
    connection = abort
    healthy = false; startPolling()
    const active = () => !stopped && generation === current && !page.hidden
    let failed = false
    function fail() {
      if (!active() || failed) return
      failed = true; abort.abort(); clearTimer(watchdog); healthy = false; startPolling()
      retryTimer = timers.setTimeout(connect, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 30_000)
    }
    function touch() {
      clearTimer(watchdog); watchdog = timers.setTimeout(fail, 45_000)
    }
    touch()
    void stream(`${url}/api/wallet/topup/events?paymentId=${encodeURIComponent(paymentId)}`, {
      signal: abort.signal, headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      // Visibility is handled here so fallback polling suspends with the stream.
      openWhenHidden: true,
      async onopen(response) {
        if (!active()) return
        if (response.status === 401) { stop(); onUnauthorized(); throw Error('Unauthorized') }
        if (response.status === 403 || response.status === 404) {
          stop(); onError(Object.assign(Error('Payment stream access denied'), { response: { status: response.status } }))
          throw Error('Payment stream access denied')
        }
        if (!response.ok || !response.headers.get('content-type')?.startsWith('text/event-stream')) throw Error('Payment stream unavailable')
      },
      onmessage(message) {
        if (!active() || failed) return
        if (message.event === 'auth-expired') { stop(); onUnauthorized(); return }
        if (message.event === 'heartbeat') { touch(); return }
        if (message.event !== 'payment-status') return
        const { payment } = JSON.parse(message.data)
        if (payment?.paymentId !== paymentId || typeof payment.status !== 'string') throw Error('Invalid payment snapshot')
        healthy = true; retryDelay = 1000; stopPolling(); touch(); accept(payment)
      },
      onclose() { throw Error('Payment stream closed') },
      onerror(error) { throw error },
    }).catch(fail)
  }
  function visibilityChanged() {
    pause()
    if (!page.hidden && !stopped) { connect(); void poll() }
  }
  page.addEventListener('visibilitychange', visibilityChanged)
  connect()
  return stop
}
