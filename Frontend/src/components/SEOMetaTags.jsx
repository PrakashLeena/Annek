import { useEffect } from "react";
import { updateMetaTags, addStructuredData, pageConfigs } from "../utils/seoManager";

/**
 * SEO Component - Updates meta tags when component mounts
 * Usage: <SEOMetaTags page="home" customTitle="Custom Title" />
 */
export const SEOMetaTags = ({
  page = "home",
  customTitle = null,
  customDescription = null,
  customKeywords = null,
  customUrl = null,
  customImage = null,
  type = "website",
  structuredData = null,
}) => {
  useEffect(() => {
    const config = pageConfigs[page] || pageConfigs.home;
    
    updateMetaTags({
      title: customTitle || config.title,
      description: customDescription || config.description,
      keywords: customKeywords || config.keywords,
      url: customUrl || `https://annek.com/#${page === "home" ? "" : page}`,
      image: customImage || "https://annek.com/og-image.png",
      type,
    });

    // Add custom structured data if provided
    if (structuredData) {
      addStructuredData(structuredData);
    }
  }, [page, customTitle, customDescription, customUrl, structuredData, type, customKeywords, customImage]);

  return null; // This component only manages meta tags
};

export default SEOMetaTags;
