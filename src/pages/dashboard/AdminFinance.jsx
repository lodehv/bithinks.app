import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { adminApi } from '../../utils/omniApi'
import { financialStatus, reconciliationStatus } from './financeStatus'
import useAdminPagedList from './useAdminPagedList'

const money = (value) => `Rp${String(value ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
const bits = (value) => `${Number(value ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} bit`
const date = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

function StatusBadge({ value, reconciliation = false }) {
  const status = reconciliation ? reconciliationStatus(value) : financialStatus(value)
  const unknown = status.label.toLowerCase().includes('belum dikenal')
  return <span className={`adm-badge finance-status--${status.tone}`} title={unknown ? String(value ?? '') : undefined}>
    {status.label}
    {unknown && value && <span className="adm-sub">{value}</span>}
  </span>
}

function Toolbar({ children, onRefresh, busy }) {
  return <div className="adm-toolbar"><div className="adm-filters">{children}</div><button className="adm-refresh" onClick={onRefresh} disabled={busy}><RefreshCw size={14} className={busy ? 'spin' : ''} /> Muat ulang</button></div>
}

function Pager({ cursor, onNext, busy }) {
  return cursor ? <div className="adm-pager"><button className="adm-refresh" onClick={onNext} disabled={busy}>Muat berikutnya <ChevronRight size={14} /></button></div> : null
}

function ListFeedback({ busy, error, empty, onRetry, colSpan }) {
  if (error) return <tr><td colSpan={colSpan} className="adm-empty" role="cell"><span role="alert">{error}</span> <button className="adm-status-action" onClick={onRetry}>Coba lagi</button></td></tr>
  if (busy) return <tr><td colSpan={colSpan} className="adm-empty" role="cell"><span role="status">Memuat data…</span></td></tr>
  return <tr><td colSpan={colSpan} className="adm-empty" role="cell">{empty}</td></tr>
}

function Payments() {
  const [filter, setFilter] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailError, setDetailError] = useState('')
  const [detailBusy, setDetailBusy] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const detailRequest = useRef(0)
  const fetchPage = useCallback((tenant, cursor) => adminApi.payments({ limit: 25, ...(tenant ? { tenant } : {}), ...(cursor ? { cursor } : {}) }), [])
  const list = useAdminPagedList({ query: filter, fetchPage, errorMessage: 'Riwayat pembayaran belum dapat dimuat.', debounceMs: 250 })

  useEffect(() => () => { detailRequest.current += 1 }, [])

  const changeFilter = (event) => {
    list.invalidate()
    setFilter(event.target.value)
  }
  const open = async (id) => {
    const request = ++detailRequest.current
    setDetailId(id)
    setDetail(null)
    setDetailError('')
    setDetailBusy(true)
    setReviewBusy(false)
    try {
      const payment = await adminApi.payment(id)
      if (request === detailRequest.current) setDetail(payment)
    } catch {
      if (request === detailRequest.current) setDetailError('Detail pembayaran belum dapat dimuat.')
    } finally {
      if (request === detailRequest.current) setDetailBusy(false)
    }
  }
  const closeDetail = () => {
    detailRequest.current += 1
    setDetailId(null)
    setDetail(null)
    setDetailError('')
    setDetailBusy(false)
    setReviewBusy(false)
  }
  const review = async (action) => {
    const reason = window.prompt('Alasan review (wajib)')
    if (!reason?.trim()) return
    const paymentId = detail.id
    const request = ++detailRequest.current
    setReviewBusy(true)
    try {
      await adminApi.reviewPayment(paymentId, { action, reason }, crypto.randomUUID())
      const payment = await adminApi.payment(paymentId)
      if (request === detailRequest.current) setDetail(payment)
    } catch {
      if (request === detailRequest.current) setDetailError('Review pembayaran gagal atau sudah diproses.')
    } finally {
      if (request === detailRequest.current) setReviewBusy(false)
    }
  }

  if (detail) {
    const state = detail.walletState ?? detail.status
    return <section>
      <button className="adm-back" onClick={closeDetail}><ArrowLeft size={14} /> Kembali ke pembayaran</button>
      {detailError && <div className="adm-error" role="alert">{detailError} {detailId && <button className="adm-status-action" onClick={() => void open(detailId)}>Coba lagi</button>}</div>}
      <div className="adm-detail">
        <h2>{detail.reference}</h2><p>{detail.tenant?.name} · {detail.purpose}</p>
        <div className="adm-detail-grid">
          <span>Nominal<strong>{money(detail.amount)}</strong></span>
          <span>Status<strong><StatusBadge value={state} /></strong></span>
          <span>Dibuat<strong>{date(detail.createdAt)}</strong></span>
          <span>Dibayar<strong>{date(detail.paidAt ?? detail.providerPaidAt)}</strong></span>
          <span>Masuk saldo<strong>{date(detail.creditedAt)}</strong></span>
          <span>Provider<strong>{detail.provider} · {detail.providerTransactionId ?? '—'}</strong></span>
        </div>
        {detail.purpose === 'LEGACY_SUBSCRIPTION' && detail.status === 'submitted' && <div className="adm-detail-actions">
          <button className="adm-wa" disabled={reviewBusy} onClick={() => void review('approve')}>Setujui</button>
          <button className="adm-status-action" disabled={reviewBusy} onClick={() => void review('reject')}>Tolak</button>
        </div>}
        <h3>Refund</h3>
        {detail.refunds?.length ? detail.refunds.map((refund) => <div className="adm-detail-row" key={refund.id}><StatusBadge value={refund.status} /> · {money(refund.amount)} · {refund.retryCount} percobaan</div>) : <p className="adm-sub">Belum ada refund.</p>}
      </div>
    </section>
  }

  return <section>
    <Toolbar onRefresh={() => void list.refresh()} busy={list.busy}>
      <label className="adm-search"><Search size={14} /><input aria-label="Cari tenant pembayaran" placeholder="Cari tenant…" value={filter} onChange={changeFilter} /></label>
    </Toolbar>
    {list.error && <div className="adm-error" role="alert">{list.error} <button className="adm-status-action" onClick={() => void list.refresh()}>Coba lagi</button></div>}
    {detailError && <div className="adm-error" role="alert">{detailError}</div>}
    {detailBusy && <p role="status">Memuat detail pembayaran…</p>}
    <div className="adm-table-wrap"><table className="adm-table adm-finance-table" role="table">
      <thead role="rowgroup"><tr role="row">
        <th id="payment-reference" scope="col" role="columnheader">Referensi</th><th id="payment-tenant" scope="col" role="columnheader">Tenant</th><th id="payment-amount" scope="col" role="columnheader">Nominal</th><th id="payment-method" scope="col" role="columnheader">Metode</th><th id="payment-status" scope="col" role="columnheader">Status</th><th id="payment-created" scope="col" role="columnheader">Dibuat</th>
      </tr></thead>
      <tbody role="rowgroup">
        {list.rows.map((row) => <tr key={row.id} role="row">
          <td data-label="Referensi" headers="payment-reference" role="cell"><button className="adm-payment-open" aria-label={`Buka pembayaran ${row.reference}`} onClick={() => void open(row.id)}>{row.reference}</button></td>
          <td data-label="Tenant" headers="payment-tenant" role="cell">{row.tenant?.name ?? '—'}</td>
          <td data-label="Nominal" headers="payment-amount" role="cell">{money(row.amount)}</td>
          <td data-label="Metode" headers="payment-method" role="cell">{row.provider} · {row.method}</td>
          <td data-label="Status" headers="payment-status" role="cell"><StatusBadge value={row.walletState ?? row.status} /></td>
          <td data-label="Dibuat" headers="payment-created" role="cell">{date(row.createdAt)}</td>
        </tr>)}
        {!list.rows.length && !list.error && <ListFeedback busy={list.busy} error="" empty="Tidak ada pembayaran." onRetry={() => void list.refresh()} colSpan="6" />}
      </tbody>
    </table></div>
    <Pager cursor={list.cursor} onNext={() => void list.loadNext()} busy={list.busy} />
  </section>
}

function Wallets() {
  const [tenant, setTenant] = useState('')
  const [selected, setSelected] = useState(null)
  const [ledger, setLedger] = useState([])
  const [ledgerBusy, setLedgerBusy] = useState(false)
  const [ledgerError, setLedgerError] = useState('')
  const ledgerRequest = useRef(0)
  const fetchPage = useCallback((search, cursor) => adminApi.wallets({ limit: 25, ...(search ? { tenant: search } : {}), ...(cursor ? { cursor } : {}) }), [])
  const list = useAdminPagedList({ query: tenant, fetchPage, errorMessage: 'Daftar wallet belum dapat dimuat.', debounceMs: 250 })

  useEffect(() => () => { ledgerRequest.current += 1 }, [])

  const changeTenant = (event) => {
    list.invalidate()
    ledgerRequest.current += 1
    setSelected(null)
    setLedger([])
    setLedgerBusy(false)
    setLedgerError('')
    setTenant(event.target.value)
  }
  const loadLedger = async (row) => {
    const request = ++ledgerRequest.current
    setSelected(row)
    setLedger([])
    setLedgerBusy(true)
    setLedgerError('')
    try {
      const data = await adminApi.ledger({ tenant: row.tenant.id, limit: 50 })
      if (request === ledgerRequest.current) setLedger(data?.rows ?? [])
    } catch {
      if (request === ledgerRequest.current) setLedgerError('Buku besar tenant belum dapat dimuat.')
    } finally {
      if (request === ledgerRequest.current) setLedgerBusy(false)
    }
  }
  const closeLedger = () => {
    ledgerRequest.current += 1
    setSelected(null)
    setLedger([])
    setLedgerBusy(false)
    setLedgerError('')
  }

  return <section>
    <Toolbar onRefresh={() => void list.refresh()} busy={list.busy}>
      <label className="adm-search"><Search size={14} /><input aria-label="Cari tenant wallet" placeholder="Cari tenant…" value={tenant} onChange={changeTenant} /></label>
    </Toolbar>
    {list.error && <div className="adm-error" role="alert">{list.error} <button className="adm-status-action" onClick={() => void list.refresh()}>Coba lagi</button></div>}
    <div className="adm-table-wrap"><table className="adm-table adm-finance-table" role="table">
      <thead role="rowgroup"><tr role="row">
        <th id="wallet-tenant" scope="col" role="columnheader">Tenant</th><th id="wallet-balance" scope="col" role="columnheader">Saldo bit</th><th id="wallet-topup" scope="col" role="columnheader">Total top-up</th><th id="wallet-usage" scope="col" role="columnheader">Total usage</th><th id="wallet-reconciliation" scope="col" role="columnheader">Rekonsiliasi</th><th id="wallet-actions" scope="col" role="columnheader">Tindakan</th>
      </tr></thead>
      <tbody role="rowgroup">
        {list.rows.map((row) => {
          const reconciliation = row.reconciliation?.state ?? 'unknown'
          return <tr key={row.walletId} role="row">
            <td data-label="Tenant" headers="wallet-tenant" role="cell">{row.tenant.name}<div className="adm-sub">{row.tenant.slug}</div></td>
            <td data-label="Saldo bit" headers="wallet-balance" role="cell">{bits(row.balance)}</td>
            <td data-label="Total top-up" headers="wallet-topup" role="cell">{bits(row.totalTopup)}</td>
            <td data-label="Total usage" headers="wallet-usage" role="cell">{bits(row.totalUsage)}</td>
            <td data-label="Rekonsiliasi" headers="wallet-reconciliation" role="cell"><StatusBadge value={reconciliation} reconciliation /></td>
            <td data-label="Tindakan" headers="wallet-actions" role="cell"><button className="adm-wa" onClick={() => void loadLedger(row)}>Buka ledger <ChevronRight size={13} /></button></td>
          </tr>
        })}
        {!list.rows.length && !list.error && <ListFeedback busy={list.busy} error="" empty="Tidak ada wallet." onRetry={() => void list.refresh()} colSpan="6" />}
      </tbody>
    </table></div>
    <Pager cursor={list.cursor} onNext={() => void list.loadNext()} busy={list.busy} />
    {selected && <div className="adm-detail" aria-live="polite">
      <button className="adm-back" onClick={closeLedger}><ArrowLeft size={14} /> Tutup ledger</button>
      <h2>{selected.tenant.name}</h2>
      {ledgerBusy && <p role="status">Memuat buku besar…</p>}
      {ledgerError && <div className="adm-error" role="alert">{ledgerError} <button className="adm-status-action" onClick={() => void loadLedger(selected)}>Coba lagi</button></div>}
      {!ledgerBusy && !ledgerError && !ledger.length && <p className="adm-empty">Belum ada transaksi di buku besar.</p>}
      {!ledgerBusy && !ledgerError && ledger.map((entry) => <div className="adm-detail-row" key={entry.id}><strong>{entry.type}</strong> · {bits(entry.amount)} · {bits(entry.balanceBefore)} → {bits(entry.balanceAfter)} · {date(entry.createdAt)}</div>)}
    </div>}
  </section>
}

function Audits() {
  const fetchPage = useCallback((_, cursor) => adminApi.audits({ limit: 25, ...(cursor ? { cursor } : {}) }), [])
  const list = useAdminPagedList({ query: '', fetchPage, errorMessage: 'Riwayat audit belum dapat dimuat.' })
  return <section>
    <Toolbar onRefresh={() => void list.refresh()} busy={list.busy} />
    {list.error && <div className="adm-error" role="alert">{list.error} <button className="adm-status-action" onClick={() => void list.refresh()}>Coba lagi</button></div>}
    <div className="adm-table-wrap"><table className="adm-table adm-finance-table" role="table">
      <thead role="rowgroup"><tr role="row">
        <th id="audit-created" scope="col" role="columnheader">Waktu</th><th id="audit-action" scope="col" role="columnheader">Aksi</th><th id="audit-entity" scope="col" role="columnheader">Entity</th><th id="audit-actor" scope="col" role="columnheader">Admin</th><th id="audit-reason" scope="col" role="columnheader">Alasan</th>
      </tr></thead>
      <tbody role="rowgroup">
        {list.rows.map((row) => <tr key={row.id} role="row">
          <td data-label="Waktu" headers="audit-created" role="cell">{date(row.createdAt)}</td>
          <td data-label="Aksi" headers="audit-action" role="cell">{row.action}</td>
          <td data-label="Entity" headers="audit-entity" role="cell">{row.entityType} · {row.entityId}</td>
          <td data-label="Admin" headers="audit-actor" role="cell">{row.actor?.name ?? row.actorUserId ?? 'Sistem'}</td>
          <td data-label="Alasan" headers="audit-reason" role="cell">{row.reason}</td>
        </tr>)}
        {!list.rows.length && !list.error && <ListFeedback busy={list.busy} error="" empty={<><ShieldCheck size={18} /> Belum ada audit.</>} onRetry={() => void list.refresh()} colSpan="5" />}
      </tbody>
    </table></div>
    <Pager cursor={list.cursor} onNext={() => void list.loadNext()} busy={list.busy} />
  </section>
}

export default function AdminFinance({ section }) {
  if (section === 'payments') return <Payments />
  if (section === 'wallets') return <Wallets />
  if (section === 'audit') return <Audits />
  return null
}
