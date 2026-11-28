/**
 * Validation and public shapes for portfolio projects, shared by the public routes,
 * the original admin routes (/api/portfolio) and Admin › Portfolio (/api/admin/portfolio).
 */
const Portfolio = require("../models/Portfolio");
const { slugify, slugOf } = require("./portfolioSlug");

const HTTPS = /^https:\/\/[^\s<>"']+$/i;

function bad(message) { const e = new Error(message); e.status = 400; return e; }

/** Keeps only known fields and checks them. `partial` = update (missing fields untouched). */
function pick(body, { partial }) {
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
  const str = (k, max, { required } = {}) => {
    if (!has(k)) { if (required && !partial) throw bad(`${k} is required.`); return; }
    if (typeof body[k] !== "string") throw bad(`${k} must be text.`);
    const v = body[k].trim();
    if (required && !v) throw bad(`${k} is required.`);
    if (v.length > max) throw bad(`${k} must be at most ${max} characters.`);
    out[k] = v;
  };
  const url = (k) => {
    if (!has(k)) return;
    const v = typeof body[k] === "string" ? body[k].trim() : "";
    if (v && !HTTPS.test(v)) throw bad(`${k} must be an https:// URL.`);
    out[k] = v;
  };
  const list = (k, maxItems, maxLen) => {
    if (!has(k)) return;
    let v = body[k];
    if (typeof v === "string") v = v.split(/\r?\n|,/);
    if (!Array.isArray(v)) throw bad(`${k} must be a list.`);
    v = [...new Set(v.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean))];
    if (v.length > maxItems) throw bad(`${k}: at most ${maxItems} entries.`);
    if (v.some((s) => s.length > maxLen)) throw bad(`${k}: each entry at most ${maxLen} characters.`);
    out[k] = v;
  };

  str("title", 120, { required: true });
  str("category", 60, { required: true });
  str("desc", 500);
  str("summary", 155);
  str("description", 5000);
  str("client", 120);
  if (has("accent")) {
    if (typeof body.accent !== "string" || !/^#[0-9a-f]{3,8}$/i.test(body.accent.trim())) throw bad("accent must be a colour like #F26A1B.");
    out.accent = body.accent.trim();
  }
  if (has("type")) {
    if (!["", ...Portfolio.TYPES].includes(body.type)) throw bad("type must be mobile, web or software.");
    out.type = body.type;
  }
  if (has("slug")) {
    const v = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    if (v && (!Portfolio.SLUG_RE.test(v) || v.length > 80)) throw bad("Slug may only use a to z, 0 to 9 and single hyphens (max 80).");
    out.slug = v; // "" = make one from the title
  }
  if (has("images")) {
    if (!Array.isArray(body.images)) throw bad("images must be a list.");
    const imgs = body.images.map((u) => (typeof u === "string" ? u.trim() : "")).filter(Boolean);
    if (imgs.length > Portfolio.MAX_IMAGES) throw bad(`At most ${Portfolio.MAX_IMAGES} images.`);
    if (!imgs.every((u) => HTTPS.test(u))) throw bad("Every image must be an https:// URL.");
    out.images = imgs;
    out.imageUrl = imgs[0] || ""; // keep the original single image field in step
  }
  url("video");
  url("liveUrl");
  list("techStack", 20, 40);
  list("tags", 40, 60);
  if (has("year")) {
    if (body.year === "" || body.year === null) out.year = undefined;
    else {
      const y = Number(body.year);
      if (!Number.isInteger(y) || y < 1990 || y > 2100) throw bad("year must be a year like 2025.");
      out.year = y;
    }
  }
  for (const k of ["visible", "published"]) {
    if (!has(k)) continue;
    if (typeof body[k] !== "boolean") throw bad(`${k} must be true or false.`);
    out.visible = body[k]; // `published` is an alias of the original `visible`
  }
  if (has("order")) {
    const n = Number(body.order);
    if (!Number.isFinite(n)) throw bad("order must be a number.");
    out.order = Math.round(n);
  }
  return out;
}

const cover = (doc) => (doc.images && doc.images[0]) || doc.imageUrl || "";
const summaryOf = (doc) => doc.summary || doc.desc || "";

/** Fields a portfolio card needs (GET /api/portfolio). */
function card(doc) {
  const summary = summaryOf(doc);
  return {
    _id: doc._id,
    slug: slugOf(doc),
    title: doc.title,
    type: doc.type || "",
    category: doc.category,
    summary,
    desc: summary,          // older clients read `desc`
    imageUrl: cover(doc),   // older clients read `imageUrl`
    accent: doc.accent,
    year: doc.year || null,
    tags: doc.tags || [],
    order: doc.order || 0,
  };
}

/** Everything the project page shows (GET /api/portfolio/:slug). */
function detail(doc) {
  const imgs = doc.images && doc.images.length ? doc.images : (doc.imageUrl ? [doc.imageUrl] : []);
  return {
    ...card(doc),
    description: doc.description || "",
    images: imgs,
    video: doc.video || "",
    liveUrl: doc.liveUrl || "",
    techStack: doc.techStack || [],
    client: doc.client || "",
  };
}

const mediaOf = (doc) => (doc ? [...(doc.images || []), doc.imageUrl, doc.video].filter(Boolean) : []);

module.exports = { pick, card, detail, mediaOf, slugify, bad };
