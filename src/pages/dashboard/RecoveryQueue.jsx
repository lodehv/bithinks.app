import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, RotateCw, ShieldAlert } from 'lucide-react'
import { adminApi } from '../../utils/omniApi'
import RefundApprovalDialog from './RefundApprovalDialog'
import RefundDisbursementDialog from './RefundDisbursementDialog'
import RefundDisbursementActions from './RefundDisbursementActions'

const labels = {
  PAID: 'Dibayar', CREDIT_PENDING: 'Kredit diproses', CREDIT_FAILED: 'Kredit gagal',
  REFUND_PENDING: 'Refund menunggu', REFUND_PROCESSING: 'Refund diproses', REFUND_FAILED: 'Refund gagal', REFUNDED: 'Refund berhasil',
}

export default function RecoveryQueue() {
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [approvalRow, setApprovalRow] = useState(null)
  const [notice, setNotice] = useState('')
  const [transferAction, setTransferAction] = useState(null)

  const load = useCallback(() => {
    setBusy(true); setError('')
    return adminApi.walletRecovery().then((data) => setRows(data?.rows ?? [])).catch(() => setError('Antrean pemulihan belum dapat dimuat.')).finally(() => setBusy(false))
  }, [])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])

  const retry = async (kind, id) => {
    const reason = window.prompt('Alasan tindakan (wajib)')
    if (!reason?.trim()) return
    setBusy(true); setError('')
    try { await (kind === 'credit' ? adminApi.retryCredit(id, reason) : adminApi.retryRefund(id, reason)); await load() }
    catch { setError('Tindakan tidak dapat dijalankan. Periksa status terbaru pembayaran.') }
    finally { setBusy(false) }
  }

  return <section className="adm-recovery">
    <div className="adm-toolbar"><div><h2><ShieldAlert size={18} /> Pemulihan pembayaran</h2><p>Pembayaran yang dibayar tetapi belum menjadi saldo, serta refund yang memerlukan tindakan.</p></div><button className="adm-refresh" onClick={load} disabled={busy}><RefreshCw size={14} className={busy ? 'spin' : ''} /> Muat ulang</button></div>
    {error && <div className="adm-error">{error}</div>}
    {notice && <p role="status">{notice}</p>}
    {transferAction && <RefundDisbursementDialog {...transferAction} onClose={() => setTransferAction(null)} onCompleted={(result) => {
      setTransferAction(null); setNotice(result.state === 'SUCCEEDED' ? 'Refund berhasil.' : result.state === 'READY'
        ? `Rekening ${result.accountName} terverifikasi. Belum ditransfer.` : 'Status transfer diperbarui. Jangan mengirim transfer baru.'); void load()
    }} />}
    {approvalRow && <RefundApprovalDialog row={approvalRow} onClose={() => setApprovalRow(null)} onApproved={() => {
      setApprovalRow(null); setNotice('Refund telah disetujui. Belum ada transfer uang.'); void load()
    }} />}
    <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Referensi</th><th>Tenant</th><th>Nominal</th><th>Status</th><th>Percobaan</th><th>Tindakan</th></tr></thead><tbody>
      {rows.map((row) => <tr key={row.id}>
        <td className="adm-mono">{row.reference}</td><td>{row.tenant?.name ?? row.tenant?.slug ?? '—'}</td>
        <td>Rp{String(row.amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</td>
        <td><span className={`adm-badge ${row.refund?.status === 'REFUNDED' ? 'st-active' : row.refund?.status === 'REFUND_FAILED' ? 'refund-state-failed' : 'st-trial'}`}>{labels[row.refund?.status] ?? labels[row.walletState] ?? row.walletState ?? '—'}</span>
          {row.refund?.approval && <div className="adm-sub">Disetujui oleh {row.refund.approval.actorUserId} pada {new Date(row.refund.approval.approvedAt).toLocaleString('id-ID')}. Alasan: {row.refund.approval.reason}.</div>}
        </td>
        <td>{row.creditAttempts}×{row.refund ? ` / ${row.refund.retryCount}×` : ''}</td>
        <td className="adm-recovery-actions">
          {row.walletState !== 'CREDITED' && !row.refund && <button className="adm-wa" disabled={busy} onClick={() => retry('credit', row.id)}><RotateCw size={13} /> Kredit</button>}
          {row.refund && !row.refund.approval && row.refund.status !== 'REFUNDED' && <button className="adm-wa" disabled={busy} onClick={() => retry('refund', row.refund.id)}><RotateCw size={13} /> Retry refund</button>}
          {row.refund && !row.refund.approval && <button className="adm-wa" disabled={busy || !row.refund.canApprove} onClick={() => setApprovalRow(row)}>Setujui refund</button>}
          <RefundDisbursementActions refund={row.refund} busy={busy} onAction={(action) => setTransferAction({ row, action })}
            onChecked={(result) => {
              setRows((current) => current.map((entry) => entry.id !== row.id ? entry : { ...entry, refund: {
                ...entry.refund, disbursement: result, status: result.state === 'SUCCEEDED' ? 'REFUNDED'
                  : result.state === 'FAILED' ? 'REFUND_FAILED' : entry.refund.status,
              } }))
              setNotice(result.state === 'SUCCEEDED' ? 'Refund berhasil.' : result.state === 'FAILED'
                ? 'Transfer gagal. Hubungi admin/support; jangan transfer ulang.' : 'Transfer masih diproses. Tidak ada transfer baru yang dikirim.')
              void load()
            }} />
        </td>
      </tr>)}
      {!busy && rows.length === 0 && <tr><td colSpan={6} className="adm-empty">Tidak ada pembayaran yang memerlukan pemulihan.</td></tr>}
    </tbody></table></div>
  </section>
}
