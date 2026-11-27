/**
 * SEO Meta Tags Manager
 * Utility to dynamically update meta tags for different pages and sections
 */

export const updateMetaTags = ({
  title = "Annek - Custom Website Design & Development",
  description = "Professional website design and development services. Get custom-built websites starting at $75.",
  keywords = "website design, web development, e-commerce, portfolio",
  url = "https://annek.tech",
  image = "https://annek.tech/og-image.png",
  type = "website",
  author = "Annek",
  locale = "en_US",
  twitterHandle = "@annek",
} = {}) => {
  // Update title
  document.title = title;
  
  // Update meta description
  updateOrCreateMetaTag("name", "description", description);
  updateOrCreateMetaTag("name", "keywords", keywords);
  updateOrCreateMetaTag("name", "author", author);
  
  // Update Open Graph tags
  updateOrCreateMetaTag("property", "og:title", title);
  updateOrCreateMetaTag("property", "og:description", description);
  updateOrCreateMetaTag("property", "og:url", url);
  updateOrCreateMetaTag("property", "og:type", type);
  updateOrCreateMetaTag("property", "og:image", image);
  updateOrCreateMetaTag("property", "og:locale", locale);
  
  // Update Twitter Card tags
  updateOrCreateMetaTag("name", "twitter:title", title);
  updateOrCreateMetaTag("name", "twitter:description", description);
  updateOrCreateMetaTag("name", "twitter:image", image);
  updateOrCreateMetaTag("name", "twitter:creator", twitterHandle);
  
  // Update canonical URL
  updateOrCreateLink("canonical", url);
};

const updateOrCreateMetaTag = (attribute, attributeValue, content) => {
  let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, attributeValue);
    document.head.appendChild(element);
  }
  
  element.setAttribute("content", content);
};

const updateOrCreateLink = (rel, href) => {
  let link = document.querySelector(`link[rel="${rel}"]`);
  
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  
  link.setAttribute("href", href);
};

/**
 * Add JSON-LD structured data
 */
export const addStructuredData = (data) => {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

/**
 * GEO Targeting - Add location-based meta tags
 */
export const addGeoMetaTags = (country, region, city, lat, lon) => {
  updateOrCreateMetaTag("name", "geo.placename", city);
  updateOrCreateMetaTag("name", "geo.region", `${country}-${region}`);
  updateOrCreateMetaTag("name", "ICBM", `${lat}, ${lon}`);
};

/**
 * Page-specific SEO configurations
 */
export const BASE_KEYWORDS = [
  "web development", "web development sri lanka", "web development mannar",
  "mobile application development sri lanka", "mobile app development mannar",
  "software development sri lanka", "software development mannar", "software customization",
  "web application development", "website maintenance packages", "monthly maintenance packages",
  "e-commerce app development", "custom software sri lanka", "annek",
].join(", ");

export const pageConfigs = {
  home: {
    title: "Annek — Web, Mobile App & Software Development in Sri Lanka",
    description: "Annek builds web applications, mobile apps and custom software in Sri Lanka (Mannar) — ready-made templates customised for your business, with monthly maintenance packages.",
    keywords: BASE_KEYWORDS,
  },
  services: {
    title: "Mobile Apps, Web Apps & Custom Software Packages | Annek",
    description: "Built-in packages for mobile applications, web applications and custom software — customised to your business and maintained monthly. Sri Lanka & worldwide.",
    keywords: `mobile application development, web application development, software customization, maintenance packages, ${BASE_KEYWORDS}`,
  },
  portfolio: {
    title: "Portfolio — Web & App Projects | Annek",
    description: "Websites, web apps and mobile apps Annek has built for businesses in Sri Lanka and worldwide.",
    keywords: `portfolio, web design examples, app projects, ${BASE_KEYWORDS}`,
  },
  pricing: {
    title: "Pricing & Maintenance Packages | Annek",
    description: "Transparent pricing for websites, web apps, mobile apps and software, with monthly maintenance packages.",
    keywords: `website pricing sri lanka, app development cost, maintenance packages, ${BASE_KEYWORDS}`,
  },
  contact: {
    title: "Contact Annek — Web, App & Software Development, Mannar, Sri Lanka",
    description: "Talk to Annek about your web application, mobile app or custom software. We reply within 24 hours.",
    keywords: `contact web developer sri lanka, app developer mannar, ${BASE_KEYWORDS}`,
  },
};

/**
 * Service-specific Schema data
 */
export const getServiceSchema = (serviceName) => {
  const schemas = {
    portfolio: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Portfolio Website Design",
      "description": "Custom portfolio website design to showcase your work and talent.",
      "provider": {
        "@type": "Organization",
        "name": "Annek",
        "url": "https://annek.tech"
      }
    },
    ecommerce: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "E-Commerce Website Design",
      "description": "Professional e-commerce website design and development for online stores.",
      "provider": {
        "@type": "Organization",
        "name": "Annek",
        "url": "https://annek.tech"
      }
    },
    booking: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Booking System Website",
      "description": "Custom booking website design with appointment scheduling system.",
      "provider": {
        "@type": "Organization",
        "name": "Annek",
        "url": "https://annek.tech"
      }
    },
  };
  
  return schemas[serviceName] || null;
};

/**
 * Hreflang tags for multi-language support
 */
export const addHrefLangTags = (languages) => {
  languages.forEach(({ lang, url }) => {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hrefLang = lang;
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Add preconnect for performance and CDN optimization
 */
export const addPreconnectTags = (domains) => {
  domains.forEach((domain) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = domain;
    document.head.appendChild(link);
  });
};
