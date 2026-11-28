/* Static site copy shared by the pages, the SEO config and the pre-render step. */

export const STRIP = ["Ecommerce Apps", "Marketing Apps", "Web Applications", "Portfolio Sites", "Institute Platforms", "Inventory & POS", "Custom Software", "Monthly Maintenance"];

export const STEPS = [
  ["Choose a package", "Pick a ready made template or tell us what you need."],
  ["We customise it", "Your brand, content and features, built in."],
  ["Launch", "We publish it to the web, Play Store, App Store or your PCs."],
  ["Monthly care", "Hosting, updates, backups and changes, every month."],
];

export const FAQS = [
  ["What does Annek do?", "Annek is a software development company in Sri Lanka. We build custom software, web applications and mobile apps for businesses, from idea to launch, and keep them secure and up to date with monthly maintenance."],
  ["What does a monthly maintenance plan cover?", "Hosting, security updates, backups, small content changes and support. Each package lists exactly what is included, and you can add more care any time."],
  ["Can you customise a template for my business?", "Yes. Every template is a starting point. We add your brand, content, features and integrations so it fits how your business works."],
  ["How long does delivery take?", "Standard websites take a few business days. Apps, web applications and custom software usually take one to four weeks depending on features. You get a clear timeline with your quote."],
  ["Do you build Android and iPhone apps?", "Yes. We build mobile apps for Android and iPhone and help you publish them on the Play Store and App Store."],
  ["Can I use my own domain?", "Absolutely. We can connect a domain you already own or help you register a new one."],
  ["How do I place an order?", "Choose a package or press “Start a project”, answer a few questions, and we reply within 24 hours with a quote and timeline."],
];

/* The three core services (home page cards, /services, Service JSON-LD). */
export const SERVICES = [
  { slug: "mobile", title: "Mobile Applications", schemaName: "Mobile App Development", text: "Ecommerce, marketing and business apps for Android and iPhone, built from proven templates and customised for you." },
  { slug: "web", title: "Web Applications", schemaName: "Web Application Development", text: "Ecommerce, portfolio, institute and industry platforms that run in any browser, with an admin panel you control." },
  { slug: "software", title: "Custom Software", schemaName: "Custom Software Development", text: "Software shaped around how your business works: billing, stock, records and automation." },
];

export const MAINTENANCE_SERVICE = {
  schemaName: "Software Maintenance and Support",
  text: "Monthly plans covering hosting, security updates, backups and changes.",
};

export const DEFAULT_WEBSITE_PLANS = [
  { name: "Starter", key: "starterPrice", price: "$75 to $80", items: ["Up to 5 pages", "Mobile responsive design", "Contact form", "Basic SEO setup"] },
  { name: "Growth", key: "growthPrice", price: "$100 to $120", hot: true, items: ["Up to 15 pages", "Custom design", "Blog or CMS", "Advanced SEO + analytics"] },
  { name: "Premium", key: "premiumPrice", price: "$150 to $170", items: ["Unlimited pages", "Ecommerce / bookings", "Payment gateway", "Custom animations"] },
];

export const DEFAULT_ABOUT = "Annek is a software development company in Sri Lanka. We build custom software, web applications and mobile apps for businesses, from idea to launch, often starting from proven solutions we customise for you, and keep them running with affordable monthly maintenance.";

/* Company details: Admin › Settings wins, these are the fallbacks. */
export function companyInfo(settings = {}) {
  return {
    email: settings.contactEmail || "info@annek.tech",
    whatsapp: (settings.whatsappNumber || "94701269689").replace(/[^0-9]/g, ""),
    phone: settings.contactPhone || "+94 70 126 9689",
    address: settings.address || "Vankalai, Sri Lanka",
    area: settings.serviceArea || "Sri Lanka · Serving worldwide",
    tagline: settings.companyTagline || "Web apps, mobile apps and custom software that we build, customise and maintain for your business.",
    about: settings.aboutText || DEFAULT_ABOUT,
  };
}

export function websitePlans(settings = {}) {
  return DEFAULT_WEBSITE_PLANS.map((p) => ({ ...p, price: settings[p.key] || p.price }));
}
