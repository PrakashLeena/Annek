# Annek preloader

The branded loading screen ("A" icon, letters, annek.tech) that shows on a visitor's first page view in a browser tab.

This folder is the only place to edit it. `vite-plugin-preloader.js` (in `Frontend/`) inlines these files into `index.html` for both `npm run dev` and `npm run build`. CSS and JS are minified only in the production build.

| File | Goes to | Notes |
|---|---|---|
| `preloader.css` | `<style>` in `<head>` (replaces `<!--preloader:css-->`) | Critical CSS, so it paints on the first frame |
| `preloader.html` | first thing in `<body>` (replaces `<!--preloader:html-->`) | Markup and `<noscript>` fallback |
| `preloader.js` | inline classic `<script>` right after the markup | Must stay non-module and non-deferred, so it runs before React |

Runtime assets live in `Frontend/public/preloader/`: `annek-a-420.webp`, `annek-a-840.webp` and `SpaceGrotesk-500.woff2`. `index.html` keeps a `<link rel="preload">` for the icon. The original plan and a standalone demo are in `docs/annek-preloader/`.

## Config

Set these as data attributes on `#annek-preloader` in `preloader.html`:

| Attribute | Values | Current | Meaning |
|---|---|---|---|
| `data-theme` | `dark` · `light` · `auto` | `light` | `auto` follows `html.dark` or `prefers-color-scheme` |
| `data-once` | `session` · `always` | `session` | `session` plays once per tab session; a refresh skips it |
| `data-ready` | `load` · `event` | `event` | `event` waits for the app to fire `annek:ready` (`src/main.jsx` does this after first paint) |
| `data-max` | milliseconds | `6000` | Hard cap before the site is shown anyway |

When the preloader is removed, it fires the window event `annek:preloader-done`. `App.jsx` waits for it before starting the scroll-reveal animations.

## Changing the theme or colours

- To switch themes, change `data-theme` in `preloader.html`.
- To change colours, edit the CSS variables in `preloader.css`. `#annek-preloader { … }` holds the dark theme and `#annek-preloader[data-theme="light"] { … }` holds the light theme:
  - `--ap-bg`: background (light theme is `#FFFFFF`)
  - `--ap-ink`: letters
  - `--ap-dim`: domain text
  - `--ap-accent`: orange lines and progress bar
  - `--ap-glow` and `--ap-haze`: the orange glow behind the logo. Set `--ap-haze: transparent` for a flat background.

To see it again after it has played, open a new tab or clear `annek-preloader-seen` from session storage.
