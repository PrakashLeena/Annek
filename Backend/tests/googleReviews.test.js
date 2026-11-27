// Run: node --test tests/googleReviews.test.js   (Google is stubbed; no network, no database)
process.env.VERCEL = "1";
process.env.MONGODB_URI = "";
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const googleReviews = require("../routes/googleReviews");
const app = require("../server");

let base, server;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); mongoose.disconnect().catch(() => {}); });
test.beforeEach(() => {
  googleReviews._clearCacheForTests();
  process.env.GOOGLE_PLACES_API_KEY = "test-key-123";
  process.env.GOOGLE_PLACE_ID = "ChIJtestPlace";
  delete process.env.GOOGLE_REVIEWS_CACHE_SECONDS;
});
test.afterEach(() => googleReviews._setFetchForTests(null));

const call = () => fetch(`${base}/api/google-reviews`).then(async (r) => ({ status: r.status, text: await r.text(), headers: r.headers }));
const EMPTY = { rating: null, userRatingCount: 0, googleMapsUri: null, reviews: [] };

const PLACE = {
  rating: 4.6,
  userRatingCount: 12,
  googleMapsUri: "https://maps.google.com/?cid=1",
  reviews: [
    {
      name: "places/ChIJtestPlace/reviews/abc",
      rating: 5,
      relativePublishTimeDescription: "2 weeks ago",
      publishTime: "2026-11-10T10:00:00Z",
      text: { text: "<script>alert(1)</script> Great team", languageCode: "en" },
      originalText: { text: "<script>alert(1)</script> Great team", languageCode: "en" },
      authorAttribution: { displayName: "Ana", uri: "https://www.google.com/maps/contrib/1", photoUri: "https://lh3.googleusercontent.com/a/x" },
      googleMapsUri: "https://www.google.com/maps/reviews/abc",
      flagContentUri: "https://www.google.com/local/review/rap/report?abc",
    },
    { name: "places/ChIJtestPlace/reviews/def", rating: 1, text: { text: "Slow reply", languageCode: "en" },
      authorAttribution: { displayName: "Bo", uri: "javascript:alert(1)" } },
  ],
};

test("success: calls Places (New) with the key and a narrow field mask, returns all reviews", async () => {
  let seen;
  googleReviews._setFetchForTests(async (url, opts) => { seen = { url, opts }; return new Response(JSON.stringify(PLACE), { status: 200 }); });
  const r = await call();
  assert.equal(r.status, 200);
  assert.equal(seen.url, "https://places.googleapis.com/v1/places/ChIJtestPlace");
  assert.equal(seen.opts.headers["X-Goog-Api-Key"], "test-key-123");
  assert.equal(seen.opts.headers["X-Goog-FieldMask"], "rating,userRatingCount,reviews,googleMapsUri");
  const body = JSON.parse(r.text);
  assert.equal(body.rating, 4.6);
  assert.equal(body.userRatingCount, 12);
  assert.equal(body.googleMapsUri, "https://maps.google.com/?cid=1");
  assert.equal(body.reviews.length, 2, "low ratings are not filtered out");
  assert.equal(body.reviews[1].rating, 1);
  assert.equal(body.reviews[0].authorName, "Ana");
  assert.equal(body.reviews[0].googleMapsUri, "https://www.google.com/maps/reviews/abc");
  assert.equal(body.reviews[1].authorUri, null, "non https links are dropped");
  assert.ok(!r.text.includes("test-key-123"), "key never reaches the client");
  assert.match(r.headers.get("cache-control"), /s-maxage=10800/);
});

test("success response is cached in memory", async () => {
  let calls = 0;
  googleReviews._setFetchForTests(async () => { calls++; return new Response(JSON.stringify(PLACE), { status: 200 }); });
  await call(); await call();
  assert.equal(calls, 1);
});

test("GOOGLE_REVIEWS_CACHE_SECONDS=0 disables caching", async () => {
  process.env.GOOGLE_REVIEWS_CACHE_SECONDS = "0";
  let calls = 0;
  googleReviews._setFetchForTests(async () => { calls++; return new Response(JSON.stringify(PLACE), { status: 200 }); });
  const r = await call(); await call();
  assert.equal(calls, 2);
  assert.equal(r.headers.get("cache-control"), "no-store");
});

test("missing key or place ID: empty result, Google is not called", async () => {
  let called = false;
  googleReviews._setFetchForTests(async () => { called = true; return new Response("{}"); });
  delete process.env.GOOGLE_PLACES_API_KEY;
  let r = await call();
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(r.text), EMPTY);
  process.env.GOOGLE_PLACES_API_KEY = "k"; delete process.env.GOOGLE_PLACE_ID;
  r = await call();
  assert.deepEqual(JSON.parse(r.text), EMPTY);
  assert.equal(called, false);
});

test("Google error status or network failure: empty result, no leak", async () => {
  googleReviews._setFetchForTests(async () => new Response(JSON.stringify({ error: { message: "API key test-key-123 invalid" } }), { status: 403 }));
  let r = await call();
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(r.text), EMPTY);
  assert.ok(!r.text.includes("test-key-123"));
  assert.match(r.headers.get("cache-control"), /s-maxage=300/);

  googleReviews._setFetchForTests(async () => { throw new Error("ECONNRESET"); });
  r = await call();
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(r.text), EMPTY);
});
