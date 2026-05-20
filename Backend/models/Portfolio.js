const mongoose = require("mongoose");

const PortfolioSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  category: { type: String, required: true },
  desc:     { type: String, default: "" },
  accent:   { type: String, default: "#5c4ef8" },
  imageUrl: { type: String, default: "" },
  tags:     [String],
  visible:  { type: Boolean, default: true },
  createdAt:{ type: Date, default: Date.now },
});

module.exports = mongoose.model("Portfolio", PortfolioSchema);
