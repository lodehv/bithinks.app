import { useEffect, useState } from "react";
import { ArrowLeft, Copy, UploadCloud, Clock, CheckCircle2, XCircle } from "lucide-react";
import { subscriptionApi } from "../../utils/omniApi";
import "./PaymentPage.css";

const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const MAX_PROOF_BYTES = 3 * 1024 * 1024; // 3 MB

export default function PaymentPage({ onBack }) {
  const [months, setMonths]   = useState(1);
  const [info, setInfo]       = useState(null);
  const [proof, setProof]     = useState(null);   // dataURL
  const [note, setNote]       = useState("");
  const [error, setError]     = useState("");
  const [busy, setBusy]       = useState(false);
  const [done, setDone]       = useState(null);    // payment hasil submit

  const fetchInfo = (m) => subscriptionApi.paymentInfo(m).then(setInfo).catch(() => setInfo(null));
  useEffect(() => { fetchInfo(months); }, [months]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PROOF_BYTES) { setError("Ukuran file maksimal 3 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setProof(reader.result); setError(""); };
    reader.readAsDataURL(file);
  };

  const copy = (text) => navigator.clipboard?.writeText(text);

  const submit = async () => {
    if (!proof) { setError("Unggah bukti transfer dulu ya."); return; }
    setBusy(true); setError("");
    try {
      const res = await subscriptionApi.submitPayment({ periodMonths: months, proofUrl: proof, senderNote: note || undefined });
      setDone(res);
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? "Gagal mengirim pembayaran. Coba lagi.");
    } finally { setBusy(false); }
  };

  const bank = info?.bank;
  const amount = info?.amount ?? 0;
  const latest = info?.latestPayment;
  const pendingReview = !done && latest && (latest.status === "submitted");

  return (
    <div className="pay">
      <button className="pay-back" onClick={onBack}><ArrowLeft size={15} /> Kembali</button>

      <div className="pay-head">
        <h1>Pembayaran Langganan</h1>
        <p>Aktifkan kembali fitur dengan transfer manual. Setelah bukti dikonfirmasi admin, akun langsung aktif.</p>
      </div>

      {done && (
        <div className="pay-status submitted">
          <Clock size={18} />
          <span><strong>Bukti diterima.</strong> Pembayaran <b>{done.reference}</b> sedang diverifikasi admin. Akun aktif otomatis setelah disetujui.</span>
        </div>
      )}
      {pendingReview && (
        <div className="pay-status submitted">
          <Clock size={18} />
          <span>Pembayaran <b>{latest.reference}</b> sudah dikirim dan menunggu konfirmasi admin.</span>
        </div>
      )}
      {!done && latest?.status === "approved" && (
        <div className="pay-status approved"><CheckCircle2 size={18} /><span>Pembayaran terakhir disetujui. Langganan aktif.</span></div>
      )}
      {!done && latest?.status === "rejected" && (
        <div className="pay-status rejected"><XCircle size={18} /><span>Pembayaran terakhir ditolak. Silakan kirim ulang bukti yang benar.</span></div>
      )}

      <div className="pay-grid">
        {/* Instruksi transfer */}
        <div className="pay-card">
          <h2>Instruksi Transfer</h2>
          <div className="pay-amount-label">Total yang harus ditransfer</div>
          <div className="pay-amount">{rupiah(amount)}</div>
          <div className="pay-amount-sub">untuk {months} bulan langganan</div>

          <div className="pay-months">
            {[1, 3, 6, 12].map((m) => (
              <button key={m} className={`pay-month-btn ${months === m ? "active" : ""}`} onClick={() => setMonths(m)}>{m} bln</button>
            ))}
          </div>

          {bank && (
            <div style={{ marginTop: 12 }}>
              <div className="pay-bank-row">
                <span className="pay-bank-label">Bank</span>
                <span className="pay-bank-value">{bank.bankName}</span>
              </div>
              <div className="pay-bank-row">
                <span className="pay-bank-label">No. Rekening</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="pay-bank-value">{bank.accountNumber}</span>
                  <button className="pay-copy" onClick={() => copy(bank.accountNumber)}><Copy size={11} /> Salin</button>
                </span>
              </div>
              <div className="pay-bank-row">
                <span className="pay-bank-label">Atas Nama</span>
                <span className="pay-bank-value" style={{ fontSize: 13 }}>{bank.accountName}</span>
              </div>
            </div>
          )}
          <div className="pay-note">Transfer tepat sampai digit terakhir agar verifikasi lebih cepat.</div>
        </div>

        {/* Upload bukti */}
        <div className="pay-card">
          <h2>Konfirmasi Pembayaran</h2>

          <div className="pay-field">
            <label>Bukti Transfer</label>
            <label className="pay-file-label">
              <UploadCloud size={18} />
              {proof ? "Ganti bukti transfer" : "Pilih gambar bukti transfer (maks 3 MB)"}
              <input type="file" accept="image/*" hidden onChange={onFile} />
            </label>
            {proof && <img src={proof} alt="bukti" className="pay-preview" />}
          </div>

          <div className="pay-field">
            <label>Catatan (opsional)</label>
            <textarea className="pay-textarea" placeholder="mis. nama pengirim / bank pengirim"
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {error && <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 10 }}>{error}</div>}

          <button className="pay-submit" onClick={submit} disabled={busy || !!done}>
            {busy ? "Mengirim…" : done ? "Terkirim" : "Kirim Bukti Pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
