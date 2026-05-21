require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const ordersRouter = require("./routes/orders");
const feedbackRouter = require("./routes/feedback");
const portfolioRouter = require("./routes/portfolio");

const app = express();
connectDB();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://annek.vercel.app",
    "https://annek-jet.vercel.app",
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/orders", ordersRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/portfolio", portfolioRouter);

// Live stats endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const Order = require("./models/Order");
    const Feedback = require("./models/Feedback");
    const orderCount = await Order.countDocuments();
    const feedbacks = await Feedback.find({ visible: true });
    const avgRating = feedbacks.length
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : null;
    res.json({ orderCount, avgRating, reviewCount: feedbacks.length });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// Health check
app.get("/api/health", (req, res) => res.json({ status: "OK", time: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Annek Backend running on http://localhost:${PORT}`);
});
