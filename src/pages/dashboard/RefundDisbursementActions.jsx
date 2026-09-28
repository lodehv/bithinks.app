const labels = { READY: 'Rekening terverifikasi; belum ditransfer', PENDING: 'Transfer diproses',
  UNCERTAIN: 'Hasil belum pasti; cek status, jangan transfer ulang', SUCCEEDED: 'Refund berhasil',
  FAILED: 'Transfer gagal; perlu tindak lanjut admin/support' }

export default function RefundDisbursementActions({ refund, busy, onAction }) {
  if (!refund?.approval) return null
  const transfer = refund.disbursement
  return <div>
    {transfer && <p role="status">{labels[transfer.state] ?? 'Status belum diketahui'}<br />
      {transfer.accountName} · ••••{transfer.accountLast4}</p>}
    {!transfer && <button className="adm-wa" disabled={busy || !refund.canPrepareDisbursement} onClick={() => onAction('prepare')}>Verifikasi rekening</button>}
    {transfer?.state === 'READY' && <button className="adm-wa" disabled={busy || !refund.canSendDisbursement} onClick={() => onAction('send')}>Kirim refund</button>}
    {transfer?.dispatchedAt && <button className="adm-wa" disabled={busy} onClick={() => onAction('inquire')}>Cek status</button>}
  </div>
}
