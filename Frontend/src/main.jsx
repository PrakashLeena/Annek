import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

// Tell the inline preloader (index.html) that the app has painted.
requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event('annek:ready'))))
