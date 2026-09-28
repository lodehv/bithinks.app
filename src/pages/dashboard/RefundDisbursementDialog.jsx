import { useEffect, useRef, useState } from 'react'
import { adminApi } from '../../utils/omniApi'
import { refundActionError } from './refundActionError'
import './RefundDialog.css'

const banks = [['002', 'BRI'], ['008', 'Mandiri'], ['009', 'BNI'], ['013', 'Permata'], ['011', 'Danamon'], ['016', 'Maybank'], ['014', 'BCA']]
const titles = { prepare: 'Verifikasi rekening refund', send: 'Kirim refund?', inquire: 'Cek status transfer' }
const rupiah = (value) => `Rp${String(value ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`

export default function RefundDisbursementDialog({ row, action, onClose, onCompleted }) {
  const dialog = useRef(null), submitting = useRef(false), requestKey = useRef(crypto.randomUUID()), submitted = useRef(null)
  const [reason, setReason] = useState(''), [bankCode, setBankCode] = useState('002'), [accountNumber, setAccountNumber] = useState('')
  const [busy, setBusy] = useState(false), [locked, setLocked] = useState(false), [error, setError] = useState('')
  const transfer = row.refund.disbursement
  useEffect(() => {
    const node = dialog.current
    node.showModal(); node.querySelector('textarea')?.focus()
    return () => node.close()
  }, [])
  const submit = async (event) => {
    event.preventDefault()
    if (submitting.current || !reason.trim() || (action === 'prepare' && !/^\d{6,30}$/.test(accountNumber))) return
    submitting.current = true
    submitted.current ??= { action, reason: reason.trim(), ...(action === 'prepare' ? { bankCode, accountNumber } : {}) }
    setLocked(true); setBusy(true); setError('')
    try {
      const result = await adminApi.refundDisbursement(row.refund.id, submitted.current, requestKey.current)
      onCompleted(result)
    } catch (error) {
      setError(refundActionError(error, 'Hasil belum dapat dipastikan. Coba permintaan yang sama atau tutup dan muat ulang. Transfer yang sudah dikirim tidak akan dikirim ulang; server hanya mengecek status.'))
    } finally { submitting.current = false; setBusy(false) }
  }
  return <dialog ref={dialog} aria-labelledby="refund-disbursement-title" onCancel={(event) => {
    if (submitting.current) event.preventDefault(); else onClose()
  }} className="refund-dialog">
    <form onSubmit={submit}>
      <h2 id="refund-disbursement-title">{titles[action]}</h2>
      <p className="refund-summary">{row.reference}<strong>{rupiah(row.amount)}</strong>Pengguna menerima nominal utuh.</p>
      <p className="refund-note">Sandbox saja. Biaya transfer ditanggung platform.</p>
      {transfer && <p>{transfer.accountName} · Bank {transfer.bankCode} · ••••{transfer.accountLast4}<br />
        Fee {rupiah(transfer.feeIdr)} · Total debit {rupiah(transfer.grossAmountIdr)}</p>}
      {action === 'prepare' && <>
        <label htmlFor="refund-bank">Bank tujuan</label>
        <select id="refund-bank" value={bankCode} disabled={locked} onChange={(e) => setBankCode(e.target.value)}>
          {banks.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
        <label htmlFor="refund-account">Nomor rekening</label>
        <input id="refund-account" required inputMode="numeric" autoComplete="off" pattern="[0-9]{6,30}" minLength={6} maxLength={30}
          value={accountNumber} disabled={locked} onChange={(e) => setAccountNumber(e.target.value)} />
        <p>Verifikasi belum mengirim uang. Periksa nama pemilik yang dikembalikan Singapay sebelum mengirim.</p>
      </>}
      {action === 'send' && <p>Pastikan nama pemilik dan rekening benar. Setelah dikirim, transfer tidak bisa diulang dari tombol ini.</p>}
      <label htmlFor="refund-transfer-reason">Alasan tindakan (wajib)</label>
      <textarea id="refund-transfer-reason" autoFocus required maxLength={500} value={reason} disabled={locked}
        onChange={(e) => setReason(e.target.value)} />
      {error && <p className="refund-error" role="alert">{error}</p>}
      <div className="refund-actions">
        <button type="button" disabled={busy} onClick={onClose}>{error ? 'Tutup' : 'Batal'}</button>
        <button type="submit" disabled={busy || !reason.trim() || (action === 'prepare' && !/^\d{6,30}$/.test(accountNumber))}>
          {busy ? 'Memproses…' : action === 'prepare' ? 'Verifikasi rekening' : action === 'send' ? 'Kirim refund' : 'Cek status'}
        </button>
      </div>
    </form>
  </dialog>
}
