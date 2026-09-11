import { CheckCircle2, Clipboard, Download, LoaderCircle, RotateCw } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { rupiah } from './walletTopupModel'

function RetryCard({ busy, error, message, onRecreate, title }) {
  return (
    <section className="pay-card pay-result" aria-live="polite">
      <h2>{title}</h2><p>{message}</p>
      {error && <p className="pay-error" role="alert">{error}</p>}
      <button type="button" className="pay-submit" disabled={busy} onClick={onRecreate}>{busy ? 'Menyiapkan…' : 'Buat pembayaran baru'}</button>
    </section>
  )
}

export default function PaymentStatus({
  busy, copied, disposition, error, expiry, onCopy, onDownloadQr,
  onRecreate, onRefresh, onSimulate, payment, qrRef, status,
}) {
  if (status === 'credited') return (
    <section className="pay-card pay-result pay-success" aria-live="assertive"><CheckCircle2 size={42} /><h2>Saldo berhasil ditambahkan</h2><p>Anda akan kembali ke halaman sebelumnya.</p></section>
  )
  if (status === 'expired') return <RetryCard busy={busy} error={error} title="Waktu pembayaran habis" message="Instruksi lama sudah dinonaktifkan. Buat pembayaran baru untuk melanjutkan." onRecreate={onRecreate} />
  if (status === 'cancelled') return <RetryCard busy={busy} error={error} title="Pembayaran dibatalkan" message="Instruksi pembayaran ini tidak lagi berlaku dan tidak dapat menambah saldo." onRecreate={onRecreate} />
  if (status === 'refunded') return <RetryCard busy={busy} error={error} title="Dana telah dikembalikan" message="Pembayaran ini tidak menambah saldo. Anda dapat membuat pembayaran baru." onRecreate={onRecreate} />

  if (status === 'expiry_check') return (
    <section className="pay-card pay-result pay-processing" aria-live="polite"><LoaderCircle size={34} /><h2>Memeriksa akhir masa pembayaran</h2><p>Instruksi lama sudah disembunyikan. Tunggu sampai penyedia memastikan status sebelum membuat pembayaran baru.</p>{error && <p className="pay-error" role="alert">{error}</p>}</section>
  )

  if (status === 'credit_pending' || status === 'credit_processing' || status === 'credit_failed') return (
    <section className="pay-card pay-result pay-processing" aria-live="polite"><LoaderCircle size={34} /><h2>Pembayaran diterima</h2><p>Saldo sedang diverifikasi dan akan diperbarui otomatis. Jangan membuat pembayaran lain.</p>{error && <p className="pay-error" role="alert">{error}</p>}</section>
  )
  if (status === 'refund_pending' || status === 'refund_processing') return (
    <section className="pay-card pay-result pay-processing" aria-live="polite"><LoaderCircle size={34} /><h2>Pengembalian dana sedang diproses</h2><p>Jangan membuat pembayaran baru sampai status pengembalian dana dipastikan.</p>{error && <p className="pay-error" role="alert">{error}</p>}</section>
  )
  if (status === 'refund_failed') return (
    <section className="pay-card pay-result pay-warning" role="alert"><h2>Pengembalian dana perlu ditangani</h2><p>Jangan membayar ulang. Tim dukungan perlu memastikan dana Anda sebelum top-up berikutnya.</p>{error && <p className="pay-error">{error}</p>}<button type="button" className="pay-copy" onClick={onRefresh}><RotateCw size={16} /> Periksa status lagi</button></section>
  )

  if (status !== 'pending') return (
    <section className="pay-card pay-result pay-warning" role="alert"><h2>Status pembayaran belum dikenali</h2><p>Instruksi disembunyikan untuk mencegah pembayaran ganda. Periksa status lagi sebelum melanjutkan.</p><button type="button" className="pay-copy" onClick={onRefresh}><RotateCw size={16} /> Periksa status lagi</button></section>
  )

  return (
    <section className="pay-card pay-instructions" aria-live="polite">
      <div className="pay-pending"><span className="pay-pulse" /> Menunggu pembayaran</div>
      {disposition === 'reused' && <p className="pay-notice">Pembayaran dengan nominal dan metode yang sama masih aktif. Gunakan kembali instruksi ini.</p>}
      {disposition === 'replacement_blocked' && <p className="pay-warning-note">Pembayaran lain masih aktif dan belum aman dibatalkan. Selesaikan instruksi ini atau tunggu hingga kedaluwarsa.</p>}
      {payment.method === 'mock' ? <div className="pay-test"><span>Mode pengujian</span><h2>Simulasikan pembayaran</h2><p>Tidak ada uang sungguhan yang diproses.</p><button type="button" className="pay-submit" disabled={busy} onClick={onSimulate}>{busy ? 'Memproses…' : 'Simulasikan pembayaran berhasil'}</button></div>
        : <><h2>{payment.method === 'qris' ? 'Pindai kode QRIS' : `Transfer melalui ${payment.virtualAccount?.bankCode ?? 'bank pilihan'}`}</h2><strong className="pay-instruction-amount">{rupiah(payment.amount)}</strong>{payment.providerFee && <p className="pay-fee">Biaya penyedia: {rupiah(payment.providerFee)} · Total dibayar: {rupiah(payment.totalAmount || Number(payment.amount) + Number(payment.providerFee))}</p>}
          {payment.qrisPayload && <div className="pay-qr"><QRCodeSVG ref={qrRef} value={payment.qrisPayload} size={220} level="M" includeMargin aria-label={`QRIS untuk pembayaran ${rupiah(payment.amount)}`} /><div className="pay-actions"><button type="button" className="pay-copy" onClick={() => onCopy(payment.qrisPayload, 'qris')}><Clipboard size={16} />{copied === 'qris' ? 'Tersalin' : 'Salin kode'}</button><button type="button" className="pay-copy" onClick={onDownloadQr}><Download size={16} /> Simpan QR</button></div></div>}
          {payment.virtualAccount && <div className="pay-va"><span>Nomor Virtual Account</span><strong>{payment.virtualAccount.number}</strong><button type="button" className="pay-copy" onClick={() => onCopy(payment.virtualAccount.number, 'va')}><Clipboard size={16} />{copied === 'va' ? 'Tersalin' : 'Salin nomor'}</button></div>}
          {!payment.qrisPayload && !payment.virtualAccount && <p className="pay-error" role="alert">Instruksi pembayaran belum tersedia. Periksa kembali status pembayaran.</p>}</>}
      {error && <p className="pay-error" role="alert">{error}</p>}
      <p className="pay-expiry">Selesaikan sebelum {expiry}. Saldo diperbarui otomatis setelah pembayaran terkonfirmasi.</p>
    </section>
  )
}
