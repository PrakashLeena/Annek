/**
 * SEO Meta Tags Manager
 * Utility to dynamically update meta tags for different pages and sections
 */

export const updateMetaTags = ({
  title = "Annek | Software Development Company in Sri Lanka",
  description = "Annek is a software development company in Sri Lanka building custom software, web applications and mobile apps for businesses, from idea to launch and beyond.",
  keywords = "software development company, custom software development, web application development, mobile app development, annek",
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
  "software development company", "software development company sri lanka", "software company sri lanka",
  "custom software development", "custom software development sri lanka",
  "web application development sri lanka", "mobile app development sri lanka",
  "software maintenance and support", "annek",
].join(", ");

// Titles: "<Page> | Annek Software Development", max 60 chars. Descriptions: max 155 chars.
export const pageConfigs = {
  home: {
    title: "Annek | Software Development Company in Sri Lanka",
    description: "Annek is a software development company in Sri Lanka building custom software, web applications and mobile apps for businesses, from idea to launch and beyond.",
    keywords: BASE_KEYWORDS,
  },
  services: {
    title: "Services | Annek Software Development",
    description: "Custom software, web applications and mobile apps built for your business by Annek, a software development company in Sri Lanka.",
    keywords: `custom software development, web application development, mobile app development, ${BASE_KEYWORDS}`,
  },
  portfolio: {
    title: "Portfolio | Annek Software Development",
    description: "Software, web applications and mobile apps Annek has built for businesses in Sri Lanka and worldwide.",
    keywords: `software projects, app projects, ${BASE_KEYWORDS}`,
  },
  pricing: {
    title: "Pricing | Annek Software Development",
    description: "Clear pricing for custom software, web applications, mobile apps and websites, with monthly maintenance and support plans.",
    keywords: `software development cost sri lanka, app development cost, maintenance plans, ${BASE_KEYWORDS}`,
  },
  contact: {
    title: "Contact | Annek Software Development",
    description: "Talk to Annek, a software development company in Sri Lanka, about your custom software, web application or mobile app. We reply within 24 hours.",
    keywords: `contact software company sri lanka, hire software developers sri lanka, ${BASE_KEYWORDS}`,
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
      "name": "Ecommerce Website Design",
      "description": "Professional ecommerce website design and development for online stores.",
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
