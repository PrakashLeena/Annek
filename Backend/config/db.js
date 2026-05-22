const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn("⚠️  MONGODB_URI is not set — skipping DB connection (server will continue but DB operations will fail).");
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      tls: true,
      retryWrites: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err && err.message ? err.message : err);
    // In serverless or managed environments, exiting the process will crash the function
    // so we avoid calling process.exit(1) here. Requests should handle DB unavailability gracefully.
  }
};

module.exports = connectDB;
