/* Turns a page from pages.js into its <head> tags. Used in the browser (useSeo → applyHead)
   and at build time (scripts/prerender.mjs → headToHtml), so both always agree. */
import { PAGES, SITE, WEBSITE_ID, ORG_ID } from "./pages.js";

export const ROBOTS_INDEX = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const OG_IMAGE = { url: `${SITE}/og-image.png`, width: "1200", height: "630", alt: "Annek, software development company in Sri Lanka" };
const HOME_KEYWORDS = "software development company, software development company sri lanka, software company sri lanka, custom software development, web application development sri lanka, mobile app development sri lanka, annek";

export const canonicalUrl = (path) => (path === "/" ? `${SITE}/` : `${SITE}${path.replace(/\/+$/, "")}`);

function breadcrumb(page) {
  if (page.path === "/") return null;
  const trail = [{ name: "Home", path: "/" }];
  if (page.parent) trail.push({ name: PAGES[page.parent].crumb, path: PAGES[page.parent].path });
  trail.push({ name: page.crumb, path: page.path });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: canonicalUrl(t.path) })),
  };
}

/**
 * @param page  an entry of PAGES
 * @param ctx   public site data ({ settings, products, solutions, ... }); may be partial
 */
export function buildHead(page, ctx = {}) {
  const settings = ctx.settings || {};
  const isHome = page.path === "/";
  // Admin › Settings can override the home page title, description and keywords.
  const title = (isHome && settings.seoTitle?.trim()) || page.title;
  const description = (isHome && settings.seoDescription?.trim()) || page.description;
  const url = canonicalUrl(page.path);
  const indexable = page.indexable ? page.indexable(ctx) : true;
  const jsonLd = [
    ...(page.schema ? [].concat(page.schema(page, ctx) || []) : []),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORG_ID },
      inLanguage: "en",
    },
    breadcrumb(page),
  ].filter(Boolean);

  return {
    title,
    canonical: url,
    meta: [
      ["name", "description", description],
      ["name", "robots", indexable ? ROBOTS_INDEX : "noindex, follow"],
      ["name", "keywords", isHome ? [settings.seoKeywords, HOME_KEYWORDS].filter(Boolean).join(", ") : null],
      ["property", "og:type", "website"],
      ["property", "og:site_name", "Annek"],
      ["property", "og:locale", "en_US"],
      ["property", "og:title", title],
      ["property", "og:description", description],
      ["property", "og:url", url],
      ["property", "og:image", OG_IMAGE.url],
      ["property", "og:image:type", "image/png"],
      ["property", "og:image:width", OG_IMAGE.width],
      ["property", "og:image:height", OG_IMAGE.height],
      ["property", "og:image:alt", OG_IMAGE.alt],
      ["name", "twitter:card", "summary_large_image"],
      ["name", "twitter:title", title],
      ["name", "twitter:description", description],
      ["name", "twitter:image", OG_IMAGE.url],
      ["name", "twitter:image:alt", OG_IMAGE.alt],
    ],
    jsonLd,
    preload: page.preload || [],
  };
}

/* Head for pages that must stay out of search (404, admin). */
export function privateHead(title, robots = "noindex") {
  return { title, canonical: null, meta: [["name", "robots", robots]], jsonLd: [], preload: [] };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// JSON inside <script>: stop "</script>" and HTML comments from breaking out.
const jsonForScript = (o) => JSON.stringify(o).replace(/</g, "\u003c").replace(/>/g, "\u003e").replace(/&/g, "\u0026");

export function headToHtml(head) {
  return [
    `<title>${esc(head.title)}</title>`,
    ...head.meta.filter(([, , v]) => v != null).map(([attr, key, v]) => `<meta ${attr}="${key}" content="${esc(v)}" />`),
    head.canonical && `<link rel="canonical" href="${esc(head.canonical)}" />`,
    ...head.preload.map((href) => `<link rel="preload" as="image" href="${esc(href)}" fetchpriority="high" />`),
    ...head.jsonLd.map((o) => `<script type="application/ld+json" data-seo>${jsonForScript(o)}</script>`),
  ].filter(Boolean).join("\n    ");
}

/* Browser: make document.head match `head` (only the tags this module manages). */
export function applyHead(head) {
  if (typeof document === "undefined") return;
  document.title = head.title;
  const managed = new Set();
  for (const [attr, key, value] of head.meta) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (value == null) { el?.remove(); continue; }
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute("content", value);
    managed.add(`${attr}:${key}`);
  }
  // Tags a previous page set that this page does not use (e.g. og:* on the 404 page).
  document.head.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], meta[name="description"], meta[name="keywords"]').forEach((el) => {
    const id = el.hasAttribute("property") ? `property:${el.getAttribute("property")}` : `name:${el.getAttribute("name")}`;
    if (!managed.has(id)) el.remove();
  });
  let link = document.head.querySelector('link[rel="canonical"]');
  if (head.canonical) {
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = head.canonical;
  } else link?.remove();
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
  for (const o of head.jsonLd) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-seo", "");
    s.textContent = JSON.stringify(o);
    document.head.appendChild(s);
  }
}
