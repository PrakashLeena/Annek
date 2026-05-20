const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Portfolio = require("../models/Portfolio");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err); else resolve(result);
    });
    stream.end(buffer);
  });

// GET all
router.get("/", async (req, res) => {
  try {
    const items = await Portfolio.find().sort({ createdAt: -1 });
    res.json(items);
  } catch { res.status(500).json({ error: "Failed to fetch portfolio." }); }
});

// POST create
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);
    let imageUrl = "";
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, { folder: "annek/portfolio", resource_type: "image" });
      imageUrl = result.secure_url;
    }
    const item = new Portfolio({ ...data, imageUrl });
    await item.save();
    res.json(item);
  } catch (e) { res.status(500).json({ error: "Failed to create portfolio item." }); }
});

// PUT update
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);
    let update = { ...data };
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, { folder: "annek/portfolio", resource_type: "image" });
      update.imageUrl = result.secure_url;
    }
    const item = await Portfolio.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(item);
  } catch { res.status(500).json({ error: "Failed to update portfolio item." }); }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Portfolio.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete." }); }
});

module.exports = router;
