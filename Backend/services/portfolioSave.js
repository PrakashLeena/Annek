/**
 * Create / update a portfolio project with slug rules:
 *   - no slug given      → made from the title, with -2, -3… if taken
 *   - slug given         → must not be used by another project (now or before), else 409
 *   - slug changed       → the old one is kept in previousSlugs so old links still work
 */
const Portfolio = require("../models/Portfolio");
const { uniqueSlug, isSlugFree, slugOf } = require("./portfolioSlug");

function taken(slug) {
  const e = new Error(`The link annek.tech/portfolio/${slug} is already used by another project.`);
  e.status = 409;
  return e;
}

async function createProject(data) {
  const { slug: wanted, ...rest } = data;
  let slug;
  if (wanted) {
    if (!(await isSlugFree(wanted))) throw taken(wanted);
    slug = wanted;
  } else slug = await uniqueSlug(rest.title);
  if (rest.order === undefined) {
    const last = await Portfolio.findOne().sort({ order: -1 }).select("order").lean();
    rest.order = last && Number.isFinite(last.order) ? last.order + 1 : 0;
  }
  return Portfolio.create({ ...rest, slug });
}

/** `doc` is a mongoose document; `data` comes from pick({ partial: true }). Saves it. */
async function updateProject(doc, data) {
  const { slug: wanted, ...rest } = data;
  const current = slugOf(doc); // stored slug, or the title fallback for older projects
  doc.set(rest);
  let next = doc.slug;
  if (wanted) next = wanted;
  else if (!doc.slug) next = current && (await isSlugFree(current, doc._id)) ? current : await uniqueSlug(doc.title, doc._id);
  if (next !== doc.slug) {
    if (wanted && !(await isSlugFree(wanted, doc._id))) throw taken(wanted);
    const prev = new Set(doc.previousSlugs || []);
    if (current && current !== next) prev.add(current);
    prev.delete(next);
    doc.slug = next;
    doc.previousSlugs = [...prev].slice(-20);
  }
  await doc.save();
  return doc;
}

module.exports = { createProject, updateProject };
