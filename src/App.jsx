import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductDetail from './pages/ProductDetail';
import { AppProvider } from './context/AppContext';

function InnerApp() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (route === '/register')            return <Register />;
  if (route === '/login')               return <Login />;
  if (route.startsWith('/dashboard'))   return <Dashboard />;
  if (route === '/bitone')              return <ProductDetail appId="bitone" />;
  if (route === '/bitomni')             return <ProductDetail appId="bitomni" />;
  if (route === '/bitfine')             return <ProductDetail appId="bitfine" />;
  if (route === '/bitpos')              return <ProductDetail appId="bitpos" />;
  if (route === '/bitteam')             return <ProductDetail appId="bitteam" />;
  if (route === '/bitdev')              return <ProductDetail appId="bitdev" />;
  return <Home />;
}

export default function App() {
  return (
    <AppProvider>
      <InnerApp />
      <Analytics />
    </AppProvider>
  );
}
