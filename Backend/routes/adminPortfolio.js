/**
 * /api/admin/portfolio — Admin › Portfolio (all routes need an admin Firebase token).
 *
 *   GET    /api/admin/portfolio                    all projects (drafts too), each with its page slug
 *   GET    /api/admin/portfolio/slug-check?slug=&id=   { slug, free }
 *   POST   /api/admin/portfolio                    create (JSON)
 *   PATCH  /api/admin/portfolio/:id                update (only the fields sent)
 *   DELETE /api/admin/portfolio/:id                delete + remove its stored files
 *   POST   /api/admin/portfolio/reorder            { ids: [...] } → order = position
 *   POST   /api/admin/portfolio/upload-signature   { kind: "image" | "video" } → signed direct upload (annek/portfolio)
 *   POST   /api/admin/portfolio/discard-uploads    { urls: [...] } → delete uploads that were never saved
 */
const express = require("express");
const router = express.Router();
const Portfolio = require("../models/Portfolio");
const { requireAdmin } = require("../middleware/adminAuth");
const { readBody, isId, sendError } = require("../services/adminCrud");
const media = require("../services/solutionMedia");
const { pick, mediaOf, bad } = require("../services/portfolioFields");
const { slugOf, slugify, isSlugFree } = require("../services/portfolioSlug");
const { createProject, updateProject } = require("../services/portfolioSave");

const FOLDER = media.PORTFOLIO_FOLDER;
const SORT = { order: 1, createdAt: -1 };

router.use(requireAdmin);

const withSlug = (d) => ({ ...d, slug: slugOf(d), slugStored: Boolean(d.slug) });

router.get("/", async (req, res) => {
  try { res.json((await Portfolio.find().sort(SORT).lean()).map(withSlug)); }
  catch (err) { sendError(res, err, "Failed to load portfolio."); }
});

router.get("/slug-check", async (req, res) => {
  try {
    const slug = slugify(req.query.slug);
    const id = typeof req.query.id === "string" && isId(req.query.id) ? req.query.id : undefined;
    res.json({ slug, free: await isSlugFree(slug, id) });
  } catch (err) { sendError(res, err, "Failed to check the link."); }
});

router.post("/upload-signature", (req, res) => {
  try { res.json(media.signUpload(req.body && req.body.kind, FOLDER)); }
  catch (err) { sendError(res, err, "Failed to prepare the upload."); }
});

router.post("/discard-uploads", async (req, res) => {
  try {
    const urls = Array.isArray(req.body && req.body.urls) ? req.body.urls.filter((u) => typeof u === "string").slice(0, 20) : [];
    const own = urls.filter((u) => media.parseOwnUrl(u, FOLDER));
    // Never delete a file that a saved project still uses.
    const inUse = own.length
      ? await Portfolio.find({ $or: [{ images: { $in: own } }, { imageUrl: { $in: own } }, { video: { $in: own } }] }).select("images imageUrl video").lean()
      : [];
    const used = new Set(inUse.flatMap(mediaOf));
    res.json({ removed: await media.destroyUrls(own.filter((u) => !used.has(u)), FOLDER) });
  } catch (err) { sendError(res, err, "Failed to discard uploads."); }
});

router.post("/reorder", async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length > 500 || !ids.every((id) => typeof id === "string" && isId(id))) throw bad("ids must be a list of project ids.");
    if (ids.length) await Portfolio.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })));
    res.json((await Portfolio.find().sort(SORT).lean()).map(withSlug));
  } catch (err) { sendError(res, err, "Failed to reorder."); }
});

router.post("/", async (req, res) => {
  try { res.status(201).json(withSlug((await createProject(pick(readBody(req, { keep: ["slug"] }), { partial: false }))).toObject())); }
  catch (err) { sendError(res, err, "Failed to create project."); }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) throw bad("Invalid id.");
    const doc = await Portfolio.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found." });
    const before = mediaOf(doc);
    await updateProject(doc, pick(readBody(req, { keep: ["slug"] }), { partial: true }));
    const after = new Set(mediaOf(doc));
    await media.destroyUrls(before.filter((u) => !after.has(u)), FOLDER);
    res.json(withSlug(doc.toObject()));
  } catch (err) { sendError(res, err, "Failed to update project."); }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) throw bad("Invalid id.");
    const gone = await Portfolio.findByIdAndDelete(req.params.id).lean();
    if (!gone) return res.status(404).json({ error: "Not found." });
    res.json({ success: true, filesRemoved: await media.destroyUrls(mediaOf(gone), FOLDER) });
  } catch (err) { sendError(res, err, "Failed to delete project."); }
});

module.exports = router;
