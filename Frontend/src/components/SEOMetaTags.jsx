import { useEffect } from "react";
import { updateMetaTags, addStructuredData, pageConfigs } from "../utils/seoManager";

const SITE = "https://annek.tech/";

/**
 * Keeps <title>, description, keywords and social tags in sync with the section in view.
 * `overrides` = settings from Admin › Settings (seoTitle, seoDescription, seoKeywords) — applied to the home page.
 * The canonical URL always stays the home page: hash sections are not separate pages for Google.
 */
export const SEOMetaTags = ({
  page = "home",
  overrides = {},
  customTitle = null,
  customDescription = null,
  customKeywords = null,
  customImage = null,
  type = "website",
  structuredData = null,
}) => {
  const { seoTitle, seoDescription, seoKeywords } = overrides || {};
  useEffect(() => {
    const config = pageConfigs[page] || pageConfigs.home;
    const isHome = !pageConfigs[page] || page === "home";
    updateMetaTags({
      title: customTitle || (isHome && seoTitle) || config.title,
      description: customDescription || (isHome && seoDescription) || config.description,
      keywords: customKeywords || [seoKeywords, config.keywords].filter(Boolean).join(", "),
      url: SITE,
      image: customImage || `${SITE}og-image.png`,
      type,
    });
    if (structuredData) addStructuredData(structuredData);
  }, [page, seoTitle, seoDescription, seoKeywords, customTitle, customDescription, customKeywords, customImage, structuredData, type]);

  return null;
};

export default SEOMetaTags;
