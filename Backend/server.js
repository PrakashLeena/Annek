require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const ordersRouter = require("./routes/orders");
const feedbackRouter = require("./routes/feedback");
const portfolioRouter = require("./routes/portfolio");
const contactRouter = require("./routes/contact");
const settingsRouter = require("./routes/settings");

const app = express();
connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://annek.vercel.app",
  "https://annek-jet.vercel.app",
];

if (process.env.FRONTEND_URL) {
  const customOrigins = process.env.FRONTEND_URL.split(",").map(url => url.trim());
  allowedOrigins.push(...customOrigins);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/orders", ordersRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/contact", contactRouter);
app.use("/api/settings", settingsRouter);

// Live stats endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const Order = require("./models/Order");
    const Feedback = require("./models/Feedback");
    const Portfolio = require("./models/Portfolio");
    const orderCount = await Order.countDocuments();
    const feedbacks = await Feedback.find({ visible: true });
    const avgRating = feedbacks.length
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : null;
    const portfolioCategories = await Portfolio.distinct("category");
    const industryCount = portfolioCategories.length;
    res.json({ orderCount, avgRating, reviewCount: feedbacks.length, industryCount });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// Health check
app.get("/api/health", (req, res) => res.json({ status: "OK", time: new Date() }));

// Root welcome route
app.get("/", (req, res) => {
  res.json({
    name: "Annek API Platform Backend",
    status: "Online",
    message: "Welcome to the Annek API. Access services via /api/health or other endpoints.",
    version: "1.0.0"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Annek Backend running on http://localhost:${PORT}`);
});
