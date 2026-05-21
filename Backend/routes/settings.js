const express = require("express");
const router = express.Router();
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

// POST /api/settings
router.post("/", async (req, res) => {
  try {
    const updates = req.body;
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
