// Run: node --test tests/portfolio.test.js   (no database or Cloudinary needed: both are stubbed)
process.env.VERCEL = "1";
process.env.MONGODB_URI = "";
process.env.CLOUDINARY_CLOUD_NAME = "democloud";
process.env.CLOUDINARY_API_KEY = "111";
process.env.CLOUDINARY_API_SECRET = "test-secret";
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const adminAuth = require("../middleware/adminAuth");
const Portfolio = require("../models/Portfolio");
const cloudinary = require("../config/cloudinary");
const { slugify, uniqueSlug } = require("../services/portfolioSlug");
const { pick } = require("../services/portfolioFields");
const app = require("../server");

let base, server;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
  process.env.ADMIN_EMAILS = "boss@annek.tech";
  adminAuth._setVerifierForTests({ verifyIdToken: async (t) => {
    if (t === "admin-token") return { uid: "1", email: "boss@annek.tech", email_verified: true };
    throw new Error("bad token");
  } });
});
test.after(() => { server.close(); mongoose.disconnect().catch(() => {}); });

const call = (path, opts = {}) => fetch(base + path, opts).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null), headers: r.headers }));
const admin = (method, body) => ({ method, headers: { "Content-Type": "application/json", Authorization: "Bearer admin-token" }, ...(body ? { body: JSON.stringify(body) } : {}) });

const orig = [];
function stub(obj, name, fn) { orig.push([obj, name, obj[name]]); obj[name] = fn; }
test.afterEach(() => { while (orig.length) { const [o, n, f] = orig.pop(); o[n] = f; } });

const IMG = (id) => `https://res.cloudinary.com/democloud/image/upload/v1700000000/annek/portfolio/${id}.webp`;
const oid = () => new mongoose.Types.ObjectId().toString();

/* ── slugs ── */

test("slugify makes clean URL slugs", () => {
  assert.equal(slugify("St.Anne's PPA"), "st-annes-ppa");
  assert.equal(slugify("  AGL Tamil Trading!! "), "agl-tamil-trading");
  assert.equal(slugify("Café Délice"), "cafe-delice");
  assert.equal(slugify("***"), "project");
  assert.ok(slugify("x".repeat(200)).length <= 80);
});

test("uniqueSlug skips slugs used now or before by other projects", async () => {
  const taken = new Set(["shop", "shop-2"]);
  let lastFilter;
  stub(Portfolio, "exists", async (f) => { lastFilter = f; return taken.has(f.$or[0].slug) ? { _id: "x" } : null; });
  assert.equal(await uniqueSlug("Shop"), "shop-3");
  assert.deepEqual(lastFilter.$or[1], { previousSlugs: "shop-3" }, "old slugs count as taken");
  const me = oid();
  await uniqueSlug("Other", me);
  assert.deepEqual(lastFilter._id, { $ne: me }, "a project never clashes with itself");
});

/* ── validation ── */

test("liveUrl, video and images must be https", () => {
  const ok = pick({ title: "A", category: "Web", liveUrl: "https://demo.example", images: [IMG("a")] }, { partial: false });
  assert.equal(ok.liveUrl, "https://demo.example");
  assert.equal(ok.imageUrl, IMG("a"), "the original imageUrl follows the cover");
  for (const bad of [{ liveUrl: "http://insecure.example" }, { liveUrl: "javascript:alert(1)" }, { liveUrl: "ftp://x.example" }, { video: "http://x.example/v.mp4" }, { images: ["http://x.example/a.png"] }]) {
    assert.throws(() => pick({ title: "A", category: "Web", ...bad }, { partial: false }), /https/, JSON.stringify(bad));
  }
  assert.equal(pick({ liveUrl: "" }, { partial: true }).liveUrl, "", "a link can be removed");
});

test("other fields are checked and unknown ones dropped", () => {
  const p = pick({ title: "A", category: "Web", type: "web", summary: "s", techStack: "React, Node , React", year: "2025", published: false, hacker: 1 }, { partial: false });
  assert.deepEqual(p.techStack, ["React", "Node"]);
  assert.equal(p.year, 2025);
  assert.equal(p.visible, false, "published is an alias of visible");
  assert.equal(p.hacker, undefined);
  const bad = (b) => assert.throws(() => pick({ title: "A", category: "Web", ...b }, { partial: false }));
  bad({ type: "games" });
  bad({ summary: "x".repeat(156) });
  bad({ slug: "Bad Slug" });
  bad({ slug: "double--hyphen" });
  bad({ year: 1800 });
  bad({ images: Array.from({ length: 11 }, (_, i) => IMG(i)) });
  bad({ title: "" });
});

/* ── public endpoints ── */

test("GET /api/portfolio lists published projects only, card fields, with slugs", async () => {
  let filter;
  stub(Portfolio, "find", (f) => { filter = f; return { sort: () => ({ lean: async () => [
    { _id: "1", title: "St.Anne's PPA", category: "Association Site", desc: "Old text", imageUrl: IMG("old"), description: "long", liveUrl: "https://x.example" },
    { _id: "2", title: "Shop", slug: "my-shop", category: "Web", summary: "New", images: [IMG("c"), IMG("d")] },
  ] }) }; });
  const r = await call("/api/portfolio");
  assert.equal(r.status, 200);
  assert.deepEqual(filter, { visible: { $ne: false } });
  assert.equal(r.body[0].slug, "st-annes-ppa", "fallback slug before the backfill");
  assert.equal(r.body[0].summary, "Old text", "summary falls back to desc");
  assert.equal(r.body[0].imageUrl, IMG("old"));
  assert.equal(r.body[0].description, undefined, "cards carry no page only fields");
  assert.equal(r.body[0].liveUrl, undefined);
  assert.equal(r.body[1].slug, "my-shop");
  assert.equal(r.body[1].imageUrl, IMG("c"), "cover is the first image");
});

test("GET /api/portfolio/:slug finds by slug, old slug or title fallback; published only", async () => {
  const docs = [
    { _id: "1", title: "Shop", slug: "shop-online", previousSlugs: ["shop"], category: "Web", images: [IMG("a")], liveUrl: "https://shop.example", visible: true },
    { _id: "2", title: "St.Anne's PPA", category: "Association Site", imageUrl: IMG("b"), visible: true },
    { _id: "3", title: "Secret", slug: "secret", category: "Web", visible: false },
  ];
  const published = (d) => d.visible !== false;
  stub(Portfolio, "findOne", (f) => ({ lean: async () => {
    assert.deepEqual(f.visible, { $ne: false }, "only published projects are looked up");
    return docs.find((d) => published(d) && (f.slug ? d.slug === f.slug : (d.previousSlugs || []).includes(f.previousSlugs))) || null;
  } }));
  stub(Portfolio, "find", (f) => ({ sort: () => ({ lean: async () => docs.filter((d) => published(d) && !d.slug && f.slug.$exists === false) }) }));

  const now = await call("/api/portfolio/shop-online");
  assert.equal(now.status, 200);
  assert.equal(now.body.slug, "shop-online");
  assert.equal(now.body.liveUrl, "https://shop.example");
  assert.deepEqual(now.body.images, [IMG("a")]);

  const old = await call("/api/portfolio/shop");
  assert.equal(old.status, 200);
  assert.equal(old.body.slug, "shop-online", "an old slug answers with the new slug so the page can redirect");

  const fallback = await call("/api/portfolio/st-annes-ppa");
  assert.equal(fallback.status, 200);
  assert.deepEqual(fallback.body.images, [IMG("b")], "old single image becomes the gallery");

  assert.equal((await call("/api/portfolio/secret")).status, 404, "unpublished stays hidden");
  assert.equal((await call("/api/portfolio/nothing-here")).status, 404);
  assert.equal((await call("/api/portfolio/Bad%20Slug")).status, 404);
});

/* ── admin ── */

test("admin routes need an admin token", async () => {
  for (const [m, p] of [["GET", "/api/admin/portfolio"], ["POST", "/api/admin/portfolio"], ["PATCH", `/api/admin/portfolio/${oid()}`], ["DELETE", `/api/admin/portfolio/${oid()}`], ["POST", "/api/admin/portfolio/reorder"], ["POST", "/api/admin/portfolio/upload-signature"], ["GET", "/api/admin/portfolio/slug-check?slug=a"], ["POST", "/api/portfolio"], ["PUT", `/api/portfolio/${oid()}`], ["DELETE", `/api/portfolio/${oid()}`]]) {
    assert.equal((await call(p, { method: m })).status, 401, `${m} ${p}`);
  }
});

test("create: slug from title, made unique; a taken custom slug is refused", async () => {
  let created;
  stub(Portfolio, "exists", async (f) => (["shop"].includes(f.$or[0].slug) ? { _id: "x" } : null));
  stub(Portfolio, "findOne", () => ({ sort: () => ({ select: () => ({ lean: async () => ({ order: 2 }) }) }) }));
  stub(Portfolio, "create", async (d) => { created = d; return { toObject: () => ({ _id: "n", ...d }) }; });
  const r = await call("/api/admin/portfolio", admin("POST", { title: "Shop", category: "Web", liveUrl: "https://shop.example", images: [IMG("a")] }));
  assert.equal(r.status, 201);
  assert.equal(created.slug, "shop-2");
  assert.equal(created.order, 3, "new projects go to the end");
  assert.equal(r.body.slug, "shop-2");

  const taken = await call("/api/admin/portfolio", admin("POST", { title: "Other", category: "Web", slug: "shop" }));
  assert.equal(taken.status, 409);
  assert.match(taken.body.error, /annek\.tech\/portfolio\/shop/);
  assert.equal((await call("/api/admin/portfolio", admin("POST", { title: "X", category: "Web", liveUrl: "http://x.example" }))).status, 400);
});

test("changing a slug keeps the old one; unchanged files stay, dropped files are deleted", async () => {
  const destroyed = [];
  stub(cloudinary.uploader, "destroy", async (id) => { destroyed.push(id); return { result: "ok" }; });
  stub(Portfolio, "exists", async () => null);
  const doc = {
    _id: oid(), title: "Shop", slug: "shop", previousSlugs: ["shop-old"], images: [IMG("a"), IMG("b")], imageUrl: IMG("a"), video: "",
    set(d) { Object.assign(this, d); }, save: async () => {}, toObject() { return { ...this }; },
  };
  stub(Portfolio, "findById", async () => doc);
  const r = await call(`/api/admin/portfolio/${doc._id}`, admin("PATCH", { slug: "shop-online", images: [IMG("b")] }));
  assert.equal(r.status, 200);
  assert.equal(doc.slug, "shop-online");
  assert.deepEqual(doc.previousSlugs.sort(), ["shop", "shop-old"]);
  assert.equal(doc.imageUrl, IMG("b"));
  assert.deepEqual(destroyed, ["annek/portfolio/a"]);

  // Switching back to an old slug takes it out of previousSlugs.
  await call(`/api/admin/portfolio/${doc._id}`, admin("PATCH", { slug: "shop" }));
  assert.equal(doc.slug, "shop");
  assert.deepEqual(doc.previousSlugs.sort(), ["shop-old", "shop-online"]);
});

test("saving an older project stores its fallback slug", async () => {
  stub(Portfolio, "exists", async () => null);
  const doc = { _id: oid(), title: "St.Anne's PPA", set(d) { Object.assign(this, d); }, save: async () => {}, toObject() { return { ...this }; } };
  stub(Portfolio, "findById", async () => doc);
  const r = await call(`/api/admin/portfolio/${doc._id}`, admin("PATCH", { summary: "Alumni site" }));
  assert.equal(r.status, 200);
  assert.equal(doc.slug, "st-annes-ppa");
  assert.deepEqual(doc.previousSlugs, [], "the fallback is not an old link to keep");
});

test("slug-check and upload signature for the portfolio folder", async () => {
  stub(Portfolio, "exists", async (f) => (f.$or[0].slug === "taken" ? { _id: "x" } : null));
  assert.deepEqual((await call("/api/admin/portfolio/slug-check?slug=Taken", admin("GET"))).body, { slug: "taken", free: false });
  assert.deepEqual((await call("/api/admin/portfolio/slug-check?slug=New%20One", admin("GET"))).body, { slug: "new-one", free: true });

  const r = await call("/api/admin/portfolio/upload-signature", admin("POST", { kind: "image" }));
  assert.equal(r.status, 200);
  assert.equal(r.body.folder, "annek/portfolio");
  const expected = cloudinary.utils.api_sign_request({ allowed_formats: r.body.allowedFormats, folder: "annek/portfolio", timestamp: r.body.timestamp }, "test-secret");
  assert.equal(r.body.signature, expected);
});

test("discard-uploads only deletes unsaved files in the portfolio folder", async () => {
  const destroyed = [];
  stub(cloudinary.uploader, "destroy", async (id) => { destroyed.push(id); return { result: "ok" }; });
  stub(Portfolio, "find", () => ({ select: () => ({ lean: async () => [{ images: [IMG("kept")] }] }) }));
  const r = await call("/api/admin/portfolio/discard-uploads", admin("POST", { urls: [IMG("orphan"), IMG("kept"), "https://res.cloudinary.com/democloud/image/upload/v1/annek/solutions/x.png"] }));
  assert.equal(r.status, 200);
  assert.deepEqual(destroyed, ["annek/portfolio/orphan"]);
});
