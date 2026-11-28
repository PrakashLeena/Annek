/**
 * Slugs for portfolio project pages (/portfolio/<slug>).
 *
 *   slugify("St.Anne's PPA")  → "st-annes-ppa"
 *   uniqueSlug(base, id)      → base, base-2, base-3… (not used by any other project, current or previous)
 *   slugOf(doc)               → stored slug, or the title fallback for projects saved before slugs existed
 *   findPublishedBySlug(s)    → { doc, slug } by current slug, an old slug, or the title fallback
 */
const Portfolio = require("../models/Portfolio");

const MAX = 80;

function slugify(text) {
  return String(text || "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "") // é → e
    .toLowerCase()
    .replace(/['’`]/g, "")                             // st anne's → st annes
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX)
    .replace(/-+$/g, "") || "project";
}

const slugOf = (doc) => (doc && doc.slug) || slugify(doc && doc.title);

/** Is `slug` free? Taken means another project uses it now or used it before (old links point there). */
async function isSlugFree(slug, excludeId) {
  const filter = { $or: [{ slug }, { previousSlugs: slug }] };
  if (excludeId) filter._id = { $ne: excludeId };
  return !(await Portfolio.exists(filter));
}

async function uniqueSlug(base, excludeId) {
  const root = slugify(base);
  for (let i = 1; i <= 50; i++) {
    const candidate = i === 1 ? root : `${root.slice(0, MAX - String(i).length - 1)}-${i}`;
    if (await isSlugFree(candidate, excludeId)) return candidate;
  }
  const e = new Error("Could not find a free slug, please choose one."); e.status = 409; throw e;
}

const PUBLISHED = { visible: { $ne: false } };

/** Published project for a URL slug. `slug` in the result is the canonical one (differs for old links). */
async function findPublishedBySlug(slug) {
  let doc = await Portfolio.findOne({ ...PUBLISHED, slug }).lean();
  if (!doc) doc = await Portfolio.findOne({ ...PUBLISHED, previousSlugs: slug }).lean();
  if (!doc) {
    // Not backfilled yet: match the title fallback (oldest project wins on a tie).
    const unslugged = await Portfolio.find({ ...PUBLISHED, slug: { $exists: false } }).sort({ createdAt: 1 }).lean();
    doc = unslugged.find((d) => slugify(d.title) === slug) || null;
  }
  return doc ? { doc, slug: slugOf(doc) } : null;
}

module.exports = { slugify, slugOf, isSlugFree, uniqueSlug, findPublishedBySlug, PUBLISHED };
