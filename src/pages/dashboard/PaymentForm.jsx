import { CreditCard, QrCode, ShieldCheck } from 'lucide-react'
import {
  TOPUP_PRESETS, amountAllowed, methodCapability, rupiah,
} from './walletTopupModel'

export default function PaymentForm({
  amount, bankCode, busy, capabilities, error, method,
  onAmountChange, onBankChange, onMethodChange, onSubmit,
}) {
  const activeCapability = methodCapability(capabilities, method)
  const methods = capabilities.methods.filter((item) => item.enabled)
  const selectMethod = (option) => {
    onMethodChange(option.id)
    if (option.id === 'va') onBankChange(option.banks[0]?.code || '')
  }

  return (
    <form className="pay-card pay-form" onSubmit={onSubmit}>
      <h2>Pilih nominal</h2>
      <div className="pay-presets" aria-label="Pilih cepat nominal isi saldo">
        {TOPUP_PRESETS.map((value) => {
          const allowed = amountAllowed(value, activeCapability)
          return <button type="button" key={value} disabled={!allowed} className={Number(amount) === value ? 'active' : ''} aria-pressed={Number(amount) === value} onClick={() => onAmountChange(String(value))}>{rupiah(value)}</button>
        })}
      </div>
      <label className="pay-field" htmlFor="topup-amount">Nominal isi saldo</label>
      <div className="pay-input-wrap"><span>Rp</span><input id="topup-amount" name="topupAmount" inputMode="numeric" autoComplete="off" value={amount} onChange={(event) => onAmountChange(event.target.value.replace(/\D/g, ''))} /></div>
      {activeCapability && (activeCapability.minAmount !== null || activeCapability.maxAmount !== null) && (
        <p className="pay-constraint">
          Batas {activeCapability.label}: {activeCapability.minAmount !== null ? rupiah(activeCapability.minAmount) : 'tanpa minimum'}–{activeCapability.maxAmount !== null ? rupiah(activeCapability.maxAmount) : 'tanpa maksimum'}.
        </p>
      )}
      <fieldset className={`pay-methods ${methods.length === 1 ? 'single' : ''}`}><legend>Pilih cara bayar</legend>
        {methods.map((option) => {
          const Icon = option.id === 'qris' ? QrCode : CreditCard
          return (
            <button type="button" key={option.id} className={`pay-method ${method === option.id ? 'selected' : ''}`} onClick={() => selectMethod(option)} aria-pressed={method === option.id}>
              <Icon size={22} /><span><strong>{option.label}</strong><small>{option.id === 'qris' ? 'Pindai dengan aplikasi bank atau dompet digital' : 'Dapatkan nomor Virtual Account'}</small></span>
            </button>
          )
        })}
      </fieldset>
      {method === 'va' && <label className="pay-field" htmlFor="bank-code">Pilih bank<select id="bank-code" name="bankCode" value={bankCode} onChange={(event) => onBankChange(event.target.value)}>{activeCapability?.banks.map((bank) => <option value={bank.code} key={bank.code}>{bank.name}</option>)}</select></label>}
      {error && <p className="pay-error" role="alert">{error}</p>}
      <button className="pay-submit" disabled={busy || !activeCapability}>{busy ? 'Menyiapkan…' : method === 'qris' ? 'Tampilkan QRIS' : 'Buat Virtual Account'}</button>
      <div className="pay-trust"><ShieldCheck size={17} /><span>Nominal, metode, dan status pembayaran diverifikasi oleh penyedia pembayaran.</span></div>
    </form>
  )
}
