import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'

// The admin panel is split out so visitors never download it.
const Admin = lazy(() => import('./Admin.jsx'))
const NotFound = lazy(() => import('./NotFound.jsx'))
const SolutionsPage = lazy(() => import('./site/SolutionsPage.jsx'))

export default function Root() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/solutions" element={<Navigate to="/#solutions" replace />} />
          <Route path="/solutions/:category" element={<SolutionsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
