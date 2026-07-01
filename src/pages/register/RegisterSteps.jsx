import { ArrowRight } from "lucide-react";
import { ErrorAlert, SubmitButton } from "./RegisterShared";

// ─── Step 1: Kredensial + kirim OTP ke email ─────────────────────────────────
export function StepCredentials({ email, setEmail, phone, setPhone, password, setPassword, loading, error, onSubmit, t }) {
  return (
    <div className="step-container">
      <h2>{t.register.title}</h2>
      <p className="subtitle">{t.register.subtitle}</p>
      <ErrorAlert message={error} />
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Alamat Email *</label>
          <input
            type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email aktif Anda"
            required autoFocus disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>
            Nomor WhatsApp / HP{" "}
            <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(opsional)</span>
          </label>
          <input
            type="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Misal: 08123456789"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Password *</label>
          <input
            type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Buat password yang kuat"
            required minLength={8} disabled={loading}
          />
          <p style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "6px", lineHeight: 1.45 }}>
            Minimal 8 karakter, mengandung huruf, angka, dan 1 karakter spesial (mis. <strong>! @ # $ %</strong>).
          </p>
        </div>
        <div className="form-actions" style={{ marginTop: "24px" }}>
          <SubmitButton loading={loading} label="Kirim Kode OTP" loadingLabel="Mengirim OTP..." icon={<ArrowRight size={18} />} />
        </div>
      </form>
    </div>
  );
}

// ─── Step 2: Verifikasi OTP ───────────────────────────────────────────────────
export function StepOtp({ email, otp, onOtpChange, loading, error, onSubmit }) {
  return (
    <div className="step-container">
      <h2>Verifikasi Email</h2>
      <p className="subtitle">
        Masukkan 6 digit kode OTP yang kami kirim ke <strong>{email}</strong>.{" "}
        Cek folder Spam jika tidak masuk.
      </p>
      <ErrorAlert message={error} />
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <input
            type="text" inputMode="numeric" value={otp}
            onChange={onOtpChange}
            placeholder="• • • • • •" maxLength={6}
            className="otp-input" required autoFocus disabled={loading}
          />
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#9CA3AF", marginTop: "8px" }}>
            Masukkan 6 digit kode OTP
          </p>
        </div>
        <div className="form-actions">
          <SubmitButton loading={loading} label="Verifikasi & Lanjut" loadingLabel="Memverifikasi..." icon={<ArrowRight size={18} />} />
        </div>
      </form>
    </div>
  );
}

// ─── Step 3: Profil Bisnis ────────────────────────────────────────────────────
export function StepProfile({ formData, onChange, loading, error, onSubmit }) {
  return (
    <div className="step-container">
      <h2>Lengkapi Profil Usaha</h2>
      <p className="subtitle">Beritahu kami sedikit tentang bisnis Anda.</p>
      <ErrorAlert message={error} />
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Nama Anda *</label>
          <input type="text" name="nama" value={formData.nama} onChange={onChange}
            placeholder="Masukkan nama lengkap" required autoFocus disabled={loading} />
        </div>
        <div className="form-group">
          <label>Nama Usaha *</label>
          <input type="text" name="namaUsaha" value={formData.namaUsaha} onChange={onChange}
            placeholder="Nama bisnis / perusahaan Anda" required disabled={loading} />
        </div>
        <div className="form-group">
          <label>Bergerak di bidang apa?</label>
          <input type="text" name="bidang" value={formData.bidang} onChange={onChange}
            placeholder="Contoh: F&B, Jasa, Manufaktur" disabled={loading} />
        </div>
        <div className="form-group">
          <label>Pilihan Solusi</label>
          <select name="solusi" value={formData.solusi} onChange={onChange} disabled={loading}>
            <option value="">Pilih modul yang diminati</option>
            <option value="ERP">Full ERP (All-in-One)</option>
            <option value="Finance">Finance (Keuangan)</option>
            <option value="POS">POS (Sistem Kasir)</option>
            <option value="WMS">WMS (Warehouse Management)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Jumlah Karyawan</label>
          <select name="jumlahKaryawan" value={formData.jumlahKaryawan} onChange={onChange} disabled={loading}>
            <option value="">Estimasi jumlah karyawan</option>
            <option value="1-10">1 – 10 Karyawan</option>
            <option value="11-50">11 – 50 Karyawan</option>
            <option value="51-200">51 – 200 Karyawan</option>
            <option value=">200">Lebih dari 200 Karyawan</option>
          </select>
        </div>
        <div className="form-actions">
          <SubmitButton loading={loading} label="Selesaikan Pendaftaran" loadingLabel="Membuat akun..." />
        </div>
      </form>
    </div>
  );
}
