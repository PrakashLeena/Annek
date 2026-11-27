import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// The admin panel is split out so visitors never download it.
const Admin = lazy(() => import('./Admin.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<App />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)

// Tell the inline preloader (index.html) that the app has painted.
requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event('annek:ready'))))
