import { createRoot } from 'react-dom/client'
import OrdersTab from '../../src/pages/dashboard/omni/OrdersTab.jsx'
import '../../src/index.css'
import '../../src/styles/ads/index.css'

// Wrapped the way the shell wraps it. Rendering the page bare makes its
// margins look tighter than what the shop owner sees.
createRoot(document.getElementById('root')).render(
  <div className="dashboard-root" style={{ display: 'block', height: 'auto', padding: 'var(--ds-space-300)' }}>
    <div className="omni"><OrdersTab /></div>
  </div>,
)
