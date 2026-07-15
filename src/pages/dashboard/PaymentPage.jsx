import { useState } from "react";
import { ArrowLeft, ShieldCheck, ExternalLink } from "lucide-react";
import { subscriptionApi } from "../../utils/omniApi";
import "./PaymentPage.css";

const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

// ─────────────────────────────────────────────────────────────────────────────
// Halaman pembayaran langganan — gateway iPaymu (redirect).
// User pilih periode → "Bayar Sekarang" → diarahkan ke halaman bayar iPaymu.
// Langganan aktif OTOMATIS setelah pembayaran (via callback iPaymu ke backend).
// ─────────────────────────────────────────────────────────────────────────────

export default function PaymentPage({ onBack, plan }) {
  const [months, setMonths] = useState(plan?.months ?? 1);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState("");

  // Estimasi tampil bila paket dipilih dari halaman pricing (nominal final
  // dikonfirmasi lagi di halaman iPaymu).
  const estimate = plan ? Math.round(plan.monthly * months) : null;

  const pay = async () => {
    setBusy(true); setError("");
    try {
      const res = await subscriptionApi.checkout(months);
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl;  // menuju halaman bayar iPaymu
      } else {
        setError("Gagal memulai pembayaran. Coba lagi.");
        setBusy(false);
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? "Gagal memulai pembayaran. Coba lagi.");
      setBusy(false);
    }
  };

  return (
    <div className="pay">
      <button className="pay-back" onClick={onBack}><ArrowLeft size={15} /> Kembali</button>

      <div className="pay-head">
        <h1>Pembayaran Langganan</h1>
        <p>Bayar aman lewat iPaymu (QRIS, Virtual Account, e-wallet). Langganan aktif otomatis setelah pembayaran berhasil.</p>
        {plan && (
          <div className="pay-plan-chip">
            Paket dipilih: <strong>{plan.name}</strong> · {plan.months} bulan
          </div>
        )}
      </div>

      <div className="pay-card pay-checkout">
        {!plan && (
          <>
            <div className="pay-amount-label">Periode langganan</div>
            <div className="pay-months">
              {[1, 3, 6, 12].map((m) => (
                <button key={m} className={`pay-month-btn ${months === m ? "active" : ""}`} onClick={() => setMonths(m)}>{m} bln</button>
              ))}
            </div>
          </>
        )}

        {estimate != null && (
          <>
            <div className="pay-amount-label">Total ({months} bulan)</div>
            <div className="pay-amount">{rupiah(estimate)}</div>
            <div className="pay-amount-sub">nominal final dikonfirmasi di halaman iPaymu</div>
          </>
        )}

        <div className="qris-unique" style={{ marginTop: 14 }}>
          <ShieldCheck size={14} />
          <span>Pembayaran diproses oleh <strong>iPaymu</strong> (gateway berlisensi). Kami tidak menyimpan data kartu/e-wallet Anda.</span>
        </div>

        {error && <div style={{ fontSize: 12, color: "#DC2626", margin: "10px 0" }}>{error}</div>}

        <button className="pay-submit" onClick={pay} disabled={busy}>
          {busy ? "Mengalihkan ke iPaymu…" : <>Bayar Sekarang <ExternalLink size={15} /></>}
        </button>
        <div className="pay-note">Anda akan diarahkan ke halaman pembayaran iPaymu yang aman, lalu kembali ke sini.</div>
      </div>
    </div>
  );
}
