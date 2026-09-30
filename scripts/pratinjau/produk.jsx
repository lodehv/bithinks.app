import { createRoot } from 'react-dom/client'
import ProductsTab from '../../src/pages/dashboard/omni/ProductsTab.jsx'
import '../../src/index.css'
import '../../src/styles/ads/index.css'

createRoot(document.getElementById('root')).render(
  <div className="dashboard-root" style={{ display: 'block', height: 'auto', padding: 'var(--ds-space-300)' }}>
    <div className="omni"><ProductsTab /></div>
  </div>,
)
