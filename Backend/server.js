require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const ordersRouter = require("./routes/orders");
const feedbackRouter = require("./routes/feedback");
const portfolioRouter = require("./routes/portfolio");

const app = express();
connectDB();

app.use(cors({ origin: ["http://localhost:5173","http://localhost:5174","http://localhost:5175"], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/orders", ordersRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/portfolio", portfolioRouter);

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
