// Run: node --test tests/settings.test.js   (no database needed; the Settings model is stubbed)
process.env.VERCEL = "1";
process.env.MONGODB_URI = "";
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const adminAuth = require("../middleware/adminAuth");
const Settings = require("../models/Settings");
const app = require("../server");

let base, server;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); mongoose.disconnect().catch(() => {}); });

const fakeVerifier = { verifyIdToken: async (t) => {
  if (t === "admin-token") return { uid: "1", email: "boss@annek.tech", email_verified: true };
  throw new Error("bad token");
} };

let store, writes;
const orig = { findOneAndUpdate: Settings.findOneAndUpdate, find: Settings.find };
test.beforeEach(() => {
  process.env.ADMIN_EMAILS = "boss@annek.tech";
  adminAuth._setVerifierForTests(fakeVerifier);
  store = {}; writes = 0;
  Settings.findOneAndUpdate = async ({ key }, { value }) => { writes++; store[key] = value; return { key, value }; };
  Settings.find = async () => Object.entries(store).map(([key, value]) => ({ key, value }));
});
test.afterEach(() => Object.assign(Settings, orig));

const save = (body, token = "admin-token") => fetch(`${base}/api/settings`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify(body),
}).then(async (r) => ({ status: r.status, body: await r.json() }));

test("saving the Google rating needs an admin", async () => {
  assert.equal((await save({ googleRating: "4.8" }, "nope")).status, 401);
  assert.equal(writes, 0);
});

test("valid Google rating and count are saved, normalised", async () => {
  const r = await save({ googleRating: "5", googleReviewCount: "012" });
  assert.equal(r.status, 200);
  assert.equal(r.body.googleRating, "5.0");
  assert.equal(r.body.googleReviewCount, "12");
  const r2 = await save({ googleRating: " 4.7 ", googleReviewCount: 3 });
  assert.equal(r2.body.googleRating, "4.7");
  assert.equal(r2.body.googleReviewCount, "3");
});

test("empty values clear the badge fields", async () => {
  const r = await save({ googleRating: "", googleReviewCount: "" });
  assert.equal(r.status, 200);
  assert.equal(r.body.googleRating, "");
  assert.equal(r.body.googleReviewCount, "");
});

test("invalid Google rating or count is rejected and nothing is written", async () => {
  for (const body of [
    { googleRating: "0.9" }, { googleRating: "5.1" }, { googleRating: "4.75" }, { googleRating: "abc" },
    { googleRating: "-4" }, { googleRating: "4,5" }, { googleReviewCount: "1.5" }, { googleReviewCount: "-2" },
    { googleReviewCount: "ten" }, { companyName: "X", googleRating: "9" },
  ]) {
    const r = await save(body);
    assert.equal(r.status, 400, JSON.stringify(body));
    assert.match(r.body.error, /Google/);
  }
  assert.equal(writes, 0);
});
