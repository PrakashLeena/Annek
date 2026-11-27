import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Admin and the AI builder are split out so visitors never download them.
const Admin = lazy(() => import('./Admin.jsx'))
const AIWebsiteBuilder = lazy(() => import('./pages/AIWebsiteBuilder.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/ai-builder" element={<AIWebsiteBuilder />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
