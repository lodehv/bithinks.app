import { createRoot } from 'react-dom/client'
import AntreanCetak from '../../src/pages/dashboard/omni/AntreanCetak.jsx'
import '../../src/index.css'

// Dibungkus meniru cangkang dasbor: halaman ini tidak pernah berdiri sendiri
// di aplikasi sungguhan, dan memotretnya tanpa jarak tepi membuat tata letaknya
// terlihat lebih mepet daripada yang dilihat pemilik toko.
createRoot(document.getElementById('root')).render(
  <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100vh' }}>
    <AntreanCetak />
  </div>,
)
