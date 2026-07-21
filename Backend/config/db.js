const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      tls: true,
      retryWrites: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    // Don't crash serverless cold starts on Vercel when env is missing/misconfigured
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
