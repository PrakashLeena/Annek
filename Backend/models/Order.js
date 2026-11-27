const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  // Package / template / product the client picked on the site (optional)
  selectedPackage: { type: String, default: "", maxlength: 300 },

  // Step 1 - Contact
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  company: { type: String, default: "" },
  phone:   { type: String, default: "", maxlength: 40 },

  // Project (2026 redesign): where it runs + free-text brief
  platforms:   [String],
  description: { type: String, default: "", maxlength: 4000 },

  // Step 2 - Pages
  pages:      [String],
  otherPages: { type: String, default: "" },

  // Step 3 - Content Materials
  logoUrl:        { type: String, default: "" },
  imageUrls:      [String],
  videoUrls:      [String],
  textContent:    { type: String, default: "" },
  productDetails: { type: String, default: "" },
  socialLinks:    { type: String, default: "" },
  contactInfo:    { type: String, default: "" },

  // Step 4 - Design
  colour:      { type: String, default: "" },
  designStyle: [String],
  fonts:       { type: String, default: "" },
  theme:       [String],
  likedSites:  { type: String, default: "" },

  // Step 5 - Features
  features:      [String],
  otherFeatures: { type: String, default: "" },

  // Step 6 - Domain & Hosting
  buyDomain: { type: Boolean, default: null },
  hasDomain: { type: Boolean, default: null },
  needHelp:  { type: Boolean, default: null },
  timeline:  { type: String, default: "" },

  // Step 7 - Maintenance
  maintenance: [String],

  // Meta
  status:    { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);
