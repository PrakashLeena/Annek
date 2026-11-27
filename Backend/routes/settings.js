const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminAuth");
const Settings = require("../models/Settings");

// GET /api/settings
router.get("/", async (req, res) => {
  try {
    const settings = await Settings.find();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    // Return default values if not defined in database
    if (!settingsMap.testimonialsTitle) {
      settingsMap.testimonialsTitle = "Trusted by hundreds of businesses";
    }
    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings." });
  }
});

// Google rating badge fields (entered by hand in the admin panel; no Google API).
// Empty clears the field. Otherwise the rating is 1.0 to 5.0 with one decimal and the
// count is a whole number. Returns { value } normalised, or { error }.
function normaliseGoogleField(key, raw) {
  const v = raw == null ? "" : String(raw).trim();
  if (v === "") return { value: "" };
  if (key === "googleRating") {
    if (!/^\d(\.\d)?$/.test(v)) return { error: "Google rating must be a number from 1.0 to 5.0 with one decimal." };
    const n = Number(v);
    if (n < 1 || n > 5) return { error: "Google rating must be between 1.0 and 5.0." };
    return { value: n.toFixed(1) };
  }
  if (!/^\d{1,7}$/.test(v)) return { error: "Google review count must be a whole number." };
  return { value: String(Number(v)) };
}

// POST /api/settings
router.post("/", requireAdmin, async (req, res) => {
  try {
    const updates = { ...(req.body || {}) };
    for (const key of ["googleRating", "googleReviewCount"]) {
      if (!(key in updates)) continue;
      const out = normaliseGoogleField(key, updates[key]);
      if (out.error) return res.status(400).json({ error: out.error });
      updates[key] = out.value;
    }
    for (const [key, value] of Object.entries(updates)) {
      await Settings.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      );
    }
    // Return all settings
    const settings = await Settings.find();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    if (!settingsMap.testimonialsTitle) {
      settingsMap.testimonialsTitle = "Trusted by hundreds of businesses";
    }
    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: "Failed to save settings." });
  }
});

module.exports = router;
