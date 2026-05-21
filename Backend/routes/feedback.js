const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const transporter = require("../config/nodemailer");

function feedbackEmailHtml(data) {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#1a1a1a;padding:28px 32px">
      <h1 style="margin:0;color:#d4f74b;font-size:22px;font-weight:700">💬 New Feedback Received</h1>
    </div>
    <div style="padding:28px 32px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 12px;font-weight:600;color:#555;width:120px;border-bottom:1px solid #f0f0f0">Name</td><td style="padding:8px 12px;color:#333;border-bottom:1px solid #f0f0f0">${data.name || "Anonymous"}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #f0f0f0">Email</td><td style="padding:8px 12px;color:#333;border-bottom:1px solid #f0f0f0">${data.email || "Not provided"}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #f0f0f0">Rating</td><td style="padding:8px 12px;color:#f59e0b;font-size:20px;border-bottom:1px solid #f0f0f0">${stars} (${data.rating}/5)</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;color:#555;vertical-align:top">Message</td><td style="padding:8px 12px;color:#333;line-height:1.6">${data.message}</td></tr>
      </table>
    </div>
  </div></body></html>`;
}

// GET /api/feedback — return visible reviews for testimonials
router.get("/", async (req, res) => {
  try {
    const reviews = await Feedback.find({ visible: true }).sort({ createdAt: -1 }).limit(20);
    res.json(reviews);
  } catch { res.status(500).json({ error: "Failed to fetch reviews." }); }
});

// GET /api/feedback/all — return all reviews for admin panel
router.get("/all", async (req, res) => {
  try {
    const reviews = await Feedback.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch { res.status(500).json({ error: "Failed to fetch all reviews." }); }
});

// DELETE /api/feedback/:id — delete a review by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Feedback.findByIdAndDelete(id);
    res.json({ success: true, message: "Review deleted successfully." });
  } catch { res.status(500).json({ error: "Failed to delete review." }); }
});

// POST /api/feedback — save review + send email
router.post("/", async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    if (!message || !rating) return res.status(400).json({ error: "Message and rating are required." });

    // Save to MongoDB
    const feedback = new Feedback({ name, email, rating: Number(rating), message });
    await feedback.save();

    // Send email notification
    try {
      await transporter.sendMail({
        from: `"Annek Feedback" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `💬 New Feedback — ${rating}/5 stars from ${name || "Anonymous"}`,
        html: feedbackEmailHtml({ name, email, rating: Number(rating), message }),
      });
    } catch (emailErr) {
      console.error("⚠️ Failed to send feedback notification email:", emailErr.message || emailErr);
    }

    res.json({ success: true, feedback });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ error: "Failed to send feedback." });
  }
});

module.exports = router;
