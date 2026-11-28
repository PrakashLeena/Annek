/**
 * Portfolio projects (Admin › Portfolio, /portfolio and /portfolio/<slug>).
 * Collection: "portfolios".
 *
 * The original fields (title, category, desc, accent, imageUrl, tags, visible) are unchanged.
 * Everything below them is optional and was added for the project pages:
 *   - `visible` is the published flag.
 *   - The cover is images[0], falling back to the old single `imageUrl`.
 *   - The card summary falls back to the old `desc`.
 *   - Projects saved before slugs existed get one from their title on read
 *     (services/portfolioSlug.js) until scripts/backfill-portfolio-slugs.js stores it.
 */
const mongoose = require("mongoose");

const TYPES = ["mobile", "web", "software"];
const MAX_IMAGES = 10;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const httpsUrl = (v) => !v || /^https:\/\/[^\s<>"']+$/i.test(v);
const urlField = {
  type: String,
  default: "",
  trim: true,
  maxlength: 1000,
  validate: { validator: httpsUrl, message: "Must be an https:// URL." },
};

const PortfolioSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  category: { type: String, required: true },
  desc:     { type: String, default: "" },
  accent:   { type: String, default: "#5c4ef8" },
  imageUrl: { type: String, default: "" },
  tags:     [String],
  visible:  { type: Boolean, default: true },
  createdAt:{ type: Date, default: Date.now },

  // Added for project pages (all optional).
  // No default: a missing slug must stay missing so the partial unique index ignores it.
  slug:          { type: String, trim: true, lowercase: true, maxlength: 80, match: [SLUG_RE, "Slug may only use a to z, 0 to 9 and single hyphens."] },
  previousSlugs: { type: [String], default: undefined },
  type:          { type: String, enum: ["", ...TYPES], default: "" },
  summary:       { type: String, default: "", trim: true, maxlength: 155 },
  description:   { type: String, default: "", trim: true, maxlength: 5000 },
  images: {
    type: [{ type: String, trim: true, maxlength: 1000 }],
    default: undefined,
    validate: [
      { validator: (a) => !a || a.length <= MAX_IMAGES, message: `At most ${MAX_IMAGES} images.` },
      { validator: (a) => !a || a.every((u) => u && httpsUrl(u)), message: "Every image must be an https:// URL." },
    ],
  },
  video:     urlField,
  liveUrl:   urlField,
  techStack: { type: [{ type: String, trim: true, maxlength: 40 }], default: undefined },
  client:    { type: String, default: "", trim: true, maxlength: 120 },
  year:      { type: Number, min: 1990, max: 2100 },
  order:     { type: Number, default: 0, min: -1000000, max: 1000000 },
});

// Unique only where a slug is stored, so projects that have not been backfilled yet never collide.
PortfolioSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: "string" } } });
PortfolioSchema.index({ previousSlugs: 1 });

module.exports = mongoose.model("Portfolio", PortfolioSchema);
module.exports.TYPES = TYPES;
module.exports.MAX_IMAGES = MAX_IMAGES;
module.exports.SLUG_RE = SLUG_RE;
