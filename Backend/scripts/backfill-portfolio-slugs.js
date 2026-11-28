/**
 * One time: store a slug on every portfolio project that has none (/portfolio/<slug>).
 *
 *   node scripts/backfill-portfolio-slugs.js           dry run: prints the plan, writes nothing
 *   node scripts/backfill-portfolio-slugs.js --apply   writes the slugs
 *
 * Uses MONGODB_URI from Backend/.env (or the environment). Safe to run more than once:
 * projects that already have a slug are left alone. The slug is the same one the site already
 * uses for them (made from the title), with -2, -3… only when two projects would clash.
 */
require("dotenv").config({ path: require("node:path").resolve(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Portfolio = require("../models/Portfolio");
const { slugify } = require("../services/portfolioSlug");

const APPLY = process.argv.includes("--apply");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set.");
  await mongoose.connect(process.env.MONGODB_URI);
  const all = await Portfolio.find().sort({ createdAt: 1 }).lean();
  const used = new Set(all.flatMap((d) => [d.slug, ...(d.previousSlugs || [])]).filter(Boolean));
  const plan = [];
  for (const d of all.filter((x) => !x.slug)) {
    const root = slugify(d.title);
    let slug = root;
    for (let i = 2; used.has(slug); i++) slug = `${root}-${i}`;
    used.add(slug);
    plan.push({ id: String(d._id), title: d.title, slug, published: d.visible !== false });
  }
  console.table(plan);
  console.log(`${all.length} projects, ${all.length - plan.length} already have a slug, ${plan.length} to set.`);
  if (!APPLY) { console.log("Dry run. Run again with --apply to write these slugs."); return; }
  if (plan.length) {
    // Make sure the partial unique slug index exists (createIndexes only adds, it never drops).
    await Portfolio.createIndexes();
    const r = await Portfolio.bulkWrite(plan.map((p) => ({ updateOne: { filter: { _id: p.id, slug: { $exists: false } }, update: { $set: { slug: p.slug } } } })));
    console.log(`Updated ${r.modifiedCount} projects.`);
  }
}

main()
  .catch((err) => { console.error(err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
