const mongoose = require("mongoose");

const ConversationMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 10000 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const VersionSnapshotSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    label: { type: String, default: "" },
    websiteSpecification: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const WebsiteProjectSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null, index: true },
    name: { type: String, required: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 500 },
    originalPrompt: { type: String, default: "", maxlength: 8000 },
    websiteSpecification: { type: mongoose.Schema.Types.Mixed, required: true },
    conversationHistory: { type: [ConversationMessageSchema], default: [] },
    currentVersion: { type: Number, default: 1 },
    versions: { type: [VersionSnapshotSchema], default: [] },
    metadata: {
      lastAction: { type: String, default: "create" },
      devicePreview: { type: String, default: "desktop" },
    },
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
  }
);

WebsiteProjectSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("WebsiteProject", WebsiteProjectSchema);
