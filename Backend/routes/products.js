/**
 * /api/products — Sector 2: Annek's own products
 *
 * Public:  GET /api/products            visible products (with install links + subscription plans)
 * Admin:   GET /api/products/admin      all products
 *          POST /api/products           create (JSON, or multipart with `data` + optional `image`)
 *          PUT /api/products/:id        update
 *          DELETE /api/products/:id     delete
 */
const express = require("express");
const router = express.Router();
const { OwnProduct } = require("../models/Catalog");
const { requireAdmin } = require("../middleware/adminAuth");
const { upload, readBody, isId, uploadImage, sendError, publicCache } = require("../services/adminCrud");

const SORT = { order: 1, createdAt: 1 };
const withImage = (req, res, next) =>
  upload.single("image")(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next()));

function normalisePlans(data) {
  if (!Array.isArray(data.plans)) return;
  data.plans = data.plans.slice(0, 12).map((p) => {
    const plan = { ...p };
    if (typeof plan.features === "string") plan.features = plan.features.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
    if (plan._id && !isId(plan._id)) delete plan._id;
    return plan;
  });
}

router.get("/", async (req, res) => {
  try {
    publicCache(res);
    res.json(await OwnProduct.find({ visible: true }).sort(SORT).lean());
  } catch (err) { sendError(res, err, "Failed to load products."); }
});

router.get("/admin", requireAdmin, async (req, res) => {
  try { res.json(await OwnProduct.find().sort(SORT).lean()); }
  catch (err) { sendError(res, err, "Failed to load products."); }
});

router.post("/", requireAdmin, withImage, async (req, res) => {
  try {
    const data = readBody(req);
    normalisePlans(data);
    const imageUrl = await uploadImage(req.file, "annek/products");
    if (imageUrl) data.imageUrl = imageUrl;
    res.status(201).json(await OwnProduct.create(data));
  } catch (err) { sendError(res, err, "Failed to create product."); }
});

router.put("/:id", requireAdmin, withImage, async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: "Invalid id." });
    const doc = await OwnProduct.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found." });
    const data = readBody(req);
    normalisePlans(data);
    const imageUrl = await uploadImage(req.file, "annek/products");
    if (imageUrl) data.imageUrl = imageUrl;
    doc.set(data);
    await doc.save();
    res.json(doc);
  } catch (err) { sendError(res, err, "Failed to update product."); }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: "Invalid id." });
    const gone = await OwnProduct.findByIdAndDelete(req.params.id);
    if (!gone) return res.status(404).json({ error: "Not found." });
    res.json({ success: true });
  } catch (err) { sendError(res, err, "Failed to delete product."); }
});

module.exports = router;
