/**
 * SEO Meta Tags Manager
 * Utility to dynamically update meta tags for different pages and sections
 */

export const updateMetaTags = ({
  title = "Annek - Custom Website Design & Development",
  description = "Professional website design and development services. Get custom-built websites starting at $75.",
  keywords = "website design, web development, e-commerce, portfolio",
  url = "https://annek.com",
  image = "https://annek.com/og-image.png",
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
export const pageConfigs = {
  home: {
    title: "Annek - Custom Website Design & Development Services",
    description: "Professional website design and development services. Get custom-built websites, e-commerce stores, portfolios, and booking sites. Fast delivery, SEO-optimized, affordable pricing starting at $75.",
    keywords: "website design, website development, web designer, e-commerce website, portfolio website, booking website, custom website builder, web development agency",
  },
  portfolio: {
    title: "Our Portfolio - Custom Website Projects | Annek",
    description: "View our portfolio of custom websites we've built for businesses. E-commerce sites, portfolios, booking systems, and more. See our best work.",
    keywords: "portfolio websites, web design examples, website projects, custom websites, web design portfolio",
  },
  services: {
    title: "Web Design & Development Services | Annek",
    description: "Our web design and development services include portfolio sites, e-commerce stores, booking systems, and custom websites. Starting at $75 - delivered in 72 hours.",
    keywords: "web design services, web development, website services, e-commerce design, custom web development",
  },
  pricing: {
    title: "Website Design Pricing Plans | Annek",
    description: "Affordable website design pricing starting at $75. Starter, Growth, and Professional plans with different features and support levels.",
    keywords: "website pricing, web design cost, affordable website design, website design packages",
  },
  contact: {
    title: "Contact Annek - Custom Website Design",
    description: "Get in touch with Annek for your custom website project. We respond within 24 hours. Fast, affordable, professional web design services.",
    keywords: "contact web designer, website design inquiry, web development contact",
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
        "url": "https://annek.com"
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
        "url": "https://annek.com"
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
        "url": "https://annek.com"
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
