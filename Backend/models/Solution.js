/**
 * Pre-designed solutions shown on /solutions/:category (Admin › Solutions).
 * Collection: "solutions".
 */
const mongoose = require("mongoose");

const CATEGORIES = ["mobile", "web", "software"];
const MAX_IMAGES = 8;

const httpsUrl = (v) => !v || /^https:\/\/[^\s<>"']+$/i.test(v);
const urlField = {
  type: String,
  default: "",
  trim: true,
  maxlength: 1000,
  validate: { validator: httpsUrl, message: "Must be an https:// URL." },
};

const SolutionSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, enum: CATEGORIES },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    purpose: { type: String, default: "", trim: true, maxlength: 160 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    images: {
      type: [{ type: String, trim: true, maxlength: 1000 }],
      default: [],
      validate: [
        { validator: (a) => a.length <= MAX_IMAGES, message: `At most ${MAX_IMAGES} images.` },
        { validator: (a) => a.every((u) => u && httpsUrl(u)), message: "Every image must be an https:// URL." },
      ],
    },
    video: urlField,
    liveUrl: urlField,
    published: { type: Boolean, default: false },
    order: { type: Number, default: 0, min: -1000000, max: 1000000 },
  },
  { timestamps: true }
);

SolutionSchema.index({ category: 1, published: 1, order: 1 });

module.exports = mongoose.model("Solution", SolutionSchema, "solutions");
module.exports.CATEGORIES = CATEGORIES;
module.exports.MAX_IMAGES = MAX_IMAGES;
