/**
 * /api/solutions — public, published pre-designed solutions.
 *   GET /api/solutions?category=mobile|web|software
 */
const express = require("express");
const router = express.Router();
const Solution = require("../models/Solution");
const { sendError } = require("../services/adminCrud");

const SORT = { order: 1, createdAt: 1 };
const PUBLIC_FIELDS = "category title purpose description images video liveUrl order";

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    if (category !== undefined && !Solution.CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "category must be mobile, web or software." });
    }
    const filter = { published: true, ...(category ? { category } : {}) };
    const items = await Solution.find(filter).select(PUBLIC_FIELDS).sort(SORT).lean();
    // Live links are a web-only feature: allowed on other categories but never shown.
    for (const it of items) if (it.category !== "web") it.liveUrl = "";
    // Short edge cache so publish/unpublish shows up within ~30 s.
    res.set("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=60");
    res.json(items);
  } catch (err) { sendError(res, err, "Failed to load solutions."); }
});

module.exports = router;
