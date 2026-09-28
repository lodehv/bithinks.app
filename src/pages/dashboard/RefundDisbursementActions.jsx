const labels = { READY: 'Rekening terverifikasi; belum ditransfer', PENDING: 'Transfer diproses',
  UNCERTAIN: 'Hasil belum pasti; cek status, jangan transfer ulang', SUCCEEDED: 'Refund berhasil',
  FAILED: 'Transfer gagal; perlu tindak lanjut admin/support' }

export default function RefundDisbursementActions({ refund, busy, onAction, onChecked }) {
  if (!refund?.approval) return null
  const transfer = refund.disbursement
  const terminal = refund.status === 'REFUNDED' || ['SUCCEEDED', 'FAILED'].includes(transfer?.state)
  return <div className="refund-status" data-state={transfer?.state}>
    {transfer && <>
      <p className="refund-status-summary" role="status">{labels[transfer.state] ?? 'Status belum diketahui'}</p>
      <p className="refund-status-detail">{transfer.accountName} · ••••{transfer.accountLast4}</p>
      {transfer.reference && <p className="refund-status-detail">Referensi: {transfer.reference}</p>}
      {refund.refundedAt && <p className="refund-status-detail">Selesai: {new Date(refund.refundedAt).toLocaleString('id-ID')}</p>}
    </>}
    {!transfer && <button className="adm-wa" disabled={busy || !refund.canPrepareDisbursement} onClick={() => onAction('prepare')}>Verifikasi rekening</button>}
    {!terminal && transfer?.state === 'READY' && <button className="adm-wa" disabled={busy || !refund.canSendDisbursement} onClick={() => onAction('send')}>Kirim refund</button>}
    {!terminal && transfer?.dispatchedAt && ['PENDING', 'UNCERTAIN'].includes(transfer.state)
      && refund.canInquireDisbursement !== false && <RefundStatusButton refundId={refund.id} disabled={busy} onChecked={onChecked} />}
  </div>
}
import RefundStatusButton from './RefundStatusButton'
import './RefundStatus.css'
