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
      <p style="margin:6px 0 0;color:#888;font-size:14px">${data.forAdmin ? 'Admin Copy — Received via Annek Platform' : `Hi ${data.name}, here are your order details!`}</p>
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

      const orderData = { ...data, logoUrl, imageUrls, videoUrls };
      const orderSubject = `🌐 Website Order — ${data.name}${data.company ? ` (${data.company})` : ""}`;

      // ── Send full order details to admin ──
      try {
        await transporter.sendMail({
          from: `"Annek" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `[Admin Copy] ${orderSubject}`,
          html: adminEmailHtml({ ...orderData, forAdmin: true }),
        });
        console.log("✅ Admin order email sent to:", process.env.ADMIN_EMAIL);
      } catch (emailErr) {
        console.error("⚠️ Failed to send admin order email:", emailErr.message || emailErr);
      }

      // ── Send full order details to customer ──
      if (data.email) {
        try {
          await transporter.sendMail({
            from: `"Annek" <${process.env.EMAIL_USER}>`,
            to: data.email,
            subject: `🎉 Your Order Details — ${orderSubject}`,
            html: adminEmailHtml({ ...orderData, forAdmin: false }),
          });
          console.log("✅ Customer order email sent to:", data.email);
        } catch (emailErr) {
          console.error("⚠️ Failed to send customer order email:", emailErr.message || emailErr);
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
