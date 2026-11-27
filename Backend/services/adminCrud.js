/**
 * Small helpers shared by the catalog + products admin routes.
 */
const mongoose = require("mongoose");
const multer = require("multer");
const { sanitizeInput } = require("../middleware/security");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // Vercel functions cap request bodies at ~4.5 MB
  fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpe?g|webp|gif|avif)$/.test(file.mimetype)),
});

const PROTECTED_FIELDS = ["_id", "__v", "createdAt", "updatedAt", "slug"];

/** Accepts JSON bodies or multipart bodies with a `data` JSON field. */
function readBody(req) {
  let body = req.body || {};
  if (typeof body.data === "string") {
    try { body = JSON.parse(body.data); } catch { const e = new Error("Invalid data payload."); e.status = 400; throw e; }
  }
  // The global sanitizer runs before body parsing in server.js, so clean here
  // (strips HTML, `$`/`.` from keys, caps string length).
  body = sanitizeInput(body);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const e = new Error("Invalid payload."); e.status = 400; throw e;
  }
  const clean = { ...body };
  PROTECTED_FIELDS.forEach((k) => delete clean[k]);
  // Normalise list fields given as "a, b, c" or newline text.
  for (const key of ["features", "tags"]) {
    if (typeof clean[key] === "string") {
      clean[key] = clean[key].split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(clean[key])) clean[key] = clean[key].map(String).map((s) => s.trim()).filter(Boolean).slice(0, 40);
  }
  return clean;
}

function isId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
}

async function uploadImage(file, folder) {
  if (!file) return null;
  const cloudinary = require("../config/cloudinary");
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", transformation: [{ width: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }] },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(file.buffer);
  });
  return result.secure_url;
}

function sendError(res, err, fallback) {
  if (err && (err.name === "ValidationError" || err.name === "CastError")) {
    return res.status(400).json({ error: err.message });
  }
  if (err && err.status) return res.status(err.status).json({ error: err.message });
  console.error(fallback, err && err.message);
  return res.status(500).json({ error: fallback });
}

/** Public, CDN-cacheable response (edge caches 5 min, serves stale while refreshing). */
function publicCache(res) {
  res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
}

module.exports = { upload, readBody, isId, uploadImage, sendError, publicCache };
