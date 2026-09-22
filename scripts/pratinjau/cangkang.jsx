import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import DashboardLayout from '../../src/pages/dashboard/DashboardLayout.jsx'
import DashboardHome from '../../src/pages/dashboard/DashboardHome.jsx'
import { AppProvider } from '../../src/context/AppContext.jsx'
import '../../src/index.css'
import '../../src/styles/ads/index.css'

// The shell carries the side navigation and the top bar, which no other
// preview page renders. Menu weight and spacing are judged here.
localStorage.setItem('padu-auth', JSON.stringify({
  token: 'pratinjau',
  user: { name: 'Sari Handayani', email: 'sari@contoh.id', role: 'owner' },
  tenant: { id: 'tenant-contoh', name: 'Bithinks Tani Makmur' },
}))

export default function Cangkang() {
  const [menu, setMenu] = useState('dashboard')
  return (
    <DashboardLayout activeMenu={menu} onMenuClick={setMenu} pageTitle="Dashboard">
      <DashboardHome onMenuClick={setMenu} />
    </DashboardLayout>
  )
}

createRoot(document.getElementById('root')).render(
  <AppProvider><Cangkang /></AppProvider>,
)
