import { ArrowRight, MailCheck } from "lucide-react";
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
//
// Kolom "Pilihan Solusi" DIHAPUS 21 Agustus 2026 atas keputusan pemilik. Ia
// menanyakan sesuatu kepada calon pelanggan lalu membuang jawabannya: nilainya
// dikirim sebagai `preferredModule` dan tidak ada satu pun tempat di backend
// yang pernah membacanya. Jangan dikembalikan tanpa ada yang memakainya.
//
// Empat kolom yang tersisa justru sebaliknya — merekalah yang dibaca pemilik
// saat memutuskan menyetujui permintaan atau tidak.
export function StepProfile({ formData, onChange, loading, error, onSubmit }) {
  return (
    <div className="step-container">
      <h2>Lengkapi Profil Usaha</h2>
      <p className="subtitle">
        Beritahu kami sedikit tentang bisnis Anda. Inilah yang dibaca tim kami saat
        meninjau permintaan Anda.
      </p>
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
          <SubmitButton loading={loading} label="Ajukan Akses" loadingLabel="Mengirim permintaan..." />
        </div>
      </form>
    </div>
  );
}

// ─── Step 4: Permintaan terkirim ──────────────────────────────────────────────
//
// Layar ini yang menggantikan "langsung masuk dashboard". Sengaja TIDAK ada
// tombol menuju dashboard: dashboardnya belum ada, dan mengarahkan orang ke
// sana cuma memindahkan kekecewaannya satu klik lebih jauh.
//
// Yang ditulis di sini apa adanya: permintaannya diterima, keputusannya di
// tangan orang, dan kabarnya lewat email yang barusan ia buktikan miliknya.
export function StepTerkirim({ email }) {
  return (
    <div className="step-container">
      <div style={{
        width: 56, height: 56, borderRadius: "50%", background: "#EEF2FF",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#4F46E5", marginBottom: 20,
      }}>
        <MailCheck size={28} />
      </div>

      <h2>Permintaan Anda sudah masuk</h2>
      <p className="subtitle">
        Kami menerima pengajuan untuk <strong>{email}</strong> dan sedang meninjaunya.
      </p>

      <div style={{
        background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10,
        padding: "16px 18px", fontSize: "0.875rem", color: "#475569", lineHeight: 1.6,
      }}>
        Akun Anda dibuat setelah permintaan ini disetujui — belum sekarang. Begitu ada
        keputusan, kabarnya kami kirim ke alamat email di atas.
      </div>

      <div className="form-actions" style={{ marginTop: 24 }}>
        <a href="/" className="back-home" style={{ marginTop: 0 }}>
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}
