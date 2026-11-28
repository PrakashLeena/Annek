/* The one source of truth for every public page: path, navigation label, H1, intro, <title>,
   meta description, breadcrumb and JSON-LD. Page components (useSeo) and the build-time
   pre-render (scripts/prerender.mjs) both read from here; head.js turns a page into tags.
   Rules: title max 60 chars, description max 155, no dashes, no "Mannar". */
import { FAQS, SERVICES, MAINTENANCE_SERVICE } from "../site/content.js";

export const SITE = "https://annek.tech";
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;
export const DEFAULT_DESCRIPTION = "Annek is a software development company in Sri Lanka building custom software, web applications and mobile apps for businesses, from idea to launch.";

/* Social profiles for Organization.sameAs.
   TODO(content): add Annek's real Facebook, LinkedIn, Instagram, Google Business profile URLs. */
export const SAME_AS = [];

const provider = { "@type": "Organization", "@id": ORG_ID, name: "Annek", url: `${SITE}/` };

const organization = (settings = {}) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Annek",
  url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: `${SITE}/logo.png`, width: 468, height: 217 },
  description: DEFAULT_DESCRIPTION,
  email: "info@annek.tech",
  telephone: "+94701269689",
  address: { "@type": "PostalAddress", addressLocality: (settings.address || "Vankalai").split(",")[0].trim(), addressCountry: "LK" },
  areaServed: { "@type": "Country", name: "Sri Lanka" },
  contactPoint: [{
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "info@annek.tech",
    telephone: "+94701269689",
    availableLanguage: ["English", "Tamil", "Sinhala"],
  }],
  ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
});

const website = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Annek",
  url: `${SITE}/`,
  description: DEFAULT_DESCRIPTION,
  publisher: { "@id": ORG_ID },
});

const services = () => [...SERVICES.map((s) => ({ name: s.schemaName, description: s.text, slug: s.slug })), { name: MAINTENANCE_SERVICE.schemaName, description: MAINTENANCE_SERVICE.text }]
  .map((s) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.description,
    serviceType: s.name,
    provider,
    areaServed: [{ "@type": "Country", name: "Sri Lanka" }, { "@type": "Place", name: "Worldwide" }],
    ...(s.slug ? { url: `${SITE}/solutions/${s.slug}` } : {}),
  }));

const faqPage = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

/* Published solutions for one showcase page (only what the API returned; nothing invented). */
const solutionList = (page, ctx) => {
  const items = (ctx.solutions?.[page.category] || []).filter((s) => s && s.title);
  if (!items.length) return [];
  return [{
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: page.h1,
    numberOfItems: items.length,
    itemListElement: items.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.title,
      ...(s.purpose ? { description: s.purpose } : {}),
    })),
  }];
};

export const PAGES = {
  home: {
    title: "Annek | Software Development Company in Sri Lanka",
    description: DEFAULT_DESCRIPTION,
    preload: ["/intro/annek-intro-poster.jpg"],
    schema: (page, ctx) => [organization(ctx.settings), website()],
    path: "/",
    h1: "Software Development Company in Sri Lanka",
  },
  services: {
    title: "Software Development Services | Annek",
    description: "Custom software, web applications and mobile apps built for your business by Annek in Sri Lanka, with ready made packages and monthly maintenance.",
    crumb: "Services",
    schema: services,
    path: "/services",
    nav: "Services",
    eyebrow: "Services",
    h1: "Our Software Development Services",
    intro: "Annek designs, builds and maintains software for businesses: mobile apps for Android and iPhone, web applications with admin panels, and custom business software. Many projects start from a proven solution that we customise, which keeps cost and delivery time down. Every build can come with a monthly maintenance plan.",
  },
  products: {
    title: "Our Apps and Software Products | Annek",
    description: "Apps and software built and run by Annek, a software development company in Sri Lanka. See what is live, in beta and coming soon.",
    crumb: "Products",
    // A page with nothing on it stays out of the index until the first product is published.
    indexable: (ctx) => (ctx.products || []).length > 0,
    path: "/products",
    nav: "Products",
    eyebrow: "Our products",
    h1: "Apps and Software Made by Annek",
    intro: "Besides client work, Annek builds and runs its own apps and software. Here you can see what is live, what is in beta and what is coming next, with plans and download links where they are available.",
  },
  portfolio: {
    title: "Portfolio | Annek Software Development",
    description: "Websites, web applications and apps Annek has designed and built for clients, from community associations to education platforms.",
    crumb: "Portfolio",
    path: "/portfolio",
    nav: "Portfolio",
    eyebrow: "Portfolio",
    h1: "Our Work",
    intro: "A selection of websites, web applications and apps Annek has designed and built for clients, from community associations to education platforms. Each project was shaped around the client's brand, content and goals.",
  },
  reviews: {
    title: "Client Reviews and Ratings | Annek",
    description: "See how clients rate working with Annek: our Google rating and reviews, plus testimonials from businesses we have built software for.",
    crumb: "Reviews",
    path: "/reviews",
    nav: "Reviews",
    eyebrow: "Reviews",
    h1: "What Our Clients Say",
    intro: "Clients rate Annek on Google and send us feedback after their projects launch. On this page you can see our Google rating and reviews, together with testimonials clients have shared with us directly.",
  },
  pricing: {
    title: "Software Development Pricing | Annek",
    description: "Clear pricing from Annek: one time website builds, packages for apps and software, and monthly maintenance plans for hosting, updates and support.",
    crumb: "Pricing",
    path: "/pricing",
    nav: "Pricing",
    eyebrow: "Pricing",
    h1: "Pricing and Packages",
    intro: "Annek keeps pricing clear. Websites are one time builds with no hidden fees. Apps, web applications and custom software are priced as packages or quoted per project, and monthly maintenance plans cover hosting, updates, backups and support.",
  },
  about: {
    title: "About Annek | Software Company in Sri Lanka",
    description: "Meet Annek, a Sri Lankan software company that builds, customises and maintains custom software, web applications and mobile apps for businesses.",
    crumb: "About",
    path: "/about",
    nav: "About",
    eyebrow: "About Annek",
    h1: "About Annek",
    intro: "Annek is a software development company in Sri Lanka that builds custom software, web applications and mobile apps for businesses at home and abroad.",
  },
  faq: {
    title: "FAQ | Annek Software Development",
    description: "Answers to common questions about working with Annek: what we build, delivery times, monthly maintenance, domains and how to place an order.",
    crumb: "FAQ",
    schema: faqPage,
    path: "/faq",
    nav: "FAQ",
    eyebrow: "FAQ",
    h1: "Frequently Asked Questions",
    intro: "Answers to the questions businesses ask most before working with Annek: what we build, how long delivery takes, what monthly maintenance covers and how to place an order.",
  },
  contact: {
    title: "Contact Annek | Software Development Sri Lanka",
    description: "Contact Annek about your custom software, web application or mobile app. Email info@annek.tech or chat on WhatsApp. We reply within 24 hours.",
    crumb: "Contact",
    path: "/contact",
    nav: "Contact",
    eyebrow: "Contact",
    h1: "Contact Annek",
    intro: "Tell us about your project, whether it is a mobile app, a web application or custom software. Send a message, email us or chat on WhatsApp, and we reply within 24 hours.",
  },
  "solutions/mobile": {
    title: "Mobile App Development Solutions | Annek",
    description: "Ready made mobile apps for Android and iPhone from Annek, a software development company in Sri Lanka, customised and launched for your business.",
    crumb: "Mobile App Solutions",
    parent: "services",
    schema: solutionList,
    path: "/solutions/mobile",
    category: "mobile",
    eyebrow: "Mobile Applications",
    h1: "Mobile App Solutions",
    intro: "Ready made mobile apps for Android and iPhone. Pick one and we customise it for your business.",
  },
  "solutions/web": {
    title: "Web Application Solutions | Annek",
    description: "Ready made web applications with admin panels from Annek, a software development company in Sri Lanka. Try the live demos and customise one.",
    crumb: "Web Application Solutions",
    parent: "services",
    schema: solutionList,
    path: "/solutions/web",
    category: "web",
    eyebrow: "Web Applications",
    h1: "Web Application Solutions",
    intro: "Ready made web applications that run in any browser, with an admin panel you control. Try the live demos.",
  },
  "solutions/software": {
    title: "Custom Software Solutions | Annek",
    description: "Ready made business software for billing, stock, records and automation from Annek, a software development company in Sri Lanka.",
    crumb: "Custom Software Solutions",
    parent: "services",
    schema: solutionList,
    path: "/solutions/software",
    category: "software",
    eyebrow: "Custom Software",
    h1: "Custom Software Solutions",
    intro: "Ready made software for billing, stock, records and automation, shaped around how your business works.",
  },
};

/* Header and footer navigation, in order. */
export const NAV = ["services", "products", "portfolio", "pricing", "reviews", "about", "contact"];

/* Old one-page links (/#services) → the real page. Hashes not listed stay as in-page anchors. */
export const HASH_REDIRECTS = {
  solutions: "/services",
  services: "/services",
  products: "/products",
  work: "/portfolio",
  portfolio: "/portfolio",
  pricing: "/pricing",
  reviews: "/reviews",
  about: "/about",
  faq: "/faq",
  contact: "/contact",
};

export const pageByPath = (path) => Object.values(PAGES).find((p) => p.path === path) || null;

for (const [key, page] of Object.entries(PAGES)) page.key = key;
