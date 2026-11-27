// Run: node --test tests/solutions.test.js   (no database or Cloudinary needed: both are stubbed)
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
const Solution = require("../models/Solution");
const cloudinary = require("../config/cloudinary");
const media = require("../services/solutionMedia");
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

const IMG = (id) => `https://res.cloudinary.com/democloud/image/upload/v1700000000/annek/solutions/${id}.webp`;
const VID = "https://res.cloudinary.com/democloud/video/upload/v1700000000/annek/solutions/clip.mp4";

test("public list: published only, category filter, liveUrl hidden outside web", async () => {
  let filter;
  stub(Solution, "find", (f) => { filter = f; return { select: () => ({ sort: () => ({ lean: async () => [
    { category: "web", title: "Shop", liveUrl: "https://demo.example" },
    { category: "mobile", title: "App", liveUrl: "https://should-hide.example" },
  ] }) }) }; });
  const r = await call("/api/solutions?category=web");
  assert.equal(r.status, 200);
  assert.deepEqual(filter, { published: true, category: "web" });
  assert.equal(r.body[0].liveUrl, "https://demo.example");
  assert.equal(r.body[1].liveUrl, "");
  assert.match(r.headers.get("cache-control"), /s-maxage=30/);
  assert.equal((await call("/api/solutions?category=games")).status, 400);
});

test("admin routes need an admin token", async () => {
  for (const [m, p] of [["GET", "/api/admin/solutions"], ["POST", "/api/admin/solutions"], ["PATCH", "/api/admin/solutions/abc"], ["DELETE", "/api/admin/solutions/abc"], ["POST", "/api/admin/solutions/reorder"], ["POST", "/api/admin/solutions/upload-signature"]]) {
    assert.equal((await call(p, { method: m })).status, 401, `${m} ${p}`);
  }
});

test("create validates category, lengths and https URLs", async () => {
  let created;
  stub(Solution, "findOne", () => ({ sort: () => ({ select: () => ({ lean: async () => ({ order: 4 }) }) }) }));
  stub(Solution, "create", async (d) => { created = d; return { _id: "x", ...d }; });
  const ok = await call("/api/admin/solutions", admin("POST", { category: "web", title: "Shop", purpose: "Sell online", images: [IMG("a")], liveUrl: "https://demo.example", published: true, hacker: 1 }));
  assert.equal(ok.status, 201);
  assert.equal(created.order, 5, "new items go to the end");
  assert.equal(created.hacker, undefined, "unknown fields are dropped");

  const bad = async (body) => (await call("/api/admin/solutions", admin("POST", { category: "web", title: "T", ...body }))).status;
  assert.equal(await bad({ category: "games" }), 400);
  assert.equal(await bad({ title: "" }), 400);
  assert.equal(await bad({ purpose: "x".repeat(161) }), 400);
  assert.equal(await bad({ liveUrl: "http://insecure.example" }), 400);
  assert.equal(await bad({ video: "javascript:alert(1)" }), 400);
  assert.equal(await bad({ images: Array.from({ length: 9 }, (_, i) => IMG(i)) }), 400);
  assert.equal(await bad({ published: "yes" }), 400);
});

test("patch removes files that were dropped; delete removes all files", async () => {
  const destroyed = [];
  stub(cloudinary.uploader, "destroy", async (id, o) => { destroyed.push(`${o.resource_type}:${id}`); return { result: "ok" }; });
  const doc = { images: [IMG("a"), IMG("b")], video: VID, set(d) { Object.assign(this, d); }, save: async () => {} };
  stub(Solution, "findById", async () => doc);
  const id = new mongoose.Types.ObjectId().toString();
  const r = await call(`/api/admin/solutions/${id}`, admin("PATCH", { images: [IMG("b")], video: "https://youtu.be/abc" }));
  assert.equal(r.status, 200);
  assert.deepEqual(destroyed.sort(), ["image:annek/solutions/a", "video:annek/solutions/clip"]);

  destroyed.length = 0;
  stub(Solution, "findByIdAndDelete", () => ({ lean: async () => ({ images: [IMG("b")], video: "https://youtu.be/abc" }) }));
  const d = await call(`/api/admin/solutions/${id}`, admin("DELETE"));
  assert.equal(d.status, 200);
  assert.deepEqual(destroyed, ["image:annek/solutions/b"], "YouTube links are not storage files");
});

test("reorder writes positions within the category", async () => {
  let ops;
  stub(Solution, "bulkWrite", async (o) => { ops = o; });
  stub(Solution, "find", () => ({ sort: () => ({ lean: async () => [] }) }));
  const a = new mongoose.Types.ObjectId().toString(), b = new mongoose.Types.ObjectId().toString();
  assert.equal((await call("/api/admin/solutions/reorder", admin("POST", { category: "web", ids: [b, a] }))).status, 200);
  assert.deepEqual(ops.map((o) => [o.updateOne.filter._id, o.updateOne.filter.category, o.updateOne.update.$set.order]), [[b, "web", 0], [a, "web", 1]]);
  assert.equal((await call("/api/admin/solutions/reorder", admin("POST", { category: "web", ids: ["nope"] }))).status, 400);
});

test("upload signature pins folder and formats", async () => {
  const r = await call("/api/admin/solutions/upload-signature", admin("POST", { kind: "video" }));
  assert.equal(r.status, 200);
  assert.equal(r.body.folder, "annek/solutions");
  assert.equal(r.body.allowedFormats, "mp4,webm");
  assert.equal(r.body.uploadUrl, "https://api.cloudinary.com/v1_1/democloud/video/upload");
  const expected = cloudinary.utils.api_sign_request({ allowed_formats: "mp4,webm", folder: "annek/solutions", timestamp: r.body.timestamp }, "test-secret");
  assert.equal(r.body.signature, expected);
  assert.equal(JSON.stringify(r.body).includes("test-secret"), false, "secret never leaves the server");
  assert.equal((await call("/api/admin/solutions/upload-signature", admin("POST", { kind: "pdf" }))).status, 400);
});

test("discard-uploads only deletes our unsaved files", async () => {
  const destroyed = [];
  stub(cloudinary.uploader, "destroy", async (id) => { destroyed.push(id); return { result: "ok" }; });
  stub(Solution, "find", () => ({ select: () => ({ lean: async () => [{ images: [IMG("kept")] }] }) }));
  const r = await call("/api/admin/solutions/discard-uploads", admin("POST", { urls: [IMG("orphan"), IMG("kept"), "https://res.cloudinary.com/democloud/image/upload/v1/annek/portfolio/x.png", "https://evil.example/a.png"] }));
  assert.equal(r.status, 200);
  assert.deepEqual(destroyed, ["annek/solutions/orphan"]);
});

test("parseOwnUrl handles transformations and rejects other clouds", () => {
  assert.deepEqual(media.parseOwnUrl("https://res.cloudinary.com/democloud/image/upload/f_auto,q_auto,w_600/v123/annek/solutions/abc.webp"), { resourceType: "image", publicId: "annek/solutions/abc" });
  assert.equal(media.parseOwnUrl("https://res.cloudinary.com/othercloud/image/upload/v1/annek/solutions/abc.webp"), null);
  assert.equal(media.parseOwnUrl("http://res.cloudinary.com/democloud/image/upload/v1/annek/solutions/abc.webp"), null);
});
