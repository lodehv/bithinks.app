import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import NotificationProvider from './components/notifications/NotificationProvider.jsx'
import { installRequestNotifications } from './components/notifications/requestNotifications.js'

installRequestNotifications()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </StrictMode>,
)
