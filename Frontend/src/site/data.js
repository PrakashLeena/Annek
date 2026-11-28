/* Shapes of the public site data. Used by the browser (SiteData.jsx) and the pre-render step. */

export const EMPTY_DATA = {
  settings: {}, catalog: null, products: [], portfolio: [], feedback: [], stats: {}, google: null, solutions: {}, projects: {},
};

/* Fields from /api/feedback that the site shows. Everything else (e.g. email) is dropped. */
export const publicFeedback = (list) => (Array.isArray(list) ? list : [])
  .map(({ _id, name, rating, message }) => ({ _id, name, rating, message }));

/* Same rule as Backend/services/portfolioSlug.js, for cards from an API that predates slugs. */
export const slugify = (text) => String(text || "")
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/['\u2019`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  .slice(0, 80).replace(/-+$/g, "") || "project";

export const publicPortfolio = (list) => (Array.isArray(list) ? list : [])
  .filter((p) => p && p.visible !== false)
  .map((p) => (p.slug ? p : { ...p, slug: slugify(p.title) }));

/* Data that may be baked into pre-rendered HTML.
   Google content never is: Google's Places terms don't allow storing review text or ratings,
   so the Places reviews and the Google rating (live or typed in Admin › Settings) load in the
   browser only. Only our own content (testimonials, portfolio, settings text) is kept. */
export function prerenderSafe(data) {
  // eslint-disable-next-line no-unused-vars
  const { googleRating, googleReviewCount, ...settings } = data.settings || {};
  return { ...data, settings, google: null };
}
