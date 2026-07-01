import { useState } from "react";
import "./Register.css";
import bitomniLogo from "../assets/logo_pilihan_fitur/bithinks_omnichannel_logo-removebg-preview.png";
import { ArrowLeft } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import api, { getApiErrorMessage } from "../utils/api";
import { WaHelperButton } from "./register/RegisterShared";
import { StepCredentials, StepOtp, StepProfile } from "./register/RegisterSteps";

// Validasi password sesuai aturan backend — dicek di langkah 1 agar error muncul
// tepat di kolom password, bukan baru ketahuan di langkah profil terakhir.
const validatePassword = (pw) => {
  if (!pw || pw.length < 8)     return "Password minimal 8 karakter.";
  if (!/[a-zA-Z]/.test(pw))     return "Password harus mengandung minimal satu huruf.";
  if (!/[0-9]/.test(pw))        return "Password harus mengandung minimal satu angka.";
  if (!/[^a-zA-Z0-9]/.test(pw)) return "Password harus mengandung minimal satu karakter spesial (mis. ! @ # $ %).";
  return null;
};

const Register = () => {
  const { t, login } = useAppContext();

  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Step 1
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");

  // Step 2
  const [otp, setOtp]                 = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  // Step 3
  const [formData, setFormData] = useState({
    nama: "", namaUsaha: "", bidang: "", solusi: "", jumlahKaryawan: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 6) setOtp(val);
  };

  const goBack = () => { setError(""); setStep((s) => s - 1); };

  // ─── Step 1: Kirim OTP ke email ────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    // Cek password dulu — supaya tidak terlanjur ke OTP/profil dengan password
    // yang akan ditolak backend di langkah akhir.
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", { email, channel: "email", purpose: "register" });
      setOtp("");
      setStep(2);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mengirim OTP. Coba lagi."));
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verifikasi OTP ─────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Kode OTP harus tepat 6 digit"); return; }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify-otp", { email, code: otp, purpose: "register" });
      setVerifyToken(res.data.data.verifyToken);
      setStep(3);
    } catch (err) {
      setError(getApiErrorMessage(err, "Kode OTP tidak valid."));
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Submit Registrasi ──────────────────────────────────────────────
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.nama || !formData.namaUsaha) {
      setError("Nama dan nama usaha wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", {
        phone,
        email,
        password,
        verifyToken,
        name:            formData.nama,
        companyName:     formData.namaUsaha,
        industry:        formData.bidang       || undefined,
        employeeCount:   formData.jumlahKaryawan || undefined,
        preferredModule: formData.solusi        || undefined,
      });
      const { accessToken, refreshToken, user, tenant } = res.data.data;
      login({ accessToken, refreshToken, user, tenant });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(getApiErrorMessage(err, "Pendaftaran gagal. Coba lagi."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
     <div className="auth-card">
      {/* Panel Kiri */}
      <div className="register-left">
        <a href="/" className="register-brand">
          <img src="/bithinks.jpeg" alt="Logo Bithinks" />
        </a>
        <div className="register-left-content">
          <h1>
            {t.hero.title1} <span>{t.hero.titleHighlight}</span>
          </h1>
          <p>{t.hero.desc}</p>
        </div>
        <img className="auth-hero-logo" src={bitomniLogo} alt="Bithinks Omnichannel" />
        <div className="auth-deco"><span /><span /></div>
      </div>

      {/* Panel Kanan */}
      <div className="register-right">
        <div className="register-form-container">
          {step === 1 ? (
            <a href="/" className="back-home">
              <ArrowLeft size={16} /> Kembali ke Beranda
            </a>
          ) : (
            <button
              className="back-home"
              onClick={goBack}
              disabled={loading}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <ArrowLeft size={16} /> Kembali
            </button>
          )}

          {step === 1 && (
            <StepCredentials
              email={email} setEmail={setEmail}
              phone={phone} setPhone={setPhone}
              password={password} setPassword={setPassword}
              loading={loading} error={error}
              onSubmit={handleSendOtp} t={t}
            />
          )}

          {step === 2 && (
            <StepOtp
              email={email} otp={otp}
              onOtpChange={handleOtpChange}
              loading={loading} error={error}
              onSubmit={handleVerifyOtp}
            />
          )}

          {step === 3 && (
            <StepProfile
              formData={formData} onChange={handleChange}
              loading={loading} error={error}
              onSubmit={handleFinalSubmit}
            />
          )}

          {step !== 3 && (
            <WaHelperButton helpText={t.register.helpText} waHelp={t.register.waHelp} />
          )}
        </div>
      </div>
     </div>
    </div>
  );
};

export default Register;
