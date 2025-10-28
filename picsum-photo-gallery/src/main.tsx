import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import PhotoDetail from './components/PhotoDetail.tsx'
import NotFound from './components/NotFound.tsx'
import ScrollToTop from './components/ScrollToTop.tsx'

// Mount the app and set up client-side routing
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* basename uses Vite's BASE_URL for subpath deployments */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* Smoothly reset scroll position on route change */}
      <ScrollToTop />
      {/* App routes */}
      <Routes>
        {/* Redirect root to gallery */}
        <Route path="/" element={<Navigate to="/photos" replace />} />
        {/* Gallery */}
        <Route path="/photos" element={<App />} />
        {/* Photo detail by id */}
        <Route path="/photos/:id" element={<PhotoDetail />} />
        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
