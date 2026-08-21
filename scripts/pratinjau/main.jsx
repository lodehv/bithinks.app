// Satu titik masuk untuk semua halaman yang dipotret. Halaman mana yang dirender
// ditentukan `?halaman=` di URL, supaya potret.mjs cukup membuka alamat berbeda
// alih-alih berkas ini ditulis ulang tiap kali ada layar baru yang perlu dilihat.
import { createRoot } from 'react-dom/client'
import MarketingDashboard from '../../src/pages/dashboard/MarketingDashboard.jsx'
import AdminPendaftaran from '../../src/pages/dashboard/AdminPendaftaran.jsx'
import Register from '../../src/pages/Register.jsx'
import { StepProfile, StepTerkirim } from '../../src/pages/register/RegisterSteps.jsx'
import { AppProvider } from '../../src/context/AppContext.jsx'
import '../../src/index.css'

const CONTOH_PROFIL = {
  nama: 'Sugeng Riyadi Tampubolon',
  namaUsaha: 'Bithinks Grosir Nusantara Sejahtera Abadi',
  bidang: 'Perdagangan Besar',
  jumlahKaryawan: '11-50',
}

const HALAMAN = {
  // Panel admin memakai kelasnya sendiri; dibungkus `.adm` supaya tampil sama
  // seperti di dalam dashboard, tanpa perlu menyeret seluruh Dashboard.jsx.
  pendaftaran: () => <div className="adm" style={{ padding: 24 }}><AdminPendaftaran /></div>,
  register: () => <AppProvider><Register /></AppProvider>,
  // Dua langkah terakhir tidak bisa dicapai tanpa OTP sungguhan, jadi keduanya
  // dirender langsung. Itu justru yang paling perlu dilihat: langkah 3 setelah
  // "Pilihan Solusi" dibuang, dan langkah 4 yang menggantikan "langsung masuk
  // dashboard".
  'register-profil': () => (
    <div className="register-page"><div className="auth-card"><div className="register-right">
      <div className="register-form-container">
        <StepProfile formData={CONTOH_PROFIL} onChange={() => {}} loading={false} error="" onSubmit={(e) => e.preventDefault()} />
      </div>
    </div></div></div>
  ),
  'register-terkirim': () => (
    <div className="register-page"><div className="auth-card"><div className="register-right">
      <div className="register-form-container">
        <StepTerkirim email="sugeng.riyadi.tampubolon@bithinksdigital.co.id" />
      </div>
    </div></div></div>
  ),
  laporan: () => <MarketingDashboard />,
}

const pilih = new URLSearchParams(location.search).get('halaman') ?? 'laporan'
const Halaman = HALAMAN[pilih]
if (!Halaman) throw new Error(`Halaman pratinjau tidak dikenal: ${pilih}`)

createRoot(document.getElementById('root')).render(<Halaman />)
