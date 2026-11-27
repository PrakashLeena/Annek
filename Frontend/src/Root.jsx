import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'

// The admin panel is split out so visitors never download it.
const Admin = lazy(() => import('./Admin.jsx'))
const NotFound = lazy(() => import('./NotFound.jsx'))

export default function Root() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
