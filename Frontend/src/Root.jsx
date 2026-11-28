import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SiteDataProvider } from './site/SiteData.jsx'
import Layout from './site/Layout.jsx'
import NotFound from './NotFound.jsx'
import SolutionsPage from './site/SolutionsPage.jsx'
import {
  Home, ServicesPage, ProductsPage, PortfolioPage, ReviewsPage, PricingPage, AboutPage, FaqPage, ContactPage,
} from './pages/SitePages.jsx'

// The admin panel is split out so visitors never download it.
const Admin = lazy(() => import('./Admin.jsx'))

/* Route table shared by the browser (BrowserRouter) and the build-time pre-render (StaticRouter). */
export function AppRoutes({ initialData }) {
  return (
    <SiteDataProvider initial={initialData}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
        <Route path="/admin" element={<Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Loading…</div>}><Admin /></Suspense>} />
        <Route path="/solutions" element={<Navigate to="/services" replace />} />
        <Route path="/solutions/:category" element={<SolutionsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SiteDataProvider>
  )
}

export default function Root({ initialData }) {
  return (
    <BrowserRouter>
      <AppRoutes initialData={initialData} />
    </BrowserRouter>
  )
}
