import { createRoot } from 'react-dom/client'
import MarketingDashboard from '../../src/pages/dashboard/MarketingDashboard.jsx'
import '../../src/index.css'
// The design tokens reach a real screen through DashboardLayout.css. The
// preview renders the page on its own, so it loads the same layer and the same
// .dashboard-root scope, otherwise every token resolves to nothing and the
// screenshot shows a page nobody will ever see.
import '../../src/styles/ads/index.css'

createRoot(document.getElementById('root')).render(
  <div className="dashboard-root" style={{ display: 'block', height: 'auto', padding: 'var(--ds-space-300)' }}>
    <MarketingDashboard />
  </div>,
)
