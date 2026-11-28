/* Shapes of the public site data. Used by the browser (SiteData.jsx) and the pre-render step. */

export const EMPTY_DATA = {
  settings: {}, catalog: null, products: [], portfolio: [], feedback: [], stats: {}, google: null, solutions: {},
};

/* Fields from /api/feedback that the site shows. Everything else (e.g. email) is dropped. */
export const publicFeedback = (list) => (Array.isArray(list) ? list : [])
  .map(({ _id, name, rating, message }) => ({ _id, name, rating, message }));

export const publicPortfolio = (list) => (Array.isArray(list) ? list : []).filter((p) => p.visible !== false);
