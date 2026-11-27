/**
 * /api/admin/solutions — Admin › Solutions (all routes need an admin Firebase token).
 *
 *   GET    /api/admin/solutions?category=web      all items (drafts too)
 *   POST   /api/admin/solutions                   create
 *   PATCH  /api/admin/solutions/:id               update (only the fields sent)
 *   DELETE /api/admin/solutions/:id               delete + remove its stored files
 *   POST   /api/admin/solutions/reorder           { category, ids: [...] } → order = position
 *   POST   /api/admin/solutions/upload-signature  { kind: "image" | "video" } → signed direct upload
 *   POST   /api/admin/solutions/discard-uploads   { urls: [...] } → delete uploads that were never saved
 */
const express = require("express");
const router = express.Router();
const Solution = require("../models/Solution");
const { requireAdmin } = require("../middleware/adminAuth");
const { readBody, isId, sendError } = require("../services/adminCrud");
const media = require("../services/solutionMedia");

const SORT = { order: 1, createdAt: 1 };
const HTTPS = /^https:\/\/[^\s<>"']+$/i;

router.use(requireAdmin);

function bad(message) { const e = new Error(message); e.status = 400; return e; }

/** Keeps only known fields, checks types/lengths/URLs. `partial` = PATCH (missing fields untouched). */
function pick(body, { partial }) {
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
  const str = (k, max, { required } = {}) => {
    if (!has(k)) { if (required && !partial) throw bad(`${k} is required.`); return; }
    if (typeof body[k] !== "string") throw bad(`${k} must be text.`);
    const v = body[k].trim();
    if (required && !v) throw bad(`${k} is required.`);
    if (v.length > max) throw bad(`${k} must be at most ${max} characters.`);
    out[k] = v;
  };
  const url = (k) => {
    if (!has(k)) return;
    const v = typeof body[k] === "string" ? body[k].trim() : "";
    if (v && !HTTPS.test(v)) throw bad(`${k} must be an https:// URL.`);
    out[k] = v;
  };

  if (has("category") || !partial) {
    if (!Solution.CATEGORIES.includes(body.category)) throw bad("category must be mobile, web or software.");
    out.category = body.category;
  }
  str("title", 120, { required: true });
  str("purpose", 160);
  str("description", 5000);
  if (has("images")) {
    if (!Array.isArray(body.images)) throw bad("images must be a list.");
    const imgs = body.images.map((u) => (typeof u === "string" ? u.trim() : "")).filter(Boolean);
    if (imgs.length > Solution.MAX_IMAGES) throw bad(`At most ${Solution.MAX_IMAGES} images.`);
    if (!imgs.every((u) => HTTPS.test(u))) throw bad("Every image must be an https:// URL.");
    out.images = imgs;
  }
  url("video");
  url("liveUrl");
  if (has("published")) {
    if (typeof body.published !== "boolean") throw bad("published must be true or false.");
    out.published = body.published;
  }
  if (has("order")) {
    const n = Number(body.order);
    if (!Number.isFinite(n)) throw bad("order must be a number.");
    out.order = Math.round(n);
  }
  return out;
}

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    if (category !== undefined && !Solution.CATEGORIES.includes(category)) throw bad("Unknown category.");
    res.json(await Solution.find(category ? { category } : {}).sort(SORT).lean());
  } catch (err) { sendError(res, err, "Failed to load solutions."); }
});

router.post("/upload-signature", (req, res) => {
  try { res.json(media.signUpload(req.body && req.body.kind)); }
  catch (err) { sendError(res, err, "Failed to prepare the upload."); }
});

router.post("/discard-uploads", async (req, res) => {
  try {
    const urls = Array.isArray(req.body && req.body.urls) ? req.body.urls.filter((u) => typeof u === "string").slice(0, 20) : [];
    const own = urls.filter((u) => media.parseOwnUrl(u));
    // Never delete a file that a saved solution still uses.
    const inUse = own.length ? await Solution.find({ $or: [{ images: { $in: own } }, { video: { $in: own } }] }).select("images video").lean() : [];
    const used = new Set(inUse.flatMap(media.mediaOf));
    const removed = await media.destroyUrls(own.filter((u) => !used.has(u)));
    res.json({ removed });
  } catch (err) { sendError(res, err, "Failed to discard uploads."); }
});

router.post("/reorder", async (req, res) => {
  try {
    const { category, ids } = req.body || {};
    if (!Solution.CATEGORIES.includes(category)) throw bad("Unknown category.");
    if (!Array.isArray(ids) || ids.length > 500 || !ids.every((id) => typeof id === "string" && isId(id))) throw bad("ids must be a list of solution ids.");
    if (ids.length) {
      await Solution.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id, category }, update: { $set: { order: i } } } })));
    }
    res.json(await Solution.find({ category }).sort(SORT).lean());
  } catch (err) { sendError(res, err, "Failed to reorder."); }
});

router.post("/", async (req, res) => {
  try {
    const data = pick(readBody(req), { partial: false });
    if (data.order === undefined) {
      const last = await Solution.findOne({ category: data.category }).sort({ order: -1 }).select("order").lean();
      data.order = last ? last.order + 1 : 0;
    }
    res.status(201).json(await Solution.create(data));
  } catch (err) { sendError(res, err, "Failed to create solution."); }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) throw bad("Invalid id.");
    const doc = await Solution.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found." });
    const before = media.mediaOf(doc);
    doc.set(pick(readBody(req), { partial: true }));
    await doc.save();
    const after = new Set(media.mediaOf(doc));
    await media.destroyUrls(before.filter((u) => !after.has(u)));
    res.json(doc);
  } catch (err) { sendError(res, err, "Failed to update solution."); }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) throw bad("Invalid id.");
    const gone = await Solution.findByIdAndDelete(req.params.id).lean();
    if (!gone) return res.status(404).json({ error: "Not found." });
    const filesRemoved = await media.destroyUrls(media.mediaOf(gone));
    res.json({ success: true, filesRemoved });
  } catch (err) { sendError(res, err, "Failed to delete solution."); }
});

module.exports = router;
module.exports._pick = pick; // for tests
