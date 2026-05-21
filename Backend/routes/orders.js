const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Order = require("../models/Order");
const transporter = require("../config/nodemailer");

// Multer — store files in memory before Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
});

// Helper: Upload a buffer to Cloudinary
const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(buffer);
  });

// ── Email Templates ──────────────────────────────────────────
function adminEmailHtml(data) {
  const row = (label, value) =>
    value
      ? `<tr><td style="padding:8px 12px;font-weight:600;color:#555;width:180px;border-bottom:1px solid #f0f0f0">${label}</td><td style="padding:8px 12px;color:#333;border-bottom:1px solid #f0f0f0">${value}</td></tr>`
      : "";

  return `
  <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#1a1a1a;padding:28px 32px">
      <h1 style="margin:0;color:#d4f74b;font-size:22px;font-weight:700">🌐 New Website Order</h1>
      <p style="margin:6px 0 0;color:#888;font-size:14px">Received via Annek Platform</p>
    </div>
    <div style="padding:28px 32px">

      <h2 style="font-size:15px;color:#5c4ef8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Contact Details</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:10px;overflow:hidden">
        ${row("Name", data.name)}
        ${row("Email", data.email)}
        ${row("Company", data.company)}
      </table>

      <h2 style="font-size:15px;color:#5c4ef8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Pages Required</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:10px;overflow:hidden">
        ${row("Pages", data.pages?.join(", "))}
        ${row("Other", data.otherPages)}
      </table>

      <h2 style="font-size:15px;color:#5c4ef8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Design Preferences</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:10px;overflow:hidden">
        ${row("Colours", data.colour)}
        ${row("Style", data.designStyle?.join(", "))}
        ${row("Fonts", data.fonts)}
        ${row("Theme", data.theme?.join(", "))}
        ${row("Liked Sites", data.likedSites)}
      </table>

      <h2 style="font-size:15px;color:#5c4ef8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Features Required</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:10px;overflow:hidden">
        ${row("Features", data.features?.join(", "))}
        ${row("Other", data.otherFeatures)}
      </table>

      <h2 style="font-size:15px;color:#5c4ef8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Domain & Hosting</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:10px;overflow:hidden">
        ${row("Purchase Domain", data.buyDomain === true ? "Yes — Purchase Domain" : data.buyDomain === false ? "No — Free Version" : "Not specified")}
        ${row("Has Domain", data.hasDomain === true ? "Yes" : data.hasDomain === false ? "No" : "Not specified")}
        ${row("Needs Help", data.needHelp === true ? "Yes" : data.needHelp === false ? "No" : "Not specified")}
        ${row("Timeline", data.timeline)}
      </table>

      <h2 style="font-size:15px;color:#5c4ef8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Maintenance & Support</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:10px;overflow:hidden">
        ${row("Options", data.maintenance?.join(", "))}
      </table>

      ${data.logoUrl ? `<h2 style="font-size:15px;color:#5c4ef8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Uploaded Files</h2><p style="margin:0 0 8px"><a href="${data.logoUrl}" style="color:#5c4ef8">View Logo</a></p>` : ""}
      ${data.imageUrls?.length ? data.imageUrls.map((u, i) => `<p style="margin:0 0 4px"><a href="${u}" style="color:#5c4ef8">Image ${i + 1}</a></p>`).join("") : ""}
      ${data.videoUrls?.length ? data.videoUrls.map((u, i) => `<p style="margin:0 0 4px"><a href="${u}" style="color:#5c4ef8">Video ${i + 1}</a></p>`).join("") : ""}

    </div>
    <div style="background:#f9f9f9;padding:20px 32px;text-align:center">
      <p style="margin:0;font-size:13px;color:#aaa">© 2026 Annek · Reply to this email to respond to the client</p>
    </div>
  </div>
  </body></html>`;
}

function customerEmailHtml(name) {
  return `
  <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#1a1a1a;padding:28px 32px;text-align:center">
      <h1 style="margin:0;color:#d4f74b;font-size:24px;font-weight:700">🎉 Order Received!</h1>
    </div>
    <div style="padding:36px 32px;text-align:center">
      <p style="font-size:18px;color:#333;margin:0 0 16px">Hi <strong>${name}</strong>!</p>
      <p style="font-size:15px;color:#666;line-height:1.7;margin:0 0 24px">
        Thank you for placing your website order with <strong>Annek</strong>.<br>
        Our team has received your requirements and will review them shortly.
      </p>
      <div style="background:#eef0ff;border-radius:12px;padding:20px 24px;margin:0 0 28px;text-align:left">
        <p style="margin:0 0 8px;font-weight:700;color:#5c4ef8;font-size:14px">⏱ What happens next?</p>
        <ul style="margin:0;padding:0 0 0 18px;color:#555;font-size:14px;line-height:1.9">
          <li>Our team will review your requirements within <strong>24 hours</strong></li>
          <li>We'll send you a detailed quote and project timeline</li>
          <li>Once approved, we'll begin building your website immediately</li>
        </ul>
      </div>
      <a href="mailto:${process.env.EMAIL_USER}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:15px;font-weight:600">Contact Us Anytime</a>
    </div>
    <div style="background:#f9f9f9;padding:20px 32px;text-align:center">
      <p style="margin:0;font-size:13px;color:#aaa">© 2026 Annek · www.annek.tech</p>
    </div>
  </div>
  </body></html>`;
}

// ── POST /api/orders ─────────────────────────────────────────
router.post(
  "/",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "images", maxCount: 20 },
    { name: "videos", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      console.log("Order submission: Parsing JSON data...");
      const data = JSON.parse(req.body.data);

      let logoUrl = "";
      let imageUrls = [];
      let videoUrls = [];

      if (req.files?.logo?.[0]) {
        console.log("Order submission: Uploading logo to Cloudinary...");
        const result = await uploadBuffer(req.files.logo[0].buffer, {
          folder: "annek/logos",
          resource_type: "image",
        });
        logoUrl = result.secure_url;
      }

      if (req.files?.images) {
        console.log("Order submission: Uploading images to Cloudinary...");
        for (const file of req.files.images) {
          const result = await uploadBuffer(file.buffer, {
            folder: "annek/images",
            resource_type: "auto",
          });
          imageUrls.push(result.secure_url);
        }
      }

      if (req.files?.videos) {
        console.log("Order submission: Uploading videos to Cloudinary...");
        for (const file of req.files.videos) {
          const result = await uploadBuffer(file.buffer, {
            folder: "annek/videos",
            resource_type: "video",
          });
          videoUrls.push(result.secure_url);
        }
      }

      console.log("Order submission: Creating mongoose order document...");
      const order = new Order({ ...data, logoUrl, imageUrls, videoUrls });
      console.log("Order submission: Saving order to MongoDB...");
      await order.save();
      console.log("Order submission: Order saved successfully to database!");

      // ── Send admin notification email ──
      try {
        await transporter.sendMail({
          from: `"Annek Platform" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `🌐 New Website Order — ${data.name} ${data.company ? `(${data.company})` : ""}`,
          html: adminEmailHtml({ ...data, logoUrl, imageUrls, videoUrls }),
        });
      } catch (emailErr) {
        console.error("⚠️ Failed to send admin notification email:", emailErr.message || emailErr);
      }

      // ── Send customer confirmation email ──
      if (data.email) {
        try {
          await transporter.sendMail({
            from: `"Annek" <${process.env.EMAIL_USER}>`,
            to: data.email,
            subject: "🎉 Your Annek Website Order Has Been Received!",
            html: customerEmailHtml(data.name),
          });
        } catch (emailErr) {
          console.error("⚠️ Failed to send customer confirmation email:", emailErr.message || emailErr);
        }
      }

      res.json({ success: true, orderId: order._id });
    } catch (error) {
      console.error("Order submission error:", error);
      res.status(500).json({ error: "Failed to submit order. Please try again." });
    }
  }
);

// ── GET /api/orders ── (admin)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// ── PATCH /api/orders/:id ── update status
router.patch("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(order);
  } catch { res.status(500).json({ error: "Failed to update order." }); }
});

// ── DELETE /api/orders/:id ──
router.delete("/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete order." }); }
});

module.exports = router;
