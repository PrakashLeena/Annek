/**
 * /api/portfolio
 *   GET    /api/portfolio          public: published projects, card fields only
 *   GET    /api/portfolio/:slug    public: one published project (current slug, an old slug, or the
 *                                  title fallback); `slug` in the answer is the canonical one
 *   POST   /api/portfolio          admin (original multipart route, kept): create
 *   PUT    /api/portfolio/:id      admin (original multipart route, kept): update
 *   DELETE /api/portfolio/:id      admin (original route, kept): delete
 * Admin › Portfolio itself uses /api/admin/portfolio (routes/adminPortfolio.js).
 */
const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminAuth");
const Portfolio = require("../models/Portfolio");
const { upload, readBody, isId, uploadImage, sendError } = require("../services/adminCrud");
const { pick, card, detail } = require("../services/portfolioFields");
const { findPublishedBySlug, PUBLISHED } = require("../services/portfolioSlug");
const { createProject, updateProject } = require("../services/portfolioSave");

const SORT = { order: 1, createdAt: -1 };
// Short edge cache so publish/unpublish shows up within ~30 s.
const cache = (res) => res.set("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=60");

router.get("/", async (req, res) => {
  try {
    const items = await Portfolio.find(PUBLISHED).sort(SORT).lean();
    cache(res);
    res.json(items.map(card));
  } catch (err) { sendError(res, err, "Failed to fetch portfolio."); }
});

router.get("/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    if (!Portfolio.SLUG_RE.test(slug) || slug.length > 80) return res.status(404).json({ error: "Not found." });
    const found = await findPublishedBySlug(slug);
    if (!found) return res.status(404).json({ error: "Not found." });
    cache(res);
    res.json(detail(found.doc));
  } catch (err) { sendError(res, err, "Failed to fetch project."); }
});

/* Original admin routes (multipart with an optional `image` file), now validated like Admin › Portfolio. */
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const data = pick(readBody(req, { keep: ["slug"] }), { partial: false });
    const img = await uploadImage(req.file, "annek/portfolio");
    if (img) { data.imageUrl = img; data.images = [img, ...(data.images || [])].slice(0, Portfolio.MAX_IMAGES); }
    res.json(await createProject(data));
  } catch (err) { sendError(res, err, "Failed to create portfolio item."); }
});

router.put("/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: "Invalid id." });
    const doc = await Portfolio.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found." });
    const data = pick(readBody(req, { keep: ["slug"] }), { partial: true });
    const img = await uploadImage(req.file, "annek/portfolio");
    if (img) { data.imageUrl = img; data.images = [img, ...((data.images || doc.images || []).slice(1))].slice(0, Portfolio.MAX_IMAGES); }
    res.json(await updateProject(doc, data));
  } catch (err) { sendError(res, err, "Failed to update portfolio item."); }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: "Invalid id." });
    await Portfolio.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { sendError(res, err, "Failed to delete."); }
});

module.exports = router;
