const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  name:    { type: String, default: "Anonymous" },
  email:   { type: String, default: "" },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  visible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
