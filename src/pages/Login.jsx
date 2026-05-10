import { useState } from "react";
import "./Login.css";
import { ArrowLeft, Mail, KeyRound, Loader2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import api, { getApiErrorMessage } from "../utils/api";

const STEP = { PASSWORD: "password", EMAIL: "email", OTP: "otp" };

function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        color: "#DC2626",
        borderRadius: "10px",
        padding: "12px 16px",
        fontSize: "0.875rem",
        marginBottom: "20px",
        lineHeight: "1.5",
      }}
    >
      {message}
    </div>
  );
}

function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      className="btn-submit"
      disabled={loading}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
    >
      {loading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
      {loading ? loadingLabel : label}
    </button>
  );
}

const Login = () => {
  const { t, login } = useAppContext();

  const [step, setStep]           = useState(STEP.PASSWORD);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Password login
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");

  // OTP login via email
  const [emailOtp, setEmailOtp] = useState("");
  const [otp, setOtp]           = useState("");

  const goToStep = (newStep) => { setError(""); setStep(newStep); };

  // ─── Login dengan Password ──────────────────────────────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { identifier, password });
      const { accessToken, refreshToken, user, tenant } = res.data.data;
      login({ accessToken, refreshToken, user, tenant });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(getApiErrorMessage(err, "Login gagal. Periksa kembali kredensial Anda."));
    } finally {
      setLoading(false);
    }
  };

  // ─── Kirim OTP ke email ─────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", {
        email:   emailOtp,
        channel: "email",
        purpose: "login",
      });
      setOtp("");
      setStep(STEP.OTP);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mengirim OTP. Coba lagi."));
    } finally {
      setLoading(false);
    }
  };

  // ─── Verifikasi OTP ─────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Kode OTP harus 6 digit"); return; }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify-otp", {
        email:   emailOtp,
        code:    otp,
        purpose: "login",
      });
      const { accessToken, refreshToken, user, tenant } = res.data.data;
      login({ accessToken, refreshToken, user, tenant });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(getApiErrorMessage(err, "Kode OTP tidak valid. Coba lagi."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 6) setOtp(val);
  };

  return (
    <div className="login-page">
      {/* Panel Kiri */}
      <div className="login-left" style={{ backgroundColor: "#FFF9DB" }}>
        <a href="/" className="login-brand">
          <img src="/bithinks.jpeg" alt="Logo Bithinks" style={{ height: "40px", borderRadius: "4px" }} />
        </a>
        <div className="login-left-content">
          <h1>{t.login.title}</h1>
          <p>{t.login.subtitle}</p>
        </div>
        <div />
      </div>

      {/* Panel Kanan */}
      <div className="login-right">

        {/* ─── Step: Login Password ──────────────────────────────────────────── */}
        {step === STEP.PASSWORD && (
          <div className="login-form-container">
            <a href="/" className="back-home">
              <ArrowLeft size={16} /> {t.register.backHome}
            </a>
            <h2>{t.login.formTitle}</h2>
            <p className="subtitle">{t.login.formSubtitle}</p>

            <ErrorAlert message={error} />

            <form onSubmit={handlePasswordLogin}>
              <div className="form-group">
                <label>{t.login.emailPhoneLabel}</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email atau nomor HP"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>{t.login.passLabel}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <SubmitButton loading={loading} label={t.login.loginBtn} loadingLabel="Memverifikasi..." />
                <div style={{ textAlign: "center", color: "#6B7280", fontSize: "0.875rem" }}>
                  {t.login.or}
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => goToStep(STEP.EMAIL)}
                  disabled={loading}
                >
                  <Mail size={20} /> Login dengan Kode OTP Email
                </button>
              </div>
            </form>

            <p style={{ textAlign: "center", marginTop: "32px", fontSize: "0.875rem", color: "#6B7280" }}>
              Belum punya akun?{" "}
              <a href="/register" style={{ color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>
                Daftar Sekarang
              </a>
            </p>
          </div>
        )}

        {/* ─── Step: Masukkan Email untuk OTP ───────────────────────────────── */}
        {step === STEP.EMAIL && (
          <div className="login-form-container">
            <button
              className="back-home"
              onClick={() => goToStep(STEP.PASSWORD)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <ArrowLeft size={16} /> {t.login.backPass}
            </button>
            <h2>Login via OTP Email</h2>
            <p className="subtitle">
              Masukkan email terdaftar Anda. Kami akan kirim kode OTP ke inbox Anda.
            </p>

            <ErrorAlert message={error} />

            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label>Alamat Email</label>
                <input
                  type="email"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  placeholder="Email terdaftar Anda"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              <div className="form-actions">
                <SubmitButton loading={loading} label="Kirim Kode OTP" loadingLabel="Mengirim..." />
              </div>
            </form>
          </div>
        )}

        {/* ─── Step: Verifikasi OTP ──────────────────────────────────────────── */}
        {step === STEP.OTP && (
          <div className="login-form-container">
            <button
              className="back-home"
              onClick={() => goToStep(STEP.EMAIL)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <ArrowLeft size={16} /> Ganti Email
            </button>
            <h2>Masukkan Kode OTP</h2>
            <p className="subtitle">
              Kode OTP telah dikirim ke <strong>{emailOtp}</strong>.{" "}
              Cek folder Spam jika tidak masuk.
            </p>

            <ErrorAlert message={error} />

            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="otp-input"
                  required
                  autoFocus
                  disabled={loading}
                />
                <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#9CA3AF", marginTop: "8px" }}>
                  Masukkan 6 digit kode OTP
                </p>
              </div>

              <div className="form-actions">
                <SubmitButton loading={loading} label={t.login.verifyBtn} loadingLabel="Memverifikasi..." />
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => goToStep(STEP.PASSWORD)}
                  disabled={loading}
                >
                  <KeyRound size={20} /> Login dengan Password
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
