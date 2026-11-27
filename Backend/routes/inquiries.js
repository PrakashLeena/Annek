/**
 * POST /api/inquiries — "Customize this for your business" forms on /solutions/:category.
 *
 * Emailed (not stored) with the existing Gmail transporter:
 *   to:       INQUIRY_TO_EMAIL (default info@annek.tech)
 *   reply-to: the customer's email
 *   subject:  [Mobile App customization] <solution> | <name>
 * Spam protection: honeypot field "website", server-side validation, per-IP rate limit
 * (inquiryLimiter in middleware/security.js).
 */
const express = require("express");
const router = express.Router();
const transporter = require("../config/nodemailer");

const FALLBACK = "info@annek.tech";
const LABELS = { mobile: "Mobile App", web: "Web App", software: "Software" };
const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const oneLine = (s) => String(s ?? "").replace(/[\r\n]+/g, " ").trim();

function recipient() {
  const to = (process.env.INQUIRY_TO_EMAIL || "").trim();
  return EMAIL.test(to) ? to : FALLBACK;
}

function validate(b) {
  const errors = [];
  const text = (k, max, required) => {
    const v = typeof b[k] === "string" ? b[k].trim() : "";
    if (required && !v) errors.push(`${k} is required.`);
    if (v.length > max) errors.push(`${k} is too long (max ${max} characters).`);
    return v;
  };
  const data = {
    category: b.category,
    name: oneLine(text("name", 100, true)),
    email: text("email", 200, true),
    phone: oneLine(text("phone", 40)),
    company: oneLine(text("company", 120)),
    solution: oneLine(text("solution", 140)) || "Something new",
    message: text("message", 3000, true),
    budget: oneLine(text("budget", 60)),
    timeline: oneLine(text("timeline", 60)),
  };
  if (!LABELS[data.category]) errors.push("category must be mobile, web or software.");
  if (data.email && !EMAIL.test(data.email)) errors.push("Please enter a valid email address.");
  return { data, errors };
}

function emailHtml(d, label) {
  const row = (k, v) => (v ? `<tr><td style="padding:8px 12px;font-weight:600;color:#555;width:150px;vertical-align:top;border-bottom:1px solid #f0f0f0">${k}</td><td style="padding:8px 12px;color:#222;border-bottom:1px solid #f0f0f0;white-space:pre-line">${esc(v)}</td></tr>` : "");
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
    <div style="background:#16130F;padding:24px 28px"><h1 style="margin:0;color:#F26A1B;font-size:20px">${esc(label)} customization request</h1></div>
    <table style="width:100%;border-collapse:collapse;margin:12px 0 20px">
      ${row("Solution", d.solution)}${row("Name", d.name)}${row("Email", d.email)}${row("Phone", d.phone)}${row("Company", d.company)}
      ${row("Budget", d.budget)}${row("Timeline", d.timeline)}${row("How to customize", d.message)}
    </table>
    <p style="padding:0 28px 24px;color:#888;font-size:12px">Reply to this email to answer ${esc(d.name)} directly.</p>
  </div></body></html>`;
}

function emailText(d, label) {
  const fields = [["Solution", d.solution], ["Name", d.name], ["Email", d.email], ["Phone", d.phone],
    ["Company", d.company], ["Budget", d.budget], ["Timeline", d.timeline]];
  return [
    `${label} customization request`, "",
    ...fields.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    "", "How to customize:", d.message,
  ].join("\n");
}

router.post("/", async (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  // Honeypot: real visitors never see or fill "website". Pretend success so bots learn nothing.
  if (typeof b.website === "string" && b.website.trim()) return res.json({ success: true });

  const { data, errors } = validate(b);
  if (errors.length) return res.status(400).json({ error: errors[0], errors });

  const label = LABELS[data.category];
  try {
    await transporter.sendMail({
      from: `"Annek Inquiries" <${process.env.EMAIL_USER}>`,
      to: recipient(),
      replyTo: { name: data.name, address: data.email },
      subject: `[${label} customization] ${data.solution} | ${data.name}`,
      text: emailText(data, label),
      html: emailHtml(data, label),
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Inquiry email failed:", err && err.message);
    res.status(502).json({ error: `We could not send your request. Please email us at ${FALLBACK}.`, fallback: FALLBACK });
  }
});

module.exports = router;
module.exports._recipient = recipient;
