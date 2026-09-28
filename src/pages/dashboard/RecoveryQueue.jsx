import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { RefreshCw, RotateCw, ShieldAlert } from 'lucide-react'
import { adminApi } from '../../utils/omniApi'
import { financialStatus } from './financeStatus'
import RefundApprovalDialog from './RefundApprovalDialog'
import RefundDisbursementDialog from './RefundDisbursementDialog'
import RefundDisbursementActions from './RefundDisbursementActions'

export default function RecoveryQueue() {
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approvalRow, setApprovalRow] = useState(null)
  const [notice, setNotice] = useState('')
  const [transferAction, setTransferAction] = useState(null)
  const loadRequest = useRef(0)
  const actionHintId = useId()

  const load = useCallback(() => {
    const request = ++loadRequest.current
    setLoading(true); setError('')
    return adminApi.walletRecovery().then((data) => {
      if (request === loadRequest.current) setRows(data?.rows ?? [])
    }).catch(() => {
      if (request === loadRequest.current) setError('Antrean pemulihan belum dapat dimuat.')
    }).finally(() => {
      if (request === loadRequest.current) setLoading(false)
    })
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => { window.clearTimeout(timer); loadRequest.current += 1 }
  }, [load])

  const retry = async (kind, id) => {
    const reason = window.prompt('Alasan tindakan (wajib)')
    if (!reason?.trim()) return
    setBusy(true); setError('')
    try { await (kind === 'credit' ? adminApi.retryCredit(id, reason) : adminApi.retryRefund(id, reason)); await load() }
    catch { setError('Tindakan tidak dapat dijalankan. Periksa status terbaru pembayaran.') }
    finally { setBusy(false) }
  }

  return <section className="adm-recovery">
    <div className="adm-toolbar"><div><h2><ShieldAlert size={18} /> Pemulihan pembayaran</h2><p>Pembayaran yang dibayar tetapi belum menjadi saldo, serta refund yang memerlukan tindakan.</p></div><button className="adm-refresh" onClick={load} disabled={busy || loading} aria-busy={loading || undefined}><RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Memuat…' : 'Muat ulang'}</button></div>
    {loading && <p role="status" className="adm-sub">Memuat antrean pemulihan…</p>}
    {error && <div className="adm-error" role="alert">{error}</div>}
    {notice && <p role="status">{notice}</p>}
    {transferAction && <RefundDisbursementDialog {...transferAction} onClose={() => setTransferAction(null)} onCompleted={(result) => {
      setTransferAction(null); setNotice(result.state === 'SUCCEEDED' ? 'Refund berhasil.' : result.state === 'READY'
        ? `Rekening ${result.accountName} terverifikasi. Belum ditransfer.` : 'Status transfer diperbarui. Jangan mengirim transfer baru.'); void load()
    }} />}
    {approvalRow && <RefundApprovalDialog row={approvalRow} onClose={() => setApprovalRow(null)} onApproved={() => {
      setApprovalRow(null); setNotice('Refund telah disetujui. Belum ada transfer uang.'); void load()
    }} />}
    <div className="adm-table-wrap"><table className="adm-table adm-recovery-table" role="table">
      <caption className="adm-visually-hidden">Antrean pemulihan pembayaran</caption>
      <thead role="rowgroup"><tr role="row">
        <th id="recovery-reference" role="columnheader" scope="col">Referensi</th>
        <th id="recovery-tenant" role="columnheader" scope="col">Tenant</th>
        <th id="recovery-amount" role="columnheader" scope="col">Nominal</th>
        <th id="recovery-status" role="columnheader" scope="col">Status</th>
        <th id="recovery-attempts" role="columnheader" scope="col">Percobaan</th>
        <th id="recovery-actions" role="columnheader" scope="col">Tindakan</th>
      </tr></thead><tbody role="rowgroup">
      {rows.map((row) => {
        const rawStatus = row.refund?.status ?? row.walletState
        const status = rawStatus ? financialStatus(rawStatus) : { label: '—', tone: 'neutral' }
        const canApprove = row.refund?.canApprove === true
        const approveHintId = `${actionHintId}-approve-${row.id}`
        return <tr key={row.id} role="row">
          <td role="cell" headers="recovery-reference" data-label="Referensi" className="adm-mono">{row.reference}</td>
          <td role="cell" headers="recovery-tenant" data-label="Tenant">{row.tenant?.name ?? row.tenant?.slug ?? '—'}</td>
          <td role="cell" headers="recovery-amount" data-label="Nominal">Rp{String(row.amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</td>
          <td role="cell" headers="recovery-status" data-label="Status"><span className={`finance-status finance-status--${status.tone}`} title={rawStatus ? `Status server: ${rawStatus}` : undefined}>{status.label}</span>
            {rawStatus && status.label === 'Status belum dikenal' && <div className="adm-sub">{rawStatus}</div>}
            {row.refund?.approval && <div className="adm-sub">Disetujui oleh {row.refund.approval.actorUserId} pada {new Date(row.refund.approval.approvedAt).toLocaleString('id-ID')}. Alasan: {row.refund.approval.reason}.</div>}
          </td>
          <td role="cell" headers="recovery-attempts" data-label="Percobaan">{row.creditAttempts}×{row.refund ? ` / ${row.refund.retryCount}×` : ''}</td>
          <td role="cell" headers="recovery-actions" data-label="Tindakan" className="adm-recovery-actions">
            {row.walletState !== 'CREDITED' && !row.refund && <button className="adm-wa" disabled={busy || loading} aria-busy={busy || loading || undefined} onClick={() => retry('credit', row.id)}><RotateCw size={13} /> Coba kredit lagi</button>}
            {row.refund && !row.refund.approval && <>
              <button className="adm-wa" disabled={busy || loading || !canApprove} aria-busy={busy || loading || undefined}
                aria-describedby={!canApprove ? approveHintId : undefined} onClick={() => setApprovalRow(row)}>Setujui refund</button>
              {!canApprove && <div className="adm-sub" id={approveHintId}>Persetujuan refund tidak diizinkan oleh server. Hubungi admin untuk memeriksa kelayakan refund.</div>}
            </>}
            {row.refund && !row.refund.approval && row.refund.status !== 'REFUNDED' && <button className="adm-status-action" disabled={busy || loading} aria-busy={busy || loading || undefined} onClick={() => retry('refund', row.refund.id)}><RotateCw size={13} /> Ulangi percobaan refund</button>}
            <RefundDisbursementActions refund={row.refund} busy={busy || loading} onAction={(action) => setTransferAction({ row, action })}
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
        </tr>
      })}
      {!loading && !busy && !error && rows.length === 0 && <tr role="row"><td role="cell" colSpan={6} className="adm-empty">Tidak ada pembayaran yang memerlukan pemulihan.</td></tr>}
    </tbody></table></div>
  </section>
}
