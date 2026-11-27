# Annek Website Preloader — Implementation Plan (for Claude Code)

## 0. Goal

Add a branded **full-screen preloader** to the annek.tech website that replays the approved Annek logo-reveal animation (orange "A" flies in → wiggle settle → "AnneK" letters slide out → "annek.tech" rises), then reveals the site with a smooth wipe.

The animation is **already built and tested** as a framework-free kit in `annek-preloader/`. Your job is to **integrate it into the website**, not to redesign it.

- Build it in **HTML/CSS + Web Animations API** (already done in the kit). Do **not** use the MP4/WebM videos as the default preloader (see §8 for why, and for the optional video mode).
- Zero runtime dependencies (no GSAP, no Lottie, no Framer Motion).
- Total preloader weight ≈ **120 KB** (icon WebP + font + inline SVG letters).

---

## 1. Source files (on the user's machine)

Folder: `E:\annek\logo\update plan frontend designs\`

| File | Use |
|---|---|
| `annek-preloader/preloader-snippet.html` | Preloader markup (letters are inline vector SVG, colour = `currentColor`) |
| `annek-preloader/preloader.css` | Critical CSS — must be **inlined in `<head>`** |
| `annek-preloader/preloader.js` | Animation + lifecycle — must be an **inline, non-deferred `<script>`** placed right after the markup |
| `annek-preloader/assets/annek-a-840.webp`, `annek-a-420.webp` | The orange "A" icon (AI-upscaled, transparent) |
| `annek-preloader/assets/SpaceGrotesk-500.woff2` | Font for "annek.tech" |
| `annek-preloader/demo.html` | Standalone reference — open in a browser to see the exact expected result (`?light` for light theme) |
| `intro/annek-intro.webm`, `intro/annek-intro.mp4`, `intro/annek-intro-poster.jpg` | Web-compressed video of the same animation — **only for the optional video mode (§8)** |
| `logo.png`, `final.png`, `favicon.*`, `icon-192/512.png`, `apple-touch-icon.png`, `og-image.png` | Brand assets already prepared — wire up favicons/OG if not done yet (§7) |
| `annek-logo-reveal-*.mp4`, `annek-logo-reveal-remotion*.zip` | Marketing video masters — **do not ship these to the website** |

> Files ending in `_1` (e.g. `annek-logo-reveal-1080p60_1.mp4`) are duplicates. Ignore them.

Website repo: `E:\annek\website\` (`Frontend/`, `Backend/`, `api/`). Hosted on Vercel. A redesign is planned: **light theme with orange accents**.

---

## 2. Step 1 — Detect the frontend stack

Inspect `Frontend/package.json` and the entry files, then follow the matching integration path in §4:

- **Vite / CRA (React SPA)** → `index.html` + `src/main.(jsx|tsx)`
- **Next.js (app router)** → `app/layout.(jsx|tsx)`
- **Next.js (pages router)** → `pages/_document.(jsx|tsx)` + `pages/_app`
- **Plain HTML** → every page's `index.html`

Report the detected stack before you change anything.

---

## 3. Step 2 — Copy assets

Copy into the frontend's **public/static** folder so the assets are served from `/preloader/`:

```
Frontend/public/preloader/annek-a-840.webp
Frontend/public/preloader/annek-a-420.webp
Frontend/public/preloader/SpaceGrotesk-500.woff2
```

The kit already references `/preloader/...`. If the static folder is served under a different base path, update the 3 URLs in `preloader.css` / `preloader-snippet.html`.

Add an image preload in `<head>`:

```html
<link rel="preload" as="image" href="/preloader/annek-a-840.webp"
      imagesrcset="/preloader/annek-a-420.webp 420w, /preloader/annek-a-840.webp 840w"
      imagesizes="(max-width: 600px) 45vw, 420px" fetchpriority="high">
```

---

## 4. Step 3 — Integrate (pick ONE path)

### Critical rule (all stacks)

The preloader must paint on the **very first frame**, before the JS bundle downloads and before React hydrates:

1. Inline `preloader.css` in `<head>`, in a `<style>` tag.
2. Make the markup from `preloader-snippet.html` the **first child of `<body>`**, outside the React root.
3. Put `preloader.js` in an inline `<script>` **immediately after** the markup. No `defer`, no `async`, no `type="module"`.
4. The site's own markup and app root stay **below** the preloader, untouched. The site renders underneath while the preloader plays.

### 4A. Vite / CRA

- `index.html`: do steps 1–3 directly. Keep `<div id="root">` after the preloader.
- Set `data-ready="event"` on `#annek-preloader`.
- `src/main.(jsx|tsx)`: after the first render, signal ready:

  ```js
  createRoot(document.getElementById('root')).render(<App />);
  requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event('annek:ready'))));
  ```

- If the home page fetches critical data (hero content), dispatch `annek:ready` after that data resolves instead, but keep the `data-max` cap.

### 4B. Next.js app router

- Put the inline CSS in `app/layout.tsx` with `<style dangerouslySetInnerHTML>` inside `<head>`.
- Render the markup as the first child of `<body>` with `dangerouslySetInnerHTML` (a **server** component, no state).
- Render the script with `<script dangerouslySetInnerHTML={{ __html: preloaderJs }} />` right after the markup. Do **not** use `next/script` with `afterInteractive`, because it runs too late.
- Add `suppressHydrationWarning` on `<html>` and `<body>`. The script adds an `ap-lock` class and removes the preloader node, so hydration must not complain. Keep the preloader **outside** any React-managed tree that re-renders.
- Keep `data-ready="load"`, or add a small client component that dispatches `annek:ready` in `useEffect`.
- Store the CSS/JS as string constants, e.g. in `app/preloader/preloader-inline.ts`, read from the kit files.

### 4C. Next.js pages router

The same approach, done in `pages/_document.tsx` (`<Head>` for the CSS; markup + script at the top of `<body>`, before `<Main />`).

### 4D. Plain HTML

Do steps 1–3 in each page, or only on the landing page if the preloader should appear only there.

---

## 5. Configuration (data attributes on `#annek-preloader`)

| Attribute | Values | Recommended |
|---|---|---|
| `data-theme` | `dark` \| `light` \| `auto` | `dark` = the approved video look. Use `light` once the light-theme redesign ships (dark letters on `#FAFAF9`, like `final.png`). `auto` follows `html.dark` / OS setting. |
| `data-once` | `session` \| `always` | `session` — plays once per tab session; in-site navigation and refreshes in the same session skip it instantly (no flash). |
| `data-ready` | `load` \| `event` | `event` for SPAs (see §4A), `load` otherwise |
| `data-max` | ms | `6000` — hard cap; the site is always revealed by then |

JS API: `window.AnnekPreloader.ready()`, `window.AnnekPreloader.skip()`.
Event fired after removal: `window` → `annek:preloader-done`. Use it to start the site's own hero entrance animations so they don't play hidden behind the preloader.

---

## 6. Behaviour spec (already implemented — verify, don't change)

| Time | What happens |
|---|---|
| 0 – 0.7 s | Orange "A" flies in from the left: rotate −42°→0, scale 0.5→1, spring easing, blur → sharp |
| 0.62 s | Landing: damped wiggle (±4.2°, squash 3.5%, 0.8 s), orange glow pulse, expanding ring |
| 0.74 – 1.3 s | "A n n e K" slide out from behind the A, 85 ms stagger, blur → sharp |
| 1.78 – 2.5 s | "annek.tech" rises out of a mask, letter-spacing settles; orange hairlines draw out |
| 2.5 s → | If the page is ready → exit. Otherwise a thin orange progress bar appears and the logo gently floats until ready (cap `data-max`). |
| Exit (~0.9 s) | Logo scales to 0.94 and fades; the overlay wipes upward (`clip-path`), then the node is removed and scroll unlocks |

Other behaviours:

- **Reduced motion:** static logo, short fade, no fly-in or wiggle.
- **No JS:** the `<noscript>` rule hides the preloader, so the site is never blocked.
- **Scroll lock:** `html.ap-lock` while the preloader is visible; removed on finish.
- **Accessibility:** the overlay has `role="status"` and `aria-label="Loading Annek"`. Make sure nothing in the site steals focus while the preloader is up.

---

## 7. Brand assets (do if missing)

- Favicons: `favicon.ico`, `favicon.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` → `public/`, linked in `<head>` (+ `site.webmanifest` icons).
- `og-image.png` → `og:image` / `twitter:image` meta tags.
- `google467617661029c74f.html` is a Google Search Console verification file. It must stay at the site root (`public/`).
- Use `logo.png` (dark theme) / `final.png` (light theme, needs export to a transparent web size) for the header logo.

---

## 8. Optional: video mode (only if the user asks for the video itself)

Use `intro/annek-intro.webm` (VP9) + `intro/annek-intro.mp4` (H.264) + `intro/annek-intro-poster.jpg`:

```html
<video autoplay muted playsinline preload="auto" poster="/preloader/annek-intro-poster.jpg">
  <source src="/preloader/annek-intro.webm" type="video/webm">
  <source src="/preloader/annek-intro.mp4" type="video/mp4">
</video>
```

- Exit on the video's `ended` event, or on `data-max`.
- If `video.play()` rejects (iOS Low Power Mode blocks autoplay), exit immediately.

Downsides vs the code version: the video is 720p (soft on retina screens), dark-only, about the same size or larger, can't wait for real loading, and autoplay can be blocked. **The code version is the default.**

---

## 9. Acceptance criteria

- [ ] Preloader visible on the first paint (no flash of site content before it), on desktop and mobile.
- [ ] Animation matches `demo.html` (compare side by side).
- [ ] Site revealed ≤ 3.5 s on a fast connection; never later than `data-max`.
- [ ] Second load in the same tab session: no preloader, no flash.
- [ ] No console errors, no React hydration warnings.
- [ ] Page scroll locked during the preloader, restored after.
- [ ] `prefers-reduced-motion: reduce` → static version.
- [ ] Works at 360 px width (logo fits, nothing clipped) and at 4K (icon stays sharp).
- [ ] Lighthouse: no CLS from the preloader (it is `position:fixed`); the LCP element is the site's own content, not the preloader.
- [ ] Hero entrance animations start on `annek:preloader-done`.

## 10. Test checklist

1. `npm run dev`. Open in a fresh tab → preloader plays → site appears.
2. Refresh in the same tab → skipped. Open a new incognito tab → plays again.
3. DevTools → Network "Slow 4G" → the progress bar appears after 2.5 s, then exits when loaded.
4. DevTools → Rendering → emulate `prefers-reduced-motion` → static version.
5. Disable JS → the site shows immediately.
6. `npm run build && npm run preview` (or `vercel build`) → repeat steps 1–3 on the production build.
7. Deploy a Vercel **preview** first. Do not touch production until the user approves.

## 11. Don'ts

- Don't rebuild the animation with a library or change its timings/easing without asking.
- Don't load the preloader JS through the bundler, as a module, or deferred. It must run inline, before the app.
- Don't ship the 4K/1080p marketing MP4s or the Remotion zip to the website.
- Don't remove `google467617661029c74f.html`.
- Don't change the backend/API for this task.
