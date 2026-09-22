import { createRoot } from 'react-dom/client'
import DashboardHome from '../../src/pages/dashboard/DashboardHome.jsx'
import { AppProvider } from '../../src/context/AppContext.jsx'
import '../../src/index.css'
import '../../src/styles/ads/index.css'

// The home screen greets the person by name, so the preview signs in a fake
// one. Nothing here touches the network: the provider reads localStorage.
localStorage.setItem('padu-auth', JSON.stringify({
  token: 'pratinjau',
  user: { name: 'Sari Handayani', email: 'sari@contoh.id', role: 'owner' },
  tenant: { id: 'tenant-contoh', name: 'Bithinks Tani Makmur' },
}))

createRoot(document.getElementById('root')).render(
  <AppProvider>
    <div className="dashboard-root" style={{ display: 'block', height: 'auto', padding: 'var(--ds-space-300)' }}>
      <DashboardHome />
    </div>
  </AppProvider>,
)
