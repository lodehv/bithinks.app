import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { adminApi } from '../../utils/omniApi'

const money = (value) => `Rp${String(value ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
const bits = (value) => `${Number(value ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} bit`
const date = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

function Toolbar({ children, onRefresh, busy }) { return <div className="adm-toolbar"><div className="adm-filters">{children}</div><button className="adm-refresh" onClick={onRefresh} disabled={busy}><RefreshCw size={14} className={busy ? 'spin' : ''} /> Muat ulang</button></div> }
function Pager({ cursor, onNext }) { return cursor ? <div className="adm-pager"><button className="adm-refresh" onClick={onNext}>Muat berikutnya <ChevronRight size={14} /></button></div> : null }

function Payments() {
  const [rows, setRows] = useState([]); const [cursor, setCursor] = useState(null); const [filter, setFilter] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [detail, setDetail] = useState(null); const [reviewBusy, setReviewBusy] = useState(false)
  const load = useCallback(async (append = false) => { setBusy(true); setError(''); try { const data = await adminApi.payments({ limit: 25, ...(filter ? { tenant: filter } : {}), ...(append && cursor ? { cursor } : {}) }); setRows((current) => append ? [...current, ...(data?.rows ?? [])] : (data?.rows ?? [])); setCursor(data?.nextCursor ?? null) } catch { setError('Riwayat pembayaran belum dapat dimuat.') } finally { setBusy(false) } }, [cursor, filter])
  // The cursor is deliberately excluded: changing it must not reload the first page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load() }, [filter])
  const open = async (id) => { try { setDetail(await adminApi.payment(id)) } catch { setError('Detail pembayaran belum dapat dimuat.') } }
  const review = async (action) => { const reason = window.prompt('Alasan review (wajib)'); if (!reason?.trim()) return; setReviewBusy(true); try { await adminApi.reviewPayment(detail.id, { action, reason }, crypto.randomUUID()); setDetail(await adminApi.payment(detail.id)) } catch { setError('Review pembayaran gagal atau sudah diproses.') } finally { setReviewBusy(false) } }
  if (detail) return <section><button className="adm-back" onClick={() => setDetail(null)}><ArrowLeft size={14} /> Kembali ke pembayaran</button>{error && <div className="adm-error">{error}</div>}<div className="adm-detail"><h2>{detail.reference}</h2><p>{detail.tenant?.name} · {detail.purpose}</p><div className="adm-detail-grid"><span>Nominal<strong>{money(detail.amount)}</strong></span><span>Status<strong>{detail.walletState ?? detail.status}</strong></span><span>Dibuat<strong>{date(detail.createdAt)}</strong></span><span>Dibayar<strong>{date(detail.paidAt ?? detail.providerPaidAt)}</strong></span><span>Masuk saldo<strong>{date(detail.creditedAt)}</strong></span><span>Provider<strong>{detail.provider} · {detail.providerTransactionId ?? '—'}</strong></span></div>{detail.purpose === 'LEGACY_SUBSCRIPTION' && detail.status === 'submitted' && <div className="adm-detail-actions"><button className="adm-wa" disabled={reviewBusy} onClick={() => void review('approve')}>Setujui</button><button className="adm-status-action" disabled={reviewBusy} onClick={() => void review('reject')}>Tolak</button></div>}<h3>Refund</h3>{detail.refunds?.length ? detail.refunds.map((refund) => <div className="adm-detail-row" key={refund.id}>{refund.status} · {money(refund.amount)} · {refund.retryCount} percobaan</div>) : <p className="adm-sub">Belum ada refund.</p>}</div></section>
  return <section><Toolbar onRefresh={() => void load()} busy={busy}><label className="adm-search"><Search size={14} /><input placeholder="Cari tenant…" value={filter} onChange={(event) => setFilter(event.target.value)} /></label></Toolbar>{error && <div className="adm-error">{error}</div>}<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Referensi</th><th>Tenant</th><th>Nominal</th><th>Metode</th><th>Status</th><th>Dibuat</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} tabIndex="0" onClick={() => void open(row.id)} onKeyDown={(event) => event.key === 'Enter' && void open(row.id)}><td className="adm-mono">{row.reference}</td><td>{row.tenant?.name ?? '—'}</td><td>{money(row.amount)}</td><td>{row.provider} · {row.method}</td><td><span className="adm-badge st-trial">{row.walletState ?? row.status}</span></td><td>{date(row.createdAt)}</td></tr>)}{!busy && !rows.length && <tr><td colSpan="6" className="adm-empty">Tidak ada pembayaran.</td></tr>}</tbody></table></div><Pager cursor={cursor} onNext={() => void load(true)} /></section>
}

function Wallets() {
  const [rows, setRows] = useState([]); const [cursor, setCursor] = useState(null); const [tenant, setTenant] = useState(''); const [selected, setSelected] = useState(null); const [ledger, setLedger] = useState([]); const [busy, setBusy] = useState(false)
  const load = useCallback(async (append = false) => { setBusy(true); try { const data = await adminApi.wallets({ limit: 25, ...(tenant ? { tenant } : {}), ...(append && cursor ? { cursor } : {}) }); setRows((current) => append ? [...current, ...(data?.rows ?? [])] : (data?.rows ?? [])); setCursor(data?.nextCursor ?? null) } finally { setBusy(false) } }, [cursor, tenant])
  // The cursor is deliberately excluded: changing it must not reload the first page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load() }, [tenant])
  const open = async (row) => { setSelected(row); const data = await adminApi.ledger({ tenant: row.tenant.id, limit: 50 }); setLedger(data?.rows ?? []) }
  return <section><Toolbar onRefresh={() => void load()} busy={busy}><label className="adm-search"><Search size={14} /><input placeholder="Cari tenant…" value={tenant} onChange={(event) => setTenant(event.target.value)} /></label></Toolbar><div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Tenant</th><th>Saldo bit</th><th>Total top-up</th><th>Total usage</th><th>Rekonsiliasi</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.walletId}><td>{row.tenant.name}<div className="adm-sub">{row.tenant.slug}</div></td><td>{bits(row.balance)}</td><td>{bits(row.totalTopup)}</td><td>{bits(row.totalUsage)}</td><td><span className="adm-badge st-trial">{row.reconciliation?.state}</span></td><td><button className="adm-wa" onClick={() => void open(row)}>Ledger <ChevronRight size={13} /></button></td></tr>)}{!busy && !rows.length && <tr><td colSpan="6" className="adm-empty">Tidak ada wallet.</td></tr>}</tbody></table></div><Pager cursor={cursor} onNext={() => void load(true)} />{selected && <div className="adm-detail"><button className="adm-back" onClick={() => setSelected(null)}><ArrowLeft size={14} /> Tutup ledger</button><h2>{selected.tenant.name}</h2>{ledger.map((entry) => <div className="adm-detail-row" key={entry.id}><strong>{entry.type}</strong> · {bits(entry.amount)} · {bits(entry.balanceBefore)} → {bits(entry.balanceAfter)} · {date(entry.createdAt)}</div>)}</div>}</section>
}

function Audits() {
  const [rows, setRows] = useState([]); const [cursor, setCursor] = useState(null); const [busy, setBusy] = useState(false)
  const load = useCallback(async (append = false) => { setBusy(true); try { const data = await adminApi.audits({ limit: 25, ...(append && cursor ? { cursor } : {}) }); setRows((current) => append ? [...current, ...(data?.rows ?? [])] : (data?.rows ?? [])); setCursor(data?.nextCursor ?? null) } finally { setBusy(false) } }, [cursor])
  // The cursor is deliberately excluded: changing it must not reload the first page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load() }, [])
  return <section><Toolbar onRefresh={() => void load()} busy={busy} /><div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Waktu</th><th>Aksi</th><th>Entity</th><th>Admin</th><th>Alasan</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{date(row.createdAt)}</td><td>{row.action}</td><td>{row.entityType} · {row.entityId}</td><td>{row.actor?.name ?? row.actorUserId ?? 'Sistem'}</td><td>{row.reason}</td></tr>)}{!busy && !rows.length && <tr><td colSpan="5" className="adm-empty"><ShieldCheck size={18} /> Belum ada audit.</td></tr>}</tbody></table></div><Pager cursor={cursor} onNext={() => void load(true)} /></section>
}

export default function AdminFinance({ section }) {
  if (section === 'payments') return <Payments />
  if (section === 'wallets') return <Wallets />
  if (section === 'audit') return <Audits />
  return null
}
