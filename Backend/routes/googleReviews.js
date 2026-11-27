// GET /api/google-reviews
// Server side proxy for Google Places API (New) Place Details, limited to the review fields.
// The API key (GOOGLE_PLACES_API_KEY) never leaves the server.
// If the key or place ID is missing, or Google fails, the endpoint answers 200 with an empty
// result so the site still renders.
const express = require("express");
const router = express.Router();

const FIELD_MASK = "rating,userRatingCount,reviews,googleMapsUri";
const EMPTY_TTL = 300; // retry Google after 5 minutes when we had nothing to show

// How long a good response is reused (memory + CDN). Google's Places policy has no caching
// exception for reviews or ratings, so this is configurable: GOOGLE_REVIEWS_CACHE_SECONDS=0 turns it off.
function cacheSeconds() {
  const v = Number.parseInt(process.env.GOOGLE_REVIEWS_CACHE_SECONDS ?? "", 10);
  return Number.isFinite(v) && v >= 0 ? Math.min(v, 86400) : 3 * 3600;
}

const empty = () => ({ rating: null, userRatingCount: 0, googleMapsUri: null, reviews: [] });

let fetchImpl = (...a) => fetch(...a);
let cache = null; // { key, expires, data }

const str = (v, max = 4000) => (typeof v === "string" ? v.slice(0, max) : null);
const httpsUrl = (v) => {
  if (typeof v !== "string") return null;
  try { const u = new URL(v); return u.protocol === "https:" ? u.href : null; } catch { return null; }
};

// Keep only what the site shows. Text stays plain text; React escapes it when rendering.
function shape(place) {
  const reviews = Array.isArray(place?.reviews) ? place.reviews : [];
  return {
    rating: typeof place?.rating === "number" ? place.rating : null,
    userRatingCount: Number.isInteger(place?.userRatingCount) ? place.userRatingCount : 0,
    googleMapsUri: httpsUrl(place?.googleMapsUri),
    reviews: reviews.map((r, i) => ({
      id: str(r?.name, 300) || `review-${i}`,
      rating: Math.max(0, Math.min(5, Math.round(Number(r?.rating) || 0))),
      text: str(r?.text?.text) || str(r?.originalText?.text) || "",
      translated: !!(r?.originalText?.text && r?.text?.text && r.originalText.languageCode !== r.text.languageCode),
      relativeTime: str(r?.relativePublishTimeDescription, 80),
      publishTime: str(r?.publishTime, 40),
      visitDate: r?.visitDate && Number.isInteger(r.visitDate.year)
        ? { year: r.visitDate.year, month: Number.isInteger(r.visitDate.month) ? r.visitDate.month : null }
        : null,
      authorName: str(r?.authorAttribution?.displayName, 120) || "Google user",
      authorUri: httpsUrl(r?.authorAttribution?.uri),
      authorPhotoUri: httpsUrl(r?.authorAttribution?.photoUri),
      googleMapsUri: httpsUrl(r?.googleMapsUri),
      flagContentUri: httpsUrl(r?.flagContentUri),
    })),
  };
}

async function loadFromGoogle(key, placeId) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetchImpl(url, {
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Places API responded ${res.status}`);
  return shape(await res.json());
}

router.get("/", async (req, res) => {
  const key = (process.env.GOOGLE_PLACES_API_KEY || "").trim();
  const placeId = (process.env.GOOGLE_PLACE_ID || "").trim();
  const send = (data, ttl) => {
    res.set("Cache-Control", ttl > 0 ? `public, max-age=300, s-maxage=${ttl}, stale-while-revalidate=600` : "no-store");
    res.json(data);
  };

  if (!key || !placeId) return send(empty(), EMPTY_TTL);

  const ttl = cacheSeconds();
  const cacheKey = placeId;
  if (ttl > 0 && cache && cache.key === cacheKey && cache.expires > Date.now()) {
    return send(cache.data, Math.ceil((cache.expires - Date.now()) / 1000));
  }

  try {
    const data = await loadFromGoogle(key, placeId);
    if (ttl > 0) cache = { key: cacheKey, expires: Date.now() + ttl * 1000, data };
    send(data, ttl);
  } catch (err) {
    // Never echo Google's error body (it can mention the key's project); log the status only.
    console.error("google-reviews:", err.message);
    send(empty(), EMPTY_TTL);
  }
});

module.exports = router;
module.exports._setFetchForTests = (fn) => { fetchImpl = fn || ((...a) => fetch(...a)); };
module.exports._clearCacheForTests = () => { cache = null; };
