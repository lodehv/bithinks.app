import { ShieldCheck } from 'lucide-react'

export default function WalletAccessDenied({ onBack }) {
  return (
    <section className="pay-card pay-result pay-warning" role="alert">
      <ShieldCheck size={36} />
      <h2>Isi saldo hanya untuk owner dan admin</h2>
      <p>Akun ini tidak memiliki izin untuk melihat saldo bit atau membuat pembayaran.</p>
      <button type="button" className="pay-copy" onClick={onBack}>Kembali ke dashboard</button>
    </section>
  )
}
