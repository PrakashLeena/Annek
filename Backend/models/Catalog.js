/**
 * Catalog models for the revamped annek.tech
 *
 * Sector 1 — Client Services
 *   ServiceCategory  main categories (Mobile / Web / Software) and their subcategories
 *   ShowcaseTemplate public templates/solutions a client can pick and have customised
 *   ServicePackage   built-in packages = setup price + monthly maintenance fee
 *   MaintenancePlan  standalone monthly maintenance plans
 *
 * Sector 2 — Own Products
 *   OwnProduct       apps/web apps/software run by Annek, with install links and subscription tiers
 */
const mongoose = require("mongoose");

const httpUrl = {
  validator: (v) => !v || /^https?:\/\/[^\s]+$/i.test(v),
  message: "Must be an http(s) URL.",
};
const urlField = { type: String, default: "", trim: true, maxlength: 600, validate: httpUrl };
const money = { type: Number, default: 0, min: 0, max: 100000000 };

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function withSlug(schema, from = "name") {
  schema.pre("validate", function setSlug(next) {
    if (!this.slug || this.isModified(from)) this.slug = slugify(this[from]);
    next();
  });
}

const common = { timestamps: true };

// ── Categories (main + sub) ───────────────────────────────────
const ServiceCategorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 80 },
  slug:        { type: String, trim: true, index: true },
  description: { type: String, default: "", maxlength: 600 },
  icon:        { type: String, default: "", maxlength: 16 },   // emoji or short glyph
  parent:      { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory", default: null, index: true },
  order:       { type: Number, default: 0 },
  visible:     { type: Boolean, default: true },
}, common);
withSlug(ServiceCategorySchema);

// ── Showcase templates ────────────────────────────────────────
const ShowcaseTemplateSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 120 },
  slug:        { type: String, trim: true, index: true },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory", required: true, index: true },
  description: { type: String, default: "", maxlength: 1500 },
  features:    { type: [String], default: [] },
  tags:        { type: [String], default: [] },
  imageUrl:    urlField,
  demoUrl:     urlField,
  order:       { type: Number, default: 0 },
  visible:     { type: Boolean, default: true },
}, common);
withSlug(ShowcaseTemplateSchema, "title");

// ── Built-in packages (setup + monthly maintenance) ───────────
const ServicePackageSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true, maxlength: 120 },
  slug:            { type: String, trim: true, index: true },
  category:        { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory", required: true, index: true },
  description:     { type: String, default: "", maxlength: 1500 },
  features:        { type: [String], default: [] },
  setupPrice:      money,
  monthlyFee:      money,
  currency:        { type: String, default: "USD", trim: true, maxlength: 8 },
  deliveryTime:    { type: String, default: "", maxlength: 60 },
  maintenancePlan: { type: mongoose.Schema.Types.ObjectId, ref: "MaintenancePlan", default: null },
  highlighted:     { type: Boolean, default: false },
  order:           { type: Number, default: 0 },
  visible:         { type: Boolean, default: true },
}, common);
withSlug(ServicePackageSchema);

// ── Maintenance plans ─────────────────────────────────────────
const MaintenancePlanSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 1000 },
  features:    { type: [String], default: [] },
  monthlyFee:  money,
  currency:    { type: String, default: "USD", trim: true, maxlength: 8 },
  order:       { type: Number, default: 0 },
  visible:     { type: Boolean, default: true },
}, common);

// ── Own products + subscription tiers ─────────────────────────
const SubscriptionPlanSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 80 },
  price:       money,
  currency:    { type: String, default: "USD", trim: true, maxlength: 8 },
  interval:    { type: String, enum: ["free", "month", "year", "one-time"], default: "month" },
  features:    { type: [String], default: [] },
  highlighted: { type: Boolean, default: false },
  checkoutUrl: urlField,
}, { _id: true });

const OwnProductSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 120 },
  slug:        { type: String, trim: true, index: true },
  type:        { type: String, enum: ["mobile", "web", "software"], default: "web" },
  tagline:     { type: String, default: "", maxlength: 160 },
  description: { type: String, default: "", maxlength: 2000 },
  features:    { type: [String], default: [] },
  imageUrl:    urlField,
  status:      { type: String, enum: ["live", "beta", "coming-soon"], default: "live" },
  links: {
    web:     urlField,   // open / sign up in browser
    android: urlField,   // Play Store / APK
    ios:     urlField,   // App Store
    windows: urlField,   // installer download
    mac:     urlField,
  },
  plans:   { type: [SubscriptionPlanSchema], default: [] },
  order:   { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
}, common);
withSlug(OwnProductSchema);

module.exports = {
  slugify,
  ServiceCategory:  mongoose.models.ServiceCategory  || mongoose.model("ServiceCategory", ServiceCategorySchema),
  ShowcaseTemplate: mongoose.models.ShowcaseTemplate || mongoose.model("ShowcaseTemplate", ShowcaseTemplateSchema),
  ServicePackage:   mongoose.models.ServicePackage   || mongoose.model("ServicePackage", ServicePackageSchema),
  MaintenancePlan:  mongoose.models.MaintenancePlan  || mongoose.model("MaintenancePlan", MaintenancePlanSchema),
  OwnProduct:       mongoose.models.OwnProduct       || mongoose.model("OwnProduct", OwnProductSchema),
};
