const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function feedbackEmailHtml(data) {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
  return `
  <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#1a1a1a;padding:28px 32px">
      <h1 style="margin:0;color:#d4f74b;font-size:22px;font-weight:700">💬 New Feedback Received</h1>
      <p style="margin:6px 0 0;color:#888;font-size:14px">Annek Website Platform</p>
    </div>
    <div style="padding:28px 32px">
      <div style="background:#fafafa;border-radius:12px;padding:20px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 12px;font-weight:600;color:#555;width:120px;border-bottom:1px solid #f0f0f0">Name</td><td style="padding:8px 12px;color:#333;border-bottom:1px solid #f0f0f0">${data.name || "Anonymous"}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #f0f0f0">Email</td><td style="padding:8px 12px;color:#333;border-bottom:1px solid #f0f0f0">${data.email || "Not provided"}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #f0f0f0">Rating</td><td style="padding:8px 12px;color:#f59e0b;font-size:20px;border-bottom:1px solid #f0f0f0">${stars} (${data.rating}/5)</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;color:#555;vertical-align:top">Message</td><td style="padding:8px 12px;color:#333;line-height:1.6">${data.message}</td></tr>
        </table>
      </div>
    </div>
    <div style="background:#f9f9f9;padding:20px 32px;text-align:center">
      <p style="margin:0;font-size:13px;color:#aaa">© 2026 Annek · Feedback submitted via website</p>
    </div>
  </div>
  </body></html>`;
}

// POST /api/feedback
router.post("/", async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    if (!message || !rating) {
      return res.status(400).json({ error: "Message and rating are required." });
    }

    await transporter.sendMail({
      from: `"Annek Feedback" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `💬 New Feedback — ${rating}/5 stars from ${name || "Anonymous"}`,
      html: feedbackEmailHtml({ name, email, rating: Number(rating), message }),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ error: "Failed to send feedback." });
  }
});

module.exports = router;
