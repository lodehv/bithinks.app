import { useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { adminApi } from '../../utils/omniApi'
import './RefundStatus.css'

export default function RefundStatusButton({ refundId, disabled, onChecked }) {
  const inFlight = useRef(false)
  const requestKey = useRef(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const check = async () => {
    if (disabled || inFlight.current) return
    inFlight.current = true
    requestKey.current ??= crypto.randomUUID()
    setPending(true); setError('')
    try {
      const result = await adminApi.refundDisbursement(refundId, { action: 'inquire' }, requestKey.current)
      requestKey.current = null
      onChecked?.(result)
    } catch {
      setError('Status belum dapat diperbarui. Coba cek lagi; tindakan ini tidak mengirim transfer baru.')
    } finally { inFlight.current = false; setPending(false) }
  }
  return <div className="refund-status-check">
    <button type="button" className="adm-wa" disabled={disabled || pending} aria-busy={pending} onClick={check}>
      <RefreshCw size={14} aria-hidden="true" />{pending ? 'Mengecek…' : 'Cek status'}
    </button>
    {error && <p role="alert">{error}</p>}
  </div>
}
