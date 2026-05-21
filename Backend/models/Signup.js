const mongoose = require("mongoose");

const SignupSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  company: { type: String, required: true },
  jobTitle: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Signup", SignupSchema);
