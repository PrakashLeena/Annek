/**
 * HOW TO INTEGRATE SEO COMPONENTS IN APP.JSX
 *
 * This file shows example implementations of the SEO utilities
 * in your React application.
 *
 * NOTE: All code below is commented out as examples.
 * Copy and adapt the code examples to your own components.
 */

// ============================================
// EXAMPLE 1: BASIC USAGE IN APP.JSX
// ============================================
/*
import { SEOMetaTags } from './components/SEOMetaTags';

export default function App() {
  return (
    <>
      <SEOMetaTags page="home" />
      
      // Rest of your app
      
    </>
  );
}
*/

// ============================================
// EXAMPLE 2: DYNAMIC META TAGS BY PAGE
// ============================================
/*
const pageMap = {
  home: "home",
  portfolio: "portfolio",
  services: "services",
  pricing: "pricing",
  contact: "contact",
};

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <>
      <SEOMetaTags page={pageMap[currentPage]} />
      
      // Navigation and page content
      
    </>
  );
}
*/

// ============================================
// EXAMPLE 3: WITH CUSTOM TITLE AND DESCRIPTION
// ============================================
/*
<SEOMetaTags
  page="portfolio"
  customTitle="Our Best Web Design Work | Annek Portfolio"
  customDescription="See our collection of custom websites for businesses, e-commerce stores, and portfolios. Explore our portfolio of successful projects."
  customKeywords="portfolio, web design examples, case studies"
/>
*/

// ============================================
// EXAMPLE 4: ADDING STRUCTURED DATA FOR SERVICES
// ============================================
/*
import { getServiceSchema } from "./utils/seoManager";

export default function PortfolioSection() {
  useEffect(() => {
    const schema = getServiceSchema("ecommerce");

    if (schema) {
      addStructuredData(schema);
    }
  }, []);

  return (
    // Your portfolio items
  );
}
*/

// ============================================
// EXAMPLE 5: CUSTOM STRUCTURED DATA
// ============================================
/*
const customSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://annek.com"
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Portfolio",
      item: "https://annek.com#portfolio"
    }
  ]
};

<SEOMetaTags
  page="portfolio"
  structuredData={customSchema}
/>
*/

// ============================================
// EXAMPLE 6: SECTION-LEVEL SEO UPDATES
// ============================================
/*
function PortfolioGrid({ projects }) {
  useEffect(() => {
    updateMetaTags({
      title: "Web Design Portfolio | Annek",
      description: `Explore ${projects.length} custom websites we've built`,
      keywords: "portfolio, web design, custom websites",
    });

    const portfolioSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Portfolio",
      description: "Custom websites we've built for clients",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: projects.length,
        itemListElement: projects.map((p, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: p.url,
          name: p.name,
          description: p.description,
          image: p.image
        }))
      }
    };

    addStructuredData(portfolioSchema);
  }, [projects]);

  return (
    // Your portfolio grid
  );
}
*/

// ============================================
// EXAMPLE 7: BLOG POST SEO
// ============================================
/*
function BlogPost({ post }) {
  useEffect(() => {
    updateMetaTags({
      title: post.title,
      description: post.excerpt,
      keywords: post.tags.join(", "),
      url: `https://annek.com/blog/${post.slug}`,
      image: post.featuredImage,
    });

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: post.featuredImage,
      datePublished: post.publishDate,
      dateModified: post.updatedDate,
      author: {
        "@type": "Organization",
        name: "Annek"
      }
    };

    addStructuredData(articleSchema);
  }, [post]);

  return (
    // Your blog post content
  );
}
*/

// ============================================
// EXAMPLE 8: IMAGE ALT TEXT BEST PRACTICES
// ============================================
/*

❌ BAD - No alt text or generic

<img src="/portfolio.png" alt="portfolio" />

✅ GOOD - Descriptive alt text

<img
  src="/portfolio.png"
  alt="Custom e-commerce website design for online store with product gallery and checkout system"
/>

✅ EXCELLENT - Descriptive + SEO

<img
  src="/portfolio.png"
  alt="Professional e-commerce website design - responsive online store with product filters, shopping cart, and secure payment gateway built with React and Node.js"
  title="E-Commerce Website Design Portfolio"
/>

*/

// ============================================
// EXAMPLE 9: INTERNAL LINKING FOR SEO
// ============================================
/*
function ServiceLinks() {
  return (
    <>
      <a href="#services/ecommerce">
        Professional e-commerce website design services
      </a>

      <a href="#portfolio/ecommerce">
        See our e-commerce portfolio projects
      </a>

      // Avoid generic links - they don't help SEO
      // <a href="#services">click here</a>

    </>
  );
}
*/

// ============================================
// EXAMPLE 10: PERFORMANCE-AWARE SEO
// ============================================
/*
import { addPreconnectTags } from "./utils/seoManager";

useEffect(() => {
  addPreconnectTags([
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "https://cdn.example.com"
  ]);
}, []);

// Also in your index.html, add:
//
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link rel="preconnect" href="https://fonts.gstatic.com">
*/

// ============================================
// CHECKLIST FOR INTEGRATION
// ============================================
/*
SEO INTEGRATION CHECKLIST:

□ Install React Helmet (optional, if using)
  npm install react-helmet

□ Import SEOMetaTags component in App.jsx
  import { SEOMetaTags } from './components/SEOMetaTags';

□ Add SEOMetaTags to main App component
  <SEOMetaTags page="home" />

□ Add SEOMetaTags to each major section/page
  - Portfolio section: page="portfolio"
  - Services section: page="services"
  - Pricing section: page="pricing"
  - Contact section: page="contact"

□ Add descriptive alt text to all images
  <img src="..." alt="descriptive text describing image content" />

□ Add internal links with descriptive anchor text
  <a href="/about">Learn about our web design services</a>

□ Update LocalBusiness schema with real info
  - Address, phone, email, hours in index.html

□ Create og-image.png (1200x630px)
  - For social media sharing

□ Create apple-touch-icon.png (180x180px)
  - For iOS bookmark icon

□ Test with:
  - Google PageSpeed Insights
  - Google Mobile-Friendly Test
  - Schema Markup Validator
  - Google Search Console

□ Submit sitemap to search engines
  - Google Search Console
  - Bing Webmaster Tools

□ Monitor with:
  - Google Analytics
  - Google Search Console
  - Core Web Vitals
*/

export const SEO_INTEGRATION_GUIDE = {
  checklist: "See above",
  components: {
    SEOMetaTags: "Main component for managing meta tags",
    seoManager: "Utility functions for SEO operations",
  },
  utils: {
    updateMetaTags: "Update meta tags dynamically",
    addStructuredData: "Add JSON-LD schema markup",
    addGeoMetaTags: "Add geographic targeting tags",
    addHrefLangTags: "Add multi-language support",
    addPreconnectTags: "Optimize performance with preconnect",
  },
};
