// Google rating badge data, typed into Admin > Settings (no Google API).
export const GOOGLE_REVIEW_URL = "https://g.page/r/CauKhIX6AGnKEAI/review";

export function parseGoogleRating(settings) {
  const rating = Number.parseFloat(settings?.googleRating);
  const count = Number.parseInt(settings?.googleReviewCount, 10);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
  if (!Number.isInteger(count) || count < 1) return null;
  return { rating: Math.round(rating * 10) / 10, count };
}
