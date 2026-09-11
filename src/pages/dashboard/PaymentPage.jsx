import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, LoaderCircle, RotateCw } from 'lucide-react'
import { walletApi } from '../../utils/omniApi'
import { loadPaymentPageData } from './loadPaymentPageData'
import PaymentForm from './PaymentForm'
import PaymentStatus from './PaymentStatus'
import {
  effectivePaymentStatus, firstEnabledMethod, methodCapability, normalizeTopupState,
  paymentErrorCode, paymentFromError, rupiah, shouldPollPayment, validateTopup,
} from './walletTopupModel'
import './PaymentPage.css'

function paymentPayload(amount, method, bankCode) {
  return { amount: Number(amount), method, ...(method === 'va' ? { bankCode } : {}) }
}

export default function PaymentPage({ onBack, onWalletChanged, onPaymentComplete }) {
  const [wallet, setWallet] = useState(null)
  const [amount, setAmount] = useState('50000')
  const [method, setMethod] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [capabilities, setCapabilities] = useState(null)
  const [payment, setPayment] = useState(null)
  const [disposition, setDisposition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uncertain, setUncertain] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [clock, setClock] = useState(Date.now())
  const qrRef = useRef(null)

  const refreshWallet = useCallback(async () => {
    const next = await walletApi.get()
    setWallet(next)
    return next
  }, [])

  const applyState = useCallback((state) => {
    const nextCapabilities = normalizeTopupState(state)
    if (!nextCapabilities) {
      setCapabilities(null); setUncertain(true)
      setError('Pilihan pembayaran belum dapat diverifikasi. Periksa kembali sebelum membuat pembayaran.')
      return
    }
    const nextPayment = state.payment ?? null
    const nextMethod = nextPayment?.method !== 'mock' && methodCapability(nextCapabilities, nextPayment?.method)
      ? nextPayment.method : firstEnabledMethod(nextCapabilities)
    const option = methodCapability(nextCapabilities, nextMethod)
    setCapabilities(nextCapabilities); setPayment(nextPayment); setMethod(nextMethod)
    setBankCode(nextPayment?.selectedBankCode || option?.banks?.[0]?.code || '')
    if (nextPayment) setAmount(String(nextPayment.amount))
    setUncertain(false)
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    const result = await loadPaymentPageData(walletApi)
    if (result.wallet) setWallet(result.wallet)
    if (result.state) applyState(result.state)
    else {
      setUncertain(true)
      setError('Status pembayaran belum dapat dipastikan. Jangan membuat pembayaran baru sampai pemeriksaan berhasil.')
    }
    if (result.walletError && result.state) setError('Saldo belum dapat dimuat, tetapi status pembayaran tetap dapat digunakan.')
    setLoading(false)
  }, [applyState])

  useEffect(() => {
    load().catch(() => {
      setUncertain(true); setLoading(false); setError('Pembayaran belum dapat dimuat.')
    })
  }, [load])

  const status = effectivePaymentStatus(payment, clock)

  useEffect(() => {
    if (status !== 'pending' || !payment?.expiresAt) return undefined
    const delay = Math.max(0, new Date(payment.expiresAt).getTime() - Date.now() + 50)
    const timer = window.setTimeout(() => setClock(Date.now()), Math.min(delay, 2_147_000_000))
    return () => window.clearTimeout(timer)
  }, [payment?.expiresAt, status])

  useEffect(() => {
    if (!payment?.paymentId || !shouldPollPayment(status)) return undefined
    let ignore = false
    const check = async () => {
      try {
        const state = await walletApi.topupState(payment.paymentId)
        if (!ignore && state.payment) { setPayment(state.payment); setClock(Date.now()); setError('') }
        else if (!ignore) {
          setUncertain(true)
          setError('Pembayaran aktif tidak ditemukan saat status diperiksa. Jangan membayar ulang.')
        }
      } catch (requestError) {
        if (!ignore && paymentErrorCode(requestError) === 'TOPUP_PROVIDER_STATE_UNCERTAIN') {
          setUncertain(true)
          setError('Penyedia belum dapat memastikan status pembayaran. Jangan membayar ulang.')
        }
      }
    }
    const timer = window.setInterval(check, 4000)
    return () => { ignore = true; window.clearInterval(timer) }
  }, [payment?.paymentId, status])

  useEffect(() => {
    if (status !== 'credited') return undefined
    refreshWallet().then((nextWallet) => onWalletChanged?.(nextWallet)).catch(() => {})
    const timer = window.setTimeout(() => onPaymentComplete?.(), 2000)
    return () => window.clearTimeout(timer)
  }, [onPaymentComplete, onWalletChanged, refreshWallet, status])

  const recoverBlockedPayment = async (requestError) => {
    const embedded = paymentFromError(requestError)
    if (embedded) return embedded
    const state = await walletApi.topupState()
    if (state?.capabilities) setCapabilities(normalizeTopupState(state))
    return state?.payment ?? null
  }

  const createPayment = async (event) => {
    event?.preventDefault()
    if (uncertain || !capabilities) return
    const validationError = validateTopup(amount, method, bankCode, capabilities)
    if (validationError) { setError(validationError); return }
    setBusy(true); setError(''); setDisposition(null)
    try {
      const result = await walletApi.topup(paymentPayload(amount, method, bankCode))
      setPayment(result); setAmount(String(result.amount))
      setDisposition(result.disposition ?? 'created'); setClock(Date.now())
    } catch (requestError) {
      const code = paymentErrorCode(requestError)
      if (code === 'TOPUP_REPLACEMENT_BLOCKED') {
        try {
          const activePayment = await recoverBlockedPayment(requestError)
          if (!activePayment) throw new Error('ACTIVE_PAYMENT_NOT_FOUND')
          setPayment(activePayment); setAmount(String(activePayment.amount))
          setDisposition('replacement_blocked')
          setError('Permintaan baru tidak dibuat karena pembayaran sebelumnya masih aktif.')
        } catch {
          setUncertain(true)
          setError('Pembayaran lama belum dapat dipastikan. Jangan membuat pembayaran baru atau membayar ulang.')
        }
      } else if (code === 'TOPUP_PROVIDER_STATE_UNCERTAIN') {
        setUncertain(true)
        setError('Penyedia belum dapat memastikan status pembayaran. Jangan membuat pembayaran baru atau membayar ulang.')
      } else {
        setError(requestError?.response?.data?.error?.message ?? 'Pembayaran tidak dapat dibuat. Coba lagi.')
      }
    } finally { setBusy(false) }
  }

  const simulatePayment = async () => {
    setBusy(true); setError('')
    try {
      await walletApi.completeMockTopup(payment.paymentId)
      setPayment((current) => ({ ...current, status: 'credited' }))
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message ?? 'Simulasi pembayaran gagal.')
    } finally { setBusy(false) }
  }

  const prepareNewPayment = () => {
    setAmount(String(payment?.amount ?? '50000'))
    if (payment?.method !== 'mock' && methodCapability(capabilities, payment?.method)) setMethod(payment.method)
    if (payment?.selectedBankCode) setBankCode(payment.selectedBankCode)
    setPayment(null); setDisposition(null); setError(''); setClock(Date.now())
  }

  const copy = async (value, name) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('CLIPBOARD_UNAVAILABLE')
      await navigator.clipboard.writeText(value); setCopied(name)
      window.setTimeout(() => setCopied(''), 1800)
    } catch { setError('Tidak dapat menyalin otomatis. Tekan dan salin nomor secara manual.') }
  }

  const downloadQr = () => {
    const svg = qrRef.current
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `qris-${payment.reference}.svg`; link.click(); URL.revokeObjectURL(url)
  }

  const expiry = payment?.expiresAt
    ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payment.expiresAt))
    : 'waktu yang ditentukan'

  return (
    <div className="pay">
      <button className="pay-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Kembali</button>
      <div className="pay-head"><h1>Isi saldo prabayar</h1><p>Saldo dipakai otomatis sebesar Rp250 untuk setiap pesanan yang selesai dan terkonfirmasi.</p></div>
      <div className="pay-grid">
        <section className="pay-card pay-balance" aria-live="polite"><span className="pay-kicker">Saldo tersedia</span><strong>{wallet ? rupiah(wallet.balance) : loading ? 'Memuat…' : 'Tidak tersedia'}</strong><span>Setara {wallet ? Math.floor(Number(wallet.balance) / 250).toLocaleString('id-ID') : '–'} pesanan berikutnya</span></section>
        {loading ? <section className="pay-card pay-loading" aria-live="polite"><LoaderCircle size={22} /> Menyiapkan pembayaran…</section>
          : uncertain ? <section className="pay-card pay-result pay-warning" role="alert"><h2>Status pembayaran belum pasti</h2><p>{error}</p><button type="button" className="pay-copy" onClick={load}><RotateCw size={16} /> Periksa kembali</button></section>
            : !capabilities?.methods.some((item) => item.enabled) ? <section className="pay-card pay-result pay-warning" role="alert"><h2>Metode pembayaran belum tersedia</h2><p>Penyedia pembayaran belum menawarkan metode yang dapat digunakan.</p></section>
              : !payment ? <PaymentForm amount={amount} bankCode={bankCode} busy={busy} capabilities={capabilities} error={error} method={method} onAmountChange={setAmount} onBankChange={setBankCode} onMethodChange={setMethod} onSubmit={createPayment} />
                : <PaymentStatus busy={busy} copied={copied} disposition={disposition} error={error} expiry={expiry} onCopy={copy} onDownloadQr={downloadQr} onRecreate={prepareNewPayment} onRefresh={load} onSimulate={simulatePayment} payment={payment} qrRef={qrRef} status={status} />}
      </div>
    </div>
  )
}
