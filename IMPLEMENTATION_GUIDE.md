---
published: false
---

# Annek Premium Redesign — Complete Implementation Guide

## Files Delivered

| File | Purpose |
|------|---------|
| `AnnekPremium.jsx` | Full redesigned frontend — drop-in React component |
| `index_head_seo.html` | Optimized `<head>` block — replace in `index.html` |
| `vercel.json` | Security & caching headers for Vercel deployment |
| `robots.txt` | Crawler rules incl. AI bots (GPTBot, ClaudeBot, etc.) |
| `sitemap.xml` | XML sitemap with image extensions |
| `site.webmanifest` | PWA manifest for installability |
| `securityMiddleware.js` | Backend rate limiting + sanitization |
| `vite.config.js` | Optimized Vite build config with code splitting |

---

## 1. Quick Integration

### Replace App.jsx

```jsx
// Frontend/src/App.jsx
export { default } from "./AnnekPremium";
```

Or integrate the component tree into your existing routing:

```jsx
// Frontend/src/main.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AnnekPremium from "./AnnekPremium";
import Admin from "./Admin";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<AnnekPremium />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
```

### Replace index.html head

Open `Frontend/index.html` and replace everything between `<head>` and `</head>`
with the contents of `index_head_seo.html`.

### Update vercel.json (Frontend)

Replace `Frontend/vercel.json` with the provided `vercel.json`.

### Add backend security

```js
// Backend/server.js — add near the top, BEFORE routes
const { applySecurityMiddleware } = require("./middleware/security");

// Copy securityMiddleware.js to Backend/middleware/security.js first
// Install: npm install express-rate-limit

applySecurityMiddleware(app);
```

---

## 2. Required npm Packages

### Frontend — optional but recommended

```bash
# Animations (already gracefully degraded without it)
npm install framer-motion

# Bundle analyzer — run once to check sizes
npm install --save-dev rollup-plugin-visualizer
```

### Backend

```bash
npm install express-rate-limit
# Already in your package.json but verify version ≥6:
npm install express-rate-limit@^7
```

---

## 3. Required Assets to Create

Create these files in `Frontend/public/`:

| Asset | Size | Tool |
|-------|------|------|
| `og-image.png` | 1200×630px | Figma, Canva, or Photoshop |
| `apple-touch-icon.png` | 180×180px | Same as logo, square |
| `favicon.ico` | 32×32px | favicon.io or realfavicongenerator.net |
| `favicon.svg` | Vector | Your logo as SVG |
| `logo.png` | 200×60px | For schema markup |
| `icon-192.png` | 192×192px | PWA icon |
| `icon-512.png` | 512×512px | PWA icon |
| `screenshot-wide.png` | 1280×800px | Screenshot of live site |
| `screenshot-mobile.png` | 390×844px | Mobile screenshot |

**OG image spec:**
- Background: dark (`#050508`)
- Logo top-left
- Headline: "Custom Websites Built For You"
- Sub: "From $75 · 72hr delivery · Unlimited revisions"
- Right side: 2–3 website mockup screenshots

---

## 4. Environment Variables

Add to `Frontend/.env.production`:

```env
VITE_API_URL=https://your-backend.vercel.app/api
VITE_ADMIN_EMAILS=youremail@gmail.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Add to `Backend/.env`:

```env
ADMIN_SECRET=your-long-random-secret-here
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. SEO Submission Checklist

### Google
1. Go to https://search.google.com/search-console
2. Add property → URL prefix → `https://annek.tech`
3. Verify via the HTML file already in place (`google467617661029c74f.html`)
4. Submit sitemap: `https://annek.tech/sitemap.xml`
5. Request indexing for homepage

### Bing
1. https://www.bing.com/webmasters
2. Import from Google Search Console (easiest)

### Test structured data
- https://search.google.com/test/rich-results
- Paste `https://annek.tech` → verify FAQ, Organization, Service schemas pass

### Test social sharing
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter/X: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

---

## 6. Performance Targets & How to Hit Them

### Target Scores
| Metric | Target | Current gap |
|--------|--------|-------------|
| Lighthouse Performance | 95+ | Image optimization |
| Lighthouse SEO | 100 | Schema + meta done |
| Lighthouse Accessibility | 95+ | ARIA + contrast done |
| LCP | < 2.5s | Preload hero font |
| CLS | < 0.1 | Skeleton loaders done |
| INP | < 200ms | Async handlers done |

### Specific fixes for LCP

Add this to `index.html` `<head>` (after font preconnects):

```html
<!-- Preload DM Sans 300/400 weights used above the fold -->
<link rel="preload" as="font" type="font/woff2"
  href="https://fonts.gstatic.com/s/dmsans/v15/..."
  crossorigin="anonymous" />
```

Or self-host the font:
```bash
npx google-webfonts-helper
# Download DM Sans 300,400,500,700 → place in public/fonts/
```

### Cloudinary image optimization

The component already applies Cloudinary transforms for portfolio images.
Add these transforms to all images:

```
/upload/w_600,h_400,c_fill,q_auto,f_auto/
```

For the OG image:
```
/upload/w_1200,h_630,c_fill,q_90,f_auto/
```

---

## 7. Security Implementation Details

### Backend rate limiting (already in securityMiddleware.js)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/orders` | 10 req | 1 hour |
| `POST /api/contact` | 5 req | 1 hour |
| `POST /api/feedback` | 10 req | 1 hour |
| All `/api/*` | 150 req | 15 min |

### CSRF protection (add to backend)

```bash
npm install csurf cookie-parser
```

```js
// In server.js
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

app.use(cookieParser());
app.use(csrf({ cookie: { httpOnly: true, secure: true, sameSite: "strict" } }));

// Send token to frontend
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

```jsx
// In AnnekPremium.jsx — fetch CSRF token before form submission
const getCsrfToken = async () => {
  const r = await fetch(`${API}/csrf-token`, { credentials: "include" });
  return (await r.json()).csrfToken;
};

// Add to headers in fetch calls:
headers: {
  "Content-Type": "application/json",
  "X-CSRF-Token": await getCsrfToken(),
}
```

### Firebase Auth hardening

The existing Firebase setup is good. Add these to your Firebase console:
- App Check (prevents API abuse from non-app clients)
- Authorized domains: add `annek.tech` and remove `localhost` in production

### MongoDB injection prevention

Already included in `securityMiddleware.js` via `preventNoSQLInjection()`.
Also add to Mongoose schemas:

```js
// In all models — add strict mode (already default) and sanitize
const schema = new mongoose.Schema({ ... }, {
  strict: true,      // Reject unknown fields
  strictQuery: true, // Reject unknown query fields
});
```

---

## 8. AI Search Optimization (GEO — Generative Engine Optimization)

The redesign is built for visibility in AI-powered search tools.

### What's implemented

- **Dense entity facts** in meta description and `description-extended` meta
- **FAQ schema** — directly feeds Google AI Overviews and Perplexity answers
- **Organization schema** with full contact details
- **Service schema** with explicit pricing and delivery times
- **robots.txt** explicitly allows: GPTBot, ChatGPT-User, Google-Extended, PerplexityBot, anthropic-ai, ClaudeBot
- Clear, factual content with specific numbers ($75, 72 hours, 40+ industries)

### Additional GEO recommendations

1. **Add an "About" page or `/about` route** with detailed company history and team bios — AI models use these for entity resolution.

2. **Add a blog** at `/blog` with articles like:
   - "How much does a website cost in 2026?"
   - "72-hour website delivery: how it works"
   - "Portfolio website design: complete guide"
   These become AI training/retrieval sources.

3. **Add a clear pricing page** at `/pricing` (not just `/#pricing`) — AI search tools often cite pricing pages directly.

4. **Wikipedia-style "About" section** — write a clear 2-paragraph description in plain English that an AI could quote verbatim about what Annek does. This is now in the About section of the redesign.

5. **Use llms.txt** — a new standard for AI-readable site descriptions:
   ```
   # Create: /public/llms.txt
   # Annek
   
   > Professional custom website design and development agency.
   
   Annek builds custom websites for businesses worldwide. Services include
   portfolio sites, e-commerce stores, booking systems, and business websites.
   Pricing starts at $75 USD. Standard delivery is 72 hours. Unlimited revisions
   included. Contact: annek.websitebuild.official@gmail.com
   
   ## Services
   - [Portfolio websites](https://annek.tech/#portfolio)
   - [Pricing](https://annek.tech/#pricing)
   - [Contact](https://annek.tech/#contact)
   ```

---

## 9. Conversion Rate Optimization (CRO)

### Implemented in the redesign

| Element | CRO Purpose |
|---------|-------------|
| Lime "Start Your Order ✦" CTA | High contrast, action-oriented |
| Trust signals under hero | Reduce anxiety before scroll |
| Skeleton loaders | Prevent layout shift that kills bounce |
| Modal quick-quote (name + email only) | Lower friction than 7-step form on first contact |
| Pricing "Most Popular" badge | Social proof anchoring |
| FAQ section | Handle objections before they're raised |
| WhatsApp FAB | Immediate low-friction contact |
| Reviews marquee auto-play | Continuous social proof without interaction |

### Additional CRO recommendations

**A. Add a sticky bottom CTA bar on mobile:**
```jsx
// Shows when user has scrolled past hero
{scrolled && (
  <div style={{
    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 800,
    background: "rgba(5,5,8,0.95)", backdropFilter: "blur(16px)",
    padding: "12px 20px", display: "flex", alignItems: "center",
    justifyContent: "space-between", borderTop: `1px solid ${T.border}`,
  }}>
    <div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>Ready to start?</div>
      <div style={{ fontSize: "12px", color: T.textMuted }}>Free quote in 24 hours</div>
    </div>
    <Button variant="lime" onClick={onOrder}>Order Now</Button>
  </div>
)}
```

**B. Add urgency to pricing (honest scarcity):**
```
"🟢 Accepting 3 new projects this week"
```

**C. Add a comparison table:**
```
Annek vs Fiverr vs Agency
Speed:  72hrs   vs  5-30 days  vs  4-12 weeks
Price:  $75+    vs  $50-500    vs  $2,000+
Custom: ✓       vs  Template   vs  ✓
```

**D. Exit intent modal** (desktop only):
```jsx
useEffect(() => {
  const fn = (e) => {
    if (e.clientY < 10 && !hasShownExit) {
      setShowExitModal(true);
      setHasShownExit(true);
    }
  };
  document.addEventListener("mousemove", fn);
  return () => document.removeEventListener("mousemove", fn);
}, []);
```

**E. Live order count social proof:**
```jsx
// Fetch from /api/stats and display:
<div>🔥 {stats.orderCount} websites delivered</div>
```

---

## 10. Tech Stack Upgrade Recommendations

### Current → Recommended

| Layer | Current | Recommended | Benefit |
|-------|---------|-------------|---------|
| Frontend | React + Vite | Next.js 14 (App Router) | SSR → better SEO, faster LCP |
| CSS | Inline styles | Tailwind CSS | Smaller bundle, design system |
| Animations | CSS transitions | Framer Motion | Smoother 3D effects |
| Images | `<img>` | `next/image` | Auto WebP/AVIF, lazy load |
| Email | Nodemailer | Resend.com or Loops | Better deliverability |
| Backend | Express on Vercel | Same + Upstash Redis | Rate limit state across instances |
| Auth | Firebase | Firebase + server-side verify | Security |
| Media | Cloudinary free | Cloudinary + image pipeline | Performance |
| Analytics | None | Plausible or Fathom | Privacy-first, GDPR compliant |
| Monitoring | None | Sentry (free tier) | Error tracking |

### Next.js migration (highest impact for SEO)

```bash
# New project
npx create-next-app@latest annek-next --typescript --tailwind --app

# Move components to app/ directory
# Use generateMetadata() for per-page SEO
# Use next/image for all images
# Use next/font for DM Sans
```

```tsx
// app/layout.tsx — metadata API
export const metadata: Metadata = {
  title: {
    default: "Annek — Custom Website Design & Development | 72hr Delivery",
    template: "%s | Annek",
  },
  description: "Professional custom website design...",
  openGraph: { /* ... */ },
  twitter: { /* ... */ },
  robots: { index: true, follow: true },
};
```

---

## 11. Testing Checklist Before Going Live

### SEO
- [ ] Run https://pagespeed.web.dev on `https://annek.tech`
- [ ] Run https://search.google.com/test/rich-results
- [ ] Check https://www.opengraph.xyz/ for OG preview
- [ ] Validate sitemap at https://www.xml-sitemaps.com/validate-xml-sitemap.html
- [ ] Check mobile-friendly: https://search.google.com/test/mobile-friendly

### Security
- [ ] Check headers at https://securityheaders.com
- [ ] SSL test at https://www.ssllabs.com/ssltest/
- [ ] Check for exposed secrets: `grep -r "VITE_" dist/` (should be empty values)

### Performance
- [ ] Lighthouse score in Chrome DevTools (incognito)
- [ ] WebPageTest at https://www.webpagetest.org
- [ ] Check bundle size: `npm run build` → check output sizes

### Accessibility
- [ ] Run axe DevTools Chrome extension
- [ ] Keyboard-navigate entire page (Tab, Enter, Esc)
- [ ] Test with screen reader (VoiceOver on Mac: Cmd+F5)
- [ ] Color contrast: https://webaim.org/resources/contrastchecker/

### Cross-browser
- [ ] Chrome, Firefox, Safari, Edge
- [ ] iOS Safari (most common mobile issue)
- [ ] Android Chrome

---

## 12. Monitoring Setup

### Google Analytics 4

```html
<!-- Add to index.html <head> — after consent banner if GDPR applies -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    page_title: document.title,
    page_location: window.location.href,
  });
</script>
```

### Track order form events

```js
// In AnnekPremium.jsx — after successful order submission:
gtag("event", "generate_lead", {
  currency: "USD",
  value: 100,
  event_category: "Order",
  event_label: "Website Order Form",
});

// Track WhatsApp click:
gtag("event", "contact", {
  event_category: "Contact",
  event_label: "WhatsApp",
});
```

### Sentry error monitoring (free)

```bash
npm install @sentry/react
```

```jsx
// main.jsx
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: "https://YOUR_DSN@sentry.io/PROJECT_ID",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

---

*Last updated: May 29, 2026*
*Designed for annek.tech — Premium redesign package*
