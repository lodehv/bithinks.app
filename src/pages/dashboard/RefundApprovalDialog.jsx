import { useEffect, useRef, useState } from 'react'
import { adminApi } from '../../utils/omniApi'
import { refundActionError } from './refundActionError'
import './RefundDialog.css'

export default function RefundApprovalDialog({ row, onClose, onApproved }) {
  const dialog = useRef(null)
  const submitting = useRef(false)
  const requestKey = useRef(crypto.randomUUID())
  const submittedReason = useRef(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const node = dialog.current
    node.showModal(); node.querySelector('textarea')?.focus()
    return () => node.close()
  }, [])

  const approve = async (event) => {
    event.preventDefault()
    if (submitting.current || !reason.trim()) return
    submitting.current = true
    submittedReason.current ??= reason.trim()
    setLocked(true); setBusy(true); setError('')
    try {
      await adminApi.approveRefund(row.refund.id, submittedReason.current, requestKey.current)
      onApproved()
    } catch (error) {
      setError(refundActionError(error, 'Persetujuan belum dapat dipastikan. Coba lagi dengan permintaan yang sama atau tutup dan muat ulang status.'))
    } finally { submitting.current = false; setBusy(false) }
  }

  return <dialog ref={dialog} aria-labelledby="refund-approval-title" onCancel={(event) => {
    if (submitting.current) event.preventDefault()
    else onClose()
  }} className="refund-dialog" aria-describedby="refund-approval-note">
    <form onSubmit={approve}>
      <h2 id="refund-approval-title">Setujui refund?</h2>
      <p className="refund-summary">{row.reference}<strong>Rp{String(row.amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</strong></p>
      <p id="refund-approval-note" className="refund-note">Ini belum mentransfer uang. Persetujuan dan identitas admin dicatat permanen di audit. Setelah disetujui, verifikasi rekening sebelum mengirim refund.</p>
      <label htmlFor="refund-approval-reason">Alasan persetujuan (wajib)</label>
      <textarea id="refund-approval-reason" autoFocus required maxLength={500} value={reason}
        placeholder="Jelaskan mengapa refund ini disetujui" disabled={locked} onChange={(event) => setReason(event.target.value)} />
      {error && <p className="refund-error" role="alert">{error}</p>}
      <div className="refund-actions">
        <button type="button" disabled={busy} onClick={onClose}>{error ? 'Tutup' : 'Batal'}</button>
        <button type="submit" disabled={busy || !reason.trim()}>{busy ? 'Menyimpan…' : error ? 'Coba permintaan yang sama' : 'Setujui refund'}</button>
      </div>
    </form>
  </dialog>
}
