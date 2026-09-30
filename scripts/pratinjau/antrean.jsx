import { createRoot } from 'react-dom/client'
import AntreanCetak from '../../src/pages/dashboard/omni/AntreanCetak.jsx'
import '../../src/index.css'
// Same reason as main.jsx: without this layer the tokens resolve to nothing.
import '../../src/styles/ads/index.css'

// Dibungkus meniru cangkang dasbor: halaman ini tidak pernah berdiri sendiri
// di aplikasi sungguhan, dan memotretnya tanpa jarak tepi membuat tata letaknya
// terlihat lebih mepet daripada yang dilihat pemilik toko.
createRoot(document.getElementById('root')).render(
  <div
    className="dashboard-root"
    style={{ display: 'block', height: 'auto', padding: 'var(--ds-space-300)', minHeight: '100vh' }}
  >
    <AntreanCetak />
  </div>,
)
