// Run: node --test tests/catalog.test.js   (no database needed — models are stubbed)
process.env.VERCEL = "1";
process.env.MONGODB_URI = "";
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const adminAuth = require("../middleware/adminAuth");
const { ServiceCategory, ShowcaseTemplate, ServicePackage, MaintenancePlan, OwnProduct } = require("../models/Catalog");
const Order = require("../models/Order");
const app = require("../server");

let base, server;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); mongoose.disconnect().catch(() => {}); });

const fakeVerifier = { verifyIdToken: async (t) => {
  if (t === "admin-token") return { uid: "1", email: "Boss@Annek.tech", email_verified: true };
  if (t === "user-token") return { uid: "2", email: "someone@gmail.com", email_verified: true };
  throw new Error("bad token");
} };
const call = (path, opts = {}) => fetch(base + path, opts).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null), headers: r.headers }));
const as = (token, extra = {}) => ({ ...extra, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(extra.headers || {}) } });

const orig = {};
function stub(obj, name, fn) { orig[`${obj.modelName}.${name}`] = [obj, name, obj[name]]; obj[name] = fn; }
test.afterEach(() => { for (const [o, n, f] of Object.values(orig)) o[n] = f; });
const q = (v) => ({ sort: () => ({ lean: async () => v }), lean: async () => v, then: (r) => r(v) });

test("admin endpoints fail closed when admin access is not configured", async () => {
  delete process.env.ADMIN_EMAILS; delete process.env.VITE_ADMIN_EMAILS;
  adminAuth._setVerifierForTests(fakeVerifier);
  assert.equal((await call("/api/orders")).status, 503);
});

test("orders list needs an admin token", async () => {
  process.env.ADMIN_EMAILS = "boss@annek.tech";
  adminAuth._setVerifierForTests(fakeVerifier);
  stub(Order, "find", () => ({ sort: async () => [{ name: "x" }] }));
  assert.equal((await call("/api/orders")).status, 401);
  assert.equal((await call("/api/orders", as("garbage"))).status, 401);
  assert.equal((await call("/api/orders", as("user-token"))).status, 403);
  const ok = await call("/api/orders", as("admin-token"));
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("cache-control"), "no-store");
});

test("existing write routes are now protected", async () => {
  process.env.ADMIN_EMAILS = "boss@annek.tech";
  for (const [m, p] of [["POST", "/api/settings"], ["DELETE", "/api/portfolio/abc"], ["GET", "/api/contact"], ["GET", "/api/feedback/all"], ["DELETE", "/api/contact/abc"]]) {
    assert.equal((await call(p, { method: m })).status, 401, `${m} ${p}`);
  }
});

test("public catalog hides items under hidden categories and is CDN cacheable", async () => {
  const main = { _id: new mongoose.Types.ObjectId(), name: "Web", parent: null };
  const sub = { _id: new mongoose.Types.ObjectId(), name: "Shop", parent: main._id };
  const orphan = { _id: new mongoose.Types.ObjectId(), name: "Orphan", parent: new mongoose.Types.ObjectId() };
  stub(ServiceCategory, "find", () => q([main, sub, orphan]));
  stub(ShowcaseTemplate, "find", () => q([{ title: "A", category: sub._id }, { title: "B", category: orphan._id }]));
  stub(ServicePackage, "find", () => q([{ name: "P", category: main._id }]));
  stub(MaintenancePlan, "find", () => q([]));
  const r = await call("/api/catalog");
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.categories.map((c) => c.name), ["Web", "Shop"]);
  assert.deepEqual(r.body.templates.map((t) => t.title), ["A"]);
  assert.equal(r.body.packages.length, 1);
  assert.match(r.headers.get("cache-control"), /s-maxage=300/);
});

test("create category validates parent and strips protected fields", async () => {
  process.env.ADMIN_EMAILS = "boss@annek.tech";
  let created;
  stub(ServiceCategory, "create", async (d) => { created = d; return { _id: "x", ...d }; });
  stub(ServiceCategory, "findById", () => ({ lean: async () => null }));
  const bad = await call("/api/catalog/categories", as("admin-token", { method: "POST", body: JSON.stringify({ name: "X", parent: new mongoose.Types.ObjectId() }) }));
  assert.equal(bad.status, 400);
  const ok = await call("/api/catalog/categories", as("admin-token", { method: "POST", body: JSON.stringify({ name: "Mobile <b>Apps</b>", _id: "hack", slug: "hack", parent: "" }) }));
  assert.equal(ok.status, 201);
  assert.equal(created.name, "Mobile Apps");
  assert.equal(created._id, undefined);
  assert.equal(created.slug, undefined);
  assert.equal(created.parent, null);
  assert.equal((await call("/api/catalog/nope", as("admin-token", { method: "POST", body: "{}" }))).status, 404);
});

test("category with children cannot be deleted", async () => {
  process.env.ADMIN_EMAILS = "boss@annek.tech";
  stub(ServiceCategory, "countDocuments", async () => 2);
  stub(ShowcaseTemplate, "countDocuments", async () => 0);
  stub(ServicePackage, "countDocuments", async () => 1);
  const r = await call(`/api/catalog/categories/${new mongoose.Types.ObjectId()}`, as("admin-token", { method: "DELETE" }));
  assert.equal(r.status, 409);
  assert.equal((await call("/api/catalog/categories/not-an-id", as("admin-token", { method: "DELETE" }))).status, 400);
});

test("model validation: slugs, prices, URLs, plans", async () => {
  const p = new OwnProduct({ name: "Shop Manager Pro!", links: { web: "https://app.annek.tech" }, plans: [{ name: "Pro", price: 9, interval: "month" }] });
  await p.validate();
  assert.equal(p.slug, "shop-manager-pro");
  await assert.rejects(new OwnProduct({ name: "X", links: { android: "javascript:alert(1)" } }).validate());
  await assert.rejects(new OwnProduct({ name: "X", plans: [{ name: "Y", interval: "weekly" }] }).validate());
  await assert.rejects(new ServicePackage({ name: "X", category: new mongoose.Types.ObjectId(), monthlyFee: -5 }).validate());
  await assert.rejects(new ShowcaseTemplate({ title: "No category" }).validate());
});

test("products: public list is cacheable, writes need admin", async () => {
  stub(OwnProduct, "find", () => q([{ name: "A" }]));
  const r = await call("/api/products");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control"), /s-maxage/);
  assert.equal((await call("/api/products", { method: "POST" })).status, 401);
  assert.equal((await call("/api/products/admin")).status, 401);
});
