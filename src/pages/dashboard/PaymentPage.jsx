import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, CheckCircle2, Clipboard, CreditCard, Download,
  LoaderCircle, QrCode, ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { walletApi } from "../../utils/omniApi";
import { loadPaymentPageData } from "./loadPaymentPageData";
import "./PaymentPage.css";

const rupiah = (value) => "Rp" + Number(value || 0).toLocaleString("id-ID");
const PRESETS = [50000, 100000, 250000, 500000];

function paymentPayload(amount, method, bankCode) {
  return { amount: Number(amount), method, ...(method === "va" ? { bankCode } : {}) };
}

export default function PaymentPage({ onBack, onWalletChanged, onPaymentComplete }) {
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState("50000");
  const [method, setMethod] = useState("qris");
  const [bankCode, setBankCode] = useState("");
  const [banks, setBanks] = useState([]);
  const [minimumAmount, setMinimumAmount] = useState(10000);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const qrRef = useRef(null);

  const refreshWallet = useCallback(async () => {
    const next = await walletApi.get();
    setWallet(next);
    return next;
  }, []);

  useEffect(() => {
    let ignore = false;
    loadPaymentPageData(walletApi)
      .then(({ wallet: nextWallet, state, walletError, stateError }) => {
        if (ignore) return;
        if (nextWallet) setWallet(nextWallet);
        if (state) {
          setBanks(state.banks ?? []);
          setMinimumAmount(state.minimumAmount ?? 10000);
          setBankCode((current) => current || state.banks?.[0]?.code || "");
        }
        if (state?.payment) {
          setPayment(state.payment);
          setAmount(String(state.payment.amount));
          if (state.payment.method !== "mock") setMethod(state.payment.method);
          if (state.payment.selectedBankCode) setBankCode(state.payment.selectedBankCode);
        }
        if (walletError) setError("Saldo belum dapat dimuat. Coba muat ulang halaman.");
        else if (stateError) setError("Status pembayaran lama belum dapat dipulihkan. Anda tetap dapat membuat pembayaran QRIS baru.");
      })
      .catch((err) => {
        if (!ignore) setError(err?.response?.data?.error?.message ?? "Pembayaran belum dapat dimuat.");
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!payment?.paymentId || payment.status !== "pending") return undefined;
    let ignore = false;
    const check = async () => {
      try {
        const state = await walletApi.topupState(payment.paymentId);
        if (!ignore && state.payment) setPayment(state.payment);
      } catch {
        // A temporary status-check failure is retried; the webhook stays authoritative.
      }
    };
    const timer = window.setInterval(check, 4000);
    return () => { ignore = true; window.clearInterval(timer); };
  }, [payment?.paymentId, payment?.status]);

  useEffect(() => {
    if (payment?.status !== "credited") return undefined;
    refreshWallet().then(() => onWalletChanged?.()).catch(() => {});
    const timer = window.setTimeout(() => onPaymentComplete?.(), 2000);
    return () => window.clearTimeout(timer);
  }, [onPaymentComplete, onWalletChanged, payment?.status, refreshWallet]);

  const createPayment = async (event, retry = false) => {
    event?.preventDefault();
    const nominal = Number(retry ? payment?.amount : amount);
    const selectedMethod = retry && payment?.method !== "mock" ? payment.method : method;
    const selectedBank = retry ? payment?.selectedBankCode : bankCode;
    if (!Number.isSafeInteger(nominal) || nominal < minimumAmount) {
      setError(`Nominal minimum isi saldo adalah ${rupiah(minimumAmount)}.`);
      return;
    }
    if (selectedMethod === "va" && !selectedBank) {
      setError("Pilih bank untuk Virtual Account.");
      return;
    }
    setBusy(true); setError("");
    try {
      const result = await walletApi.topup(paymentPayload(nominal, selectedMethod, selectedBank));
      setPayment(result);
      setAmount(String(result.amount));
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? "Pembayaran tidak dapat dibuat. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const simulatePayment = async () => {
    setBusy(true); setError("");
    try {
      await walletApi.completeMockTopup(payment.paymentId);
      setPayment((current) => ({ ...current, status: "credited" }));
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? "Simulasi pembayaran gagal.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value, name) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("CLIPBOARD_UNAVAILABLE");
      await navigator.clipboard.writeText(value);
      setCopied(name);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Tidak dapat menyalin otomatis. Tekan dan salin nomor secara manual.");
    }
  };

  const downloadQr = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qris-${payment.reference}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const expiry = payment?.expiresAt
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(payment.expiresAt))
    : null;

  return (
    <div className="pay">
      <button className="pay-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Kembali</button>
      <div className="pay-head">
        <h1>Isi saldo prabayar</h1>
        <p>Saldo dipakai otomatis sebesar Rp250 untuk setiap pesanan yang selesai dan terkonfirmasi.</p>
      </div>
      <div className="pay-grid">
        <section className="pay-card pay-balance" aria-live="polite">
          <span className="pay-kicker">Saldo tersedia</span>
          <strong>{wallet ? rupiah(wallet.balance) : loading ? "Memuat…" : "Tidak tersedia"}</strong>
          <span>Setara {wallet ? Math.floor(Number(wallet.balance) / 250).toLocaleString("id-ID") : "–"} pesanan berikutnya</span>
        </section>

        {loading ? <section className="pay-card pay-loading" aria-live="polite"><LoaderCircle size={22} /> Menyiapkan pembayaran…</section>
          : !payment ? <form className="pay-card pay-form" onSubmit={createPayment}>
            <h2>Pilih nominal</h2>
            <div className="pay-presets" aria-label="Pilih nominal isi saldo">
              {PRESETS.map((value) => <button type="button" key={value} className={Number(amount) === value ? "active" : ""} aria-pressed={Number(amount) === value} onClick={() => setAmount(String(value))}>{rupiah(value)}</button>)}
            </div>
            <label className="pay-field" htmlFor="topup-amount">Nominal lain</label>
            <div className="pay-input-wrap"><span>Rp</span><input id="topup-amount" name="topupAmount" inputMode="numeric" autoComplete="off" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} /></div>
            <fieldset className="pay-methods"><legend>Pilih cara bayar</legend>
              <button type="button" className={`pay-method ${method === "qris" ? "selected" : ""}`} onClick={() => setMethod("qris")} aria-pressed={method === "qris"}><QrCode size={22} /><span><strong>QRIS</strong><small>Pindai dengan aplikasi bank atau dompet digital</small></span></button>
              <button type="button" className={`pay-method ${method === "va" ? "selected" : ""}`} onClick={() => setMethod("va")} aria-pressed={method === "va"}><CreditCard size={22} /><span><strong>Transfer bank</strong><small>Dapatkan nomor Virtual Account</small></span></button>
            </fieldset>
            {method === "va" && <label className="pay-field" htmlFor="bank-code">Pilih bank<select id="bank-code" name="bankCode" value={bankCode} onChange={(event) => setBankCode(event.target.value)}>{banks.map((bank) => <option value={bank.code} key={bank.code}>{bank.name}</option>)}</select></label>}
            {error && <p className="pay-error" role="alert">{error}</p>}
            <button className="pay-submit" disabled={busy}>{busy ? "Menyiapkan…" : method === "qris" ? "Tampilkan QRIS" : "Buat Virtual Account"}</button>
            <div className="pay-trust"><ShieldCheck size={17} /><span>Nominal dan status pembayaran selalu diverifikasi otomatis.</span></div>
          </form>
            : payment.status === "credited" ? <section className="pay-card pay-result pay-success" aria-live="assertive"><CheckCircle2 size={42} /><h2>Saldo berhasil ditambahkan</h2><p>Anda akan kembali ke halaman sebelumnya.</p></section>
              : payment.status === "expired" ? <section className="pay-card pay-result" aria-live="polite"><h2>Waktu pembayaran habis</h2><p>Buat ulang dengan nominal dan cara bayar yang sama.</p>{error && <p className="pay-error" role="alert">{error}</p>}<button type="button" className="pay-submit" disabled={busy} onClick={(event) => createPayment(event, true)}>{busy ? "Menyiapkan…" : "Buat ulang pembayaran"}</button></section>
                : <section className="pay-card pay-instructions" aria-live="polite">
                  <div className="pay-pending"><span className="pay-pulse" /> Menunggu pembayaran</div>
                  {payment.method === "mock" ? <div className="pay-test"><span>Mode pengujian</span><h2>Simulasikan pembayaran</h2><p>Tidak ada uang sungguhan yang diproses.</p><button type="button" className="pay-submit" disabled={busy} onClick={simulatePayment}>{busy ? "Memproses…" : "Simulasikan pembayaran berhasil"}</button></div>
                    : <><h2>{payment.method === "qris" ? "Pindai kode QRIS" : `Transfer melalui ${payment.virtualAccount?.bankCode ?? "bank pilihan"}`}</h2><strong className="pay-instruction-amount">{rupiah(payment.amount)}</strong>
                      {payment.qrisPayload && <div className="pay-qr"><QRCodeSVG ref={qrRef} value={payment.qrisPayload} size={220} level="M" includeMargin aria-label={`QRIS untuk pembayaran ${rupiah(payment.amount)}`} /><div className="pay-actions"><button type="button" className="pay-copy" onClick={() => copy(payment.qrisPayload, "qris")}><Clipboard size={16} />{copied === "qris" ? "Tersalin" : "Salin kode"}</button><button type="button" className="pay-copy" onClick={downloadQr}><Download size={16} /> Simpan QR</button></div></div>}
                      {payment.virtualAccount && <div className="pay-va"><span>Nomor Virtual Account</span><strong>{payment.virtualAccount.number}</strong><button type="button" className="pay-copy" onClick={() => copy(payment.virtualAccount.number, "va")}><Clipboard size={16} />{copied === "va" ? "Tersalin" : "Salin nomor"}</button></div>}
                      {!payment.qrisPayload && !payment.virtualAccount && <p className="pay-error" role="alert">Instruksi pembayaran belum tersedia. Muat ulang halaman untuk mencoba kembali.</p>}</>}
                  {error && <p className="pay-error" role="alert">{error}</p>}
                  <p className="pay-expiry">Selesaikan sebelum {expiry}. Saldo diperbarui otomatis setelah pembayaran terkonfirmasi.</p>
                </section>}
      </div>
    </div>
  );
}
