/* Signed direct uploads to Cloudinary for Admin › Solutions and Admin › Portfolio.
   The API only signs (Vercel functions cannot take large request bodies). */
import { useRef, useState } from "react";
import { adminFetch } from "../utils/adminApi";
import { C } from "./helpers";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_SOURCE_IMAGE_BYTES = 40 * 1024 * 1024; // before resizing
export const HTTPS = /^https:\/\/[^\s<>"']+$/i;

export const label = { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5, display: "block" };
export const hint = { fontSize: 11, color: C.muted, marginTop: 4, display: "block" };
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

/* ── Uploading ─────────────────────────────────────────────── */

/** Resizes to max 1920px on the long side and re-encodes (WebP, JPEG fallback). */
async function shrinkImage(file) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`${file.name}: could not read this image.`);
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const toBlob = (type, q) => new Promise((r) => canvas.toBlob(r, type, q));
  let blob = await toBlob("image/webp", 0.85);
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.85);
  if (!blob) throw new Error(`${file.name}: could not compress this image.`);
  // Keep the original if it was already small enough and our version is not smaller.
  if (scale === 1 && file.size <= blob.size && file.size <= MAX_IMAGE_BYTES) return file;
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
}

/** Signed direct upload to Cloudinary with progress; resolves to the https URL. `base` e.g. "/admin/solutions". */
async function directUpload(base, file, kind, onProgress) {
  const sig = await adminFetch(`${base}/upload-signature`, { method: "POST", body: { kind } });
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);
  fd.append("allowed_formats", sig.allowedFormats);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sig.uploadUrl);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) resolve(data.secure_url);
      else reject(new Error(data?.error?.message || `Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(fd);
  });
}

/** Deletes uploads that were never saved (the API refuses anything a saved item uses). */
export function discardUploads(base, urls) {
  if (urls.length) adminFetch(`${base}/discard-uploads`, { method: "POST", body: { urls } }).catch(() => {});
}

/**
 * Upload state for one editor. `session` holds every URL uploaded while it was open, so files
 * removed before saving (or the whole edit when cancelled) can be discarded afterwards.
 */
export function useMediaUploads(base) {
  const [uploads, setUploads] = useState([]); // [{ id, name, progress, error }]
  const session = useRef([]);
  const busy = uploads.some((u) => u.progress < 1 && !u.error);

  const track = (name) => {
    const id = Math.random().toString(36).slice(2);
    setUploads((u) => [...u, { id, name, progress: 0, error: null }]);
    return {
      progress: (p) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: p } : x))),
      fail: (msg) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: msg } : x))),
      done: () => setUploads((u) => u.filter((x) => x.id !== id)),
    };
  };

  /** Uploads up to `room` images; calls `add(url)` for each one that finishes. Returns an error text or null. */
  const addImages = (files, room, add) => {
    const list = [...files].slice(0, Math.max(0, room));
    Promise.all(list.map(async (file) => {
      const t = track(file.name);
      try {
        if (!IMAGE_TYPES.includes(file.type)) throw new Error(`${file.name}: use JPG, PNG or WebP.`);
        if (file.size > MAX_SOURCE_IMAGE_BYTES) throw new Error(`${file.name}: file is too large (${mb(file.size)}).`);
        const small = await shrinkImage(file);
        if (small.size > MAX_IMAGE_BYTES) throw new Error(`${file.name}: still ${mb(small.size)} after compressing (max 5 MB).`);
        const url = await directUpload(base, small, "image", t.progress);
        session.current.push(url);
        add(url);
        t.done();
      } catch (err) { t.fail(err.message); }
    }));
    return files.length > room ? `${files.length - room} image(s) not added: the limit is reached.` : null;
  };

  const addVideo = async (file, set) => {
    if (!file) return;
    const t = track(file.name);
    try {
      if (!VIDEO_TYPES.includes(file.type)) throw new Error(`${file.name}: use MP4 or WebM.`);
      if (file.size > MAX_VIDEO_BYTES) throw new Error(`${file.name}: ${mb(file.size)} is over the 100 MB limit.`);
      const url = await directUpload(base, file, "video", t.progress);
      session.current.push(url);
      set(url);
      t.done();
    } catch (err) { t.fail(err.message); }
  };

  const dismiss = (id) => setUploads((x) => x.filter((y) => y.id !== id));
  /** After saving: discard this session's uploads the saved item does not use. Cancel: pass []. */
  const finish = (keptUrls) => {
    const kept = new Set(keptUrls.filter(Boolean));
    discardUploads(base, session.current.filter((u) => !kept.has(u)));
    session.current = [];
  };

  return { uploads, busy, addImages, addVideo, dismiss, finish };
}

export const EDITOR_CSS = `
.sol-editor { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; }
.sol-pill { border: 1.5px solid #e5e5e5; background: #fff; color: #444; border-radius: 999px; padding: 6px 14px; font: 600 13px inherit; font-family: inherit; cursor: pointer; }
.sol-pill.on { background: ${C.accentSoft}; border-color: ${C.accentSoft}; color: ${C.accent}; }
.sol-mini { border: 0; background: #f3f4f6; color: #444; border-radius: 6px; padding: 3px 7px; font: 600 11px inherit; font-family: inherit; cursor: pointer; }
.sol-mini:disabled { opacity: .4; cursor: default; }
.sol-mini.danger { background: ${C.dangerSoft}; color: ${C.danger}; }
@media (max-width: 900px) { .sol-editor { grid-template-columns: 1fr; } }
`;
