import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.jsx'

const el = document.getElementById('root')
const norm = (p) => p.replace(/\/+$/, '') || '/'

// Pre-rendered page for this URL (scripts/prerender.mjs): hydrate it with the data it was built from.
// Anything else (admin, 404, the dev server) is rendered fresh in the browser.
if (el.dataset.path && norm(el.dataset.path) === norm(window.location.pathname) && el.firstElementChild) {
  hydrateRoot(el, <StrictMode><Root initialData={window.__ANNEK_DATA__} /></StrictMode>)
} else {
  el.textContent = ''
  createRoot(el).render(<StrictMode><Root /></StrictMode>)
}

// Tell the inline preloader (index.html) that the app has painted.
requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event('annek:ready'))))
