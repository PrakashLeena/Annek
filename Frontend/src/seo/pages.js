/* The one source of truth for every public page: path, navigation label, H1 and intro.
   Page components and the build-time pre-render both read from here. */

export const PAGES = {
  home: {
    path: "/",
    h1: "Software Development Company in Sri Lanka",
  },
  services: {
    path: "/services",
    nav: "Services",
    eyebrow: "Services",
    h1: "Our Software Development Services",
    intro: "Annek designs, builds and maintains software for businesses: mobile apps for Android and iPhone, web applications with admin panels, and custom business software. Many projects start from a proven solution that we customise, which keeps cost and delivery time down. Every build can come with a monthly maintenance plan.",
  },
  products: {
    path: "/products",
    nav: "Products",
    eyebrow: "Our products",
    h1: "Apps and Software Made by Annek",
    intro: "Besides client work, Annek builds and runs its own apps and software. Here you can see what is live, what is in beta and what is coming next, with plans and download links where they are available.",
  },
  portfolio: {
    path: "/portfolio",
    nav: "Portfolio",
    eyebrow: "Portfolio",
    h1: "Our Work",
    intro: "A selection of websites, web applications and apps Annek has designed and built for clients, from community associations to education platforms. Each project was shaped around the client's brand, content and goals.",
  },
  reviews: {
    path: "/reviews",
    nav: "Reviews",
    eyebrow: "Reviews",
    h1: "What Our Clients Say",
    intro: "Clients rate Annek on Google and send us feedback after their projects launch. On this page you can see our Google rating and reviews, together with testimonials clients have shared with us directly.",
  },
  pricing: {
    path: "/pricing",
    nav: "Pricing",
    eyebrow: "Pricing",
    h1: "Pricing and Packages",
    intro: "Annek keeps pricing clear. Websites are one time builds with no hidden fees. Apps, web applications and custom software are priced as packages or quoted per project, and monthly maintenance plans cover hosting, updates, backups and support.",
  },
  about: {
    path: "/about",
    nav: "About",
    eyebrow: "About Annek",
    h1: "About Annek",
    intro: "Annek is a software development company in Sri Lanka that builds custom software, web applications and mobile apps for businesses at home and abroad.",
  },
  faq: {
    path: "/faq",
    nav: "FAQ",
    eyebrow: "FAQ",
    h1: "Frequently Asked Questions",
    intro: "Answers to the questions businesses ask most before working with Annek: what we build, how long delivery takes, what monthly maintenance covers and how to place an order.",
  },
  contact: {
    path: "/contact",
    nav: "Contact",
    eyebrow: "Contact",
    h1: "Contact Annek",
    intro: "Tell us about your project, whether it is a mobile app, a web application or custom software. Send a message, email us or chat on WhatsApp, and we reply within 24 hours.",
  },
  "solutions/mobile": {
    path: "/solutions/mobile",
    category: "mobile",
    eyebrow: "Mobile Applications",
    h1: "Mobile App Solutions",
    intro: "Ready made mobile apps for Android and iPhone. Pick one and we customise it for your business.",
  },
  "solutions/web": {
    path: "/solutions/web",
    category: "web",
    eyebrow: "Web Applications",
    h1: "Web Application Solutions",
    intro: "Ready made web applications that run in any browser, with an admin panel you control. Try the live demos.",
  },
  "solutions/software": {
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
