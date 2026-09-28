import { useEffect, useRef, useState } from 'react'
import { adminApi } from '../../utils/omniApi'

export default function RefundApprovalDialog({ row, onClose, onApproved }) {
  const dialog = useRef(null)
  const submitting = useRef(false)
  const requestKey = useRef(crypto.randomUUID())
  const submittedReason = useRef(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)

  useEffect(() => { dialog.current?.showModal() }, [])

  const approve = async (event) => {
    event.preventDefault()
    if (submitting.current || !reason.trim()) return
    submitting.current = true
    submittedReason.current ??= reason.trim()
    setLocked(true); setBusy(true); setError('')
    try {
      await adminApi.approveRefund(row.refund.id, submittedReason.current, requestKey.current)
      onApproved()
    } catch {
      setError('Persetujuan belum dapat dipastikan. Coba lagi dengan permintaan yang sama atau tutup dan muat ulang status.')
    } finally { submitting.current = false; setBusy(false) }
  }

  return <dialog ref={dialog} aria-labelledby="refund-approval-title" onCancel={(event) => {
    if (submitting.current) event.preventDefault()
    else onClose()
  }} style={{ maxWidth: 440, width: 'calc(100% - 32px)', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
    <form onSubmit={approve}>
      <h2 id="refund-approval-title">Setujui refund?</h2>
      <p>{row.reference} · Rp{String(row.amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</p>
      <p>Persetujuan dicatat beserta identitas admin dan tidak dapat diubah. Ini belum mentransfer uang.</p>
      <label htmlFor="refund-approval-reason">Alasan persetujuan (wajib)</label>
      <textarea id="refund-approval-reason" autoFocus required maxLength={500} value={reason}
        disabled={locked} onChange={(event) => setReason(event.target.value)} style={{ display: 'block', width: '100%', minHeight: 90, margin: '8px 0 16px' }} />
      {error && <p role="alert">{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button type="button" disabled={busy} onClick={onClose} style={{ minHeight: 44 }}>Batal</button>
        <button type="submit" disabled={busy || !reason.trim()} style={{ minHeight: 44 }}>{busy ? 'Menyimpan…' : 'Setujui refund'}</button>
      </div>
    </form>
  </dialog>
}
