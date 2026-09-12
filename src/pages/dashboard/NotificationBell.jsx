import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, Wallet, AlertTriangle, X } from 'lucide-react'
import { notificationApi } from '../../utils/omniApi'
import './NotificationBell.css'

const rupiah = (value) => `Rp${String(value ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
const time = (value) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))

function copy(row) {
  const data = row.data ?? {}
  if (row.type === 'TOPUP_CREDITED') return { title: 'Saldo berhasil ditambahkan', body: `${rupiah(data.amount)} masuk dari ${data.reference}. Saldo sekarang ${rupiah(data.balance)}.` }
  return { title: 'Saldo hampir habis', body: `Saldo ${rupiah(data.balance)} melewati ambang ${rupiah(data.threshold)}. Isi saldo sebelum pekerjaan berhenti.` }
}

export default function NotificationBell({ onOpenTopup, onOpenPayment }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [unread, setUnread] = useState(0)
  const [cursor, setCursor] = useState(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)

  const load = useCallback(async (append = false) => {
    try {
      const data = await notificationApi.list({ limit: 20, ...(append && cursor ? { cursor } : {}) })
      setRows((current) => append ? [...current, ...(data?.rows ?? [])] : (data?.rows ?? []))
      setCursor(data?.nextCursor ?? null)
      setUnread(data?.unread ?? 0)
    } catch { /* the dashboard remains usable when notifications are unavailable */ }
  }, [cursor])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 60_000)
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer) }
  }, [load])
  useEffect(() => {
    const close = (event) => { if (open && ref.current && !ref.current.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const markRead = async (row) => {
    if (!row.readAt) {
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, readAt: new Date().toISOString() } : item))
      setUnread((value) => Math.max(0, value - 1))
      await notificationApi.markRead(row.id).catch(() => {})
    }
    setOpen(false)
    if (row.type === 'TOPUP_CREDITED') onOpenPayment?.(row.entityId)
    else onOpenTopup?.()
  }

  const markAll = async () => {
    setBusy(true)
    try { await notificationApi.markAllRead(); setRows((current) => current.map((row) => ({ ...row, readAt: row.readAt ?? new Date().toISOString() }))); setUnread(0) } finally { setBusy(false) }
  }

  return <div className="notification-bell" ref={ref}>
    <button type="button" className="notification-trigger" aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`} aria-expanded={open} onClick={() => { setOpen((value) => !value); if (!open) void load() }}>
      <Bell size={18} />{unread > 0 && <span className="notification-count">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <section className="notification-popover" aria-label="Notifikasi">
      <header><div><strong>Notifikasi</strong><span>{unread ? `${unread} belum dibaca` : 'Semua sudah dibaca'}</span></div><button type="button" aria-label="Tutup notifikasi" onClick={() => setOpen(false)}><X size={16} /></button></header>
      {rows.length === 0 ? <p className="notification-empty">Belum ada notifikasi.</p> : <div className="notification-list">{rows.map((row) => { const item = copy(row); return <button type="button" key={row.id} className={`notification-item ${row.readAt ? '' : 'unread'}`} onClick={() => void markRead(row)}><span className="notification-icon">{row.type === 'TOPUP_CREDITED' ? <Wallet size={16} /> : <AlertTriangle size={16} />}</span><span><strong>{item.title}</strong><span>{item.body}</span><time dateTime={row.createdAt}>{time(row.createdAt)}</time></span></button> })}</div>}
      <footer>{cursor && <button type="button" onClick={() => void load(true)}>Muat notifikasi lama</button>} {unread > 0 && <button type="button" disabled={busy} onClick={() => void markAll()}><CheckCheck size={14} /> Tandai semua dibaca</button>}</footer>
    </section>}
  </div>
}
