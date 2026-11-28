/**
 * Cloudinary helpers for Admin › Solutions and Admin › Portfolio.
 *
 * Photos and videos upload straight from the browser to Cloudinary (Vercel
 * functions cap request bodies at ~4.5 MB). The server only signs the upload:
 * the signature pins the folder and the allowed formats, so a signed request
 * cannot write elsewhere or upload other file types.
 *
 * Uses the existing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.
 */
const cloudinary = require("../config/cloudinary");

const FOLDER = "annek/solutions";
const PORTFOLIO_FOLDER = "annek/portfolio";
// A signature can only ever be issued for one of these folders.
const FOLDERS = [FOLDER, PORTFOLIO_FOLDER];
const KINDS = {
  image: { resourceType: "image", formats: "jpg,jpeg,png,webp" },
  video: { resourceType: "video", formats: "mp4,webm" },
};

function cloudName() {
  return process.env.CLOUDINARY_CLOUD_NAME || "";
}

function isConfigured() {
  return Boolean(cloudName() && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

/** Signed parameters for one direct browser upload. */
function signUpload(kind, folder = FOLDER) {
  const k = KINDS[kind];
  if (!FOLDERS.includes(folder)) { const e = new Error("Unknown upload folder."); e.status = 400; throw e; }
  if (!k) { const e = new Error("kind must be image or video."); e.status = 400; throw e; }
  if (!isConfigured()) { const e = new Error("File storage is not configured on the server."); e.status = 503; throw e; }
  const timestamp = Math.round(Date.now() / 1000);
  const params = { allowed_formats: k.formats, folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName()}/${k.resourceType}/upload`,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    allowedFormats: k.formats,
    signature,
  };
}

/**
 * Maps a delivery URL to { resourceType, publicId } when it is a file in `folder`
 * (default: the solutions folder); returns null for anything else (YouTube, other folders…).
 */
function parseOwnUrl(url, folder = FOLDER) {
  if (typeof url !== "string" || !cloudName()) return null;
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== "https:" || u.hostname !== "res.cloudinary.com") return null;
  const re = new RegExp(`^/${cloudName().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(image|video)/upload/(?:[^/]+/)*?(?:v\\d+/)?(${folder}/[^?#]+?)(?:\\.[a-z0-9]+)?$`, "i");
  const m = decodeURIComponent(u.pathname).match(re);
  return m ? { resourceType: m[1].toLowerCase(), publicId: m[2] } : null;
}

/** Deletes our stored files for these URLs. Never throws; returns how many were removed. */
async function destroyUrls(urls, folder = FOLDER) {
  const targets = [...new Set((urls || []).filter(Boolean))].map((u) => parseOwnUrl(u, folder)).filter(Boolean);
  let removed = 0;
  await Promise.all(targets.map(async ({ resourceType, publicId }) => {
    try {
      const r = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
      if (r && (r.result === "ok" || r.result === "not found")) removed++;
    } catch (err) {
      console.error("Cloudinary delete failed:", publicId, err && err.message);
    }
  }));
  return removed;
}

/** Media URLs a solution document references. */
function mediaOf(doc) {
  if (!doc) return [];
  return [...(doc.images || []), doc.video].filter(Boolean);
}

module.exports = { FOLDER, PORTFOLIO_FOLDER, KINDS, signUpload, parseOwnUrl, destroyUrls, mediaOf, isConfigured };
