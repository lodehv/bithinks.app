import { useId } from 'react'
import RefundStatusButton from './RefundStatusButton'
import './RefundStatus.css'
import { financialStatus } from './financeStatus'

const prepareDenied = 'Verifikasi rekening tidak diizinkan oleh server. Hubungi admin untuk memeriksa kelayakan refund dan konfigurasi.'
const sendDenied = 'Pengiriman refund tidak diizinkan oleh server. Hubungi admin untuk memeriksa kelayakan refund dan konfigurasi.'

export default function RefundDisbursementActions({ refund, busy, onAction, onChecked }) {
  const hintId = useId()
  if (!refund?.approval) return null
  const transfer = refund.disbursement
  const terminal = refund.status === 'REFUNDED' || ['SUCCEEDED', 'FAILED'].includes(transfer?.state)
  const canPrepare = refund.canPrepareDisbursement === true
  const canSend = refund.canSendDisbursement === true
  return <div className="refund-status" data-state={transfer?.state}>
    {transfer && <>
      <p className="refund-status-summary" role="status">{financialStatus(transfer.state, 'disbursement').label}</p>
      <p className="refund-status-detail">{transfer.accountName} · ••••{transfer.accountLast4}</p>
      {transfer.reference && <p className="refund-status-detail">Referensi: {transfer.reference}</p>}
      {refund.refundedAt && <p className="refund-status-detail">Selesai: {new Date(refund.refundedAt).toLocaleString('id-ID')}</p>}
    </>}
    {!transfer && terminal && <p className="refund-status-summary" role="status">{financialStatus(refund.status, 'payment').label}</p>}
    {!terminal && !transfer && <>
      <button className="adm-wa" disabled={busy || !canPrepare} aria-busy={busy || undefined}
        aria-describedby={!canPrepare ? `${hintId}-prepare` : undefined} onClick={() => onAction('prepare')}>Verifikasi rekening</button>
      {!canPrepare && <p className="refund-action-hint" id={`${hintId}-prepare`}>{prepareDenied}</p>}
    </>}
    {!terminal && transfer?.state === 'READY' && <>
      <button className="adm-wa" disabled={busy || !canSend} aria-busy={busy || undefined}
        aria-describedby={!canSend ? `${hintId}-send` : undefined} onClick={() => onAction('send')}>Kirim refund</button>
      {!canSend && <p className="refund-action-hint" id={`${hintId}-send`}>{sendDenied}</p>}
    </>}
    {!terminal && transfer?.dispatchedAt && ['PENDING', 'UNCERTAIN'].includes(transfer.state)
      && refund.canInquireDisbursement !== false && <RefundStatusButton refundId={refund.id} disabled={busy} onChecked={onChecked} />}
  </div>
}
